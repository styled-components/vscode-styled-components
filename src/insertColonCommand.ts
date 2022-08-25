import { commands, Position, Range, window } from "vscode";
import { getDefaultCSSDataProvider } from "vscode-css-languageservice";
import { normalizeRegex, patterns } from "./patterns";

// Collect all CSS Functions, like matrix(), rotate() etc
// There may be overlap so use Set to ensure unique values
const getCSSFunctions = () => {
  return properties.reduce((acc, val) => {
    if (!val?.values) {
      return acc;
    }

    val.values?.forEach((v) => {
      if (v.name.slice(v.name.length - 1) === ")") {
        acc.add(v.name);
      }
    });

    return acc;
  }, new Set());
};

const cssDataProvider = getDefaultCSSDataProvider();
const properties = cssDataProvider.provideProperties();
const allCSSFunctions = getCSSFunctions();

export const enterKeyEvent = commands.registerCommand(
  "extension.insertColonOrSemiColon",
  async () => {
    await commands.executeCommand("acceptSelectedSuggestion");
    const editor = window.activeTextEditor;

    if (!editor) {
      return;
    }

    const selection = editor.selection;
    const textBeforeCursor = editor.document.getText(
      new Range(new Position(0, 0), selection.active)
    );
    let insideAPattern = false;

    // determine if the cursor is inside a pattern
    patterns.forEach((pattern) => {
      try {
        /**
         * this regex will match if the cursor is inside the pattern
         * more specifically, we've encountered the beginning but not the corresponding ending
         * that should indicate that we're inside css
         */
        const endRegex = new RegExp(
          `(${normalizeRegex(pattern.begin)})(?![\\S\\s]*(${normalizeRegex(
            pattern.end
          )}))`
        );

        if (endRegex.test(textBeforeCursor)) {
          insideAPattern = true;
        }
      } catch (e) {
        // if the regex is invalid, skip it
        console.warn("Failed to process regex:", e);
      }
    });

    if (!insideAPattern) {
      return;
    }

    const lineText = editor.document.lineAt(selection.start.line).text;
    const lineTextList = lineText.trim().split(" ");
    const lastWordBeforeCursor = lineTextList[lineTextList.length - 1];

    if (properties.find((value) => value.name === lastWordBeforeCursor)) {
      editor.edit((editBuilder) => {
        editBuilder.insert(
          editor.document.lineAt(selection.active).range.end,
          ": ;"
        );
      });
      commands.executeCommand("cursorLeft");
      commands.executeCommand("editor.action.triggerSuggest");
    }

    if (allCSSFunctions.has(lastWordBeforeCursor.slice(0, -1))) {
      commands.executeCommand("cursorLeft");
    }
  }
);
