import type { Color } from "vscode-css-languageservice";
import {
  colorFromHex,
  colorFromHSL,
  colorFromHWB,
  colorFromLAB,
  colorFromLCH,
  colorFromOKLAB,
  colorFromOKLCH,
  colors,
  hslFromColor,
  hwbFromColor,
  labFromColor,
  lchFromColor,
  oklabFromColor,
  oklchFromColor,
} from "vscode-css-languageservice/lib/esm/languageFacts/colors";

export type FoundColor = { start: number; end: number; color: Color };

// upstream vscode-css-languageservice has #9370d8/#d87093; CSS Color 4 values; remove when upstream fixes
const namedColors: Record<string, string> = {
  ...colors,
  mediumpurple: "#9370db",
  palevioletred: "#db7093",
};

const degreesPerUnit = {
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360,
} as const satisfies Record<string, number>;
type AngleUnit = keyof typeof degreesPerUnit;
const isAngleUnit = (unit: string): unit is AngleUnit =>
  Object.hasOwn(degreesPerUnit, unit);
const angleUnits = Object.keys(degreesPerUnit).join("|");

// Each alternative is a fixed shape (no nested or overlapping quantifiers), so a scan is linear in the line length.
const number = String.raw`(?:\d+(?:\.\d+)?|\.\d+)`;
const channel = String.raw`(?:\d+(?:\.\d+)?%|\d+)`;
const alpha = `${number}%?`;
const comma = String.raw`\s*,\s*`;
const slash = String.raw`\s*\/\s*`;
// Each position takes a number, percentage, angle, or `none`; the parser checks the kind its position accepts.
const wideArg = String.raw`(?:[+-]?${number}(?:%|${angleUnits})?|none)`;

const wideArguments = String.raw`\(\s*${wideArg}(?:${comma}${wideArg}${comma}${wideArg}(?:${comma}${wideArg})?|\s+${wideArg}\s+${wideArg}(?:${slash}${wideArg})?)\s*\)`;
const wideFunction = String.raw`(?<![\w-])(?:hwb|l(?:ab|ch)|ok(?:lab|lch))${wideArguments}`;

const literalPatterns = [
  // The guards skip JavaScript private names (`this.#feed()`, `#fade() {}`) and selectors (`a&#fff`, `#fadeIn`), whose digits are valid hex.
  String.raw`(?<![\w&.])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w(-])`,
  String.raw`(?<![\w-])rgba?\(\s*${channel}${comma}${channel}${comma}${channel}(?:${comma}${alpha})?\s*\)`,
  String.raw`(?<![\w-])rgba?\(\s*${channel}\s+${channel}\s+${channel}(?:${slash}${alpha})?\s*\)`,
  String.raw`(?<![\w-])hsla?${wideArguments}`,
  // Any word after a colon or comma, filtered by the name table: a name alternation at every colon scans slower, and a lookbehind rescans whitespace.
  String.raw`[:,]\s+[a-z]+(?![\w(-])`,
];

const literalRegex = new RegExp(literalPatterns.join("|"), "gi");
// Adding the wide-gamut shapes to the main regex slows every scan; a line with none of their names skips them. `lab(` and `lch(` also gate oklab and oklch.
const wideGate = /(?:hwb|lab|lch)\(/i;
const wideLiteralRegex = new RegExp(
  [...literalPatterns, wideFunction].join("|"),
  "gi",
);

const splitChannels = (inner: string): string[] =>
  inner.includes(",")
    ? inner.split(",").map((part) => part.trim())
    : inner
        .split("/")
        .flatMap((part, index) =>
          index === 0 ? part.trim().split(/\s+/) : [part.trim()],
        );

const scaledToken = new RegExp(String.raw`^[+-]?${number}%?$`);
const angleToken = new RegExp(
  String.raw`^([+-]?${number})(${angleUnits})?$`,
  "i",
);

// VS Code's CSS support takes a number as `whole` units or a percentage as 100 units, and rejects a result outside lower..1.
const scaledOf = (
  token: string,
  whole: number,
  lower = 0,
): number | undefined => {
  if (!scaledToken.test(token)) {
    return undefined;
  }

  const value = parseFloat(token);
  const result = token.endsWith("%") ? value / 100 : value / whole;

  return result >= lower && result <= 1 ? result : undefined;
};

// A hue is an angle in any unit (a bare number is degrees) or the lowercase keyword `none`.
const hueOf = (token: string): number | undefined => {
  if (token === "none") {
    return 0;
  }

  const match = angleToken.exec(token);

  if (!match) {
    return undefined;
  }

  const unit = (match[2] ?? "deg").toLowerCase();

  return isAngleUnit(unit)
    ? (parseFloat(match[1]) * degreesPerUnit[unit]) % 360
    : undefined;
};

const parseWide = (name: string, inner: string): Color | undefined => {
  const [first, second, third, a] = splitChannels(inner);
  const opacity = a === undefined ? 1 : scaledOf(a, 1);

  if (opacity === undefined) {
    return undefined;
  }

  switch (name) {
    case "rgb":
    case "rgba": {
      const red = scaledOf(first, 255);
      const green = scaledOf(second, 255);
      const blue = scaledOf(third, 255);

      return red === undefined || green === undefined || blue === undefined
        ? undefined
        : { red, green, blue, alpha: opacity };
    }
    case "hsl":
    case "hsla": {
      const hue = hueOf(first);
      const saturation = scaledOf(second, 100);
      const lightness = scaledOf(third, 100);

      return hue === undefined ||
        saturation === undefined ||
        lightness === undefined
        ? undefined
        : colorFromHSL(hue, saturation, lightness, opacity);
    }
    case "hwb": {
      const hue = hueOf(first);
      const white = scaledOf(second, 100);
      const black = scaledOf(third, 100);

      return hue === undefined || white === undefined || black === undefined
        ? undefined
        : colorFromHWB(hue, white, black, opacity);
    }
    case "lab": {
      const l = scaledOf(first, 100);
      const labA = scaledOf(second, 125, -1);
      const labB = scaledOf(third, 125, -1);

      return l === undefined || labA === undefined || labB === undefined
        ? undefined
        : colorFromLAB(l * 100, labA * 125, labB * 125, opacity);
    }
    case "lch": {
      const l = scaledOf(first, 100);
      const chroma = scaledOf(second, 230);
      const hue = hueOf(third);

      return l === undefined || chroma === undefined || hue === undefined
        ? undefined
        : colorFromLCH(l * 100, chroma * 230, hue, opacity);
    }
    case "oklab": {
      const l = scaledOf(first, 1);
      const labA = scaledOf(second, 0.4, -1);
      const labB = scaledOf(third, 0.4, -1);

      return l === undefined || labA === undefined || labB === undefined
        ? undefined
        : colorFromOKLAB(l, labA * 0.4, labB * 0.4, opacity);
    }
    case "oklch": {
      const l = scaledOf(first, 1);
      const chroma = scaledOf(second, 0.4);
      const hue = hueOf(third);

      return l === undefined || chroma === undefined || hue === undefined
        ? undefined
        : colorFromOKLCH(l, chroma * 0.4, hue, opacity);
    }
    default:
      return undefined;
  }
};

const isNamedLiteral = (literal: string) =>
  literal.startsWith(":") || literal.startsWith(",");

const parseNamed = (literal: string): Color | undefined => {
  const name = literal.slice(1).trim().toLowerCase();

  // The name regex matches any word, so `constructor` must not reach Object.prototype.
  return Object.hasOwn(namedColors, name)
    ? (colorFromHex(namedColors[name]) ?? undefined)
    : undefined;
};

const parseLiteral = (literal: string): Color | undefined => {
  if (literal.startsWith("#")) {
    return colorFromHex(literal) ?? undefined;
  }

  const open = literal.indexOf("(");

  return parseWide(
    literal.slice(0, open).toLowerCase(),
    literal.slice(open + 1, -1),
  );
};

export const findColors = (line: string): FoundColor[] => {
  const found: FoundColor[] = [];

  const regex = wideGate.test(line) ? wideLiteralRegex : literalRegex;

  // exec on a shared regex skips matchAll's per-call RegExp clone. A loop run to null resets lastIndex; a throw mid-loop would leave it set for the next line.
  regex.lastIndex = 0;

  for (let match = regex.exec(line); match; match = regex.exec(line)) {
    const [literal] = match;
    const named = isNamedLiteral(literal);
    const color = named ? parseNamed(literal) : parseLiteral(literal);

    if (color) {
      // A named color's literal starts at its colon or comma; the swatch covers only the name.
      const prefixLength = named
        ? literal.length - literal.slice(1).trimStart().length
        : 0;

      found.push({
        start: match.index + prefixLength,
        end: match.index + literal.length,
        color,
      });
    }
  }

  return found;
};

const hex2 = (value: number) => value.toString(16).padStart(2, "0");

// Formats match getColorPresentations in vscode-css-languageservice; order per docs/spec.md.
export const colorPresentationLabels = (color: Color): string[] => {
  const red = Math.round(color.red * 255);
  const green = Math.round(color.green * 255);
  const blue = Math.round(color.blue * 255);
  const { alpha } = color;
  const opaque = alpha === 1;

  const { h, s, l } = hslFromColor(color);
  const hsl = `${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  const slashAlpha = opaque ? "" : ` / ${alpha}`;
  const hwb = hwbFromColor(color);
  const lab = labFromColor(color);
  const lch = lchFromColor(color);
  const oklab = oklabFromColor(color);
  const oklch = oklchFromColor(color);

  return [
    `#${hex2(red)}${hex2(green)}${hex2(blue)}${opaque ? "" : hex2(Math.round(alpha * 255))}`,
    opaque
      ? `rgb(${red}, ${green}, ${blue})`
      : `rgba(${red}, ${green}, ${blue}, ${alpha})`,
    opaque ? `hsl(${hsl})` : `hsla(${hsl}, ${alpha})`,
    `hwb(${hwb.h} ${Math.round(hwb.w * 100)}% ${Math.round(hwb.b * 100)}%${slashAlpha})`,
    `lab(${lab.l}% ${lab.a} ${lab.b}${slashAlpha})`,
    `lch(${lch.l}% ${lch.c} ${lch.h}${slashAlpha})`,
    `oklab(${oklab.l}% ${oklab.a} ${oklab.b}${slashAlpha})`,
    `oklch(${oklch.l}% ${oklch.c} ${oklch.h}${slashAlpha})`,
  ];
};
