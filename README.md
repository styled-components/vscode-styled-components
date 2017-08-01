# vscode-styled-components

Syntax highlighting for [styled-components](https://github.com/styled-components/styled-components).

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

## Known Issues

Highlighting is broken immediately after a styled-component is returned from an arrow function:

    const arrowFun = (...args) => css`
        height: 12px;
    `

    const test = "'const' isn't highlighted correctly"
