// Tokenize a VimL sample with the real VS Code grammar engine
// (vscode-textmate + vscode-oniguruma) and assert key scopes. Verifies the
// grammar actually loads under oniguruma and classifies tokens.
const fs = require('fs');
const path = require('path');
const vsctm = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');

const root = path.join(__dirname, '..');
const wasm = fs.readFileSync(path.join(root, 'node_modules/vscode-oniguruma/release/onig.wasm'));
const onigLib = oniguruma.loadWASM(wasm.buffer).then(() => ({
  createOnigScanner: (s) => new oniguruma.OnigScanner(s),
  createOnigString: (s) => new oniguruma.OnigString(s)
}));

const registry = new vsctm.Registry({
  onigLib,
  loadGrammar: () =>
    Promise.resolve(
      vsctm.parseRawGrammar(
        fs.readFileSync(path.join(root, 'syntaxes/vim.tmLanguage.json'), 'utf8'),
        'vim.tmLanguage.json'
      )
    )
});

const lines = [
  '#!/usr/bin/env vimlrs',
  '" set defaults',
  'let g:counter = 0',
  'function! s:Trim(text) abort',
  "    let l:s = substitute(a:text, '^\\s\\+', \"\", \"g\")",
  '    return toupper(l:s)',
  'endfunction',
  'if v:version > 800 && has("nvim")',
  '    echo printf("%d", g:counter)',
  'endif',
  'set number'
];

// (lineIndex, columnIndex) -> required scope substring
const checks = [
  [1, 0, 'comment.line', 'comment'],
  [2, 0, 'keyword.control', 'let'],
  [2, 4, 'variable.other', 'g:counter'],
  [3, 0, 'keyword.control', 'function!'],
  [3, 12, 'entity.name.function', 's:Trim'],
  [4, 14, 'support.function', 'substitute'],
  [4, 25, 'variable.other', 'a:text'],
  [5, 11, 'support.function', 'toupper'],
  [6, 0, 'keyword.control', 'endfunction'],
  [7, 3, 'constant.language', 'v:version'],
  [8, 9, 'support.function', 'printf'],
  [10, 0, 'keyword.other.command', 'set']
];

registry.loadGrammar('source.viml').then((grammar) => {
  let ruleStack = vsctm.INITIAL;
  const tokensPerLine = lines.map((line) => {
    const r = grammar.tokenizeLine(line, ruleStack);
    ruleStack = r.ruleStack;
    return r.tokens;
  });

  let failed = 0;
  for (const [li, col, wantScope, label] of checks) {
    const toks = tokensPerLine[li];
    const tok = toks.find((t) => col >= t.startIndex && col < t.endIndex);
    const scopes = tok ? tok.scopes.join(' ') : '(none)';
    const ok = scopes.includes(wantScope);
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  L${li}c${col} ${label.padEnd(12)} want=${wantScope.padEnd(30)} got=${scopes}`);
  }
  console.log(failed === 0 ? '\nALL TOKEN CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error(e); process.exit(2); });
