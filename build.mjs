import esbuild from "esbuild";

const production = process.argv[2] === "--production";
const watch = process.argv[2] === "--watch";
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
    target: "ES2022",
    plugins: [
      {
        name: "watch",
        setup(build) {
          build.onEnd(() => {
            if (watch) console.log("build finished");
          });
          build.onStart(() => {
            if (watch) console.log("building...");
          });
        },
      },
    ],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

if (watch) {
  await context.watch();
} else {
  context.rebuild();
  context.dispose();
}
