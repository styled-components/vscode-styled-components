# Release Notes

## 1.7.0 (TBD)

- Add support for globalStyles. [#320](https://github.com/styled-components/vscode-styled-components/pull/320)
- Update typescript-styled-plugin. [#323](https://github.com/styled-components/vscode-styled-components/pull/323)
- Fix URLS in css. [#323](https://github.com/styled-components/vscode-styled-components/pull/323)

## 1.6.6 (26-07-2021)

- Fixed regression on keyframes intellisense. [#317](https://github.com/styled-components/vscode-styled-components/issues/317)

## 1.6.5 (25-07-2021)

- Migrated to ESBuild (from Webpack)
- Set an alert if vscode-styled-jsx is installed. See [#310](https://github.com/styled-components/vscode-styled-components/issues/310)
- Migrated from vscode-test to @vscode/test-electron
- Upgraded to styled plugin 0.18
- Fixed "Expand Template String" which should automatically open up the backticks

## 1.6.4 (01-06-2021)

- Guard insert colon with when clause. Thanks @phyllisstein! [297](https://github.com/styled-components/vscode-styled-components/pull/297)
- Cursor control has returned but only with CSS Functions
- Fix color matching issues, match multiple colors per-line and reduce false-positives on named color matches
- Revert styled plugin back to v0.16 so keyframes errors are supressed

## 1.6.3 (21-05-2021)

- Respect user's "acceptSuggestionOnEnter" configuration

## 1.6.2 (20-05-2021)

- Remove cursor control until issue can be fixed

## 1.6.0 (18-05-2021)

- Updated typescript-styled-plugin to v0.17
- Improved Syntax support
- Added support for keyframes
- Updated colorProvider to support alpha values on hex colors
- Adds a colon or semicolon on Enter. Also moves the cursor to the middle of a () function [284](https://github.com/styled-components/vscode-styled-components/pull/284)
- Updated documentation
- Improved support for Next style tags
- Added support for highlighting :focus-visible and :user-invalid pseudoclasses, thanks wojtekmaj! [289](https://github.com/styled-components/vscode-styled-components/pull/289)

## 1.5.2 (29-04-2021)

- Updated typescript-styled-plugin to v0.16

## 1.5.1 (24-04-2021)

- Fixed multiline issue [281](https://github.com/styled-components/vscode-styled-components/pull/281)
- Documentation updates [280](https://github.com/styled-components/vscode-styled-components/pull/280)
- Fixed broken tests [272](https://github.com/styled-components/vscode-styled-components/pull/272)

## 1.5.0 (22-01-2021)

- Added support for .svelte files [265](https://github.com/styled-components/vscode-styled-components/pull/265)
- Added support for template string helper functions [262](https://github.com/styled-components/vscode-styled-components/pull/262)

## 1.4.1 (10-12-2020)

- Fixed color provider bug on matching wrong strings [260](https://github.com/styled-components/vscode-styled-components/pull/260)
- npm script postinstall should use prepare [253](https://github.com/styled-components/vscode-styled-components/pull/253)

## 1.4.0 (05-12-2020)

- Updated CONTRIBUTING.md for how to use regexes and how to debug [251](https://github.com/styled-components/vscode-styled-components/pull/251)
- Allow destructuring property arrow function [250](https://github.com/styled-components/vscode-styled-components/pull/250)
- Updated color provider to better support colors in CSS [249](https://github.com/styled-components/vscode-styled-components/pull/249)

## 1.3.0 (18-11-2020)

- Added support for astroturf `stylesheet` (Thanks @mikestopcontinues) [245](https://github.com/styled-components/vscode-styled-components/pull/245)

## 1.2.0 (19-10-2020)

- Addition of the color picker [239](https://github.com/styled-components/vscode-styled-components/pull/239)
- Fix `.extend` grammar [240](https://github.com/styled-components/vscode-styled-components/pull/240)

## 1.1.0 (15-10-2020)

- Allows spaces before function call parenthesis (fixes ESLint `func-call-spacing`) [238](https://github.com/styled-components/vscode-styled-components/pull/238)
- Supports function calls inside of `styled` [237](https://github.com/styled-components/vscode-styled-components/pull/237)

## 1.0.0 (09-10-2020)

- We're 1.0.0!
- We have a more stable test system, moving to Github actions
- Support added for more type parameters [236](https://github.com/styled-components/vscode-styled-components/pull/236)
- Addition of completion provider [232](https://github.com/styled-components/vscode-styled-components/pull/232)
- Contribution Guide added [223](https://github.com/styled-components/vscode-styled-components/pull/223)
- TS Generics support for `.attr` syntax
- Single line comments now supported
- Fixed issue with `aspect-ratio` not working [190](https://github.com/styled-components/vscode-styled-components/issues/190)

As it's Hacktoberfest we appreciate any contributions and have plenty of issues to work on, [take a look](https://github.com/styled-components/vscode-styled-components/issues)

## 0.0.31

- support custom-at-rules [230](https://github.com/styled-components/vscode-styled-components/pull/230), thanks to @vxna

## 0.0.30

- support .withConfig() [225](https://github.com/styled-components/vscode-styled-components/pull/225), thanks to @auver

## 0.0.29

- Fix release issue

## 0.0.28

- fix for space before <type>, thanks to @mrGibi

## 0.0.27

- Add support for css prop [#173](https://github.com/styled-components/vscode-styled-components/pull/173), thanks to @njdancer
- Update typescript-styled-plugin [#195](https://github.com/styled-components/vscode-styled-components/pull/195), thanks to @mjbvz

## 0.0.26

- Enable plugin with workspace version by default, thanks to @mjbvz
- Add support for TypeScript type parameters, thansk to @antoinerousseau

## 0.0.25

- Fix [#137](https://github.com/styled-components/vscode-styled-components/issues/137), thanks to @jbm1991

## 0.0.24

- Upgrade to typescript-styled-plugin 0.13.0, thanks to @mjbvz

## 0.0.23

- Upgrade to typescript-styled-plugin 0.12.0, thanks to @mjbvz

## 0.0.22

- Upgrade to typescript-styled-plugin 0.11.0, thanks to @mjbvz
- Add support for new createGlobalStyle API, thanks to @probablyup
- Add support for .vue file extension, thanks to @jaxx2104

## 0.0.21

- Upgrade to typescript-styled-plugin 0.10.0
- Try making highlighting of template tag more consistent with other tagged templates

## 0.0.20

- Fix language mode inside js expression, thanks to @mjbvz

## 0.0.19

- Upgrade to typescript-styled-plugin 0.8.1

## 0.0.18

- Update to styled plugin 0.6.3, thansk to @mjbvz

## 0.0.17

- Add support for emotion-style TypeScript declarations, thanks to @dstaley
- Fix highlighting after `withComponent`, thanks to @Cu3PO42
- Enable highlighting after `Component.extend.attrs`, thanks to @Cu3PO42
- Don't inject highlighting grammar into strings, thanks to @Cu3PO42

## 0.0.16

- Add Emmet CSS Suggestions, thanks to @mjbvz and @ramya-rao-a and the awesome [TypeScript Styled Plugin](https://github.com/Microsoft/typescript-styled-plugin)

## 0.0.15

- Support @import rules in injectGlobal, thanks to @Cu3PO42
- Update typescript-styled-plugin to 0.5.1, adding quick fixes for misspelled properties, thanks to @mbjvz

## 0.0.14

- Replace the CSS grammar by one built on language-sass and language-css to ensure syntax highlighting works as in (S)CSS files, thanks to @Cu3PO42
- Rewrites the injection grammar to utilise the built-in highlighting for the JS/TS parts, thanks to @Cu3PO42
- Only change language mode to CSS inside of a template literal, thanks to @Cu3PO42

## 0.0.13

- Add support attrs support, thanks to @bsutt123

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

- Allow space before `in the styled regex`

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
