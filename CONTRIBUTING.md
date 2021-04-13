# Contributing

Start off forking, then cloning the project locally:

- `$ yarn` - Install dependencies
- `$ yarn test` - Run tests (may be skechy on MacOS)
- `$ yarn format` - Format any changes you've made with prettier
- `$ yarn lint` - Check formatting with prettier

## Adding Syntax

The syntax is regex based, tools I've been using have include a mix of [regex101.com](https://regex101.com/) and [regexr.com](https://regexr.com/). Note that VSCode does
not use JavaScript Regex, but [oniguruma](https://github.com/kkos/oniguruma) instead. They are more compatible with the _PCRE_ flavor in these
websites. The Regex in the JSON files are string encoded, so you need to decode/encode them when copying between these websites, you can use a [tool like this](https://www.freeformatter.com/json-escape.html#ad-output).

It can take some time to get used to the regular expressions.

To visually test your changes press `F5` while having this project open in VSCode, it will open another window with extension enabled. You can load the `colorize-fixture` folder in that window to see your changes.

Refer to JS/TS tokens syntax at https://github.com/microsoft/vscode/tree/master/extensions under `<language>/syntaxes/<lang>.tmLanguage.json`.

To check how tokens are being matched, select "Developer: Inspect Editor Tokens and Scope" under Command Palette.

### "A line break seems to break the syntax highlighting"

Many of the bugs raised are due to multiline regex not being available.
Textmate grammar can [only match a single line](https://github.com/microsoft/vscode-textmate/issues/32). Unfortunately a lot of the regex we have tries to parse multiple lines at once (which won't work).
This has caused bugs to be raised such as: https://github.com/styled-components/vscode-styled-components/issues/266 and https://github.com/styled-components/vscode-styled-components/issues/277

The best fix is to look at the new line and create a new rule in https://github.com/styled-components/vscode-styled-components/blob/master/syntaxes/styled-components.json which will match that line as close as possible whilst still being generic. Regex101 helps with this.

## Intellisense issues

Intellisense is handled by https://github.com/microsoft/typescript-styled-plugin.

The best way to debug issues with intellisense is to clone that repo, then use `yarn link` with this repository. That should allow you to inspect what's happening better. More detail below.

For most things `typescript-styled-plugin` is just a [pass-through](https://github.com/microsoft/typescript-styled-plugin/blob/master/src/_language-service.ts#L87-L95) to the CSS/SCSS language services. For example, looking at [getCompletionItems](https://github.com/microsoft/typescript-styled-plugin/blob/master/src/_language-service.ts#L215-L244) you can see it just calls the equivalent on the upstream language services. So if something works natively (CSS file), but not in styled-components its most likely because it's not passing the correct events through.

### Setting up for development & debugging

I use VSCode's multiroot workspace for this. I have both `typescript-styled-plugin` and `vscode-styled-components` folders loaded.

- Make sure `typescript-styled-plugin` is yarn linked into `vscode-styled-components`
- In `vscode-styled-components/.vscode/launch.json` I add `"env": { "TSS_DEBUG": "9229" }` to the "Launch Extension". You can test this is working by going to chrome://inspect/#devices in your browser.
- In `typescript-styled-plugin` I add a launch config [see Launch Config for styled Plugin below] (this will allow us to set breakpoints in styled-plugin)
- In `typescript-styled-plugin` sourcemaps are off by default, so you will need to add `"sourceMap": true` under `compilerOptions` to the `tsconfig.json` fille
- Make sure you `yarn|npm compile` the `typescript-styled-plugin` repo after making changes (you could set up a watch here)
- [Debug Tab] Click "Launch extension"
- [Debug Tab] Click "Debug Styled Plugin"

You should now be able to use styled-components in the guest window and set breakpoints on the plugin in the main window.

More Info:

- https://github.com/microsoft/typescript-styled-plugin/issues/120#issuecomment-707400103
- https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#testing-locally

### Logging

If you want logging, you can set `"typescript.tsserver.log": "verbose"` in your global settings (or local guest settings) and view the output, there should be a path to a log file that's printed out. Any console.log you do from the plugin will end up in there.

### Launch Config for styled Plugin

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Debug Styled Plugin",
      "skipFiles": ["<node_internals>/**"],
      "outFiles": ["${workspaceFolder}/lib/**/*.js"],
      "port": 9229
    }
  ]
}
```

## Tests

You can run tests simply by running `yarn test`.
This should spawn another instance of VSCode to run the end to end tests in.

The syntax tests will generate tokens for [fixtures we have](./src/tests/suite/colorize-fixtures) which are then compared to the results (adjacent folder). If there are changes and the tests fail it will generate a new result (overwriting the previous one).

When making syntax changes you should update the test suite.
