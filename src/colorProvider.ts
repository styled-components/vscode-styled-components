import {
  Color,
  TextDocument,
  ColorInformation,
  Range,
  ColorPresentation,
} from "vscode";

// #rrggbb or #rrggbbaa
const colorMatch = /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})?/;
// #rgb or #rgba
const colorMatchShort = /#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})?/;
// #rgba(255, 0, 153, 1);
const rgbaMatch = /rgba?\((\d+)\,\s*(\d+)\,\s*(\d+)(?:\)|\,\s*(\d+)\))[;]?/;

export const colorProvider = {
  provideColorPresentations(color: Color, context: any) {
    return [
      new ColorPresentation(
        `#${padHex(color.red * 255)}${padHex(color.green * 255)}${padHex(
          color.blue * 255
        )}`
      ),
    ];
  },
  provideDocumentColors(document: TextDocument) {
    const colors: ColorInformation[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const element = document.lineAt(i);
      let matches =
        colorMatch.exec(element.text) ??
        colorMatchShort.exec(element.text) ??
        rgbaMatch.exec(element.text);
      if (matches) {
        const color = colorFromString(matches[0]);
        if (color) {
          colors.push(
            new ColorInformation(
              new Range(i, matches.index, i, matches.index + matches[0].length),
              color
            )
          );
        }
      }
    }
    return colors;
  },
};

const padHex = (i: number): string => {
  let hex = Math.floor(i).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
};

const colorFromString = (str: string): Color | undefined => {
  // #rrggbb or #rrggbbaa
  let matches: RegExpMatchArray | null;
  matches = str.match(colorMatch);
  if (matches) {
    return new Color(
      parseInt(matches[1], 16) / 255,
      parseInt(matches[2], 16) / 255,
      parseInt(matches[3], 16) / 255,
      matches[4] ? parseInt(matches[4], 16) / 255 : 1
    );
  }

  matches = str.match(colorMatchShort);
  if (matches) {
    return new Color(
      parseInt(matches[1], 16) / 255,
      parseInt(matches[2], 16) / 255,
      parseInt(matches[3], 16) / 255,
      matches[4] ? parseInt(matches[4], 16) / 255 : 1
    );
  }

  matches = str.match(rgbaMatch);
  if (matches) {
    return new Color(
      parseInt(matches[1], 10),
      parseInt(matches[2], 10),
      parseInt(matches[3], 10),
      matches[4] ? parseInt(matches[4], 10) : 1
    );
  }
  // // r,g,b as int 1-255 or float 0-1
  // const matches = str.match(
  //   /\s*(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)\s*,?\s*(\d+(?:\.\d+)?)(?:\s*,?\s*(\d+(?:\.\d+)?))?\s*/
  // );
  // if (matches) {
  //   let r = parseFloat(matches[1]);
  //   let g = parseFloat(matches[2]);
  //   let b = parseFloat(matches[3]);
  //   let a = matches[4] ? parseFloat(matches[4]) : undefined;
  //   if (r > 1 || g > 1 || b > 1 || (a && a > 1)) {
  //     r = r / 255;
  //     g = g / 255;
  //     b = b / 255;
  //     if (a) {
  //       a = a / 255;
  //     }
  //   }
  //   if (!a) {
  //     a = 1;
  //   }
  //   return new vscode.Color(r, g, b, a);
  // }

  return undefined;
};
