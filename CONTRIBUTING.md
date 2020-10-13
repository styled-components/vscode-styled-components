# Contributing

Start off forking, then cloning the project locally:

- `$ yarn` - Install dependencies
- `$ yarn test` - Run tests (may be skechy on MacOS)
- `$ yarn format` - Format any changes you've made with prettier
- `$ yarn lint` - Check formatting with prettier

## Adding Syntax

The syntax is regex based, tools I've been using have include a mix of https://regex101.com/ and https://regexr.com/.
The later matches groupings back to the original regex.

It can take some time to get used to the regular expressions.

To visually test your changes click on `Launch Extension` on the left panel and open a project of your choosing.
Something I tend to do is copy (or symlink) the fixtures fodler (colorize-fixtures) and open that with the launched window

## Intellisense isues

Intellisense is handled by https://github.com/microsoft/typescript-styled-plugin.

The best way to debug issues with intellisense is to clone that repo, then use `yarn link` with this repository. That should allow you to inspect what's happening better. More detail below.

For most things `typescript-styled-plugin` is just a [pass-through](https://github.com/microsoft/typescript-styled-plugin/blob/master/src/_language-service.ts#L87-L95) to the CSS/SCSS language services. For example, looking at [getCompletionItems](https://github.com/microsoft/typescript-styled-plugin/blob/master/src/_language-service.ts#L215-L244) you can see it just calls the equivalent on the upstream language services. So if something works natively (CSS file), but not in styled-components its most likely because it's not passing the correct events through.

### Setting Up for development

I use VSCode's multiroot workspace for this. I have both `typescript-styled-plugin` and `vscode-styled-components` folders loaded.
- Make sure `typescript-styled-plugin` is yarn linked into `vscode-styled-components`
- In `vscode-styled-components/.vscode/launch.json`  I add `"env": { "TSS_DEBUG": "9229" }` to the "Launch Extension". You can test this is working by going to chrome://inspect/#devices in your browser.
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
