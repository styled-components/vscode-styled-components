import fs from "node:fs";
import path from "node:path";

import Mocha from "mocha";

// Runs inside the bundle in .integration-test/, which holds every *.test.js next to this file.
export async function run() {
  const mocha = new Mocha({
    // A test's first editor action in a fresh VS Code also loads grammars and starts the extension, which can take seconds on a shared CI runner.
    timeout: 10_000,
    ui: "tdd",
  });

  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith(".test.js"))
    .forEach((file) => mocha.addFile(path.resolve(__dirname, file)));

  return new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}
