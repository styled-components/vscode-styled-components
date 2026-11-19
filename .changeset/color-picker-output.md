---
"vscode-styled-components": patch
---

The color picker now writes the same values VS Code's picker writes in `.css` files. A semi-transparent hex color always gets a valid two-digit alpha (`#ff00000d` rather than `#ff0000c`), and `hsl()` values use whole numbers.
