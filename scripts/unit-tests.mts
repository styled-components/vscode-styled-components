import { spawnSync } from "node:child_process";
import { globSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import esbuild from "esbuild";

const entryPoints = [
  // The integration suites need VS Code's extension host (scripts/bundle-integration-tests.mts).
  ...globSync("src/**/*.test.ts", { exclude: ["src/tests/suite/**"] }),
  ...globSync("syntaxes/src/**/*.test.ts"),
];

if (entryPoints.length === 0) {
  console.error("No unit test files found.");
  process.exit(1);
}

// Each run bundles into its own folder, so concurrent runs in one checkout do not delete each other's files.
const outdir = mkdtempSync(join(tmpdir(), "unit-test-"));

try {
  const { metafile } = await esbuild.build({
    entryPoints,
    outdir,
    bundle: true,
    format: "cjs",
    metafile: true,
    platform: "node",
    target: "node22",
  });

  const bundles = Object.keys(metafile.outputs).filter((file) =>
    file.endsWith(".js"),
  );
  const result = spawnSync(process.execPath, ["--test", ...bundles], {
    stdio: "inherit",
  });

  process.exitCode = result.status ?? 1;
} finally {
  rmSync(outdir, { recursive: true, force: true });
}
