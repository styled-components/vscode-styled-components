const Frame = {
  plainTemplate: 0,
  styledTemplate: 1,
  interpolation: 2,
  source: 3,
} as const;

type FrameKind = (typeof Frame)[keyof typeof Frame];

type Segment =
  | { kind: "angles" | "call" | "index"; start: number; end: number }
  | { kind: "member"; name: string; start: number };

const Char = {
  asterisk: 42,
  backslash: 92,
  backtick: 96,
  bang: 33,
  carriageReturn: 13,
  closeBrace: 125,
  closeBracket: 93,
  closeParen: 41,
  dollar: 36,
  dot: 46,
  doubleQuote: 34,
  equals: 61,
  greaterThan: 62,
  lessThan: 60,
  minus: 45,
  newline: 10,
  openBrace: 123,
  openBracket: 91,
  openParen: 40,
  plus: 43,
  question: 63,
  semicolon: 59,
  singleQuote: 39,
  slash: 47,
} as const;

const OPENER_OF = new Map<number, number>([
  [Char.closeParen, Char.openParen],
  [Char.closeBracket, Char.openBracket],
  [Char.closeBrace, Char.openBrace],
]);

// Characters after which `/` divides. `<` is included so a JSX closing tag (`</p>`) never opens a regex.
const NOT_BEFORE_REGEX = new Set<number>([
  Char.backtick,
  Char.doubleQuote,
  Char.singleQuote,
  Char.lessThan,
  ...OPENER_OF.keys(),
]);
const KEYWORDS_BEFORE_EXPRESSION = new Set([
  "await",
  "case",
  "delete",
  "do",
  "else",
  "in",
  "instanceof",
  "new",
  "of",
  "return",
  "throw",
  "typeof",
  "void",
  "yield",
]);

const STYLED_ROOT = /^\$?[sS]tyled$/;
const GLOBAL_ROOTS = new Set([
  "createGlobalStyle",
  "createGlobalStyles",
  "injectGlobal",
  "stylesheet",
]);
const HELPER_ROOTS = new Set(["css", "keyframes", ...GLOBAL_ROOTS]);
// The grammar's shape: one whitespace character after "style", none before ">".
const STYLED_JSX_HEAD = /<style\s(?:jsx|jsx\s+global|global\s+jsx)+>\{$/;
// Characters before the `{` that `STYLED_JSX_HEAD` reads (bounds the slice, keeping the check constant-time).
const STYLED_JSX_HEAD_WINDOW = 40;
const CSS_PROP_HEAD = "css={";
// The grammar's `.withComponent(...)` argument: a quoted identifier or a dotted identifier chain, no spaces or calls.
const WITH_COMPONENT_ARGUMENT =
  /^(?:(['"])[_$\p{L}][_$\p{L}\p{N}]*\1|[_$\p{L}][_$.\p{L}\p{N}]*)$/u;

const isOpener = (code: number) =>
  code === Char.openParen ||
  code === Char.openBracket ||
  code === Char.openBrace;

const isIdentifierChar = (code: number) =>
  (code >= 48 && code <= 57) ||
  (code >= 65 && code <= 90) ||
  (code >= 97 && code <= 122) ||
  code === 95 ||
  code === Char.dollar ||
  code > 127;

const isWhitespace = (code: number) =>
  code <= 32 ||
  code === 160 ||
  code === 0xfeff ||
  code === 0x2028 ||
  code === 0x2029;

/**
 * Whether the cursor, at the end of `textBeforeCursor`, sits in the CSS text of a recognized styled template.
 * Linear time: one forward pass over the text, plus a backward walk over the tag at each template opener.
 * Regex literals are recognized from the previous significant token and skipped like strings; a `/` after `)`, `]`, `}`, a string, a template, or a postfix `++`/`--` is division, and a regex with no closing `/` on its line is treated as division.
 * Approximations: a backtick in JSX text counts as a template delimiter, `/*` in JSX text opens a block comment, an apostrophe or quote in JSX text opens a string (inside an interpolation it can swallow the interpolation's `}`), and a `/` after `)` or `}` that starts a regex (`if (x) /re/.test(y)`) reads as division.
 */
export function isInsideStyledTemplate(textBeforeCursor: string): boolean {
  const text = textBeforeCursor;
  const length = text.length;

  // Parallel stacks of numbers: an object per frame or bracket slows the scan (measured 25%).
  // A template frame's anchor is its first index; an interpolation frame's is the bracket stack height when it opened.
  // The bottom entry is the source text itself and is never popped, so the top is always in bounds (`.at(-1)` and an out-of-bounds read both slow the per-character loop).
  const frameKinds: FrameKind[] = [Frame.source];
  const frameAnchors: number[] = [0];
  const bracketCodes: number[] = [];
  const bracketPositions: number[] = [];

  // closer index -> opener index + 1 (0 means unmatched)
  const partnerPlusOne = new Int32Array(length);
  // last index of a comment, string, or template -> its first index
  const spanStarts = new Map<number, number>();
  const commentStarts = new Map<number, number>();

  const skipTrivia = (from: number) => {
    let at = from;
    while (at >= 0) {
      const commentStart = commentStarts.get(at);
      if (commentStart !== undefined) {
        at = commentStart - 1;
      } else if (isWhitespace(text.charCodeAt(at))) {
        at--;
      } else {
        break;
      }
    }

    return at;
  };

  // closer `>` -> its `<`, from walks that succeeded; a later walk jumps over the pair as it does over a bracket pair.
  const angleOpeners = new Map<number, number>();
  // A failed walk from `deadFrom` stopped at `deadStop` (-1 for the file start). A later walk that enters the range holds a depth at least as high, so it stops at the same place.
  let deadFrom = -1;
  let deadStop = -1;

  // Index of the `<` that opens the type arguments closed by the `>` at `closer`, or -1.
  const findAngleOpener = (closer: number) => {
    let depth = 1;
    let at = closer - 1;
    let stop = -1;
    while (at >= 0) {
      if (at <= deadFrom && at >= deadStop) {
        stop = deadStop;
        break;
      }

      const spanStart = spanStarts.get(at);
      if (spanStart !== undefined) {
        at = spanStart - 1;
        continue;
      }

      const code = text.charCodeAt(at);
      if (code === Char.greaterThan) {
        if (text.charCodeAt(at - 1) === Char.equals) {
          at -= 2;
          continue;
        }

        const known = angleOpeners.get(at);
        if (known !== undefined) {
          at = known - 1;
          continue;
        }
        depth++;
      } else if (code === Char.lessThan) {
        depth--;
        if (depth === 0) {
          angleOpeners.set(closer, at);

          return at;
        }
      } else if (OPENER_OF.has(code)) {
        const opener = partnerPlusOne[at] - 1;
        if (opener < 0) {
          stop = at;
          break;
        }
        at = opener - 1;
        continue;
      } else if (
        isOpener(code) ||
        code === Char.semicolon ||
        code === Char.backtick
      ) {
        stop = at;
        break;
      }
      at--;
    }

    deadFrom = closer;
    deadStop = stop;

    return -1;
  };

  const acceptsRoot = (
    name: string,
    isMember: boolean,
    segments: Segment[],
    styledOnly: boolean,
  ) => {
    if (STYLED_ROOT.test(name)) {
      return segments.every((segment) => segment.kind !== "index");
    }
    if (styledOnly) {
      return false;
    }

    const onlyAngles = segments.every((segment) => segment.kind === "angles");
    if (name === "css" || name === "keyframes") {
      return onlyAngles;
    }
    if (GLOBAL_ROOTS.has(name)) {
      return !isMember && onlyAngles;
    }
    if (name === "extend") {
      // Segments run from the tag backward: a call, then the member it belongs to, repeated.
      const isConfigured = segments.every((segment, index) =>
        index % 2 === 0
          ? segment.kind === "call"
          : segment.kind === "member" &&
            (segment.name === "attrs" || segment.name === "withConfig"),
      );

      return isMember && segments.length % 2 === 0 && isConfigured;
    }
    if (name === "withComponent") {
      const [call] = segments;

      return (
        isMember &&
        segments.length === 1 &&
        call.kind === "call" &&
        WITH_COMPONENT_ARGUMENT.test(text.slice(call.start + 1, call.end))
      );
    }
    if ((name === "media" || name === "Media") && !isMember) {
      const [first, second] = segments;
      return (
        (segments.length === 1 && first.kind === "member") ||
        (segments.length === 2 &&
          first.kind === "call" &&
          second.kind === "member")
      );
    }

    return false;
  };

  // The grammar opens a helper tag (`css`, `keyframes`, a global root) only with its backtick directly after the name, or after one set of type arguments that directly follows the name, with whitespace (also line breaks) between them and the backtick.
  const backtickFollowsHead = (
    nameEnd: number,
    segments: Segment[],
    tagEnd: number,
    from: number,
  ) => {
    if (segments.length === 0) {
      return tagEnd === from;
    }

    return (
      segments.length === 1 &&
      segments[0].start === nameEnd &&
      text.slice(tagEnd + 1, from + 1).trim() === ""
    );
  };

  // Walks the tag expression backward from `from` (the last index of the tag); `styledOnly` limits roots to `styled`.
  // Returns undefined when the tag is not styled, else the name of the member or root directly before its argument list ("" when the tag has no such name).
  const styledTagCallee = (from: number, styledOnly: boolean) => {
    const segments: Segment[] = [];
    const tagEnd = skipTrivia(from);
    let callee: string | undefined;

    for (let at = tagEnd; at >= 0; at = skipTrivia(at)) {
      const code = text.charCodeAt(at);
      if (isIdentifierChar(code)) {
        let start = at;
        while (start > 0 && isIdentifierChar(text.charCodeAt(start - 1))) {
          start--;
        }

        const name = text.slice(start, at + 1);
        let before = skipTrivia(start - 1);
        if (text.charCodeAt(before) === Char.bang) {
          before = skipTrivia(before - 1);
        }

        const isDot = before >= 0 && text.charCodeAt(before) === Char.dot;
        const isSpread = isDot && text.charCodeAt(before - 1) === Char.dot;
        const isMember = isDot && !isSpread;
        callee ??= segments.every((segment) => segment.kind === "angles")
          ? name
          : "";

        const accepted = acceptsRoot(name, isMember, segments, styledOnly);
        // A rejected helper that is a member (`styled.css⏎`) keeps walking: an outer `styled` root still accepts.
        const isDetached =
          accepted &&
          HELPER_ROOTS.has(name) &&
          !backtickFollowsHead(at + 1, segments, tagEnd, from);
        if (accepted && !isDetached) {
          return callee;
        }
        if (!isMember) {
          return undefined;
        }

        segments.push({ kind: "member", name, start });
        at =
          text.charCodeAt(before - 1) === Char.question
            ? before - 2
            : before - 1;
      } else if (code === Char.greaterThan) {
        const opener =
          text.charCodeAt(at - 1) === Char.equals ? -1 : findAngleOpener(at);
        if (opener < 0) {
          return undefined;
        }
        segments.push({ kind: "angles", start: opener, end: at });
        at = opener - 1;
      } else if (OPENER_OF.has(code)) {
        const opener = partnerPlusOne[at] - 1;
        if (opener < 0) {
          return undefined;
        }
        segments.push({
          kind: code === Char.closeParen ? "call" : "index",
          start: opener,
          end: at,
        });
        at = opener - 1;
      } else {
        return undefined;
      }
    }

    return undefined;
  };

  // `attrs` and `withConfig` take props functions, so the grammar leaves an arrow's template in them plain.
  const arrowHostCache = new Map<number, boolean>();
  const hostsStyledArrow = (paren: number) => {
    const cached = arrowHostCache.get(paren);
    if (cached !== undefined) {
      return cached;
    }

    const callee = styledTagCallee(paren - 1, true);
    const hosts =
      callee !== undefined && callee !== "attrs" && callee !== "withConfig";
    arrowHostCache.set(paren, hosts);

    return hosts;
  };

  const opensStyledTemplate = (backtick: number) => {
    const last = backtick - 1;
    if (last >= 0 && text.charCodeAt(last) === Char.openBrace) {
      const head = text.slice(
        Math.max(0, last - STYLED_JSX_HEAD_WINDOW),
        last + 1,
      );
      const isCssProp =
        head.endsWith(CSS_PROP_HEAD) &&
        !isIdentifierChar(text.charCodeAt(last - CSS_PROP_HEAD.length));

      return isCssProp || STYLED_JSX_HEAD.test(head);
    }

    const at = skipTrivia(last);
    if (
      at < 1 ||
      text.charCodeAt(at) !== Char.greaterThan ||
      text.charCodeAt(at - 1) !== Char.equals
    ) {
      return styledTagCallee(last, false) !== undefined;
    }

    return (
      bracketCodes.at(-1) === Char.openParen &&
      hostsStyledArrow(bracketPositions[bracketPositions.length - 1])
    );
  };

  // A failed regex scan covers the rest of its line, so later slashes on that line stay divisions (keeps a long line of `(/[` linear).
  let lineWithoutRegexEnd = -1;

  // Whether the `/` at `slash` begins a regex literal rather than a division, judged by the previous significant token.
  const startsRegex = (slash: number) => {
    const last = skipTrivia(slash - 1);
    if (last < 0) {
      return true;
    }

    const code = text.charCodeAt(last);
    if (!isIdentifierChar(code)) {
      const isIncrementOrDecrement =
        (code === Char.plus || code === Char.minus) &&
        text.charCodeAt(last - 1) === code;
      if (isIncrementOrDecrement) {
        // A postfix `++`/`--` ends an operand, so a following `/` divides.
        const operandCode = text.charCodeAt(skipTrivia(last - 2));

        return !(
          isIdentifierChar(operandCode) ||
          operandCode === Char.closeParen ||
          operandCode === Char.closeBracket
        );
      }

      return !NOT_BEFORE_REGEX.has(code);
    }

    let start = last;
    while (start > 0 && isIdentifierChar(text.charCodeAt(start - 1))) {
      start--;
    }

    return KEYWORDS_BEFORE_EXPRESSION.has(text.slice(start, last + 1));
  };

  // Index of the `/` that closes the regex literal opened at `slash`, or -1 when the line ends first.
  const findRegexEnd = (slash: number) => {
    let inClass = false;
    let at = slash + 1;
    while (at < length) {
      const code = text.charCodeAt(at);
      if (code === Char.newline) {
        break;
      }
      if (code === Char.backslash) {
        at += 2;
        continue;
      }
      if (code === Char.openBracket) {
        inClass = true;
      } else if (code === Char.closeBracket) {
        inClass = false;
      } else if (code === Char.slash && !inClass) {
        return at;
      }
      at++;
    }

    lineWithoutRegexEnd = at;

    return -1;
  };

  let unterminated = false;
  let index = 0;

  while (index < length) {
    const code = text.charCodeAt(index);
    const frame = frameKinds[frameKinds.length - 1];

    if (frame === Frame.plainTemplate || frame === Frame.styledTemplate) {
      if (code === Char.backslash) {
        index += 2;
        continue;
      }
      if (code === Char.backtick) {
        spanStarts.set(index, frameAnchors[frameAnchors.length - 1]);
        frameKinds.pop();
        frameAnchors.pop();
      } else if (
        code === Char.dollar &&
        text.charCodeAt(index + 1) === Char.openBrace
      ) {
        frameKinds.push(Frame.interpolation);
        frameAnchors.push(bracketCodes.length);
        bracketCodes.push(Char.dollar);
        bracketPositions.push(index + 1);
        index++;
      }
      index++;
      continue;
    }

    if (code === Char.slash) {
      const next = text.charCodeAt(index + 1);
      if (next === Char.slash) {
        let end = text.indexOf("\n", index + 2);
        if (end < 0) {
          unterminated = true;
          break;
        }
        end--;
        commentStarts.set(end, index);
        spanStarts.set(end, index);
        index = end + 1;
        continue;
      }
      if (next === Char.asterisk) {
        const close = text.indexOf("*/", index + 2);
        if (close < 0) {
          unterminated = true;
          break;
        }
        commentStarts.set(close + 1, index);
        spanStarts.set(close + 1, index);
        index = close + 2;
        continue;
      }

      const end =
        index > lineWithoutRegexEnd && startsRegex(index)
          ? findRegexEnd(index)
          : -1;
      if (end >= 0) {
        spanStarts.set(end, index);
        index = end + 1;
        continue;
      }
    } else if (code === Char.singleQuote || code === Char.doubleQuote) {
      let end = index + 1;
      let closed = false;
      while (end < length) {
        const inner = text.charCodeAt(end);
        if (inner === Char.backslash) {
          end +=
            text.charCodeAt(end + 1) === Char.carriageReturn &&
            text.charCodeAt(end + 2) === Char.newline
              ? 3
              : 2;
          continue;
        }
        if (inner === code) {
          closed = true;
          break;
        }
        if (inner === Char.newline) {
          break;
        }
        end++;
      }

      if (end >= length) {
        unterminated = true;
        break;
      }
      if (closed) {
        spanStarts.set(end, index);
      }
      index = end + 1;
      continue;
    } else if (code === Char.backtick) {
      frameKinds.push(
        opensStyledTemplate(index) ? Frame.styledTemplate : Frame.plainTemplate,
      );
      frameAnchors.push(index);
    } else if (isOpener(code)) {
      bracketCodes.push(code);
      bracketPositions.push(index);
    } else if (OPENER_OF.has(code)) {
      if (bracketCodes.at(-1) === OPENER_OF.get(code)) {
        partnerPlusOne[index] =
          bracketPositions[bracketPositions.length - 1] + 1;
        bracketCodes.pop();
        bracketPositions.pop();
      } else if (code === Char.closeBrace && frame === Frame.interpolation) {
        // An unclosed paren or bracket (often from a regex literal) must not trap the template inside its interpolation.
        const bracketBase = frameAnchors[frameAnchors.length - 1];
        bracketCodes.length = bracketBase;
        bracketPositions.length = bracketBase;
        frameKinds.pop();
        frameAnchors.pop();
      }
    }
    index++;
  }

  return (
    !unterminated && frameKinds[frameKinds.length - 1] === Frame.styledTemplate
  );
}
