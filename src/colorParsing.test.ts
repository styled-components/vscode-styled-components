import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Color } from "vscode-css-languageservice";

import { colorPresentationLabels, findColors } from "./colorParsing";

const bytes = ({ red, green, blue, alpha }: Color) => [
  Math.round(red * 255),
  Math.round(green * 255),
  Math.round(blue * 255),
  alpha,
];

// Each found color as [start, end, r, g, b, alpha] with channels in 0-255.
const found = (line: string) =>
  findColors(line).map(({ start, end, color }) => [
    start,
    end,
    ...bytes(color),
  ]);

const only = (line: string) => {
  const colors = findColors(line);
  assert.equal(colors.length, 1, `expected one color in ${line}`);

  return bytes(colors[0].color);
};

type Family = { valid: Record<string, number[]>; invalid: string[] };

// Expected channels for the wide-gamut families are what VS Code's CSS support shows for the same text in a .css file.
const families = {
  hex: {
    valid: {
      "#f0a": [255, 0, 170, 1],
      "#F0A8": [255, 0, 170, 0x88 / 255],
      "#ff0099": [255, 0, 153, 1],
      "#FF009980": [255, 0, 153, 0x80 / 255],
    },
    invalid: ["#fffff", "#ff00001", "#ff", "#fffffffff"],
  },
  "rgb and rgba": {
    valid: {
      "rgb(255, 0, 153)": [255, 0, 153, 1],
      "rgb(255,0,153)": [255, 0, 153, 1],
      "rgba(255, 0, 153, 0.5)": [255, 0, 153, 0.5],
      "rgba(255, 0, 153, .25)": [255, 0, 153, 0.25],
      "rgba(255, 0, 153, 50%)": [255, 0, 153, 0.5],
      "rgb(255, 0, 153, 0.5)": [255, 0, 153, 0.5],
      "rgb(255 0 153)": [255, 0, 153, 1],
      "rgb(255   0   153)": [255, 0, 153, 1],
      "rgb(255 0 153 / 50%)": [255, 0, 153, 0.5],
      "rgb(255 0 153/0.5)": [255, 0, 153, 0.5],
      "rgba(255 0 153 / 0.5)": [255, 0, 153, 0.5],
      "rgb(100% 0% 60%)": [255, 0, 153, 1],
      "rgb(100%, 0%, 60%, 50%)": [255, 0, 153, 0.5],
      "RGB(255 0 153)": [255, 0, 153, 1],
      "RGBA(255, 0, 153, 0.5)": [255, 0, 153, 0.5],
    },
    invalid: [
      "rgb(255, 0 153)",
      "rgb(255 0, 153)",
      "rgb(255, 0, 153 / 0.5)",
      "rgb(255 0 153, 0.5)",
      "rgb(300, 0, 0)",
      "rgb(120% 0% 0%)",
      "rgba(255, 0, 153, 1.5)",
      "rgb(255 0 153 / 150%)",
      "rgb(255 0)",
      "rgb(255, 0, 153",
    ],
  },
  "hsl and hsla": {
    valid: {
      "hsl(220, 30%, 10%)": [18, 23, 33, 1],
      "hsla(220, 30%, 10%, 0.5)": [18, 23, 33, 0.5],
      "hsl(220 30% 95%)": [238, 241, 246, 1],
      "hsl(220 30% 95% / 0.5)": [238, 241, 246, 0.5],
      "hsl(220 30% 95% / 50%)": [238, 241, 246, 0.5],
      "hsla(220 30% 95% / 50%)": [238, 241, 246, 0.5],
      "hsl(120deg 100% 50%)": [0, 255, 0, 1],
      "hsl(240.0deg, 100%, 50%)": [0, 0, 255, 1],
      "hsl(-120, 100%, 50%)": [0, 0, 255, 1],
      "hsl(-120deg 100% 50%)": [0, 0, 255, 1],
      "hsl(480, 100%, 50%)": [0, 255, 0, 1],
      "hsl(720 100% 50%)": [255, 0, 0, 1],
      "hsl(0, 0%, 50%)": [128, 128, 128, 1],
      "HSL(0, 100%, 50%)": [255, 0, 0, 1],
      "HSLA(0 100% 50% / 0.5)": [255, 0, 0, 0.5],
      "hsl(0.5turn 50% 50%)": [64, 191, 191, 1],
      "hsl(120rad 50% 50%)": [191, 139, 64, 1],
      "hsl(200grad, 50%, 50%)": [64, 191, 191, 1],
      "hsl(none 100% 50%)": [255, 0, 0, 1],
      "hsl(220 30 95)": [238, 241, 246, 1],
      "hsl(220, 30, 95, .5)": [238, 241, 246, 0.5],
    },
    invalid: [
      "hsl(220, 30% 10%)",
      "hsl(220 30%, 10%)",
      "hsl(220, 30%, 10% / 0.5)",
      "hsl(220 30% 10%, 0.5)",
      "hsl(220, 120%, 50%)",
      "hsl(220, 30%, 110%)",
      "hsla(220, 30%, 10%, 1.5)",
      "hsl(220 30%)",
      "hsl(220 120 50)",
      "hsl(220, 30 10)",
      "hsl(220 30% 10%deg)",
    ],
  },
  hwb: {
    valid: {
      "hwb(120 0% 0%)": [0, 255, 0, 1],
      "hwb(120, 0%, 0%)": [0, 255, 0, 1],
      "hwb(0.5turn 20% 30%)": [51, 179, 179, 1],
      "hwb(none 20% 30% / 50%)": [179, 51, 51, 0.5],
      "HWB(120 20 30 / .5)": [51, 179, 51, 0.5],
      "hwb(100grad 0 0)": [128, 255, 0, 1],
      "hwb(3.14rad 0 0)": [0, 255, 255, 1],
      "hwb(-120 0% 0%)": [0, 0, 255, 1],
      "hwb(0 80% 80%)": [128, 128, 128, 1],
    },
    invalid: [
      "hwb(50% 50% 50%)",
      "hwb(120 0% 0% / 150%)",
      "hwb(120 0%)",
      "hwb(120 0%, 0%)",
      "hwb(120deg 0% 0%deg)",
    ],
  },
  lab: {
    valid: {
      "lab(50 20 -30)": [127, 109, 170, 1],
      "lab(50% 20% -30%)": [127, 107, 183, 1],
      "lab(50 20 30 / 0.5)": [164, 105, 69, 0.5],
      "LAB(50 20 30)": [164, 105, 69, 1],
      "lab(50, 20, 30, 0.5)": [164, 105, 69, 0.5],
      "lab(0 0 0)": [0, 0, 0, 1],
      "lab(100 0 0)": [255, 255, 255, 1],
      "lab(100 125 125)": [255, 80, 0, 1],
    },
    invalid: [
      "lab(150 0 0)",
      "lab(-1 0 0)",
      "lab(50 200 0)",
      "lab(50 -130 0)",
      "lab(none 0 0)",
      "lab(50 20 30 / none)",
      "lab(50deg 20 30)",
      "lab(50 20 5.)",
      "lab(50 20, 30)",
      "lab(50 20 30, 0.5)",
      "lab(50, 20, 30 / 0.5)",
      "lab(50 20 30 / -0.5)",
      "lab(50 20 30 0.5)",
    ],
  },
  lch: {
    valid: {
      "lch(50 100 none)": [255, 0, 123, 1],
      "lch(50% 40% 270deg)": [0, 131, 255, 1],
      "lch(50 100 0.25turn / 0.5)": [146, 116, 0, 0.5],
    },
    invalid: ["lch(50 100)", "lch(50 100 50%)", "lch(50 231 0)"],
  },
  oklab: {
    valid: {
      "oklab(0.7 -0.2 0.1)": [0, 195, 85, 1],
      "oklab(70% -50% 25% / 50%)": [0, 195, 85, 0.5],
      "oklab(0.5 0 0 / +1)": [99, 99, 99, 1],
    },
    invalid: ["oklab(1.5 0 0)", "oklab(0.5 0.5 0)"],
  },
  oklch: {
    valid: {
      "oklch(0.7 0.3 150)": [0, 203, 0, 1],
      "oklch(70% 50% 150deg)": [0, 191, 84, 1],
      "oklch(0.7 0.3 150 / 25%)": [0, 203, 0, 0.25],
      "OKLCH(0.7 0.1 none)": [210, 132, 156, 1],
      "oklch(0.7 0.1 0.5turn)": [75, 179, 161, 1],
      "oklch(0.7 0.1 3.14159rad)": [75, 179, 161, 1],
      "oklch(0 0 0)": [0, 0, 0, 1],
      "oklch(0.7 0.4 150)": [0, 214, 0, 1],
    },
    invalid: [
      "oklch(0.7 0.5 150)",
      "oklch(0.7 0.1 NONE)",
      "oklch(0.7 0.1 50%)",
      "oklch(0.7 0.1 1e2)",
    ],
  },
} satisfies Record<string, Family>;

describe("findColors", () => {
  for (const [family, { valid, invalid }] of Object.entries(families)) {
    describe(family, () => {
      for (const [literal, expected] of Object.entries(valid)) {
        test(`shows a swatch for ${literal}`, () => {
          assert.deepEqual(only(`color: ${literal};`), expected);
        });
      }

      for (const literal of invalid) {
        test(`shows no swatch for ${literal}`, () => {
          assert.deepEqual(found(`color: ${literal};`), []);
        });
      }
    });
  }

  test("shows no swatch for an identifier or id selector that starts with hex digits", () => {
    assert.deepEqual(
      found("this.#feed(); #fadeIn {} a&#fff {} #fff-x {} #fade() {}"),
      [],
    );
  });

  test("shows a swatch for a hex literal beside punctuation", () => {
    assert.deepEqual(found("a{color:#fff} b: (#000), #123;"), [
      [8, 12, 255, 255, 255, 1],
      [18, 22, 0, 0, 0, 1],
      [25, 29, 17, 34, 51, 1],
    ]);
  });

  test("shows no swatch for a function whose name continues from a longer word", () => {
    assert.deepEqual(
      found(
        "a: mylab(50 20 30); b: my-hwb(0 0% 0%); c: myrgb(1,2,3); d: my-rgba(1 2 3); e: myhsl(0 0% 0%); f: x-hsla(0, 0%, 0%, 1)",
      ),
      [],
    );
  });

  describe("named colors", () => {
    test("shows a swatch for a name after a colon and whitespace", () => {
      assert.deepEqual(found("color: red;"), [[7, 10, 255, 0, 0, 1]]);
    });

    test("shows a swatch for a name after a comma and whitespace, ignoring case", () => {
      assert.deepEqual(found("box-shadow: 0 0 1px, BLACK;"), [
        [21, 26, 0, 0, 0, 1],
      ]);
    });

    test("shows CSS Color 4 values for mediumpurple and palevioletred", () => {
      assert.deepEqual(only("color: mediumpurple;"), [147, 112, 219, 1]);
      assert.deepEqual(only("color: palevioletred;"), [219, 112, 147, 1]);
    });

    test("shows no swatch for a name without a preceding colon or comma", () => {
      assert.deepEqual(found("const red = 1; red"), []);
    });

    test("shows no swatch for a name that continues into a longer word", () => {
      assert.deepEqual(found("color: redirect; a: red-ish;"), []);
    });

    test("shows no swatch for a CSS keyword that is not a named color", () => {
      assert.deepEqual(found("color: transparent; display: block;"), []);
    });

    test("shows no swatch for a word that names an Object.prototype member", () => {
      assert.deepEqual(
        found("a: constructor; b: toString; c: hasOwnProperty; d: __proto__"),
        [],
      );
    });
  });

  test("reports the start and end of every color on a line, whatever its kind", () => {
    assert.deepEqual(
      found(
        "a: red; b: #fff, rgb(255 0 153), hsl(0 100% 50% / .5); c: oklch(0.7 0.3 150)",
      ),
      [
        [3, 6, 255, 0, 0, 1],
        [11, 15, 255, 255, 255, 1],
        [17, 31, 255, 0, 153, 1],
        [33, 53, 255, 0, 0, 0.5],
        [58, 76, 0, 203, 0, 1],
      ],
    );
  });

  test("finds colors again on a second call", () => {
    assert.equal(findColors("color: #fff;").length, 1);
    assert.equal(findColors("color: #fff;").length, 1);
  });

  test("scans a long line of near-matches in linear time", () => {
    const runs = 7;
    const nearMatchLines = (n: number) => [
      `rgb(${"1 ".repeat(4 * n)}`,
      `hsl(${"1 ".repeat(4 * n)}`,
      `rgb(1 1 1${" ".repeat(10 * n)}`,
      `hsl(1${"0".repeat(10 * n)}`,
      `rgba(${"1,".repeat(4 * n)}`,
      `#${"f".repeat(10 * n)}`,
      ...["hsl", "hwb", "lab", "lch", "oklab", "oklch"].flatMap((name) => [
        `${name}(${"1 ".repeat(4 * n)}`,
        `${name}(1${"0".repeat(10 * n)}`,
        `${name}(1 1 1${" ".repeat(10 * n)}`,
        `${name}(${"1,".repeat(4 * n)}`,
        `${name}(${"1%".repeat(4 * n)}`,
        `${name}(1 1 ${"1deg".repeat(2.5 * n)}`,
      ]),
    ];

    // The fastest run, not the total of one: load on the machine only ever adds time.
    const fastestMs = (lines: string[]) => {
      let fastest = Infinity;
      for (let run = 0; run < runs; run++) {
        const start = performance.now();
        for (const line of lines) {
          assert.deepEqual(findColors(line), []);
        }
        fastest = Math.min(fastest, performance.now() - start);
      }

      return fastest;
    };

    const n = 5000;
    const single = fastestMs(nearMatchLines(n));
    const quadruple = fastestMs(nearMatchLines(4 * n));

    // Linear growth is 4x and quadratic 16x; 8x leaves room for noise.
    assert.ok(
      quadruple < 8 * Math.max(single, 1),
      `n=${n}: ${single.toFixed(2)} ms, n=${4 * n}: ${quadruple.toFixed(2)} ms`,
    );
  });
});

describe("colorPresentationLabels", () => {
  test("offers hex, rgb, hsl, then the wide-gamut forms for an opaque color", () => {
    assert.deepEqual(
      colorPresentationLabels({ red: 1, green: 0, blue: 0.6, alpha: 1 }),
      [
        "#ff0099",
        "rgb(255, 0, 153)",
        "hsl(324, 100%, 50%)",
        "hwb(324 0% 0%)",
        "lab(55.64% 86.55 -9.73)",
        "lch(55.64% 87.09 353.58)",
        "oklab(65.33% 0.26735 -0.02465)",
        "oklch(65.33% 0.26848 354.733)",
      ],
    );
  });

  test("offers alpha forms and an eight-digit hex when alpha is below 1", () => {
    assert.deepEqual(
      colorPresentationLabels({ red: 1, green: 0, blue: 0, alpha: 0.5 }),
      [
        "#ff000080",
        "rgba(255, 0, 0, 0.5)",
        "hsla(0, 100%, 50%, 0.5)",
        "hwb(0 0% 0% / 0.5)",
        "lab(53.23% 80.11 67.22 / 0.5)",
        "lch(53.23% 104.58 40 / 0.5)",
        "oklab(62.793% 0.22489 0.1258 / 0.5)",
        "oklch(62.793% 0.25768 29.223 / 0.5)",
      ],
    );
  });

  test("zero-pads the hex alpha digits", () => {
    assert.deepEqual(
      colorPresentationLabels({ red: 1, green: 0, blue: 0, alpha: 0.05 }),
      [
        "#ff00000d",
        "rgba(255, 0, 0, 0.05)",
        "hsla(0, 100%, 50%, 0.05)",
        "hwb(0 0% 0% / 0.05)",
        "lab(53.23% 80.11 67.22 / 0.05)",
        "lch(53.23% 104.58 40 / 0.05)",
        "oklab(62.793% 0.22489 0.1258 / 0.05)",
        "oklch(62.793% 0.25768 29.223 / 0.05)",
      ],
    );
  });

  test("rounds channels, hue, saturation, and lightness to integers and keeps VS Code's float formatting in the wide-gamut forms", () => {
    const channels = { red: 0.123, green: 0.456, blue: 0.789 };

    assert.deepEqual(colorPresentationLabels({ ...channels, alpha: 1 }), [
      "#1f74c9",
      "rgb(31, 116, 201)",
      "hsl(210, 73%, 46%)",
      "hwb(210 12% 21%)",
      "lab(48.36% 6.6 -50.94)",
      "lch(48.36% 51.36 277.38)",
      "oklab(55.605000000000004% -0.04522 -0.14602)",
      "oklch(55.605% 0.15286 252.794)",
    ]);
    assert.deepEqual(colorPresentationLabels({ ...channels, alpha: 0.25 }), [
      "#1f74c940",
      "rgba(31, 116, 201, 0.25)",
      "hsla(210, 73%, 46%, 0.25)",
      "hwb(210 12% 21% / 0.25)",
      "lab(48.36% 6.6 -50.94 / 0.25)",
      "lch(48.36% 51.36 277.38 / 0.25)",
      "oklab(55.605000000000004% -0.04522 -0.14602 / 0.25)",
      "oklch(55.605% 0.15286 252.794 / 0.25)",
    ]);
  });

  test("offers black and white without a hue or saturation", () => {
    assert.deepEqual(
      colorPresentationLabels({ red: 0, green: 0, blue: 0, alpha: 1 }),
      [
        "#000000",
        "rgb(0, 0, 0)",
        "hsl(0, 0%, 0%)",
        "hwb(0 0% 100%)",
        "lab(0% 0 0)",
        "lch(0% 0 0)",
        "oklab(0% 0 0)",
        "oklch(0% 0 0)",
      ],
    );
    assert.deepEqual(
      colorPresentationLabels({ red: 1, green: 1, blue: 1, alpha: 1 }),
      [
        "#ffffff",
        "rgb(255, 255, 255)",
        "hsl(0, 0%, 100%)",
        "hwb(0 100% 0%)",
        "lab(100% 0.01 -0.01)",
        "lch(100% 0.01 296.81)",
        "oklab(100% 0 -0.00011)",
        "oklch(100% 0.00011 271.152)",
      ],
    );
  });
});
