// Bundles the integration suites into .integration-test/ for VS Code's extension host, whose Node does not strip types.
// "vscode" is supplied by the host; mocha loads from node_modules.
import { globSync, rmSync } from "node:fs";

import esbuild from "esbuild";

const outdir = ".integration-test";

rmSync(outdir, { recursive: true, force: true });

await esbuild.build({
  entryPoints: [
    "src/tests/suite/index.ts",
    ...globSync("src/tests/suite/*.test.ts"),
  ],
  outbase: "src/tests/suite",
  outdir,
  bundle: true,
  external: ["vscode", "mocha"],
  format: "cjs",
  platform: "node",
  sourcemap: true,
  target: "node22",
});
