"use strict";

const assert = require("assert");
const vscode = require("vscode");

const EXTENSION_ID = "styled-components.vscode-styled-components";

suite("extension", () => {
  test("activates without an error", async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `${EXTENSION_ID} is not installed`);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });
});
