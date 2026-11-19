import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, test } from "node:test";

import {
  fixtureFileNames,
  readColorizeResult,
  resultFileName,
} from "./tests/colorizeToken.mts";
import type { ColorizeToken } from "./tests/colorizeToken.mts";

import { isInsideStyledTemplate } from "./templateScanner";

const lines = (...parts: string[]) => parts.join("\n");

describe("isInsideStyledTemplate", () => {
  const inside: Record<string, string> = {
    "a plain styled block": lines(
      "const A = styled.div`",
      "  color: red;",
      "  ",
    ),
    "after a nested template in an interpolation (#437)": lines(
      "const A = styled.div`",
      "  color: ${`${theme.x} !important`};",
      "  background: ",
    ),
    "after a css helper in an arrow interpolation": lines(
      "const A = styled.div`",
      "  ${(p) => p.a && css`color: red;`}",
      "  display: ",
    ),
    "in an outer css template that contains a nested css template": lines(
      "const a = css`",
      "  ${css`color: red;`}",
      "  display: ",
    ),
    "in a nested css template": "const a = css`x ${css`color: ",
    "after attrs whose arrow returns an object holding a template": lines(
      "const A = styled.div.attrs((props) => ({ x: `${props.s}` }))`",
      "  color: ",
    ),
    "after a multi-line type argument": lines(
      "const A = styled.div<",
      "  P",
      ">`",
      "  color: ",
    ),
    "after a multi-line object type argument on a call": lines(
      "const A = styled(Button)<{",
      "  a: string",
      "}>`",
      "  color: ",
    ),
    "after an inline object type argument":
      "const A = styled.div<{ a: string; b: number }>`color: ",
    "after an object type argument holding a function type":
      "const A = styled.div<{ onClick: () => void }>`color: ",
    "after a function type argument":
      "const A = styled.div<() => void>`color: ",
    "after a member prefix": "const A = theme.styled.div`color: ",
    "after a parenthesized member prefix":
      "const A = (await load()).styled.div`color: ",
    "after a dollar-prefixed styled": "const A = $styled.div`color: ",
    "after styled called with a string": 'const A = styled("div")`color: ',
    "after styled called with a component and whitespace":
      "const A = styled (Button)`color: ",
    "after styled with a newline before the backtick": lines(
      "const A = styled.div",
      "  .attrs({ a: 1 })",
      "  .withConfig({ b: 2 })`color: ",
    ),
    "after a comment between the head and the backtick": lines(
      "const A = styled.div /* why */`color: ",
    ),
    "after an arrow function returning the template":
      "const A = styled.div(({ theme }) => `color: ",
    "after an arrow with a bare parameter":
      "const A = styled.div((p) => `color: ",
    "after keyframes": "const k = keyframes`from { ",
    "after keyframes with a type argument": "const k = keyframes<P>`from { ",
    "after css": "const c = css`color: ",
    "after a member css": "const c = styledLib.css`color: ",
    "after createGlobalStyle": "const G = createGlobalStyle`body { ",
    "after injectGlobal": "injectGlobal`body { ",
    "after stylesheet": "const s = stylesheet`body { ",
    "after extend": "const B = A.extend`color: ",
    "after extend then attrs": "const B = A.extend.attrs({ a: 1 })`color: ",
    "after extend then withConfig":
      "const B = A.extend.withConfig({ a: 1 })`color: ",
    "after extend with attrs on the next line":
      "const B = A.extend\n  .attrs({ a: 1 })`color: ",
    "after extend then a chain of attrs and withConfig":
      "const B = A.extend.attrs({ a: 1 }).attrs({ b: 2 }).withConfig({ c: 3 })`color: ",
    "after extend then a chain split over lines": lines(
      "const B = A.extend",
      "  .attrs({ a: 1 })",
      "  .withConfig({ b: 2 })`color: ",
    ),
    "after css with type arguments and a space": "const c = css<P> `color: ",
    "after an arrow with an unparenthesized parameter":
      "const A = styled.div(p => `color: ",
    "after an arrow with an unparenthesized dollar parameter":
      "const A = styled.div($p => `color: ",
    "after withComponent": "const B = A.withComponent('a')`color: ",
    "after withComponent with a dotted identifier":
      "const B = A.withComponent(Other.Comp)`color: ",
    "after withComponent then extend":
      "const B = A.withComponent('a').extend`color: ",
    "after a media helper": "const m = media.desktop`color: ",
    "after a media helper with a call":
      'const m = media.breakAt("300px")`color: ',
    "after the css prop": "const a = <div css={`color: ",
    "after styled-jsx": "const a = <style jsx>{`div { ",
    "after global styled-jsx": "const a = <style jsx global>{`div { ",
    "after global-first styled-jsx": "const a = <style global jsx>{`div { ",
    "after an interpolation that holds a brace string": lines(
      "const A = styled.div`",
      "  color: ${p.a ? '{' : ''};",
      "  display: ",
    ),
    "after JSX text with an apostrophe on an earlier line": lines(
      "const a = <p>Don't</p>;",
      "const A = styled.div`",
      "  color: ",
    ),
    "after an escaped backtick": "const A = styled.div`a \\` b",
    "after a block comment that mentions styled":
      "/* styled.div`x */ const A = styled.div`color: ",
    "after a regex literal containing a backtick": lines(
      "const r = /[(`]/g;",
      "const A = styled.div`color: ",
    ),
    "after a regex literal containing brackets and a backtick": lines(
      "const r = /\\(`\\)[{]/;",
      "const A = styled.div`color: ",
    ),
    "after a regex literal with a slash inside a class": lines(
      "const r = /[/`]/;",
      "const A = styled.div`color: ",
    ),
    "after a regex literal with an escaped slash": lines(
      "const r = /a\\/`/;",
      "const A = styled.div`color: ",
    ),
    "after a regex literal in an argument list": lines(
      "s.replace(/`/g, '');",
      "const A = styled.div`color: ",
    ),
    "after a regex literal following a return": lines(
      "function f() { return /x`/; }",
      "const A = styled.div`color: ",
    ),
    "after a regex literal following a typeof": lines(
      "const t = typeof /x`/;",
      "const A = styled.div`color: ",
    ),
    "after a regex literal following a comment": lines(
      "const r = /* why */ /`/;",
      "const A = styled.div`color: ",
    ),
    "after a division of identifiers": lines(
      "const x = a / b;",
      "const A = styled.div`color: ",
    ),
    "after a division after a parenthesis": lines(
      "const x = (a) / 2 + `p` + (b) / 3;",
      "const A = styled.div`color: ",
    ),
    "after a division after an index": lines(
      "const x = arr[0] / 3, y = arr[1] / 4;",
      "const A = styled.div`color: ",
    ),
    "after a division inside an interpolation": lines(
      "const A = styled.div`",
      "  width: ${a / 2}px;",
      "  height: ${(b) / 3}px;",
      "  color: ",
    ),
    "after a regex literal following a postfix increment division": lines(
      "a = b++ / 2; r = /`/;",
      "const A = styled.div`color: ",
    ),
    "after a regex literal following a postfix decrement division": lines(
      "a = (b)-- / 2; r = /`/;",
      "const A = styled.div`color: ",
    ),
    "after an arrow template whose call closes on its line": lines(
      "const A = styled.div(({ theme }) => `color: red;`);",
      "const B = styled.div`color: ",
    ),
    "after a template-literal type argument": lines(
      "const A = styled.div<{ a: `x${string}` }>`color: ",
    ),
    "after a top-level template-literal type argument": lines(
      "const A = styled.div<`x${string}`>`color: ",
    ),
    "after css with type arguments ending its line": lines(
      "const A = css<P>",
      "`",
      "  col",
    ),
    "after a member css with a newline before the backtick": lines(
      "const A = styled.css",
      "`",
      "  col",
    ),
    "after styled-jsx whose global flag is separated by two spaces":
      "const a = <style jsx  global>{`div { ",
    "in a 600-line createGlobalStyle block": `const G = createGlobalStyle\`\n${"  body { color: red; }\n".repeat(600)}  `,
  };

  for (const [name, text] of Object.entries(inside)) {
    test(`is inside ${name}`, () => {
      assert.equal(isInsideStyledTemplate(text), true);
    });
  }

  const outside: Record<string, string> = {
    "a plain template": "const s = `color",
    "a plain template after a closed styled block": lines(
      "const A = styled.div`color: red;`;",
      "const s = `color",
    ),
    "code after a closed styled block":
      "const A = styled.div`color: red;`;\nconst b = ",
    "an interpolation": "const A = styled.div`color: ${p.a",
    "an interpolation after a brace string":
      "const A = styled.div`color: ${p.a ? '{' : ''",
    "a nested template inside an interpolation":
      "const A = styled.div`color: ${`x",
    "a line comment mentioning styled": "// styled.div`color",
    "a block comment mentioning styled": "/* styled.div`color",
    "a string mentioning styled": "const s = 'styled.div`color",
    "an escaped backslash before the closing backtick":
      "const A = styled.div`a \\\\`;\nconst b = ",
    "an identifier that merely ends in styled": "const A = unstyled.div`color",
    "an identifier that merely contains css": "const A = mycss`color",
    "a comparison before a plain template": "const s = a < b > `color",
    "after a closed JSX block": lines(
      "const a = <p>Don't</p>;",
      "const A = styled.div`color: red;`;",
      "const b = ",
    ),
    "the css prop's interpolation": "const a = <div css={`color: ${p",
    "a call that is not styled": "const A = notStyled(({ theme }) => `color: ",
    "an uppercase STYLED root": "const A = STYLED.div`color: ",
    "an element named style without jsx": "const a = <style>{`div { ",
    "styled-jsx with two spaces before jsx": "const a = <style  jsx>{`div { ",
    "styled-jsx with a space before the closing angle":
      "const a = <style jsx >{`div { ",
    "an arrow returning a template inside attrs":
      "const A = styled.div.attrs((p) => `color: ",
    "an arrow returning a template inside withConfig on a call":
      "const A = styled(Button).withConfig((p) => `color: ",
    "an arrow returning a template inside attrs with type arguments":
      "const A = styled.div.attrs<P>((p) => `color: ",
    "a css helper whose backtick is on the next line": lines(
      "const A = css",
      "`",
      "  col",
    ),
    "a keyframes helper whose backtick is on the next line": lines(
      "const k = keyframes",
      "`",
    ),
    "a css helper with type arguments and a comment before the next line":
      lines("const A = css<P> /* why */", "`", "  col"),
    "a css helper with a comment before the backtick":
      "const c = css /* why */`color: ",
    "a css helper with a space before the backtick": "const c = css `color: ",
    "a keyframes helper with a comment before the backtick":
      "const k = keyframes /* x */`from { ",
    "a global helper with a space before the backtick":
      "const G = createGlobalStyle `body { ",
    "a css helper with type arguments, a comment, then the backtick":
      "const c = css<P> /* why */`color: ",
    "a css helper with a space before its type arguments":
      "const c = css <P>`color: ",
    "a media helper spelled in capitals": "const m = MEDIA.desktop`color: ",
    "a withComponent call argument":
      "const B = A.withComponent(getComp())`color: ",
    "a withComponent argument spanning lines": lines(
      "const B = A.withComponent(",
      '  "span"',
      ")`color: ",
    ),
  };

  for (const [name, text] of Object.entries(outside)) {
    test(`is not inside ${name}`, () => {
      assert.equal(isInsideStyledTemplate(text), false);
    });
  }
});

describe("isInsideStyledTemplate scaling", () => {
  const budgetMs = 100;
  const runs = 7;

  // The fastest run, not the median: load on the machine only ever adds time.
  const fastestMs = (text: string) => {
    isInsideStyledTemplate(text);
    let fastest = Infinity;
    for (let run = 0; run < runs; run++) {
      const start = performance.now();
      isInsideStyledTemplate(text);
      fastest = Math.min(fastest, performance.now() - start);
    }

    return fastest;
  };

  const shapes: Record<string, (n: number) => string> = {
    "a long call chain after styled": (n) =>
      `const a = styled${"(a)".repeat(n)}x\``,
    "a long call chain ending at a styled template": (n) =>
      `const a = styled${"(a)".repeat(n)}\``,
    "a long run of closing angle brackets": (n) =>
      `const a = ${"x>".repeat(n)}\``,
    "many lines of a closing angle bracket before a template": (n) =>
      "x = 1 > `a`\n".repeat(n),
    "nested type arguments each followed by a template": (n) =>
      `${"A<".repeat(n)}${"x>`a`".repeat(n)}\``,
    "a long call chain with many arrow templates": (n) =>
      `const a = styled${".a".repeat(n)}(${"(p) => `x`,".repeat(n)}\``,
    "a styled file with many lines": (n) =>
      `const A = styled.div\`\n${"  color: red;\n".repeat(n)}`,
    "a styled file with many interpolations": (n) =>
      `const A = styled.div\`\n${"  color: ${(p) => p.a ? `x` : 'y'};\n".repeat(n)}`,
    "a file of many closed styled templates": (n) =>
      `${"const A = styled.div`color: red;`;\n".repeat(n)}const b = styled.div\``,
    "a long line of unterminated regex starts": (n) =>
      `const a = ${"(/[".repeat(n)}\nconst b = styled.div\``,
    "a long line of unclosed type arguments": (n) =>
      `const a = styled.div${"<b&&".repeat(n)}\``,
  };

  for (const [name, build] of Object.entries(shapes)) {
    test(`finishes ${name} within the budget and scales linearly`, () => {
      const n = 5000;
      const single = fastestMs(build(n));
      assert.ok(single < budgetMs, `n=${n}: ${single.toFixed(2)} ms`);

      const quadruple = fastestMs(build(4 * n));
      // Linear growth is 4x and quadratic 16x; 8x leaves room for noise.
      assert.ok(
        quadruple < 8 * Math.max(single, 1),
        `n=${n}: ${single.toFixed(2)} ms, n=${4 * n}: ${quadruple.toFixed(2)} ms`,
      );
    });
  }
});

// Each entry is a docs/spec.md "Known deviations" item where the command reaches further than the grammar, keyed "fixture:line:column" (1-based) of the opening backtick.
const ACCEPTED_EXCEPTIONS: Record<string, string> = {};

const BEGIN_SCOPE = /punctuation\.definition\.string\.template\.begin\.\w+$/;
const END_SCOPE = /punctuation\.definition\.string\.template\.end\.\w+$/;

function openingBackticks(source: string, tokens: ColorizeToken[]) {
  const placed: Array<{
    token: ColorizeToken;
    line: number;
    column: number;
    offset: number;
  }> = [];
  let line = 0;
  let lineStart = 0;
  let offset = 0;

  // Token texts concatenate to the source minus line breaks.
  for (const token of tokens) {
    if (token.c.length === 0) {
      continue;
    }

    while (source[offset] === "\r" || source[offset] === "\n") {
      if (source[offset] === "\n") {
        line++;
        lineStart = offset + 1;
      }
      offset++;
    }

    placed.push({ token, line, column: offset - lineStart, offset });
    offset += token.c.length;
  }

  const found: Array<{ key: string; offset: number; inside: boolean }> = [];
  for (let i = 0; i + 1 < placed.length; i++) {
    const { token, line, column, offset } = placed[i];
    const scopes = token.t.split(" ");
    if (token.c !== "`" || !scopes.some((scope) => BEGIN_SCOPE.test(scope))) {
      continue;
    }

    const enclosing = scopes.filter(
      (scope) =>
        !BEGIN_SCOPE.test(scope) && !scope.startsWith("string.template"),
    );
    const nextScopes = placed[i + 1].token.t.split(" ");
    const opensTemplate = enclosing.every(
      (scope, index) => nextScopes[index] === scope,
    );
    // An empty template has no content token, so its tokens cannot say whether it is CSS.
    const isEmpty = nextScopes.some((scope) => END_SCOPE.test(scope));
    if (!opensTemplate || isEmpty) {
      continue;
    }

    found.push({
      key: `${line + 1}:${column + 1}`,
      offset: offset + 1,
      inside:
        nextScopes.lastIndexOf("source.css.scss") >
        nextScopes.lastIndexOf("meta.embedded.line.ts"),
    });
  }

  return found;
}

describe("isInsideStyledTemplate against the colorize results", () => {
  const root = resolve(".");
  const fixturesDir = join(root, "src/tests/suite/colorize-fixtures");
  const resultsDir = join(root, "src/tests/suite/colorize-results");

  const fixtures = fixtureFileNames(fixturesDir).map((fileName) => {
    const source = readFileSync(join(fixturesDir, fileName), "utf8");
    const tokens = readColorizeResult(
      join(resultsDir, resultFileName(fileName)),
    );

    return { fileName, source, openers: openingBackticks(source, tokens) };
  });

  for (const { fileName, source, openers } of fixtures) {
    test(`agrees with the grammar after every opening backtick in ${fileName}`, () => {
      const disagreements: string[] = [];

      for (const { key, offset, inside } of openers) {
        const id = `${fileName}:${key}`;
        const actual = isInsideStyledTemplate(source.slice(0, offset));
        if (actual !== inside && !(id in ACCEPTED_EXCEPTIONS)) {
          disagreements.push(`${id} grammar=${inside} scanner=${actual}`);
        }
      }

      assert.deepEqual(disagreements, []);
    });
  }

  test("compares both inside and outside openers across the fixtures", () => {
    const answers = fixtures.flatMap(({ openers }) =>
      openers.map(({ inside }) => inside),
    );

    assert.ok(
      answers.filter(Boolean).length >= 50,
      "too few styled openers compared",
    );
    assert.ok(
      answers.filter((inside) => !inside).length >= 5,
      "too few plain openers compared",
    );
  });

  test("lists only exceptions that still disagree with the grammar", () => {
    const live = new Set<string>();
    for (const { fileName, source, openers } of fixtures) {
      for (const { key, offset, inside } of openers) {
        if (isInsideStyledTemplate(source.slice(0, offset)) !== inside) {
          live.add(`${fileName}:${key}`);
        }
      }
    }

    assert.deepEqual(
      Object.keys(ACCEPTED_EXCEPTIONS).filter((id) => !live.has(id)),
      [],
    );
  });
});
