import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as vscode from "vscode";

const EXTENSION_ID = "styled-components.vscode-styled-components";
const COMMAND_ID = "extension.insertColonOrSemiColon";
const SNIPPET_LABEL = "expand template string";

// Providers register for scheme "file", so the document lives on disk.
async function openTsx(lines: string[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "styled-components-"));
  const file = path.join(dir, "fixture.tsx");
  fs.writeFileSync(file, lines.join("\n"));
  const document = await vscode.workspace.openTextDocument(file);
  const editor = await vscode.window.showTextDocument(document);
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension, `${EXTENSION_ID} is not installed`);
  await extension.activate();

  return { dir, document, editor };
}

async function closeFixture({ dir }: { dir: string }) {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  fs.rmSync(dir, { recursive: true, force: true });
}

function endOf(document: vscode.TextDocument, lineIndex: number) {
  return document.lineAt(lineIndex).range.end;
}

suite("commands", () => {
  suite("Enter command", () => {
    test("inserts a colon and semicolon after a property inside a template that holds a nested template", async () => {
      const lines = [
        'import styled, { css } from "styled-components";',
        "const A = styled.div`",
        "  color: ${`${theme.x} !important`};",
        "  background: ${(p) => p.a && css`display: block;`};",
        "  color",
        "`;",
      ];
      const fixture = await openTsx(lines);
      try {
        const end = endOf(fixture.document, 4);
        fixture.editor.selection = new vscode.Selection(end, end);

        await vscode.commands.executeCommand(COMMAND_ID);

        assert.strictEqual(fixture.document.lineAt(4).text, "  color: ;");
        assert.deepStrictEqual(
          [
            fixture.editor.selection.active.line,
            fixture.editor.selection.active.character,
          ],
          [4, "  color: ".length],
        );
      } finally {
        await closeFixture(fixture);
      }
    });

    test("moves the cursor between the parentheses of a CSS function picked before the semicolon", async () => {
      const lines = ["const A = styled.div`", "  transform: rotate();", "`;"];
      const fixture = await openTsx(lines);
      try {
        const afterFunction = new vscode.Position(
          1,
          "  transform: rotate()".length,
        );
        fixture.editor.selection = new vscode.Selection(
          afterFunction,
          afterFunction,
        );

        await vscode.commands.executeCommand(COMMAND_ID);

        assert.strictEqual(fixture.document.getText(), lines.join("\n"));
        assert.deepStrictEqual(
          [
            fixture.editor.selection.active.line,
            fixture.editor.selection.active.character,
          ],
          [1, "  transform: rotate(".length],
        );
      } finally {
        await closeFixture(fixture);
      }
    });

    test("leaves a plain template unchanged", async () => {
      const lines = ["const s = `", "  color", "`;"];
      const fixture = await openTsx(lines);
      try {
        const end = endOf(fixture.document, 1);
        fixture.editor.selection = new vscode.Selection(end, end);

        await vscode.commands.executeCommand(COMMAND_ID);

        assert.strictEqual(fixture.document.getText(), lines.join("\n"));
      } finally {
        await closeFixture(fixture);
      }
    });
  });

  suite("backtick snippet", () => {
    async function snippetLabels(
      lines: string[],
      position: (document: vscode.TextDocument) => vscode.Position,
      triggerCharacter: string | undefined,
    ) {
      const fixture = await openTsx(lines);
      try {
        const list =
          await vscode.commands.executeCommand<vscode.CompletionList>(
            "vscode.executeCompletionItemProvider",
            fixture.document.uri,
            position(fixture.document),
            triggerCharacter,
          );

        return list.items
          .map((item) =>
            typeof item.label === "string" ? item.label : item.label.label,
          )
          .filter((label) => label === SNIPPET_LABEL);
      } finally {
        await closeFixture(fixture);
      }
    }

    const atEnd = (document: vscode.TextDocument) =>
      document.lineAt(document.lineCount - 1).range.end;

    test("is offered after a backtick that opens a styled template", async () => {
      const labels = await snippetLabels(["const A = styled.div`"], atEnd, "`");

      assert.deepStrictEqual(labels, [SNIPPET_LABEL]);
    });

    test("is not offered after a backtick that opens a plain template", async () => {
      const labels = await snippetLabels(["const s = `"], atEnd, "`");

      assert.deepStrictEqual(labels, []);
    });

    test("is not offered after a backtick inside a comment", async () => {
      const labels = await snippetLabels(["// see `"], atEnd, "`");

      assert.deepStrictEqual(labels, []);
    });

    test("is not offered on a request without the backtick trigger inside a styled block", async () => {
      const labels = await snippetLabels(
        ["const A = styled.div`", "  color"],
        atEnd,
        undefined,
      );

      assert.deepStrictEqual(labels, []);
    });
  });
});
