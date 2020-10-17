import { ExtensionContext, languages, DocumentSelector } from "vscode";
import { colorProvider } from "./colorProvider";
import { registerCompletionProvider } from "./completionItemProvider";

export const documentSelector: DocumentSelector = [
  { scheme: "file", language: "typescriptreact" },
  { scheme: "file", language: "javascriptreact" },
];

function activate(context: ExtensionContext) {
  registerCompletionProvider(context);
  languages.registerColorProvider(documentSelector, colorProvider);
}

module.exports = {
  activate,
};
