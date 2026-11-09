---
"vscode-styled-components": patch
---

Rebuild with a current esbuild, drop the redundant `onCommand` activation event (VS Code infers it from the contributed commands), and stop shipping development-only files in the extension package.
