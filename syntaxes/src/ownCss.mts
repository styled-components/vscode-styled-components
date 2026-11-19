// Turns css.styled's rule set into a self-contained grammar: every "source.css#name" include becomes a local "#css-name" copy from css.tmLanguage.json
// (VS Code's CSS grammar, vendored from the pinned VS Code), then two rewrites cut Oniguruma's compile and match cost without changing any match.
import vscodeCss from "./css.tmLanguage.json" with { type: "json" };
import type { Captures, Grammar, Rule } from "./grammarTypes.ts";

const vscodeRepository: Record<string, Rule> = vscodeCss.repository;

// Each walker rebuilds only the keys it changes, so every key keeps its place in the emitted JSON.
const mapCaptures = (
  captures: Captures,
  mapRule: (rule: Rule) => Rule,
): Captures =>
  Object.fromEntries(
    Object.entries(captures).map(([key, capture]) => [
      key,
      {
        ...capture,
        ...(capture?.patterns && { patterns: capture.patterns.map(mapRule) }),
      },
    ]),
  );

const mapRule = (
  rule: Rule,
  mapString: (key: string, value: string) => string,
): Rule => {
  const recurse = (child: Rule): Rule => mapRule(child, mapString);
  return {
    ...rule,
    ...(rule.begin !== undefined && { begin: mapString("begin", rule.begin) }),
    ...(rule.end !== undefined && { end: mapString("end", rule.end) }),
    ...(rule.match !== undefined && { match: mapString("match", rule.match) }),
    ...(rule.while !== undefined && { while: mapString("while", rule.while) }),
    ...(rule.include !== undefined && {
      include: mapString("include", rule.include),
    }),
    ...(rule.patterns && { patterns: rule.patterns.map(recurse) }),
    ...(rule.captures && { captures: mapCaptures(rule.captures, recurse) }),
    ...(rule.beginCaptures && {
      beginCaptures: mapCaptures(rule.beginCaptures, recurse),
    }),
    ...(rule.endCaptures && {
      endCaptures: mapCaptures(rule.endCaptures, recurse),
    }),
  };
};

const mapGrammar = (
  grammar: Grammar,
  mapString: (key: string, value: string) => string,
): Grammar => ({
  ...grammar,
  patterns: grammar.patterns.map((rule) => mapRule(rule, mapString)),
  repository: Object.fromEntries(
    Object.entries(grammar.repository).map(([name, rule]) => [
      name,
      mapRule(rule, mapString),
    ]),
  ),
});

const REGEX_KEYS = ["begin", "end", "match", "while"];

const includePattern = (prefix: string) => new RegExp(`^${prefix}([\\w-]+)$`);

const childRules = (rule: Rule): Rule[] => [
  ...(rule.patterns ?? []),
  ...[rule.captures, rule.beginCaptures, rule.endCaptures].flatMap((captures) =>
    Object.values(captures ?? {}).flatMap((capture) => capture?.patterns ?? []),
  ),
];

// A rule and every rule nested under it, through patterns and capture patterns.
export const ruleTree = (rule: Rule): Rule[] => [
  rule,
  ...childRules(rule).flatMap(ruleTree),
];

export const grammarRules = (
  grammar: Pick<Grammar, "patterns" | "repository">,
): Rule[] =>
  [...grammar.patterns, ...Object.values(grammar.repository)].flatMap(ruleTree);

export const regexesOf = (rules: Rule[]): string[] =>
  rules.flatMap((rule) =>
    [rule.begin, rule.end, rule.match, rule.while].filter(
      (regex) => regex !== undefined,
    ),
  );

const includesOf = (rule: Rule, prefix: string): string[] => {
  const pattern = includePattern(prefix);
  return ruleTree(rule).flatMap(
    (node) => node.include?.match(pattern)?.slice(1) ?? [],
  );
};

const renameInclude = (from: string, to: string) => {
  const pattern = includePattern(from);
  return (key: string, value: string) =>
    key === "include" ? value.replace(pattern, `${to}$1`) : value;
};

// Functions that ship in Chrome, Firefox, and Safari (MDN browser-compat-data) but that the pinned VS Code CSS grammar's function rules lack; they get its misc-function tokens. Remove a name when the pinned grammar gains it.
export const MISC_FUNCTIONS_BEYOND_VSCODE = [
  "anchor",
  "anchor-size",
  "contrast-color",
  "env",
  "light-dark",
  "mod",
  "rem",
  "round",
  "sibling-count",
  "sibling-index",
] as const;

// Same body as VS Code's misc-function rule, minus the density rule; it joins "css-functions" so it is reachable from every nested function argument.
const miscFunctionsBeyondVscode = (): Rule => ({
  begin: `(?i)(?<![\\w-])(${trie([...MISC_FUNCTIONS_BEYOND_VSCODE])})(\\()`,
  beginCaptures: {
    1: { name: "support.function.misc.css" },
    2: { name: "punctuation.section.function.begin.bracket.round.css" },
  },
  end: String.raw`\)`,
  endCaptures: {
    0: { name: "punctuation.section.function.end.bracket.round.css" },
  },
  name: "meta.function.misc.css",
  patterns: [
    { include: "#css-arithmetic-operators" },
    { include: "#css-property-values" },
    { match: String.raw`[^'"),\s]+`, name: "variable.parameter.misc.css" },
  ],
});

const interpolationInclude: Rule = { include: "#interpolation" };

// The rewrites below depend on these rules; a missing one fails the build rather than silently dropping the rewrite.
const requireRule = (grammar: Grammar, key: string): Rule => {
  const rule = grammar.repository[key];
  if (rule === undefined) {
    throw new Error(
      `The CSS grammar has no "${key}" rule, which the build rewrites to support \${...} interpolations. Add the rule to css.styled.mts, or include it from there with a "source.css#<name>" include.`,
    );
  }
  return rule;
};

// Copies the reached VS Code rules (and the rules they include) under a "css-" prefix.
function inlineVscodeCss(grammar: Grammar): Grammar {
  const reached = new Set<string>();
  const queue = [
    ...grammar.patterns.flatMap((rule) => includesOf(rule, "source\\.css#")),
    ...Object.values(grammar.repository).flatMap((rule) =>
      includesOf(rule, "source\\.css#"),
    ),
  ];
  while (queue.length > 0) {
    const name = queue.pop();
    if (name === undefined || reached.has(name)) continue;
    reached.add(name);
    queue.push(...includesOf(vscodeRepository[name], "#"));
  }

  const inlined = mapGrammar(grammar, renameInclude("source\\.css#", "#css-"));
  for (const name of [...reached].sort()) {
    inlined.repository[`css-${name}`] = mapRule(
      vscodeRepository[name],
      renameInclude("#", "#css-"),
    );
  }

  const functions = requireRule(inlined, "css-functions");
  const propertyValues = requireRule(inlined, "css-property-values");
  inlined.repository["css-functions"] = {
    ...functions,
    patterns: [...(functions.patterns ?? []), miscFunctionsBeyondVscode()],
  };
  // Every function argument list reaches this rule, so "${...}" stays an interpolation inside "min(${a}px, 1rem)".
  inlined.repository["css-property-values"] = {
    ...propertyValues,
    patterns: [interpolationInclude, ...(propertyValues.patterns ?? [])],
  };
  return withInterpolations(inlined);
}

// A "${...}" is an interpolation inside "url(...)" and inside a quoted string, as it is everywhere else; VS Code's CSS grammar has no such notion.
// The url argument stops before "${" so "url(img-${n}.png)" splits around the interpolation.
const withInterpolations = (grammar: Grammar): Grammar => {
  const url = requireRule(grammar, "css-url");
  const string = requireRule(grammar, "css-string");
  requireRule(grammar, "interpolation");

  const inString = (quoted: Rule): Rule => ({
    ...quoted,
    patterns: [
      interpolationInclude,
      ...(quoted.patterns ?? []).map((sub) =>
        sub.patterns === undefined
          ? sub
          : { ...sub, patterns: [interpolationInclude, ...sub.patterns] },
      ),
    ],
  });

  return {
    ...grammar,
    repository: {
      ...grammar.repository,
      "css-string": {
        ...string,
        patterns: (string.patterns ?? []).map(inString),
      },
      "css-url": {
        ...url,
        patterns: [
          interpolationInclude,
          ...(url.patterns ?? []).map((pattern) =>
            pattern.name === "variable.parameter.url.css"
              ? { ...pattern, match: String.raw`(?:[^'")\s$]|\$(?!\{))+` }
              : pattern,
          ),
        ],
      },
    },
  };
};

// Under (?i), Oniguruma case-folds a class holding \w over all of Unicode at compile (about 0.3 ms per class) and matches it slower.
// These classes are proven fold-closed (identical at every code point with and without (?i), grammar.test.ts), so (?-i:...) changes no match.
export const FOLD_CLOSED_CLASSES = [
  String.raw`[\w-]`,
  String.raw`[\w:-]`,
  String.raw`[\w@-]`,
];

type BracketClass = {
  start: number;
  end: number;
  text: string;
  ignoreCase: boolean;
};

// Bracket classes of an Oniguruma pattern with the (?i) state at each; handles escapes, nested and POSIX classes, (?x) whitespace and comments, and inline flag groups.
export function bracketClasses(pattern: string): BracketClass[] {
  const found: BracketClass[] = [];
  const lead = pattern.match(/^\(\?([imx]+)\)/);
  let index = lead ? lead[0].length : 0;
  let extended = lead?.[1].includes("x") ?? false;
  let ignoreCase = lead?.[1].includes("i") ?? false;
  const groups: { extended: boolean; ignoreCase: boolean }[] = [];

  while (index < pattern.length) {
    const char = pattern[index];
    if (char === "\\") {
      index += 2;
    } else if (extended && /\s/.test(char)) {
      index++;
    } else if (extended && char === "#") {
      while (index < pattern.length && pattern[index] !== "\n") index++;
    } else if (char === "(") {
      groups.push({ extended, ignoreCase });
      const flags = pattern
        .slice(index)
        .match(/^\(\?([imx]*)(?:-([imx]+))?(\)|:)/);
      if (flags === null) {
        index++;
        continue;
      }
      if (flags[1].includes("i")) ignoreCase = true;
      if (flags[2]?.includes("i")) ignoreCase = false;
      if (flags[1].includes("x")) extended = true;
      if (flags[2]?.includes("x")) extended = false;
      if (flags[3] === ")") groups.pop();
      index += flags[0].length;
    } else if (char === ")") {
      ({ extended, ignoreCase } = groups.pop() ?? { extended, ignoreCase });
      index++;
    } else if (char === "[") {
      const start = index;
      let depth = 0;
      index++;
      if (pattern[index] === "^") index++;
      if (pattern[index] === "]") index++;
      for (; index < pattern.length; index++) {
        if (pattern[index] === "\\") index++;
        else if (pattern[index] === "[") depth++;
        else if (pattern[index] === "]" && depth-- === 0) break;
      }
      index++;
      found.push({
        start,
        end: index,
        text: pattern.slice(start, index),
        ignoreCase,
      });
    } else {
      index++;
    }
  }
  return found;
}

function unfoldClasses(pattern: string): string {
  return bracketClasses(pattern)
    .filter(
      ({ ignoreCase, text }) =>
        ignoreCase && FOLD_CLOSED_CLASSES.includes(text),
    )
    .reverse()
    .reduce(
      (out, { start, end, text }) =>
        `${out.slice(0, start)}(?-i:${text})${out.slice(end)}`,
      pattern,
    );
}

// Under (?i) Oniguruma lets these letter pairs match one ligature or sharp-s character (U+FB00-FB06, U+00DF, U+1E9E), but only inside one literal, so a trie never branches between them.
const FOLD_PAIRS = ["ss", "st", "ff", "fi", "fl"];

const foldUnits = (word: string): string[] =>
  [...word].reduce<string[]>((units, char) => {
    const last = units.at(-1);
    return last !== undefined && FOLD_PAIRS.includes(last.at(-1) + char)
      ? [...units.slice(0, -1), last + char]
      : [...units, char];
  }, []);

const expandClasses = (word: string): string[] => {
  const m = word.match(/^(.*?)\[([^\]]+)\](.*)$/);
  if (m === null) return [word];
  const chars = m[2].replace(
    /(.)-(.)/g,
    (_: string, from: string, to: string) =>
      String.fromCharCode(
        ...Array.from(
          { length: to.charCodeAt(0) - from.charCodeAt(0) + 1 },
          (_, i) => from.charCodeAt(0) + i,
        ),
      ),
  );
  return [...chars].flatMap((c) => expandClasses(m[1] + c + m[3]));
};

const WORD_LIST = String.raw`^(\(\?x?i\))?(\(\?<!\[[^\]]*\]\))(\(\?:|\(\?i:|\()([-a-zA-Z0-9|[\]]+)\)(\(\?!\[\\w-\]\)|\(\?=\[\+~>\\s,\.\\#\|&\)\{:\\\[\]\|\/\\\*\|\$\))$`;

type WordList = {
  lead: string;
  before: string;
  open: string;
  words: string[];
  after: string;
};

// A case-insensitive word list fenced by lookarounds that reject [\w-] before and after (VS Code's keyword and tag-name rules), or null.
// The fences make a match the whole [\w-] run or nothing, so alternative order cannot change what matches and a trie is equivalent.
export function parseWordList(pattern: string): WordList | null {
  const compact = /^\(\?x/.test(pattern)
    ? pattern.replace(/(?<!\\)#[^\n]*/g, "").replace(/\s+/g, "")
    : pattern;
  const m = compact.match(new RegExp(WORD_LIST));
  if (m === null || !(m[1]?.includes("i") || m[3] === "(?i:")) return null;

  const words = m[4].split("|").flatMap(expandClasses);
  if (words.length < 8 || words.some((word) => !/^[A-Za-z0-9-]+$/.test(word)))
    return null;
  return { lead: m[1] ?? "", before: m[2], open: m[3], words, after: m[5] };
}

type Trie = { end: boolean; next: Map<string, Trie> };

const newTrie = (): Trie => ({ end: false, next: new Map() });

function trie(words: string[]): string {
  const root = newTrie();
  for (const word of new Set(words.map((w) => w.toLowerCase()))) {
    let node = root;
    for (const unit of foldUnits(word)) {
      let child = node.next.get(unit);
      if (child === undefined) {
        child = newTrie();
        node.next.set(unit, child);
      }
      node = child;
    }
    node.end = true;
  }

  const emit = (node: Trie): string => {
    const branches = [...node.next].sort(([a], [b]) => (a < b ? -1 : 1));
    if (branches.length === 0) return "";

    const alternatives = branches.map(([unit, first]) => {
      let text = unit;
      let child = first;
      while (child.next.size === 1 && !child.end) {
        const [[onlyUnit, only]] = child.next;
        text += onlyUnit;
        child = only;
      }
      return text + emit(child);
    });
    const optional = node.end ? "?" : "";
    if (alternatives.length === 1 && optional === "") return alternatives[0];
    if (alternatives.length === 1 && alternatives[0].length === 1)
      return `${alternatives[0]}?`;
    return `(?:${alternatives.join("|")})${optional}`;
  };
  return emit(root);
}

export function rewriteRegex(pattern: string): string {
  const list = parseWordList(pattern);
  const factored =
    list === null
      ? pattern
      : `${list.lead}${list.before}${list.open}${trie(list.words)})${list.after}`;
  return unfoldClasses(factored);
}

export const ownCss = (grammar: Grammar): Grammar =>
  mapGrammar(inlineVscodeCss(grammar), (key, value) =>
    REGEX_KEYS.includes(key) ? rewriteRegex(value) : value,
  );
