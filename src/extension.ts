import {
  commands,
  type DocumentSelector,
  type ExtensionContext,
  extensions,
  languages,
  window,
} from "vscode";
import { colorProvider } from "./colorProvider";
import { provideCompletionItems } from "./completionItemProvider";
import { insertColonOrSemiColon } from "./insertColonCommand";

export const documentSelector: DocumentSelector = [
  { scheme: "file", language: "typescriptreact" },
  { scheme: "file", language: "javascriptreact" },
];

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      documentSelector,
      { provideCompletionItems },
      "`",
    ),
    languages.registerColorProvider(documentSelector, colorProvider),
    commands.registerCommand(
      "extension.insertColonOrSemiColon",
      insertColonOrSemiColon,
    ),
  );

  // Check for conflicting extensions #310
  const result = extensions.all.find((v) => v.id === "blanu.vscode-styled-jsx");
  if (result) {
    window.showErrorMessage(
      `You have ${result.packageJSON.name} installed. This conflicts with the VSCode Styled Components extension and is not needed, you can remove or disable it`,
    );
  }
}
