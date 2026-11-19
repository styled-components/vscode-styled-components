import { spawnSync } from "node:child_process";
import { watch as watchFiles } from "node:fs";

import esbuild from "esbuild";

const production = process.argv[2] === "--production";
const watch = process.argv[2] === "--watch";

// A subprocess, not an import: watch mode regenerates, and a module imported once would serve stale grammars.
const generateGrammars = () =>
  spawnSync(process.execPath, ["./syntaxes/src/generate.mts"], {
    stdio: "inherit",
  }).status === 0;

if (!generateGrammars()) process.exit(1);

const context = await esbuild
  .context({
    entryPoints: ["./src/extension.ts"],
    bundle: true,
    outdir: "dist",
    external: ["vscode"],
    format: "cjs",
    sourcemap: !production,
    minify: production,
    platform: "node",
    mainFields: ["module", "main"],
    target: "ES2022",
    plugins: watch
      ? [
          {
            name: "watch",
            setup(build) {
              build.onEnd(() => console.log("build finished"));
              build.onStart(() => console.log("building..."));
            },
          },
        ]
      : [],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

if (watch) {
  let pending: NodeJS.Timeout | undefined;
  watchFiles("./syntaxes/src", { recursive: true }, () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      console.log("building...");
      if (!generateGrammars()) console.error("grammar generation failed");
      console.log("build finished");
    }, 100);
  });
  await context.watch();
} else {
  // esbuild has already printed the errors when rebuild rejects.
  const built = await context.rebuild().then(
    () => true,
    () => false,
  );
  await context.dispose();
  if (!built) process.exit(1);
}
