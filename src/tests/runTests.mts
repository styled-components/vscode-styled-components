import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { runTests } from "@vscode/test-electron";

import vscodeVersion from "./vscodeVersion.mts";

const extensionDevelopmentPath = path.resolve(import.meta.dirname, "../../");

// The bundle scripts/bundle-integration-tests.mts writes in `pretest`.
const extensionTestsPath = path.resolve(
  extensionDevelopmentPath,
  ".integration-test/index",
);

// The default user-data dir sits under the checkout, which pushes VS Code's IPC socket past macOS's 103-char limit (listen EINVAL).
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vsc-"));

try {
  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: ["--disable-extensions", `--user-data-dir=${userDataDir}`],
    version: vscodeVersion,
  });
} catch (err) {
  console.error("Failed to run tests", err);
  process.exitCode = 1;
} finally {
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
