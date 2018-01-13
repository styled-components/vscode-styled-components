# vscode-styled-components

Syntax highlighting and IntelliSense for [styled-components](https://github.com/styled-components/styled-components).

![Syntax highlighting in action](demo.png)

Uses the CSS grammar from the Atom [language-babel](https://github.com/gandm/language-babel).

## Install

Inside VSCode, press `Ctrl+P`, and enter:

```
ext install vscode-styled-components
```

It should be the top result.

[[Source](https://marketplace.visualstudio.com/items?itemName=jpoissonnier.vscode-styled-components)]

## Features

* Syntax highlighting for styled components in JavaScript and TypeScript.
* Detailed CSS IntelliSense while working in styled strings.
* Syntax error reporting.

> **❗Important**: IntelliSense and language support requires VS Code 1.20+.

## Usage
The styled-components extension adds highlighting and IntelliSense for styled-component template strings in JavaScript and TypeScript. It works out of the box when you use VS Code's built-in version of TypeScript.

If you are [using a workspace version of typescript](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions), you must currently configure the TS Server plugin manually by following [these instructions](https://github.com/Microsoft/typescript-styled-plugin#usage)

## Known Issues

Conflict with vscode-babel-coloring extension breaks highlighting.

Highlighting is broken immediately after a styled-component is returned from an arrow function:

    const arrowFun = (...args) => css`
        height: 12px;
    `

    const test = "'const' isn't highlighted correctly"
