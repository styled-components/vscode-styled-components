---
"vscode-styled-components": patch
---

Picking a CSS property from the suggestion list and pressing Enter fills in `: ;` again when the template holds a nested template string inside `${}` (#437). It also works when the styled tag is spread across several lines.
