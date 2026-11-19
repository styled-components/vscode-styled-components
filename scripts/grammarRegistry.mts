import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { downloadAndUnzipVSCode, SilentReporter } from "@vscode/test-electron";
import vscodeOniguruma from "vscode-oniguruma";
import vscodeTextmate from "vscode-textmate";
import type { IRawGrammar } from "vscode-textmate";

import vscodeVersion from "../src/tests/vscodeVersion.mts";
import pkg from "../package.json" with { type: "json" };

const require = createRequire(import.meta.url);
const { Registry, parseRawGrammar } = vscodeTextmate;
const { createOnigScanner, createOnigString, loadWASM } = vscodeOniguruma;

export const repoRoot = resolve(fileURLToPath(import.meta.url), "../..");

const injectionHosts = new Set(
  pkg.contributes.grammars.find((grammar) => grammar.scopeName === "styled")
    ?.injectTo ?? [],
);
if (injectionHosts.size === 0) {
  throw new Error('package.json has no "styled" grammar with an injectTo list');
}

const builtInGrammarFiles = [
  "extensions/typescript-basics/syntaxes/TypeScript.tmLanguage.json",
  "extensions/typescript-basics/syntaxes/TypeScriptReact.tmLanguage.json",
  "extensions/javascript/syntaxes/JavaScript.tmLanguage.json",
  "extensions/javascript/syntaxes/JavaScriptReact.tmLanguage.json",
  "extensions/css/syntaxes/css.tmLanguage.json",
];

const repoGrammarFiles = ["styled-components.json", "css.styled.json"];

function appRootOf(executablePath: string) {
  if (process.platform === "darwin") {
    const marker = ".app/";
    const end = executablePath.indexOf(marker);
    if (end === -1) {
      throw new Error(`Cannot find the .app bundle in ${executablePath}`);
    }
    return join(
      executablePath.slice(0, end + marker.length - 1),
      "Contents/Resources/app",
    );
  }

  if (process.platform === "win32") {
    const installDir = dirname(executablePath);
    // Recent Windows archives nest resources/app under a 10-hex-character commit folder.
    const commitDir = readdirSync(installDir).find(
      (name) =>
        /^[0-9a-f]{10}$/.test(name) &&
        existsSync(join(installDir, name, "resources/app")),
    );
    return join(installDir, commitDir ?? "", "resources/app");
  }

  if (process.platform === "linux") {
    return join(dirname(executablePath), "resources/app");
  }

  throw new Error(
    `This script supports macOS, Linux, and Windows; ${process.platform} is not supported.`,
  );
}

// loadWASM returns its first load's promise on every later call.
const loadOniguruma = () =>
  loadWASM(readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm")));

// appRoot is the pinned VS Code's app folder; it is downloaded when omitted.
export async function resolveAppRoot(appRoot?: string) {
  if (appRoot !== undefined) return resolve(appRoot);

  const executablePath = await downloadAndUnzipVSCode({
    // The library defaults to a cache under the working directory, which re-downloads VS Code when run from a subfolder.
    cachePath: join(repoRoot, ".vscode-test"),
    version: vscodeVersion,
    reporter: new SilentReporter(),
  });
  return appRootOf(executablePath);
}

// Builds a registry of the pinned VS Code's grammars plus the two repo grammars found in grammarDir.
export async function createRegistry(grammarDir: string, appRoot: string) {
  await loadOniguruma();

  const grammars = new Map<string, IRawGrammar>();
  const grammarSources = [
    ...builtInGrammarFiles.map((file) => join(appRoot, file)),
    ...repoGrammarFiles.map((file) => join(grammarDir, file)),
  ];
  for (const path of grammarSources) {
    const raw = parseRawGrammar(readFileSync(path, "utf8"), path);
    grammars.set(raw.scopeName, raw);
  }

  return new Registry({
    onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
    getInjections: (scopeName) =>
      injectionHosts.has(scopeName) ? ["styled"] : undefined,
    loadGrammar: async (scopeName) => grammars.get(scopeName) ?? null,
  });
}
