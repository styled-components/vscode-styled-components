// Writes the two grammar JSON files that package.json registers.
// Usage: node syntaxes/src/generate.mts [outDir]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { cssStyledGrammar } from "./css.styled.mts";
import { styledComponentsGrammar } from "./styled-components.mts";

export const defaultGrammarsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function writeGrammars(outDir: string) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "styled-components.json"),
    `${JSON.stringify(styledComponentsGrammar, null, 2)}\n`,
  );
  writeFileSync(
    join(outDir, "css.styled.json"),
    `${JSON.stringify(cssStyledGrammar, null, 2)}\n`,
  );
}

if (import.meta.main) {
  writeGrammars(resolve(process.argv[2] ?? defaultGrammarsDir));
}
