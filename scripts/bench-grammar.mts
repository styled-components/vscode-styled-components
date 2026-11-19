// Usage: npm run bench:grammar -- [<baselineSyntaxesDir> [<otherSyntaxesDir>...]] [--fixtures <dir>] [--app-root <vscodeAppDir>] [--rounds <n>] [--runs <n>]
// Tokenizes the colorize fixtures, repeated to about 5,000 lines, under a tsx and a js host.
// Every (round, host, variant) cell runs in a fresh process, with the variant order rotating each round, so no cell inherits another's warmed regex cache or JIT.
// Reports the median first pass (cold) and the median of each process's warm median. The "current" variant is generated from syntaxes/src into a temp folder; nothing is written into the repo.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import vscodeTextmate from "vscode-textmate";
import type { IGrammar } from "vscode-textmate";

import { fixtureFileNames } from "../src/tests/colorizeToken.mts";
import { writeGrammars } from "../syntaxes/src/generate.mts";
import {
  createRegistry,
  repoRoot,
  resolveAppRoot,
} from "./grammarRegistry.mts";

const { INITIAL } = vscodeTextmate;

const TARGET_LINES = 5000;
const hosts = ["source.tsx", "source.js"];

const { positionals: otherDirs, values: flags } = (() => {
  try {
    return parseArgs({
      options: {
        "app-root": { type: "string" },
        child: { type: "string" },
        fixtures: { type: "string" },
        host: { type: "string" },
        rounds: { type: "string" },
        runs: { type: "string" },
      },
      allowPositionals: true,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(2);
  }
})();
const requiredFlag = (flag: "app-root" | "host") => {
  const value = flags[flag];
  if (value === undefined) throw new Error(`--${flag} needs a value`);
  return value;
};
const positiveIntegerFlag = (flag: "rounds" | "runs", fallback: number) => {
  const raw = flags[flag];
  if (raw === undefined) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    console.error(`--${flag} needs a positive whole number, got "${raw}"`);
    process.exit(2);
  }
  return value;
};
const runs = positiveIntegerFlag("runs", 7);
const rounds = positiveIntegerFlag("rounds", 5);
const fixturesDir = resolve(
  flags.fixtures ?? join(repoRoot, "src/tests/suite/colorize-fixtures"),
);

const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[values.length >> 1];

const loadCorpus = () => {
  const documents = fixtureFileNames(fixturesDir).map((file) =>
    readFileSync(join(fixturesDir, file), "utf8").split(/\r?\n/),
  );
  if (documents.length === 0) {
    console.error(
      `No fixtures found in ${fixturesDir}; pass --fixtures <dir>.`,
    );
    process.exit(2);
  }

  // Every document restarts from the initial state, so one fixture's leak does not change what the next costs.
  const corpus: string[][] = [];
  let lineCount = 0;
  while (lineCount < TARGET_LINES) {
    for (const document of documents) {
      corpus.push(document);
      lineCount += document.length;
    }
  }

  return { corpus, lineCount };
};

const tokenizeCorpus = (grammar: IGrammar, corpus: string[][]) => {
  const start = performance.now();
  for (const document of corpus) {
    let ruleStack = INITIAL;
    for (const line of document) {
      ruleStack = grammar.tokenizeLine(line, ruleStack).ruleStack;
    }
  }
  return performance.now() - start;
};

const childDir = flags.child;
if (childDir !== undefined) {
  // One cell: a fresh process, first pass then warm passes; prints "<first> <warmMedian>".
  const registry = await createRegistry(
    resolve(childDir),
    resolve(requiredFlag("app-root")),
  );
  const host = requiredFlag("host");
  const grammar = await registry.loadGrammar(host);
  if (grammar === null) throw new Error(`no grammar loaded for ${host}`);
  const { corpus } = loadCorpus();
  const first = tokenizeCorpus(grammar, corpus);
  const warm = Array.from({ length: runs }, () =>
    tokenizeCorpus(grammar, corpus),
  );
  console.log(`${first} ${median(warm)}`);
  process.exit(0);
}

// Fails before any variant runs when the fixtures folder is empty.
const { lineCount } = loadCorpus();

const currentDir = mkdtempSync(join(tmpdir(), "bench-grammar-"));

try {
  writeGrammars(currentDir);

  const variants = [
    ...otherDirs.map((dir, index) => ({
      name: index === 0 ? "baseline" : `other${index}`,
      dir: resolve(dir),
    })),
    { name: "current", dir: currentDir },
  ];

  const appRoot = await resolveAppRoot(flags["app-root"]);
  const script = fileURLToPath(import.meta.url);
  const cells = new Map<string, { first: number[]; warm: number[] }>();

  for (let round = 0; round < rounds; round++) {
    for (const host of hosts) {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[(i + round) % variants.length];
        const [first, warm] = execFileSync(
          process.execPath,
          [
            script,
            "--child",
            variant.dir,
            "--host",
            host,
            "--app-root",
            appRoot,
            "--fixtures",
            fixturesDir,
            "--runs",
            String(runs),
          ],
          { encoding: "utf8" },
        )
          .trim()
          .split(" ")
          .map(Number);
        const cell = cells.get(`${host} ${variant.name}`) ?? {
          first: [],
          warm: [],
        };
        cell.first.push(first);
        cell.warm.push(warm);
        cells.set(`${host} ${variant.name}`, cell);
      }
    }
  }

  console.log(
    `${lineCount} lines, ${rounds} fresh processes per row, ${runs} warm passes per process`,
  );
  console.log("host        variant   first pass ms   warm median ms");

  for (const host of hosts) {
    for (const variant of variants) {
      const cell = cells.get(`${host} ${variant.name}`);
      if (cell === undefined) continue;
      console.log(
        `${host.padEnd(11)} ${variant.name.padEnd(9)} ${median(cell.first).toFixed(0).padStart(13)} ${median(cell.warm).toFixed(0).padStart(16)}`,
      );
    }
  }
} finally {
  rmSync(currentDir, { recursive: true, force: true });
}
