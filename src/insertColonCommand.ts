import { commands, window } from "vscode";
import { getDefaultCSSDataProvider } from "vscode-css-languageservice";

const cssDataProvider = getDefaultCSSDataProvider();
const properties = cssDataProvider.provideProperties();

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

    // if (lastWordBeforeCursor[lastWordBeforeCursor.length - 2] === ")") {
    //   commands.executeCommand("cursorLeft");
    // }
  }
);
