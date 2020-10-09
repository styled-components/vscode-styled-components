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

The best way to debug issues with intellisense is to clone that repo, then use `yarn link` with this repository. That should allow you to inspect what's happening better.

For most things `typescript-styled-plugin` is just a [pass-through](https://github.com/microsoft/typescript-styled-plugin/blob/master/src/_language-service.ts#L87-L95) to the CSS/SCSS language services. For example, looking at [getCompletionItems](https://github.com/microsoft/typescript-styled-plugin/blob/master/src/_language-service.ts#L215-L244) you can see it just calls the equivalent on the upstream language services. So if something works natively (CSS file), but not in styled-components its most likely because it's not passing the correct events through.

## Tests

You can run tests simply by running `yarn test`.
This should spawn another instance of VSCode to run the end to end tests in.

The syntax tests will generate tokens for [fixtures we have](./src/tests/suite/colorize-fixtures) which are then compared to the results (adjacent folder). If there are changes and the tests fail it will generate a new result (overwriting the previous one).

When making syntax changes you should update the test suite.
