import { commands, window } from "vscode";
import { getDefaultCSSDataProvider } from "vscode-css-languageservice";

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

    const cursorPosition = editor.selection;
    const lineText = editor.document.lineAt(cursorPosition.start.line).text;
    const lineTextList = lineText.trim().split(" ");
    const lastWordBeforeCursor = lineTextList[lineTextList.length - 1];

    if (properties.find((value) => value.name === lastWordBeforeCursor)) {
      editor.edit((editBuilder) => {
        editBuilder.insert(
          editor.document.lineAt(cursorPosition.active).range.end,
          ": ;"
        );
        commands.executeCommand("cursorLeft");
        commands.executeCommand("editor.action.triggerSuggest");
      });
    }

    if (allCSSFunctions.has(lastWordBeforeCursor.slice(0, -1))) {
      commands.executeCommand("cursorLeft");
    }
  }
);
