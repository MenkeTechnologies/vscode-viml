// Regression test for lib/resolveBinary.js — the fix for the uncaught
// "Client is not running and can't be stopped" / "Pending response rejected"
// errors that fire when the editor's PATH (GUI launch) doesn't include the
// vimlrs binary. Runs headless in CI (no `vscode` dependency).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { resolveVimlrsBinary, defaultFallbackDirs } = require('../lib/resolveBinary');

// Build a throwaway "bin" dir holding an executable named `vimlrs`, plus a
// non-executable file, so the test asserts real fs.accessSync(X_OK) behavior.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'viml-resolver-'));
const binDir = path.join(tmp, 'bin');
fs.mkdirSync(binDir);
const exe = path.join(binDir, 'vimlrs');
fs.writeFileSync(exe, '#!/bin/sh\nexit 0\n');
fs.chmodSync(exe, 0o755);
const notExe = path.join(tmp, 'not-exec');
fs.writeFileSync(notExe, 'x');
fs.chmodSync(notExe, 0o644);

const origPath = process.env.PATH;
test.after(() => {
  process.env.PATH = origPath;
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('bare name resolves via PATH', () => {
  process.env.PATH = binDir;
  assert.equal(resolveVimlrsBinary('vimlrs'), exe);
});

test('GUI-launch bug: bare name resolves via fallback dir even with PATH empty', () => {
  // The reported failure: editor launched from the Dock has a minimal PATH
  // that omits the binary's dir. Resolution must still find it via the
  // fallback locations (in production: /opt/homebrew/bin, ~/.cargo/bin, etc.).
  process.env.PATH = '';
  assert.equal(resolveVimlrsBinary('vimlrs', [binDir]), exe);
});

test('PATH is searched before fallback dirs', () => {
  process.env.PATH = binDir;
  // A bogus fallback must not shadow the real PATH hit.
  assert.equal(resolveVimlrsBinary('vimlrs', ['/nonexistent']), exe);
});

test('explicit executable path is returned as-is', () => {
  assert.equal(resolveVimlrsBinary(exe), exe);
});

test('explicit non-executable / missing path returns undefined (no client start)', () => {
  assert.equal(resolveVimlrsBinary(path.join(tmp, 'nope', 'vimlrs')), undefined);
  assert.equal(resolveVimlrsBinary(notExe), undefined);
});

test('missing bare name returns undefined', () => {
  process.env.PATH = binDir;
  assert.equal(resolveVimlrsBinary('vimlrs-does-not-exist', []), undefined);
});

test('production fallback list includes the Cargo and Homebrew prefixes', () => {
  // Guards against someone trimming the list and silently reintroducing the
  // GUI-PATH bug (vimlrs is a `cargo install` binary — ~/.cargo/bin matters).
  const dirs = defaultFallbackDirs();
  assert.ok(dirs.includes('/opt/homebrew/bin'));
  assert.ok(dirs.some((d) => d.endsWith(path.join('.cargo', 'bin'))));
});
