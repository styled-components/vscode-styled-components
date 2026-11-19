import {
  Color,
  ColorInformation,
  ColorPresentation,
  Range,
  type TextDocument,
} from "vscode";

import { colorPresentationLabels, findColors } from "./colorParsing";

export const colorProvider = {
  provideColorPresentations(color: Color) {
    return colorPresentationLabels(color).map(
      (label) => new ColorPresentation(label),
    );
  },
  provideDocumentColors(document: TextDocument) {
    const colors: ColorInformation[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      for (const { start, end, color } of findColors(document.lineAt(i).text)) {
        colors.push(
          new ColorInformation(
            new Range(i, start, i, end),
            new Color(color.red, color.green, color.blue, color.alpha),
          ),
        );
      }
    }

    return colors;
  },
};
