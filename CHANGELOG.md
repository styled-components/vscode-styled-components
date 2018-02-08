# Release Notes

## 0.0.14

- Replace the CSS grammar by one built on language-sass and language-css to ensure syntax highlighting works as in (S)CSS files
- Rewrites the injection grammar to utilise the built-in highlighting for the JS/TS parts
- Only change language mode to CSS inside of a template literal

## 0.0.13

= Add support attrs support, thanks to @bsutt123

## 0.0.12

- Support highlighting in media templates, thanks to @trevorwright

## 0.0.11

- Detailed CSS IntelliSense while working in styled strings and syntax error reporting, thanks to @matb. Note that this requires VSCode 1.20+

## 0.0.10

- Fix highlighting in VS Code 1.18, thanks to @mbjvz
- Fix highlighting of display: flex, thanks to @chinclubi

## 0.0.9

- Styled string contents are now marked as CSS embeddedLanguage, enabling proper CSS comments and better bracket matching, thanks to @mjbvz

## 0.0.8

- Add support for Typescript, thanks to @misantronic

## 0.0.7

- Add support for `.withComponent()`, thanks to @bessey
- Add support for `.extend`

## 0.0.6

- Allow space before ` in the styled regex`

## 0.0.5

- Fix `styled` regex

## 0.0.4

- Update CSS grammar to latest version from https://github.com/gandm/language-babel
- Make styled-components default export matching case insensitive, fixes #10

## 0.0.3

Don't highlight inside comments, thanks to @wmertens and @alpyre

## 0.0.2

Add suport for string tagnames, injectGlobal and keyframes

## 0.0.1

Initial release of vscode-styled-components
