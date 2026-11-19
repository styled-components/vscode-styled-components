import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { parseArgs } from "node:util";

import vscodeTextmate from "vscode-textmate";
import type { IGrammar } from "vscode-textmate";

import {
  endsWithSentinel,
  leakedSentinelLines,
  readColorizeResult,
  resultFileName,
  rootScopeByExtension,
  SENTINEL_LINE,
} from "../src/tests/colorizeToken.mts";
import {
  defaultGrammarsDir,
  writeGrammars,
} from "../syntaxes/src/generate.mts";
import { createRegistry, resolveAppRoot } from "./grammarRegistry.mts";

const { INITIAL } = vscodeTextmate;

type Token = { text: string; scopes: string[] };
type TokenizedLine = { number: number; text: string; tokens: Token[] };

function tokenizeText(grammar: IGrammar, text: string): TokenizedLine[] {
  const lines = text.split(/\r?\n/);
  let ruleStack = INITIAL;

  return lines.map((line, index) => {
    const result = grammar.tokenizeLine(line, ruleStack);
    ruleStack = result.ruleStack;

    // Adjacent tokens with identical scopes merge, as in VS Code's captured tokens.
    const tokens: Token[] = [];
    for (const token of result.tokens) {
      const text = line.slice(
        token.startIndex,
        Math.min(token.endIndex, line.length),
      );
      if (text.length === 0) {
        continue;
      }

      const previous = tokens.at(-1);
      if (previous && previous.scopes.join(" ") === token.scopes.join(" ")) {
        previous.text += text;
      } else {
        tokens.push({ text, scopes: token.scopes });
      }
    }

    return { number: index + 1, text: line, tokens };
  });
}

function printFile(file: string, lines: TokenizedLine[]) {
  console.log(`# ${file}`);
  for (const line of lines) {
    console.log(`${line.number}: ${line.text}`);
    for (const token of line.tokens) {
      console.log(
        `  ${JSON.stringify(token.text)} => ${token.scopes.join(" ")}`,
      );
    }
  }
}

function checkSentinel(
  file: string,
  rootScope: string,
  lines: TokenizedLine[],
) {
  // A CSS fixture cannot hold the JavaScript sentinel.
  if (extname(file) === ".css") {
    console.log(`SKIP ${file}: CSS has no sentinel`);
    return true;
  }

  const texts = lines.map((line) => line.text);
  if (!endsWithSentinel(texts)) {
    console.log(`FAIL ${file}: no "${SENTINEL_LINE}" last line`);
    return false;
  }

  const leaked = leakedSentinelLines(texts, rootScope, (index) => {
    const token = lines[index].tokens[0];
    return token && { text: token.text, scopes: token.scopes.join(" ") };
  });
  if (leaked.length === 0) {
    console.log(`PASS ${file}`);
    return true;
  }

  for (const { line, token } of leaked) {
    console.log(
      `FAIL ${file}:${line}: sentinel scopes ${token?.scopes ?? "(none)"}`,
    );
  }
  return false;
}

// Compares a file's tokens (text and scopes) with its committed colorize-results file.
function checkDrift(file: string, lines: TokenizedLine[], showCount: number) {
  const resultPath = resolve(
    dirname(file),
    "../colorize-results",
    resultFileName(basename(file)),
  );
  if (!existsSync(resultPath)) {
    console.log(`NO RESULT ${file}: ${resultPath} does not exist`);
    return false;
  }

  const expected = readColorizeResult(resultPath).map((token) => ({
    text: token.c,
    scopes: token.t,
  }));
  const actual = lines
    .flatMap((line) => line.tokens)
    .map((token) => ({ text: token.text, scopes: token.scopes.join(" ") }));

  const diffs = [];
  for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
    const a = expected[i];
    const b = actual[i];
    if (a?.text !== b?.text || a?.scopes !== b?.scopes) {
      diffs.push({ index: i, expected: a, actual: b });
    }
  }

  console.log(
    `${diffs.length === 0 ? "same " : "DRIFT"} ${file}: ${diffs.length} differing tokens (committed ${expected.length}, now ${actual.length})`,
  );
  for (const diff of diffs.slice(0, showCount)) {
    console.log(`  #${diff.index} committed ${JSON.stringify(diff.expected)}`);
    console.log(`  #${diff.index} now       ${JSON.stringify(diff.actual)}`);
  }
  return diffs.length === 0;
}

const usage =
  "Usage: npm run tokenize -- [--sentinel | --drift [--show <n>]] [--grammars <dir>] <files...>";

const parsed = (() => {
  try {
    return parseArgs({
      options: {
        drift: { type: "boolean" },
        grammars: { type: "string" },
        sentinel: { type: "boolean" },
        show: { type: "string" },
      },
      allowPositionals: true,
    });
  } catch (error) {
    console.error(
      `${error instanceof Error ? error.message : error}\n${usage}`,
    );
    process.exit(2);
  }
})();
const { drift, sentinel, show } = parsed.values;
const files = parsed.positionals;
const showCount = Number(show ?? 0);
const grammarDirFlag = parsed.values.grammars;

if (!Number.isInteger(showCount) || showCount < 0) {
  console.error(`--show needs a whole number, got "${show}"`);
  process.exit(2);
}

if (files.length === 0) {
  console.error(usage);
  process.exit(2);
}

// The grammar JSON files are generated; an explicit --grammars directory is used as is.
if (grammarDirFlag === undefined) {
  writeGrammars(defaultGrammarsDir);
}

const registry = await createRegistry(
  grammarDirFlag === undefined ? defaultGrammarsDir : resolve(grammarDirFlag),
  await resolveAppRoot(),
);
let allPassed = true;

for (const file of files) {
  const rootScope = rootScopeByExtension[extname(file)];
  if (rootScope === undefined) {
    console.error(
      `${file}: unsupported extension; use ${Object.keys(rootScopeByExtension).join(", ")}`,
    );
    process.exit(2);
  }

  const grammar = await registry.loadGrammar(rootScope);
  if (grammar === null) {
    console.error(`${file}: no grammar loaded for ${rootScope}`);
    process.exit(2);
  }

  const lines = tokenizeText(grammar, readFileSync(file, "utf8"));
  if (sentinel) {
    allPassed = checkSentinel(file, rootScope, lines) && allPassed;
  } else if (drift) {
    allPassed = checkDrift(file, lines, showCount) && allPassed;
  } else {
    printFile(file, lines);
  }
}

process.exit(allPassed ? 0 : 1);
