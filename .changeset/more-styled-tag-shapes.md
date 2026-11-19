---
"vscode-styled-components": minor
---

CSS highlighting now works in more of the ways you write styled components: a tag chain, on one line or split across lines by Prettier (`styled.div` or `Button.extend`, then any number of `.attrs()` and `.withConfig()` calls), a comment between `styled.div` and its backtick, a tag reached through an object (`theme.styled.div`, `$styled.div`, `theme.css`) or through a call or index (`getTheme().styled.div`, `items[0].styled.div`), type arguments that span several lines, including on `theme.keyframes`, and an arrow function whose parameter starts with `$` or has no parentheses, like `styled.div(($props) => ...)` or `styled.div(p => ...)`.
