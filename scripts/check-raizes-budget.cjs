const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');

const sourcePath = path.join(__dirname, '../app/tropcalia/finance.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = new Module(sourcePath, module);
loaded._compile(compiled, sourcePath);
const { calculateScenario: calculate, formats } = loaded.exports;
const cents = (value) => Math.round(value * 100);

assert.equal(formats.length, 2);
assert.equal(calculate('pocket', 50, 50).commission, 250);
assert.equal(calculate('pocket', 50, 50).company, -575);
assert.equal(calculate('pocket', 50, 50).supportNeeded, 725);
assert.equal(calculate('pocket', 50, 50).minimumTickets, 68);
assert.equal(calculate('pocket', 67, 50).viable, false);
assert.equal(calculate('pocket', 68, 50).viable, true);
assert.equal(calculate('pocket', 70, 50).company, 275);
assert.equal(calculate('premium', 80, 50).company, -1400);
assert.equal(calculate('premium', 80, 50).supportNeeded, 1700);
assert.equal(calculate('premium', 40, 100).gross, calculate('premium', 80, 50).gross);
assert.equal(calculate('premium', 40, 100).company, calculate('premium', 80, 50).company);
assert.equal(calculate('premium', 119, 50).viable, false);
assert.equal(calculate('premium', 120, 50).viable, true);
assert.equal(calculate('premium', 120, 50).company, 300);
assert.equal(calculate('premium', 125, 50).company, 512.5);
assert.equal(calculate('premium', 150, 50).company, 1575);
assert.equal(calculate('premium', 50, 10).withinCapacity, false);
assert.equal(calculate('premium', 0, 50).minimumPrice, null);
assert.equal(calculate('premium', 0, 50).supportNeeded, 5100);
assert.equal(calculate('pocket', 50, 50, 0).company, -450);
assert.equal(calculate('pocket', 50, 50, 5, 0).supportNeeded, 125);

let reconciled = 0;
for (const format of formats) {
  for (const price of [25, 49.99, 50, 100, 153.62]) {
    for (const fees of [0, 5, 8.5, 15]) {
      for (const people of [0, 1, 40, 50, 67, 68, 70, 80, 119, 120, 125, 150]) {
        const result = calculate(format.id, people, price, fees);
        assert.equal(cents(result.gross), [result.commission, result.reserve, result.artists, result.production, result.company].reduce((total, amount) => total + cents(amount), 0));
        assert.equal(result.artists, format.artists * 300);
        if (result.minimumTickets <= 150) {
          assert.equal(calculate(format.id, result.minimumTickets, price, fees).viable, true);
          assert.equal(calculate(format.id, result.minimumTickets - 1, price, fees).viable, false);
        }
        if (result.minimumPrice !== null) {
          assert.equal(calculate(format.id, people, result.minimumPrice, fees).viable, true);
          assert.equal(calculate(format.id, people, result.minimumPrice - 0.01, fees).viable, false);
        }
        reconciled++;
      }
    }
  }
}
for (const args of [['pocket', -1, 50], ['premium', 151, 50], ['pocket', 50.5, 50], ['pocket', 50, 0], ['pocket', 50, NaN], ['pocket', 50, 50, 90], ['pocket', 50, 50, 5, -1]]) {
  assert.throws(() => calculate(...args));
}
console.log(`Raízes budget verified: ${reconciled} reconciled scenarios, exact activation thresholds, fee floors and input limits.`);
