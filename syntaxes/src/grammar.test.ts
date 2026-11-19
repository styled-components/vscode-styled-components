import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { before, describe, test } from "node:test";

// A named import: esbuild gives a .ts file's default import of this CommonJS package its "default" export (undefined), where Node's own ESM loader gives module.exports.
import { OnigScanner, OnigString, loadWASM } from "vscode-oniguruma";

import { fixtureFileNames } from "../../src/tests/colorizeToken.mts";
import { cssStyledGrammar } from "./css.styled.mts";
import vscodeCss from "./css.tmLanguage.json" with { type: "json" };
import type { Grammar, Rule } from "./grammarTypes.ts";
import {
  bracketClasses,
  FOLD_CLOSED_CLASSES,
  grammarRules,
  MISC_FUNCTIONS_BEYOND_VSCODE,
  ownCss,
  parseWordList,
  regexesOf,
  rewriteRegex,
  ruleTree,
} from "./ownCss.mts";
import { styledComponentsGrammar } from "./styled-components.mts";

const tagNameList = parseWordList(vscodeCss.repository["tag-names"].match);
if (tagNameList === null) {
  throw new Error("VS Code's tag-names rule is no longer a keyword list");
}
const tagNames = tagNameList.words;

const ownTagNamesRegex = cssStyledGrammar.repository["css-tag-names"].match;
if (ownTagNamesRegex === undefined) {
  throw new Error('The generated grammar has no "css-tag-names" match rule');
}

// Tests run from the repo root (scripts/unit-tests.mts).
const fixturesDir = "src/tests/suite/colorize-fixtures";

const extraLines = [
  "accent-color: red",
  "ALIGN-ITEMS: center",
  "-webkit-box-shadow: none",
  "div > a:hover, SPAN.b",
  "A, Abbr, ALTGLYPH, altglyphdef",
  "H1 { } h6 { } h7 { }",
  "font: 12px/1.5 Helvetica, sans-serif",
  "@media screen and (max-width: 10px) { a { b: c } }",
  "transform: translateX(10%) rotate(3deg)",
  "color: ButtonFace AliceBlue",
  "x-foo-bar: baz",
  "font-face-src, font-face, font-face-uri, font",
  "mi mn mo msub msubsup msup mstyle ms math",
  "  grid-template-areas: 'a b'",
  "svg path g use symbol switch set stop",
  "Q q P p S s U u I i B b",
  "",
];

// Blank and repeated fixture lines (every fixture ends with the same sentinel) add no new input.
const fixtureLines = [
  ...new Set(
    fixtureFileNames(fixturesDir).flatMap((file) =>
      readFileSync(join(fixturesDir, file), "utf8").split(/\r?\n/),
    ),
  ),
];

const capturesOf = (match: {
  captureIndices: { start: number; end: number }[];
}) => match.captureIndices.map((c) => `${c.start}:${c.end}`).join(";");

// A search from a position finds the leftmost match at or after it, so stepping to one past each match start visits every position a match can begin; "\G" matches only where a search starts, so a regex with it needs every position.
const matchesIn = (
  scanner: OnigScanner,
  text: string,
  atEveryPosition: boolean,
) => {
  const string = new OnigString(text);
  const matches: string[] = [];
  let position = 0;
  while (position <= text.length) {
    const match = scanner.findNextMatchSync(string, position);
    if (match === null && !atEveryPosition) break;
    matches.push(match === null ? "none" : capturesOf(match));
    position =
      atEveryPosition || match === null
        ? position + 1
        : match.captureIndices[0].start + 1;
  }
  return matches;
};

const includeNames = (rules: Rule[], prefix: string) =>
  rules.flatMap((rule) =>
    rule.include?.startsWith(prefix) ? [rule.include.slice(prefix.length)] : [],
  );

// Repository keys no pattern reaches through includes; "extraSeeds" are keys another grammar includes from this one.
const unreachableKeys = (grammar: Grammar, extraSeeds: string[] = []) => {
  const reached = new Set<string>();
  const queue = [
    ...includeNames(grammar.patterns.flatMap(ruleTree), "#"),
    ...extraSeeds,
  ];
  while (queue.length > 0) {
    const key = queue.pop();
    if (key === undefined || reached.has(key)) continue;
    reached.add(key);
    const rule = grammar.repository[key];
    if (rule !== undefined) queue.push(...includeNames(ruleTree(rule), "#"));
  }
  return Object.keys(grammar.repository).filter((key) => !reached.has(key));
};

before(async () => {
  const wasm = readFileSync("node_modules/vscode-oniguruma/release/onig.wasm");
  await loadWASM(
    wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength),
  );
});

// Case variants plus the characters Oniguruma's (?i) folds onto ASCII letters: sharp s, long s, the Kelvin sign, and the Latin ligatures.
const foldProbes = (word: string) => [
  word,
  word.toUpperCase(),
  word.replaceAll("ss", "ß"),
  word.replaceAll("ss", "ẞ"),
  word.replaceAll("s", "ſ"),
  word.replaceAll("k", "K"),
  word.replaceAll("ffi", "ﬃ"),
  word.replaceAll("ffl", "ﬄ"),
  word.replaceAll("ff", "ﬀ"),
  word.replaceAll("fi", "ﬁ"),
  word.replaceAll("fl", "ﬂ"),
  word.replaceAll("st", "ﬆ"),
];

describe("CSS ownership", () => {
  test("leaves no include of VS Code's CSS grammar", () => {
    assert.doesNotMatch(JSON.stringify(cssStyledGrammar), /"source\.css#/);
  });

  test("leaves no fold-closed class and no keyword alternation for Oniguruma to case-fold", () => {
    for (const regex of regexesOf(grammarRules(cssStyledGrammar))) {
      assert.equal(parseWordList(regex), null, regex);
      for (const { ignoreCase, text } of bracketClasses(regex)) {
        assert.ok(!(ignoreCase && FOLD_CLOSED_CLASSES.includes(text)), regex);
      }
    }
  });

  test("each fold-closed class matches the same code points with and without (?i)", () => {
    let text = "";
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint++) {
      if (codePoint < 0xd800 || codePoint > 0xdfff)
        text += String.fromCodePoint(codePoint);
    }
    const string = new OnigString(text);

    // One zero-width search over the whole text finds the first code point that exactly one variant accepts.
    const firstDifference = (cls: string) =>
      new OnigScanner([
        String.raw`(?=(?-i:${cls}))(?!(?i:${cls}))|(?!(?-i:${cls}))(?=(?i:${cls}))`,
      ]).findNextMatchSync(string, 0)?.captureIndices[0].start;

    assert.notEqual(
      firstDifference("[a-z]"),
      undefined,
      "the search sees a class that case folding changes",
    );
    for (const cls of FOLD_CLOSED_CLASSES) {
      const start = firstDifference(cls);
      assert.equal(
        start,
        undefined,
        `${cls} differs at U+${text.codePointAt(start ?? 0)?.toString(16)}`,
      );
    }
  });

  test("every rewritten VS Code regex matches exactly what the original matches at every position", () => {
    const rewritten = regexesOf(grammarRules(vscodeCss)).filter(
      (regex) => rewriteRegex(regex) !== regex,
    );

    assert.ok(
      rewritten.length > 20,
      "the rewrite reaches the keyword and function rules",
    );
    for (const regex of rewritten) {
      const original = new OnigScanner([regex]);
      const owned = new OnigScanner([rewriteRegex(regex)]);
      const atEveryPosition = regex.includes(String.raw`\G`);
      const probes = new Set(
        (parseWordList(regex)?.words ?? []).flatMap(foldProbes),
      );
      const lines = [
        ...fixtureLines,
        ...extraLines,
        ...[...probes].map((word) => `${word} {a${word}-${word.slice(0, -1)}(`),
      ];
      for (const line of lines) {
        assert.deepEqual(
          matchesIn(owned, line, atEveryPosition),
          matchesIn(original, line, atEveryPosition),
          `${line} / ${regex.slice(0, 60)}`,
        );
      }
    }
  });

  test("every local include resolves to a rule in the repository", () => {
    for (const key of includeNames(grammarRules(cssStyledGrammar), "#")) {
      assert.ok(key in cssStyledGrammar.repository, key);
    }
  });

  test("fails the build with the missing rule's name when the CSS rules it rewrites are absent", () => {
    assert.throws(
      () => ownCss({ patterns: [], repository: {}, scopeName: "x" }),
      /no "css-functions" rule/,
    );
  });

  test("a function VS Code's CSS grammar lacks gets one misc-function token for its whole hyphenated name, in any letter case", () => {
    const miscRules = (
      cssStyledGrammar.repository["css-functions"].patterns ?? []
    ).filter(
      (rule) =>
        rule.name === "meta.function.misc.css" && rule.begin !== undefined,
    );
    const scanner = new OnigScanner(miscRules.map((rule) => rule.begin ?? ""));

    for (const name of MISC_FUNCTIONS_BEYOND_VSCODE) {
      for (const variant of [name, name.toUpperCase()]) {
        const text = `${variant}(1)`;
        const match = scanner.findNextMatchSync(new OnigString(text), 0);
        assert.deepEqual(
          match?.captureIndices.slice(1, 3).map((c) => [c.start, c.end]),
          [
            [0, variant.length],
            [variant.length, variant.length + 1],
          ],
          text,
        );
        assert.equal(
          scanner.findNextMatchSync(new OnigString(`x-${text}`), 0),
          null,
          `x-${text} is not the function`,
        );
      }
    }
  });

  test("no function it adds is already a VS Code function rule", () => {
    const vscodeFunctionBegins =
      vscodeCss.repository.functions.patterns.flatMap((rule) =>
        "begin" in rule && typeof rule.begin === "string" ? [rule.begin] : [],
      );
    const scanner = new OnigScanner(vscodeFunctionBegins);

    for (const name of MISC_FUNCTIONS_BEYOND_VSCODE) {
      assert.equal(
        scanner.findNextMatchSync(new OnigString(`${name}(1)`), 0),
        null,
        `${name} is in VS Code's CSS grammar; remove it from MISC_FUNCTIONS_BEYOND_VSCODE`,
      );
    }
  });

  test("matches every element name at the start of a selector, in any letter case", () => {
    const tagNameRule = new OnigScanner([ownTagNamesRegex]);

    for (const name of tagNames) {
      for (const variant of [name, name.toUpperCase()]) {
        const text = `${variant} {`;
        const match = tagNameRule.findNextMatchSync(new OnigString(text), 0);
        assert.equal(
          match?.captureIndices[0].end,
          variant.length,
          `${variant} is a tag name`,
        );
      }
    }
  });

  test("does not match a word that only starts with an element name", () => {
    const tagNameRule = new OnigScanner([ownTagNamesRegex]);

    assert.equal(
      tagNameRule.findNextMatchSync(new OnigString("divider {"), 0),
      null,
    );
  });
});

describe("generated grammars", () => {
  test("every regex compiles in Oniguruma", () => {
    const regexes = [
      ...regexesOf(grammarRules(styledComponentsGrammar)),
      ...regexesOf(grammarRules(cssStyledGrammar)),
    ];

    assert.ok(regexes.length > 100);
    for (const regex of regexes) {
      assert.doesNotThrow(() => new OnigScanner([regex]), regex);
    }
  });

  test("every property value rule ends before a closing backtick", () => {
    const text = "color: red`";
    const backtick = text.indexOf("`");
    const valueRules = grammarRules(cssStyledGrammar).filter((rule) =>
      rule.contentName?.startsWith("meta.property-value"),
    );

    assert.equal(valueRules.length, 2);
    for (const rule of valueRules) {
      const opened = new OnigScanner([rule.begin ?? ""]).findNextMatchSync(
        new OnigString(text),
        0,
      );
      const closed = new OnigScanner([rule.end ?? ""]).findNextMatchSync(
        new OnigString(text),
        opened?.captureIndices[0].end ?? text.length,
      );

      assert.deepEqual(
        [closed?.captureIndices[0].start, closed?.captureIndices[0].end],
        [backtick, backtick],
        rule.contentName,
      );
    }
  });

  test("every repository rule is reachable from the top-level patterns", () => {
    const cssSeeds = includeNames(
      grammarRules(styledComponentsGrammar),
      "source.css.styled#",
    );

    assert.deepEqual(unreachableKeys(styledComponentsGrammar), []);
    assert.deepEqual(unreachableKeys(cssStyledGrammar, cssSeeds), []);
  });
});
