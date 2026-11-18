# TypeScript and the tsserver plugin host

Checked 2026-11-18 against typescript 7.0.2 and 6.0.3, typescript-template-language-service-decorator 2.3.2.

## Which TypeScript runs the plugin

- The extension's IntelliSense and diagnostics come from `@styled/typescript-styled-plugin`, which `package.json` registers under `contributes.typescriptServerPlugins`. VS Code loads it into the user's tsserver.
- TypeScript 7 (the native Go compiler, `typescript@latest`) ships no `tsserver` and no language-service plugin API, and VS Code's TypeScript 7 mode does not load `typescriptServerPlugins`. Plugins run only on TypeScript 5.x and 6.x hosts; 6.0.3 is the last release with tsserver.
- So a user on a TypeScript 7 host gets highlighting (the grammar) but no styled-components IntelliSense. Check the host version first when triaging "IntelliSense is not working".
- `enableForWorkspaceTypeScriptVersions: true` means the plugin also loads when the user selects the workspace TypeScript, so the workspace version matters as much as VS Code's bundled one.

## Plugin loading facts

- tsserver loads plugins with a synchronous `require()` resolved Node10-style: `package.json` `main`, never the `exports` map. An ESM-only plugin loads only where Node supports `require(esm)` (unflagged from Node 20.19 and 22.12).
- Load and activation failures appear only in the tsserver log (`"typescript.tsserver.log": "verbose"`); the editor shows nothing.
- `typescript-template-language-service-decorator` (archived at 2.3.2) throws on activation under TypeScript below 5.0 unless the plugin gates on the host's major version.
- The decorator matches tags textually on tagged templates only: name `n` matches `n`, `n.`, `n(`, `n<`, `n[`, `*.n`. A bare template literal (no tag) gets no IntelliSense, so users wrap nested CSS in the `css` helper.

## This repo's own typecheck

- The `typescript` devDependency (7.x) typechecks `src/` with `npx tsc --noEmit -p .`; it is not the plugin host and is never bundled.
- TypeScript 7 treats the TS 6.0 deprecations as hard errors (`moduleResolution: node`/`classic`, `baseUrl`, `outFile`, `target: es5`, `downlevelIteration`) and exits 1 (not 2) on a type error under `--noEmit`.
- TypeScript 7 has no `ts.*` compiler API (`require("typescript")` returns only version fields), so a script that needs the API (for example a plugin test harness) installs TypeScript 6 separately.
