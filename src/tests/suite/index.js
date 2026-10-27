const path = require('path');
const Mocha = require('mocha');
const { glob } = require('glob');

async function run() {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd'
  });
  // mocha.useColors(true);

  const testsRoot = path.resolve(__dirname, '..');



  try {
    const files = await glob('**/**.test.js', { cwd: testsRoot });

    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
    // Run the mocha test
    return new Promise((c, e) => {
      mocha.run(failures => {
        if (failures > 0) {
          e(`${failures} tests failed.`);
        } else {
          c();
        }
      })
    });
  } catch (err) {
    e(err);
  }
}

module.exports.run = run;
