import { ExtensionContext, languages, DocumentSelector } from "vscode";
import { colorProvider } from "./colorProvider";
import { provideCompletionItems } from "./completionItemProvider";
import { enterKeyEvent } from "./insertColonCommand";

export const documentSelector: DocumentSelector = [
  { scheme: "file", language: "typescriptreact" },
  { scheme: "file", language: "javascriptreact" },
];

function activate(context: ExtensionContext) {
  // Handle Completions in this extension
  context.subscriptions.push(
    languages.registerCompletionItemProvider(documentSelector, {
      provideCompletionItems,
    })
  );

  // Handle colors
  context.subscriptions.push(
    languages.registerColorProvider(documentSelector, colorProvider)
  );

  // Handle auto Colon / SemiColon
  context.subscriptions.push(enterKeyEvent);
}

module.exports = {
  activate,
};
