import { ExtensionContext } from "vscode";
import { registerCompletionProvider } from "./completionItemProvider";

function activate(context: ExtensionContext) {
  registerCompletionProvider(context);
}

module.exports = {
  activate,
};
