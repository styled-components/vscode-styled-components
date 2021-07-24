const production = process.argv[2] === "--production";
const watch = process.argv[2] === "--watch";

require("esbuild")
  .build({
    entryPoints: ["./src/extension.ts"],
    bundle: true,
    outdir: "dist",
    external: ["vscode"],
    sourcemap: !production,
    minify: production,
    target: ["node12"],
    watch: watch && {
      onRebuild(error) {
        if (error) console.error("watch build failed:", error);
        else console.log("watch build succeeded");
      },
    },
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
