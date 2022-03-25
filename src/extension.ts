import {
  ExtensionContext,
  languages,
  extensions,
  DocumentSelector,
  window,
} from "vscode";
import { colorProvider } from "./colorProvider";
import { provideCompletionItems } from "./completionItemProvider";
import { enterKeyEvent } from "./insertColonCommand";

export const documentSelector: DocumentSelector = [
  { scheme: "file", language: "typescriptreact" },
  { scheme: "file", language: "javascriptreact" },
];

export function activate(context: ExtensionContext) {
  // Handle Completions in this extension
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      documentSelector,
      {
        provideCompletionItems,
      },
      "`"
    )
  );

  // Handle colors
  context.subscriptions.push(
    languages.registerColorProvider(documentSelector, colorProvider)
  );

  // Handle auto Colon / SemiColon
  context.subscriptions.push(enterKeyEvent);

  // Check for conflicting extensions #310
  const result = extensions.all.find((v) => v.id === "blanu.vscode-styled-jsx");
  if (result) {
    window.showErrorMessage(
      `You have ${result.packageJSON.name} installed. This conflicts with the VSCode Styled Components extension and is not needed, you can remove or disable it`
    );
  }
}
