// Composes the injection grammar (scope "styled") from named regex fragments. generate.mts writes it to syntaxes/styled-components.json.
// Rule order is behavior: TextMate tries the patterns in order and the first rule at the leftmost position wins.

import type { Captures, Grammar, Rule } from "./grammarTypes.ts";

const TICK = "`";

// Identifier, member, and bracketed-group repeats are possessive or atomic, so they never backtrack; the chain repeats (PREFIX, STYLED_PREFIX, CALL_CHAIN) and the lazy arrow-parameter group in styledTemplate can, bounded by the line length.
const ID_START = String.raw`_$[:alpha:]`;
const ID_PART = String.raw`_$[:alnum:]`;
const ID = String.raw`[${ID_START}][${ID_PART}]*+`;

// A tag starts at the root of its chain, never inside a longer identifier or member access.
// The injection wins ties against TypeScript's own begin at the same position (L:), so a rule that begins at the root never swallows a closer TypeScript needs.
const ROOT = String.raw`(?<![${ID_PART}.])`;
// A "." directly after ")" or "]" (`(await load()).styled`) also starts a root, and the match begins at that ".", because TypeScript's member rule would otherwise consume ".styled" first.
const STYLED_ROOT = String.raw`(?:${ROOT}|(?<=[)\]])\.\s*)`;
const PREFIX = String.raw`(?:${ID}\s*\??\.\s*)*`;
const STYLED = String.raw`\$?[sS]tyled`;

// A scan that finds no match reads to the end of the line, and the injection runs it again at every token. Each bracketed group reads at most this many items, which bounds one scan; a line of repeated "styled(" still costs more than linear time in its length (about 4x per doubling, on a synthetic line).
// A head longer than this window on one line gets no highlighting.
const WINDOW = 300;
const upToWindow = (inner: string) => String.raw`(?>(?:${inner}){0,${WINDOW}})`;

// Balanced brackets, three levels deep.
const ANGLE_3 = String.raw`<${upToWindow("=>|[^<>]")}>`;
const ANGLE_2 = String.raw`<${upToWindow(`=>|[^<>]|${ANGLE_3}`)}>`;
const TYPE_ARGUMENTS = String.raw`<${upToWindow(`=>|[^<>]|${ANGLE_2}`)}>`;
const PAREN_3 = String.raw`\(${upToWindow("[^()]")}\)`;
const PAREN_2 = String.raw`\(${upToWindow(`[^()]|${PAREN_3}`)}\)`;
const PARENS = String.raw`\(${upToWindow(`[^()]|${PAREN_2}`)}\)`;
// Parentheses that hold no backtick: a call argument that holds one (an arrow function returning the template) belongs to the head, not to this match.
const PLAIN_PAREN_3 = String.raw`\(${upToWindow(`[^()${TICK}]`)}\)`;
const PLAIN_PAREN_2 = String.raw`\(${upToWindow(`[^()${TICK}]|${PLAIN_PAREN_3}`)}\)`;
const PLAIN_PARENS = String.raw`\(${upToWindow(`[^()${TICK}]|${PLAIN_PAREN_2}`)}\)`;
// A call in a styled prefix (`foo().styled.div`) is consumed with the root: TypeScript's call frame opened at "foo" would otherwise never close.
const STYLED_PREFIX = String.raw`(?:${ID}(?:${PLAIN_PARENS})?\s*\??\.\s*)*`;
const BRACE_3 = String.raw`\{${upToWindow("[^{}]")}\}`;
const BRACE_2 = String.raw`\{${upToWindow(`[^{}]|${BRACE_3}`)}\}`;
const BRACES = String.raw`\{${upToWindow(`[^{}]|${BRACE_2}`)}\}`;
const BRACKETS = String.raw`\[${upToWindow(String.raw`[^\[\]]|\[[^\[\]]*+\]`)}\]`;

// A "<" opens type arguments when they close on this line before a call, template, member or line end,
// or when they stay open to the line end (no stray ">", ")" or ";" before it, except inside an object type).
const TYPE_ARGUMENTS_OPEN = String.raw`<\s*${upToWindow(`=>|[^<>()${TICK};{}]|${PARENS}|${ANGLE_2}`)}(?:\{[^${TICK}]*)?$`;
const GUARD = String.raw`(?:${TYPE_ARGUMENTS}\s*(?:[(${TICK}.]|$)|${TYPE_ARGUMENTS_OPEN})`;

// A head frame opens only when a backtick follows later on the line, or the line ends inside an open bracket.
// Neither holds inside a begin capture of the single-line rule, so the head rule never fires while a capture is retokenized.
const GUARD_TICK = String.raw`${upToWindow(`[^${TICK}]`)}${TICK}`;
const GUARD_OPEN = String.raw`${upToWindow(String.raw`[^(){}\[\]<>${TICK}]|=>|${PARENS}|${BRACES}|${BRACKETS}|${TYPE_ARGUMENTS}`)}(?:[<{\[]|\((?!\s*$))`;

// Member accesses after the root, stopping before a call or generic call (those belong to the head body).
const MEMBERS = String.raw`(?:\s*\??\.\s*${ID}(?!\s*(?:\(|${TYPE_ARGUMENTS}\s*\()))*+`;

// A chain that ends its line, optionally before a comment, with the backtick on a later line (Prettier's `styled.div⏎  .attrs({…})`).
// The literal "\n" is the guard: the text TextMate retokenizes for a begin capture is cut at the capture's end and has no "\n", so the frame cannot open inside its own capture.
// A bare "styled" is the separate bare-"styled" rule below, so the root alone never counts as a chain.
const CHAIN_ITEM = String.raw`[ \t]*(?:\??\.[ \t]*${ID}|${PARENS}|${TYPE_ARGUMENTS})`;
const LINE_END = String.raw`[ \t]*(?:/[/*].*)?\n`;
const CHAIN_AT_LINE_END = String.raw`(?:(?<![sS]tyled)(?=${CHAIN_ITEM}*+${LINE_END})|(?=${CHAIN_ITEM}++${LINE_END}))`;

const expression = [{ include: "source.tsx#expression" }];
const typeScriptExpression = [{ include: "source.ts#expression" }];

const templateBeginName =
  "punctuation.definition.string.template.begin.js string.template.js";
const templateEndName =
  "punctuation.definition.string.template.end.js string.template.js";
const tagName = "entity.name.function.tagged-template.js";
const propertyTagName =
  "entity.name.function.tagged-template.js variable.other.property.js";
const cssContent = "source.css.scss";
// Every template except keyframes shares the "css-body" frame, so the CSS top-level scanner compiles once rather than once per template rule.
const cssInclude = [{ include: "#css-body" }];

const template = (
  begin: string,
  beginCaptures: Captures,
  patterns: Rule[] = cssInclude,
) => ({
  contentName: cssContent,
  begin,
  beginCaptures,
  end: TICK,
  endCaptures: { 0: { name: templateEndName } },
  patterns,
});

const typeParameters = { patterns: [{ include: "source.ts#type-parameters" }] };

// The head frame spans the lines between a tag's root and its backtick.
const headEnd = String.raw`(?<=${TICK})|(?=\s*[^\s.(<${TICK}/])|(?=\s+<)|(?!${GUARD})(?=<)`;
const helperEnd = String.raw`(?<=${TICK})|(?=\s*[^\s<${TICK}])|(?!${GUARD})(?=<)`;
const head = (begin: string, beginCaptures: Captures) => ({
  begin,
  beginCaptures,
  end: headEnd,
  patterns: [{ include: "#styled-head-body" }],
});
const helperHead = (begin: string, beginCaptures: Captures) => ({
  begin,
  beginCaptures,
  end: helperEnd,
  patterns: [
    { include: "#helper-template" },
    { include: "#head-type-arguments" },
  ],
});

const repository = {
  // Zero-width and unnamed, so scopes are unchanged; (?!`) keeps it from opening on an empty template, where TextMate's no-progress guard would end the line.
  "css-body": {
    begin: String.raw`(?<=${TICK})(?!${TICK})`,
    end: String.raw`(?=${TICK})`,
    patterns: [{ include: "source.css.styled" }],
  },
  // The styled head's closing backtick keeps the legacy "begin" scope so existing results do not drift.
  "head-template": {
    ...template(TICK, { 0: { name: templateBeginName } }),
    endCaptures: { 0: { name: templateBeginName } },
  },
  "helper-template": template(TICK, { 0: { name: templateBeginName } }),
  // A ")", ";", "}" or "]" at the top level of the type arguments proves the "<" was a comparison; the frame ends there.
  "head-type-arguments": {
    name: "meta.type.parameters.ts",
    begin: String.raw`(?=${GUARD})(<)`,
    beginCaptures: {
      1: { name: "punctuation.definition.typeparameters.begin.ts" },
    },
    end: String.raw`>|(?=[);}\]])`,
    endCaptures: {
      0: { name: "punctuation.definition.typeparameters.end.ts" },
    },
    patterns: [{ include: "source.ts#type-arguments-body" }],
  },
  "head-member": {
    match: String.raw`(\??\.)\s*(${ID})(?!\s*[(<])`,
    captures: {
      1: { name: "punctuation.accessor.ts" },
      2: { name: "variable.other.property.ts" },
    },
  },
  // source.tsx#expression, not source.ts#expression: JSX in a head (a Material-UI wrapper's `<Button {...other} />`) keeps JSX scopes in every host.
  "styled-head-body": {
    patterns: [
      { include: "#head-template" },
      { include: "#head-type-arguments" },
      { include: "#head-member" },
      ...expression,
    ],
  },
} satisfies Record<string, Rule>;

// The "(" of a call that takes the template or an arrow returning it, except the arguments of ".attrs" and ".withConfig", which compute props, not styles (spec, "Out of scope").
const OPEN_CALL = String.raw`(?:(?<!\.attrs|\.withConfig)\()?`;

const styledTemplate = template(
  String.raw`(${STYLED_ROOT}${STYLED_PREFIX}${STYLED}(?:${TYPE_ARGUMENTS}(?=\())?(?:\.${ID}|\s*${PLAIN_PARENS})*+(?:\s*${TYPE_ARGUMENTS})?${OPEN_CALL})\s*((?:\([\{\}\w$,\:\s]+?\)|${ID})\s*=>\s*)?(${TICK})`,
  {
    1: { patterns: typeScriptExpression },
    2: { patterns: typeScriptExpression },
    3: { name: templateBeginName },
  },
);

const cssTemplate = template(
  String.raw`${ROOT}(${PREFIX})(css)(${TYPE_ARGUMENTS})?(${TICK})`,
  {
    1: { patterns: typeScriptExpression },
    2: { name: tagName },
    3: typeParameters,
    4: { name: templateBeginName },
  },
);

const globalTemplate = template(
  String.raw`${ROOT}(injectGlobal|createGlobalStyles?|stylesheet)(${TYPE_ARGUMENTS})?(${TICK})`,
  { 1: { name: tagName }, 2: typeParameters, 3: { name: templateBeginName } },
);

// "keyframes" and ".extend" start at the chain root: a rule that begins earlier on the line consumes a closer (")", "]") that TypeScript needs to end a frame opened on a previous line.
const keyframesTemplate = template(
  String.raw`${ROOT}(${PREFIX})(keyframes)(${TYPE_ARGUMENTS})?(${TICK})`,
  {
    1: { patterns: typeScriptExpression },
    2: { name: propertyTagName },
    3: typeParameters,
    4: { name: templateBeginName },
  },
  [{ include: "source.css.styled#keyframes_body" }],
);

const CALL_SEGMENT = String.raw`${ID}(?:${PARENS})?`;
const CALL_CHAIN = String.raw`(?:${CALL_SEGMENT}\s*\??\.\s*)*${CALL_SEGMENT}`;
const extendTemplate = template(
  String.raw`${ROOT}(${CALL_CHAIN})(\.)(extend)(${TICK})`,
  {
    1: { patterns: typeScriptExpression },
    2: { name: "punctuation.accessor.js" },
    3: { name: propertyTagName },
    4: { name: templateBeginName },
  },
);

const withComponentTemplate = template(
  String.raw`(${ROOT}${PREFIX}${ID}\.withComponent\((?:['"]${ID}['"]|[_$[:alpha:]][_$\.[:alnum:]]*)\))\s*(?:(\.)(extend))?(${TICK})`,
  {
    1: { patterns: typeScriptExpression },
    2: { name: "punctuation.accessor.js" },
    3: { name: propertyTagName },
    4: { name: templateBeginName },
  },
);

const mediaTemplate = template(
  String.raw`(${ROOT}[mM]edia\.[[:alpha:]][[:alnum:]]*(?:${PARENS})?)\s*(${TICK})`,
  { 1: { patterns: typeScriptExpression }, 2: { name: templateBeginName } },
);

const cssPropTemplate = {
  ...template(String.raw`\s*(css)(=)(\{)(${TICK})`, {
    1: { name: "entity.other.attribute-name.jsx" },
    2: { name: "keyword.operator.assignment.jsx" },
    3: { name: "punctuation.section.embedded.begin.jsx" },
    4: {
      name: "punctuation.definition.string.template.begin.jsx string.template.js",
    },
  }),
  end: String.raw`(${TICK})(\})\s*`,
  endCaptures: {
    1: {
      name: "punctuation.definition.string.template.end.jsx string.template.js",
    },
    2: { name: "punctuation.section.embedded.end.jsx" },
  },
};

const styledJsxTemplate = {
  ...template(
    String.raw`(?<=<style\s(?:jsx|jsx\s+global|global\s+jsx)+\>\{)${TICK}`,
    { 0: { name: templateBeginName } },
  ),
  end: String.raw`${TICK}(?=\}\<\/style\>)`,
};

export const styledComponentsGrammar = {
  fileTypes: ["js", "jsx", "ts", "tsx", "vue", "svelte"],
  injectionSelector:
    "L:source -comment -string -(source.css.scss -meta.embedded.line.ts)",
  patterns: [
    styledTemplate,
    cssTemplate,
    keyframesTemplate,
    globalTemplate,
    extendTemplate,
    withComponentTemplate,
    mediaTemplate,
    // Separate rules, not one alternation: each tag shape has its own captures, and one "(css|keyframes)" head measured slower in `npm run bench:grammar`.
    head(
      String.raw`(${STYLED_ROOT}${STYLED_PREFIX}${STYLED}${MEMBERS})(?:(?=\s*[(.<])(?=${GUARD_TICK}|${GUARD_OPEN})|${CHAIN_AT_LINE_END})`,
      { 1: { patterns: typeScriptExpression } },
    ),
    head(
      String.raw`${ROOT}(${CALL_CHAIN})(\.)(extend)(?=\.(?:attrs|withConfig)\b|\s*$)`,
      {
        1: { patterns: typeScriptExpression },
        2: { name: "punctuation.accessor.js" },
        3: { name: tagName },
      },
    ),
    // Bare "styled" or "styled(" ending the line: names given directly, since retokenizing "styled" would re-enter this rule.
    head(String.raw`${ROOT}(?:(${STYLED})\s*$|(${STYLED})(?=\s*\(\s*$))`, {
      1: { name: "variable.other.readwrite.ts" },
      2: { name: "meta.function-call.ts entity.name.function.ts" },
    }),
    helperHead(String.raw`${ROOT}(${PREFIX})(css)(?=${GUARD})`, {
      1: { patterns: typeScriptExpression },
      2: { name: tagName },
    }),
    helperHead(String.raw`${ROOT}(${PREFIX})(keyframes)(?=${GUARD})`, {
      1: { patterns: typeScriptExpression },
      2: { name: tagName },
    }),
    helperHead(
      String.raw`${ROOT}(injectGlobal|createGlobalStyles?|stylesheet)(?=${GUARD})`,
      {
        1: { name: tagName },
      },
    ),
    cssPropTemplate,
    styledJsxTemplate,
  ],
  scopeName: "styled",
  repository,
} satisfies Grammar;
