import { commands, Position, Range, Selection, window } from "vscode";
import { getDefaultCSSDataProvider } from "vscode-css-languageservice";
import { isInsideStyledTemplate } from "./templateScanner";

// CSS functions (`matrix()`, `rotate()`, ...) appear under many properties, so a Set keeps each name once.
const propertyNames = new Set<string>();
const cssFunctions = new Set<string>();

for (const property of getDefaultCSSDataProvider().provideProperties()) {
  propertyNames.add(property.name);

  for (const value of property.values ?? []) {
    if (value.name.endsWith(")")) {
      cssFunctions.add(value.name);
    }
  }
}

export const insertColonOrSemiColon = async () => {
  await commands.executeCommand("acceptSelectedSuggestion");
  const editor = window.activeTextEditor;

  if (!editor) {
    return;
  }

  const selection = editor.selection;
  const lineText = editor.document.lineAt(selection.start.line).text.trim();
  const lastWordBeforeCursor = lineText.slice(lineText.lastIndexOf(" ") + 1);
  const isProperty = propertyNames.has(lastWordBeforeCursor);
  const isFunction = cssFunctions.has(lastWordBeforeCursor.slice(0, -1));

  // The template scan reads the whole document before the cursor, so it runs only once the word matches.
  if (!isProperty && !isFunction) {
    return;
  }

  const textBeforeCursor = editor.document.getText(
    new Range(new Position(0, 0), selection.active),
  );

  if (!isInsideStyledTemplate(textBeforeCursor)) {
    return;
  }

  // The cursors move through the editor API: the `cursorLeft` command acts on the focused editor, which may not be this one.
  const moveCursorsLeft = () => {
    editor.selections = editor.selections.map(({ active }) => {
      const left = active.character > 0 ? active.translate(0, -1) : active;

      return new Selection(left, left);
    });
  };

  if (isProperty) {
    await editor.edit((editBuilder) => {
      editBuilder.insert(
        editor.document.lineAt(selection.active).range.end,
        ": ;",
      );
    });
    moveCursorsLeft();
    await commands.executeCommand("editor.action.triggerSuggest");
  }

  if (isFunction) {
    moveCursorsLeft();
  }
};
