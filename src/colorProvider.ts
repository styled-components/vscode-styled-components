import {
  Color,
  TextDocument,
  ColorInformation,
  Range,
  ColorPresentation,
} from "vscode";

import { rgb, color as d3Color } from "d3-color";

// #rrggbb or #rrggbbaa
const colorMatch = /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})?/;
// rgb or rgba
const colorMatchShort = /#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})?/;
// rgba(255, 0, 153, 1);
const rgbaMatch = /rgba?\((\d+)\,\s*(\d+)\,\s*(\d+)(?:\)|\,\s*([\d\.]+)\))/;
// hsl(60, 100%, 50%)
const hslMatch = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/;
// blue
const namedColor = /(?<=:|\s+)(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|goldenrod|gold|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavenderblush|lavender|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)(?![\w\-])/i;

export const colorProvider = {
  provideColorPresentations(color: Color) {
    let parsedColor = rgb(
      color.red * 255,
      color.green * 255,
      color.blue * 255,
      color.alpha
    );
    return [
      new ColorPresentation(parsedColor.formatHex()),
      new ColorPresentation(parsedColor.formatRgb()),
      new ColorPresentation(parsedColor.formatHsl()),
    ];
  },
  provideDocumentColors(document: TextDocument) {
    const colors: ColorInformation[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const element = document.lineAt(i);
      let match =
        colorMatch.exec(element.text) ??
        colorMatchShort.exec(element.text) ??
        rgbaMatch.exec(element.text) ??
        hslMatch.exec(element.text) ??
        namedColor.exec(element.text);
      if (match) {
        const color = colorFromString(match[0]);
        if (color) {
          colors.push(
            new ColorInformation(
              new Range(i, match.index, i, match.index + match[0].length),
              color
            )
          );
        }
      }
    }
    return colors;
  },
};

const colorFromString = (str: string): Color | undefined => {
  let color = d3Color(str);
  if (color?.displayable()) {
    return new Color(
      (color?.rgb().r as number) / 255,
      (color?.rgb().g as number) / 255,
      (color?.rgb().b as number) / 255,
      color?.rgb().opacity as number
    );
  }

  return undefined;
};
