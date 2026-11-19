import { readdirSync, readFileSync } from "node:fs";

// One token of a colorize-results file: its text, its space-joined scopes, and its color per theme.
export type ColorizeToken = { c: string; t: string; r: Record<string, string> };

// The colorize-results file name of a fixture: "styled.js" is "styled_js.json".
export const resultFileName = (fixtureName: string) =>
  `${fixtureName.replace(".", "_")}.json`;

// A fixtures folder's file names, sorted; folders a tool leaves behind (a `.vscode-test` cache) are skipped.
export const fixtureFileNames = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

const isColorizeToken = (value: unknown): value is ColorizeToken =>
  typeof value === "object" &&
  value !== null &&
  "c" in value &&
  typeof value.c === "string" &&
  "t" in value &&
  typeof value.t === "string" &&
  "r" in value &&
  typeof value.r === "object" &&
  value.r !== null &&
  Object.values(value.r).every((color: unknown) => typeof color === "string");

export const isColorizeTokens = (value: unknown): value is ColorizeToken[] =>
  Array.isArray(value) && value.every(isColorizeToken);

// Reads a colorize-results file, throwing when it is not a list of colorize tokens.
export const readColorizeResult = (resultPath: string) => {
  const parsed: unknown = JSON.parse(readFileSync(resultPath, "utf8"));
  if (!isColorizeTokens(parsed)) {
    throw new Error(`${resultPath} is not a list of colorize tokens`);
  }

  return parsed;
};

// A fixture's last non-empty line, and any line before it, that must tokenize at the file's root scope.
export const SENTINEL_LINE = "const sentinel = 1;";

export type ColorizeSentinelToken = { text: string; scopes: string };

// Whether a fixture ends with the sentinel line (blank lines after it are ignored).
export const endsWithSentinel = (lines: string[]) =>
  lines.filter((line) => line.trim() !== "").at(-1) === SENTINEL_LINE;

// source.js.jsx yields meta.var.expr.js.jsx, so the suffix is everything after "source."
const sentinelScopes = (rootScope: string) => {
  const lang = rootScope.slice("source.".length);
  return [rootScope, `meta.var.expr.${lang}`, `storage.type.${lang}`];
};

// Every sentinel line whose first token is not at root scope, so a leak that recovers before the last line still fails.
// `firstTokenOfLine` takes a zero-based line index and returns that line's first token.
export const leakedSentinelLines = (
  lines: string[],
  rootScope: string,
  firstTokenOfLine: (lineIndex: number) => ColorizeSentinelToken | undefined,
) => {
  const expected = sentinelScopes(rootScope).join(" ");
  const leaked: { line: number; token: ColorizeSentinelToken | undefined }[] =
    [];

  lines.forEach((text, index) => {
    if (text !== SENTINEL_LINE) {
      return;
    }

    const token = firstTokenOfLine(index);
    if (token?.text !== "const" || token.scopes !== expected) {
      leaked.push({ line: index + 1, token });
    }
  });

  return leaked;
};

// Plain CSS is here to compare a template's tokens with what VS Code gives the same CSS in a .css file.
export const rootScopeByExtension: Partial<Record<string, string>> = {
  ".css": "source.css",
  ".js": "source.js",
  ".jsx": "source.js.jsx",
  ".ts": "source.ts",
  ".tsx": "source.tsx",
};
