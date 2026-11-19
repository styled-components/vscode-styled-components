# Behavior spec

This spec is the source of truth for what the extension does; the code implements it. A behavior change edits this file first, in the same PR as the code. Intended behavior that the code does not yet meet is listed under [Known deviations](#known-deviations).

## Scope and hosts

- Editor: VS Code, from the minimum version in `package.json` `engines.vscode`. Published to the VS Code Marketplace only (Open VSX is requested in #368).
- Activation: opening a `javascriptreact` or `typescriptreact` document.
- The syntax grammar injects into JavaScript, TypeScript, JSX, TSX, Vue, and Svelte documents, everywhere except inside comments and strings.
- The color swatches and the backtick snippet serve documents on disk (`file` scheme) whose language is `javascriptreact` or `typescriptreact`. Untitled documents and plain `.js`/`.ts` files get neither.
- The Enter command's keybinding applies where [Enter command](#enter-command) says.
- IntelliSense and diagnostics run wherever VS Code's TypeScript server runs the bundled plugin (see [IntelliSense and diagnostics](#intellisense-and-diagnostics)).

## Syntax highlighting

Highlighting never extends past the end of a recognized template: code after any expression, recognized or not, is highlighted exactly as the host language's own grammar highlights it.

### Recognized tags

A template literal is highlighted as CSS when its opening backtick ends one of these tags. The tag head (everything from the tag's root, such as `styled`, to the backtick) may span lines; see [Tag heads across lines](#tag-heads-across-lines).

- `styled.div`, `styled(Component)`, `styled("div")`, `styled(Namespace.Component)`, `styled(getComponent(props))`, `styled (Component)`, and bare `styled`; the root may also be spelled `Styled` or `$styled`
- roots reached through members, calls, or indexes: `theme.styled.div`, `foo().styled.div`, `items[0].styled.div`, `(await load()).styled.div`, `theme.css`, `theme.keyframes`
- an arrow function returning the template, with a parenthesized or an unparenthesized parameter, on the tag's line too: ``styled.div(({ theme }) => ` ``, ``styled.div(($props) => ` ``, ``styled.div(p => ` ``, ``styled.div.attrs({})(({ theme }) => `color: red;`)``
- `.attrs(...)` and `.withConfig(...)` chains
- TypeScript generics: `styled.div<Props>`, `styled<Props>("div")`, `styled<Props, "div">("div")`, `.attrs<Props>(...)<Props>`, and on helpers: `css<Props>`, `keyframes<Props>`, `createGlobalStyle<Props>`
- helpers: `css`, `keyframes`, `createGlobalStyle`, `createGlobalStyles`, `injectGlobal`, `stylesheet`
- `.extend` tags (`Button.extend`, `a().b.extend`) anywhere in an expression, also followed by any number of `.attrs(...)` and `.withConfig(...)` calls (`Button.extend.attrs({}).withConfig({})`), on one line or split across lines
- `.withComponent(...)` tags whose argument is a quoted identifier or a dotted identifier chain (`A.withComponent("a")`, `A.withComponent(Other.Comp)`), also followed by `.extend`
- media helpers: `media.desktop`, `media.breakAt("300px")`; the root may also be spelled `Media`
- the `css` prop: ``css={` ``
- styled-jsx: ``<style jsx>{` ``, ``<style jsx global>{` ``, ``<style global jsx>{` ``, with one whitespace character after `style` and none before `>`. A `<style>` without `jsx` stays a plain string.

### Tag heads across lines

<!-- prettier-ignore -->
```tsx
const Title = styled.div<{
  active: boolean;
}>`
  color: red;
`;

const ExternalLink = styled.a
  .attrs({ target: "_blank" })
  .withConfig({ displayName: "ExternalLink" })`
  color: blue;
`;

const ColoredButton = styled(({ color, ...other }) => (
  <Button {...other} />
))`
  color: ${(props) => props.color};
`;
```

A tag head may span lines in these places:

- type arguments, on `styled` and on the helpers, member-prefixed ones included (`theme.keyframes<{`, then the closing `}>` and backtick on a later line)
- `.attrs(...)` and `.withConfig(...)` arguments
- the argument of `styled(...)`, such as `Button` on a line of its own, or an arrow function returning JSX (the Material-UI wrapper above)
- between chain members, in Prettier style (each `.attrs(...)` on its own line, after `styled.div` or `Button.extend`)
- a comment between the head and the backtick (`styled.div // why`, with the backtick on the next line)

A helper tag (the helpers listed under [Recognized tags](#recognized-tags)) takes its backtick directly after its name, or after one set of type arguments that directly follows the name, with whitespace or line breaks allowed between the type arguments and the backtick (`css<Props>`, then the backtick alone on the next line). Whitespace or a comment between a helper's name and its backtick leaves the template plain.

JSX inside a tag head keeps its JSX highlighting.

TextMate grammars match one line at a time, so a rule that needs to see a newline never matches. The injection grammar therefore matches only the tag's root, then lets the host language's own rules open and close every bracket after the root, and starts the CSS template at the backtick on whichever line it falls. Authoring guidance: CONTRIBUTING.md, "A line break seems to break the syntax highlighting".

### Inside a recognized template

- Template content gets the CSS grammar (`source.css.styled`): nesting, `&` selectors, at-rules including custom ones (`@apply`, `@screen`), comments.
- Scope names come from two sources. The grammar's own rules (`syntaxes/src/css.styled.mts`) give `.scss` names, so `color: red;` in a template gets `punctuation.separator.key-value.scss`, `punctuation.terminator.rule.scss`, and `meta.property-value.scss`, where a `.css` file gets `.css` names. The rules copied from VS Code's CSS grammar (`syntaxes/src/ownCss.mts` copies them under a `css-` prefix) give that grammar's names, from the pinned test version of VS Code, whichever VS Code version the user runs.
- A few newer CSS functions the pinned grammar does not know yet (such as `light-dark()` and `sibling-index()`) are highlighted the same way as its other functions; `MISC_FUNCTIONS_BEYOND_VSCODE` in `syntaxes/src/ownCss.mts` holds the list. The generated CSS grammar is self-contained: it includes no rule from VS Code's CSS grammar.
- An empty template (` styled.div`` `) is highlighted as an empty CSS template, and code after its closing backtick keeps the host language's highlighting.
- An interpolation (`${...}`) is highlighted as a TypeScript expression, including inside a CSS function's arguments, inside `url(...)` (`url(img-${n}.png)`), and inside a quoted string (`var(--a, "${font}")`).
- A `keyframes` template, and the body of an `@keyframes` block (one line or several), additionally highlight `from`, `to`, and percentage selectors (decimals such as `33.3%` included).
- A last declaration without `;` ends at the closing backtick.
- VS Code treats template content as the `css` language and interpolations as `typescript` for language-keyed editor features.

### Out of scope

- A template literal without a recognized tag (`` `color: red;` `` passed to a function, or returned from one) stays a plain string. Wrap nested CSS in the `css` helper.
- A template returned by an arrow function inside `.attrs(...)` or `.withConfig(...)` (``styled.div.attrs((p) => `x`)``) stays a plain string: those arguments compute props, not styles.
- A renamed import (`import s from "styled-components"`): tags are recognized by name, never by import, because the grammar cannot see imports.
- A `.withComponent(...)` argument other than a quoted identifier or a dotted identifier chain (`A.withComponent(getComp())`, or an argument with spaces or line breaks inside the parentheses).
- A member prefix on `createGlobalStyle`, `createGlobalStyles`, `injectGlobal`, `stylesheet`, or `media` (`theme.media.desktop`).

## IntelliSense and diagnostics

- Completions and CSS diagnostics inside templates come from the bundled `@styled/typescript-styled-plugin`, registered as a TypeScript server plugin. The extension adds no CSS completions or diagnostics of its own.
- The plugin needs a TypeScript host that loads tsserver plugins; which TypeScript versions qualify: [docs/typescript.md](typescript.md).
- Plugin configuration: the plugin's README, linked from this repo's README.

## Color swatches

When a served document contains a color literal:

- a swatch and the color picker appear when the literal is `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa` (exactly 3, 4, 6, or 8 hex digits), with no word character (letter, digit, or `_`), `&`, or `.` before the `#`, and no word character, `(`, or `-` after the digits. JavaScript private names (`this.#fade`, `#feed()`) and selectors (`#fadeIn`, `a&#fff`) get none.
- a swatch and the color picker appear when the literal is `rgb()`, `rgba()`, `hsl()`, or `hsla()` in comma syntax (`rgba(255, 0, 153, 0.5)`) or space syntax with an optional `/ alpha` (`hsl(0.5turn 30% 95% / 50%)`), as VS Code accepts them in a `.css` file. An rgb channel is an integer or a percentage. A hue is a number with either sign and an optional `deg`, `grad`, `rad`, or `turn` (a bare number is degrees, wrapping at 360), or the lowercase keyword `none` (0). Saturation and lightness are each a number or a percentage (`hsl(220 30 95)` equals `hsl(220 30% 95%)`). Alpha is a number or a percentage.
- a swatch and the color picker appear when the literal is `hwb()`, `lab()`, `lch()`, `oklab()`, or `oklch()` in a syntax VS Code accepts for that function in a `.css` file, except the space syntax with a fourth value and no slash (`lab(50 20 30 0.5)`), which VS Code accepts and CSS does not.
- a swatch and the color picker appear when one of those five function names is uppercase (`OKLCH(0.7 0.1 150)`), as for `RGB()` and `HSL()`, though VS Code shows no swatch for it in a `.css` file.
- a `lab()`, `lch()`, `oklab()`, or `oklch()` swatch shows each red, green, and blue channel clamped to 0 to 255 when the value is in range but outside sRGB (`lab(100 125 125)` shows `rgb(255 80 0)`), as VS Code does.
- a swatch and the color picker appear when the literal is a named CSS color after `:` or `,` and whitespace (`color: red`, `0 0 1px, black`), except `transparent`. A named color shows its CSS Color 4 value; `mediumpurple` (`#9370db`) and `palevioletred` (`#db7093`) differ from the swatches VS Code shows in a `.css` file (`#9370d8`, `#d87093`).
- no swatch appears when one function mixes commas and spaces as separators (`rgb(255, 0 153)`).
- no swatch appears when a function name continues a longer word (`myrgb(1, 2, 3)`, `x-hsla(0, 0%, 0%, 1)`, `my-hwb(0 0% 0%)`).
- no swatch appears when a value is out of range: an rgb channel above 255 or 100%, an hsl saturation or lightness or an hwb whiteness or blackness outside 0 to 100 (or 0% to 100%), or an alpha outside 0 to 1 (or 0% to 100%). A hue has no range.
- no swatch appears when a `lab()`, `lch()`, `oklab()`, or `oklch()` channel is outside its range: lightness 0 to 100 (`lab()`, `lch()`) or 0 to 1 (`oklab()`, `oklch()`), a and b -125 to 125 (`lab()`) or -0.4 to 0.4 (`oklab()`), chroma 0 to 230 (`lch()`) or 0 to 0.4 (`oklch()`). A percentage scales each range's upper end to 100% (`oklab(0.5 -100% 100%)` equals `oklab(0.5 -0.4 0.4)`).

Matching ignores case and covers every line of the document, not only CSS templates.

When the user picks a color in the picker, the offered formats are hex, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, and `oklch()`, in that order, each written the way VS Code writes it for a `.css` file:

- rgb channels, the hsl hue, and hsl percentages are whole numbers.
- hex is `#rrggbb`, or `#rrggbbaa` with a two-digit alpha when alpha is below 1.
- `rgba()` and `hsla()` replace `rgb()` and `hsl()` only when alpha is below 1.
- `hwb()` through `oklch()` use space syntax, with `/ alpha` only when alpha is below 1.

## Enter command

Command `extension.insertColonOrSemiColon` ("Fix Colon and Semicolon") is bound to Enter.

When the user presses Enter:

- the command runs when the suggestion list is open, focus is in a text editor, the editor's language id contains `javascript` or `typescript` (the keybinding's `when` clause in `package.json`), and `editor.acceptSuggestionOnEnter` is not `off`.
- VS Code's default Enter behavior runs in every other case.

When the command runs, it first accepts the selected suggestion, then:

- `: ;` is appended at the end of the line, the cursor lands before the `;`, and the suggestion list reopens, when the cursor is inside a CSS template and the line's last word is a known CSS property.
- the cursor moves inside the parentheses when the cursor is inside a CSS template and the line ends with a known CSS function followed by one character (`transform: rotate();`).
- nothing else happens when the cursor is outside every CSS template, there is no active editor, or the last word is neither a property nor a function.

```css
/* "color" selected in the suggestion list, Enter pressed */
color: |;
```

"Inside a CSS template" means the cursor is in the CSS content of a recognized template, at any nesting depth, including a template whose tag head spans lines, and not inside an interpolation (`${...}`), a JavaScript comment, or a plain string.

## Backtick snippet

When the user types a backtick that opens a recognized template in a served document, the suggestion list offers "expand template string":

- it inserts a newline, an indented cursor line, and a newline, when the cursor sits between two backticks.
- it inserts a newline, an indented cursor line, a newline, and the closing backtick, when no backtick follows the cursor.

The snippet is never offered on a completion request that the typed backtick did not trigger.

## Performance

- A grammar change tokenizes the benchmark corpus (the colorize fixtures repeated to about 5,000 lines) at or below the time of the grammars on `main`, both warm and on the first pass, in TSX and JS hosts. `npm run bench:grammar` measures it.
- The template check behind the Enter command and the backtick snippet runs in linear time over the text before the cursor, and finishes in under 100 ms at 5,000 lines.
- The color swatch scan takes time linear in a line's length, with no absolute budget; `src/colorParsing.test.ts` guards it.

## Conflicting-extension warning

When the extension activates and `blanu.vscode-styled-jsx` is enabled, an error message names that extension, says it conflicts with this one and is not needed, and tells the user to remove or disable it.

## Public contract

Themes, other extensions, and user configuration depend on these. Changing any of them needs a major changeset; everything else is internal and may be rewritten freely.

- Extension id: `styled-components.vscode-styled-components`
- Injection grammar scope name: `styled`
- Language id and CSS grammar scope name: `source.css.styled`
- Template content scope name: `source.css.scss`
- Scope names of the grammar's own CSS rules (the `.scss` names in `syntaxes/src/css.styled.mts`, such as `entity.other.attribute-name.scss`; themes color by them)
- Command id: `extension.insertColonOrSemiColon`
- TypeScript server plugin registration: `@styled/typescript-styled-plugin`

The other scope names (on the tag, the backticks, and an interpolation's expression) follow VS Code's TypeScript and JavaScript grammars, and the scope names of the rules copied from VS Code's CSS grammar follow that grammar when the pinned version moves (see [Inside a recognized template](#inside-a-recognized-template)); a change that comes from those grammars needs no major changeset.

## Packaging and release

- The build generates both grammars (`syntaxes/*.json`) from their sources in `syntaxes/src/`.
- `syntaxes/src/` holds a copy of VS Code's CSS grammar from the pinned test version. The build takes the CSS rules it uses from that copy and rewrites them for speed, emitting the same tokens and scope names.
- The published package holds the manifest, the bundled extension (`dist/`), both generated grammars (not `syntaxes/src/`), the language configuration, README, CHANGELOG, LICENSE, the third-party notice for the copied VS Code CSS grammar (MIT), the images the README and Marketplace page use, and production dependencies under `node_modules/` (the TypeScript plugin among them). `.vscodeignore` excludes sources, tests, docs, CI, and tooling config. List the contents with `npm run compile`, then `npx vsce ls` (`vsce ls` lists the files on disk and builds nothing).
- A release happens only through changesets and the Release workflow on `main`; mechanics: [docs/changesets.md](changesets.md).
- Publishing uses Marketplace trusted publishing (OIDC). No publish token or long-lived secret is stored anywhere.

## Test strategy

Two test layers run in CI, and a headless tokenizer and a grammar benchmark support grammar work.

- Unit layer: `npm run test:unit` runs the pure-logic tests (`src/**/*.test.ts` outside `src/tests/suite/`, and `syntaxes/src/**/*.test.ts`) in Node, without VS Code. They cover the template check behind the Enter command and the backtick snippet, including a differential test that compares the check with the grammar at every opening backtick in the colorize results, the generated CSS grammar against VS Code's, that every repository rule of both generated grammars is reachable from the top-level patterns, and the color swatch matching and picker formats (`src/colorParsing.test.ts`). CI runs them in the Lint job.
- Integration suite: `npm test` runs the suites below inside the VS Code version pinned in `src/tests/vscodeVersion.mts`, with every other extension disabled. CI runs it on macOS, Ubuntu, and Windows. Moving the pin replaces the copy of VS Code's CSS grammar in `syntaxes/src/` with the new version's, then regenerates the grammars and every colorize result for review.
- Headless tokenizer: `npm run tokenize -- <files>` prints each line's tokens and scopes, using the grammars of the pinned VS Code build plus this repo's grammars, without opening a window. With `--sentinel`, it exits non-zero when a sentinel line of a file is not at root scope or the file does not end with the sentinel line (see the sentinel convention below). With `--drift`, it compares each fixture's tokens against the fixture's committed result. It generates the grammars from `syntaxes/src/` first, except with `--grammars <dir>`, which tokenizes with the grammar files in that folder as they are. A `.css` file tokenizes with the pinned build's CSS grammar (`source.css`), so a template's tokens can be compared with the tokens VS Code gives the same CSS in a `.css` file. An unknown flag exits with code 2. Use it to write and check grammar changes.
- Grammar benchmark: `npm run bench:grammar -- [<baselineSyntaxesDir>...]` measures the grammars against the speed bar in [Performance](#performance). It generates the current grammars into a temporary folder and compares them with each given folder of grammar files (the first is the baseline; `node syntaxes/src/generate.mts <dir>` in a checkout of `main` writes one). Each round, host, and grammar set runs in a fresh process. An unknown flag exits with code 2.

| Integration suite | Lives in                                                     | Guards                                                                                                                                               |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activation        | `src/tests/suite/extension.test.ts`                          | the extension activates without an error                                                                                                             |
| Colorization      | `src/tests/suite/colorize-fixtures/` and `colorize-results/` | each fixture's token boundaries, scope names, and the colors every built-in theme gives them, compared against the committed result for that fixture |
| Commands          | `src/tests/suite/commands.test.ts`                           | the Enter command's edits, and when the backtick snippet is offered                                                                                  |

When the colorization test runs under CI:

- the test fails when a fixture has no committed result.
- the test fails when any token differs from the committed result, scope names included.

In both cases the test writes the new result, and CI uploads it as an artifact for review.

When the colorization test runs locally:

- the test writes the result file and passes when a fixture has no committed result.
- the test rewrites the result file and fails when token text or a theme color differs.
- the test rewrites the result file and passes when only scope names differ.

A rewritten result shows up in the diff of `colorize-results/` and is committed only after review.

Every colorize fixture except a `.css` fixture (plain CSS cannot hold the JavaScript line) has the sentinel line `const sentinel = 1;` as its last non-blank line, and may repeat it after earlier constructs. A fixture without that last line fails the colorization test and `npm run tokenize -- --sentinel` (which prints `SKIP` for a `.css` file). Every sentinel line must tokenize at root scope: the language root scope, the variable-declaration scope, and the `const` keyword scope, and no other. Any other scope on a sentinel line means highlighting leaked out of a template. A fixture that leaks joins the colorization test's known-leaks list only with an open issue number. A listed fixture whose sentinel line reaches root scope fails the test until its entry is removed.

Every colorize fixture contains CSS-highlighted tokens, except a fixture in the colorization test's plain-fixtures list (a fixture that checks that plain code stays plain). A shape whose highlighting depends on the host language has one fixture per host file extension.

No test covers:

- the conflicting-extension warning.
- the color provider's hand-off of each document line to the color parsing.
- the `file`-scheme and language restriction of the swatches and the snippet (the suites open one `.tsx` file on disk).
- the snippet's two insert texts (the suite counts offered labels only).
- the Enter command accepting the selected suggestion first, and reopening the suggestion list after `: ;` (the suite runs the command with no suggestion list open).
- the Enter command doing nothing when there is no active editor, or when the line's last word is neither a property nor a function inside a template.
- the Enter keybinding's `when` clause.

## Known deviations

An entry names the intended behavior and the issue that tracks it, or "No issue filed".
