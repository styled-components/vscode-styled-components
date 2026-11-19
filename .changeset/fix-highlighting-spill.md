---
"vscode-styled-components": patch
---

Syntax highlighting no longer breaks for the rest of the file after certain styled components. These now highlight correctly, along with the code below them: a template right after a call whose arrow function returns an object or JSX, like `foo(() => ({ ... }))` or MUI's `styled(({ className, ...props }) => (...))` pattern (#383); `.attrs()` that uses props, even across several lines (#292); a props type written over several lines, like `styled.div<{ color: string }>` broken onto new lines (#358); TypeScript type parameters after `styled.div` (#442); a styled component passed into a function such as `React.memo` (#196); and templates after `Comp.extend`, `keyframes`, and `.withComponent()`.
