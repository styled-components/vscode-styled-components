const path = require('path');
const Mocha = require('mocha');
const { glob } = require('glob');

async function run() {
  const mocha = new Mocha({
    ui: 'tdd'
  });

  const testsRoot = path.resolve(__dirname, '..');
  const files = await glob('**/**.test.js', { cwd: testsRoot });

  files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise((resolve, reject) => {
    mocha.run(failures => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}

module.exports.run = run;
