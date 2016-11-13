# vscode-styled-components

Syntax highlighting for [styled-components](https://github.com/styled-components/styled-components).

![Syntax highlighting in action](demo.png)

Currently the grammar is a copy of the SCSS grammar, using the contents of the SCSS `property_list` rule as starting point.
The javascript `#template-substitution-element` rule is added as a possible pattern and is also added to the SCSS `property_values` rule.

## Features

## Known Issues

Highlighting is broken immediately after a styled-component is returned from an arrow function:

    const arrowFun = (...args) => css`
        height: 12px;
    `

    const test = "'const' isn't highlighted correctly"
