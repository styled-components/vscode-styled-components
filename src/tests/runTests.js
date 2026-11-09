const fs = require('fs');
const os = require('os');
const path = require('path');
const runTests = require('@vscode/test-electron').runTests;

// Built-in themes and grammars change between VS Code releases, so colorize-results only match the version they were captured with. Bump deliberately and regenerate.
const vscodeVersion = '1.145.2';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		const launchArgs = [
			// This disables all extensions except the one being tested
			'--disable-extensions',
			// The default user-data dir sits under the checkout, which pushes VS Code's IPC socket past macOS's 103-char limit (listen EINVAL).
			`--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'vsc-'))}`,
		];

		// Download VS Code, unzip it and run the integration test
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs,
			version: vscodeVersion,
		});
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exit(1);
	}
}

main();
