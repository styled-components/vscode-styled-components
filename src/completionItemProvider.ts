import {
  type CancellationToken,
  type CompletionContext,
  CompletionItem,
  CompletionItemKind,
  Position,
  Range,
  SnippetString,
  type TextDocument,
} from "vscode";
import { isInsideStyledTemplate } from "./templateScanner";

const BACKTICK = "`";
const LABEL = "expand template string";

export const provideCompletionItems = (
  document: TextDocument,
  position: Position,
  _token: CancellationToken,
  context: CompletionContext,
) => {
  if (context.triggerCharacter !== BACKTICK) {
    return undefined;
  }

  const textBeforeCursor = document.getText(
    new Range(new Position(0, 0), position),
  );
  if (!isInsideStyledTemplate(textBeforeCursor)) {
    return undefined;
  }

  const nextCharacterPosition = position.with({
    character: position.character + 1,
  });
  const isBetweenTicks =
    document.getText(new Range(position, nextCharacterPosition)) === BACKTICK;

  const item = new CompletionItem(LABEL, CompletionItemKind.Snippet);
  // Between two backticks the closing one already exists; otherwise the snippet adds it.
  item.insertText = new SnippetString(
    isBetweenTicks ? "\n\t$0\n" : `\n\t$0\n${BACKTICK}`,
  );
  item.documentation =
    "Creates a new CSS block with correct backticks \n`\n\t$0\n`";

  if (isBetweenTicks) {
    item.sortText = `::A ${LABEL}`;
  }

  return [item];
};
