/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from "node:assert";
import fs from "node:fs";
import { join, basename, dirname, extname } from "node:path";
import { isDeepStrictEqual } from "node:util";

import { commands, Uri } from "vscode";

import {
  endsWithSentinel,
  fixtureFileNames,
  isColorizeTokens,
  leakedSentinelLines,
  readColorizeResult,
  resultFileName,
  rootScopeByExtension,
  SENTINEL_LINE,
} from "../colorizeToken.mts";
import type { ColorizeToken } from "../colorizeToken.mts";

// Fixtures whose sentinel line is mis-scoped by a known grammar leak; the value is the open issue.
const KNOWN_LEAKS: Partial<Record<string, string>> = {};

// Fixtures of shapes that must stay plain code: none of their tokens may be CSS. Every other fixture must hold at least one CSS token.
const PLAIN_FIXTURES = [
  "comment.js",
  "plain-comparisons.js",
  "plain-jsx.js",
  "plain-jsx.tsx",
  "plain-typescript.ts",
];

// Under CI every difference from the committed result fails, so a scope-only change cannot pass unreviewed.
const isCI = process.env.CI === "true";

function rootScopeOf(fileName: string) {
  const rootScope = rootScopeByExtension[extname(fileName)];
  if (rootScope === undefined) {
    throw new Error(`No root scope known for ${fileName}`);
  }
  return rootScope;
}

// Token texts concatenate to the source minus newlines, so each line consumes tokens until its length is covered.
function firstTokenIndexByLine(tokens: ColorizeToken[], lineLengths: number[]) {
  const firstIndexes: number[] = [];
  let tokenIndex = 0;
  lineLengths.forEach((length, lineIndex) => {
    firstIndexes.push(tokenIndex);

    let remaining = length;
    while (remaining > 0) {
      remaining -= tokens[tokenIndex].c.length;
      tokenIndex++;
    }
    assert.strictEqual(
      remaining,
      0,
      `a token spans the end of line ${lineIndex + 1}`,
    );
  });
  return firstIndexes;
}

function assertSentinelScopes(fixturePath: string, tokens: ColorizeToken[]) {
  const fileName = basename(fixturePath);
  const lines = fs.readFileSync(fixturePath, "utf8").split(/\r?\n/);
  // A CSS fixture cannot hold the JavaScript sentinel.
  if (extname(fileName) === ".css") {
    return;
  }
  if (!endsWithSentinel(lines)) {
    throw new Error(
      `${fileName}: the last non-blank line must be "${SENTINEL_LINE}"; it proves no earlier construct leaked`,
    );
  }

  const firstIndexes = firstTokenIndexByLine(
    tokens,
    lines.map((line) => line.length),
  );
  const leaked = leakedSentinelLines(
    lines,
    rootScopeOf(fileName),
    (lineIndex) => {
      const token = tokens[firstIndexes[lineIndex]];
      return token && { text: token.c, scopes: token.t };
    },
  );

  const knownLeak = KNOWN_LEAKS[fileName];
  if (knownLeak !== undefined) {
    assert.ok(
      leaked.length > 0,
      `${fileName} no longer leaks; remove its KNOWN_LEAKS entry (issue #${knownLeak})`,
    );
    return;
  }

  assert.deepStrictEqual(
    leaked,
    [],
    `${fileName}: every sentinel line must have root-level scopes; an earlier construct leaked`,
  );
}

function assertCssTokens(fixturePath: string, tokens: ColorizeToken[]) {
  const fileName = basename(fixturePath);
  const cssTokenCount = tokens.filter((token) =>
    token.t.split(" ").includes("source.css.scss"),
  ).length;

  if (PLAIN_FIXTURES.includes(fileName)) {
    assert.strictEqual(
      cssTokenCount,
      0,
      `${fileName} is listed in PLAIN_FIXTURES but ${cssTokenCount} tokens are CSS`,
    );
    return;
  }

  assert.ok(
    cssTokenCount > 0,
    `${fileName} has no CSS token; highlight the template or list the fixture in PLAIN_FIXTURES`,
  );
}

// A scope-only change passes locally, since the result file is rewritten and the diff is reviewed in git.
function isTextAndColorUnchanged(
  data: ColorizeToken[],
  previousData: ColorizeToken[],
) {
  return (
    data.length === previousData.length &&
    data.every(
      (token, i) =>
        token.c === previousData[i].c &&
        isDeepStrictEqual(token.r, previousData[i].r),
    )
  );
}

async function assertUnchangedTokens(fixturePath: string) {
  const fileName = basename(fixturePath);
  const data = await commands.executeCommand<unknown>(
    "_workbench.captureSyntaxTokens",
    Uri.file(fixturePath),
  );
  if (!isColorizeTokens(data)) {
    throw new Error(
      `${fileName}: the captured tokens are not a list of colorize tokens`,
    );
  }

  const resultPath = join(
    dirname(dirname(fixturePath)),
    "colorize-results",
    resultFileName(fileName),
  );
  const serialized = JSON.stringify(data, null, "\t");

  if (!fs.existsSync(resultPath)) {
    fs.writeFileSync(resultPath, serialized);
    if (isCI) {
      throw new Error(
        `${fileName} has no committed result; the generated colorize-results file is uploaded as a CI artifact, review and commit it`,
      );
    }
  } else {
    const previousData = readColorizeResult(resultPath);
    try {
      assert.deepStrictEqual(data, previousData);
    } catch (e) {
      fs.writeFileSync(resultPath, serialized);
      if (isCI || !isTextAndColorUnchanged(data, previousData)) {
        throw e;
      }
    }
  }

  assertSentinelScopes(fixturePath, data);
  assertCssTokens(fixturePath, data);
}

suite("colorization", () => {
  // The bundle runs from .integration-test/, one folder below the repo root.
  const extensionColorizeFixturePath = join(
    __dirname,
    "../src/tests/suite/colorize-fixtures",
  );
  // readdirSync throws on a missing folder, so a wrong path fails the run instead of defining zero tests.
  const fixturesFiles = fixtureFileNames(extensionColorizeFixturePath);
  if (fixturesFiles.length === 0) {
    throw new Error(`No colorize fixtures in ${extensionColorizeFixturePath}`);
  }

  fixturesFiles.forEach((fixturesFile) => {
    test(fixturesFile, async function () {
      // The first capture in a fresh VS Code includes loading the grammars.
      this.timeout(5000);
      await assertUnchangedTokens(
        join(extensionColorizeFixturePath, fixturesFile),
      );
    });
  });
});
