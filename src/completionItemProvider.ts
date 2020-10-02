import {
  DocumentSelector,
  languages,
  TextDocument,
  Position,
  Range,
  CompletionItem,
  SnippetString,
  CompletionItemKind,
  ExtensionContext,
} from "vscode";

export const registerCompletionProvider = (context: ExtensionContext) => {
  // Only provide completions for files that match the language type
  const documentSelector: DocumentSelector = [
    { scheme: "file", language: "typescriptreact" },
    { scheme: "file", language: "javascriptreact" },
  ];

  const provider = languages.registerCompletionItemProvider(
    documentSelector,
    {
      provideCompletionItems(document: TextDocument, position: Position) {
        // First decide if we're between two `` or next to one
        const nextCharacterPosition = position.with({
          character: position.character + 1,
        });
        const range = new Range(position, nextCharacterPosition);

        if (document.getText(range) === "`") {
          // To be used when the cursor is sitting in between 2 back ticks
          const blockCompletionItemBetweenTicks = new CompletionItem(
            "expand template string"
          );

          blockCompletionItemBetweenTicks.insertText = new SnippetString(
            "\n\t$0\n"
          );
          blockCompletionItemBetweenTicks.kind = CompletionItemKind.Snippet;
          blockCompletionItemBetweenTicks.documentation =
            "Creates a new CSS block with correct backticks \n`\n\t$0\n`";

          return [blockCompletionItemBetweenTicks];
        }

        // To be used when the cursor is on the end of the line after a single back tick
        const blockCompletionItem = new CompletionItem(
          "expand template string"
        );

        blockCompletionItem.insertText = new SnippetString("\n\t$0\n`");
        blockCompletionItem.kind = CompletionItemKind.Snippet;
        blockCompletionItem.documentation =
          "Creates a new CSS block with correct backticks \n`\n\t$0\n`";

        return [blockCompletionItem];
      },
    },
    "`"
  );

  context.subscriptions.push(provider);
};
