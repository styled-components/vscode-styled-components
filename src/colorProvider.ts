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
const namedColor = /(?<=color:\s*)\w+/;

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
