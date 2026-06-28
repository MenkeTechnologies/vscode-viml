# Changelog

## 0.1.0

- Initial release.
- Filetype detection for `*.vim`, the well-known config filenames (`vimrc`,
  `.vimrc`, `_vimrc`, `gvimrc`, `.gvimrc`, `_gvimrc`, `.exrc`, `_exrc`,
  `.nvimrc`, `init.vim`), and VimL shebangs (`#!/usr/bin/env vimlrs`,
  `#!/usr/bin/vim`, `#!/usr/bin/nvim`).
- TextMate grammar (`source.viml`) — statement keywords (`if` / `elseif` /
  `else` / `endif` / `while` / `endwhile` / `for` / `endfor` / `in` /
  `function` / `endfunction` / `return` / `break` / `continue` / `try` /
  `catch` / `finally` / `throw` / `let` / `unlet` / `const` / `lockvar` /
  `unlockvar` / `call` / `eval` / `execute` / `echo` / `echomsg` / `finish`),
  common ex commands (`set` / `setlocal` / `autocmd` / `augroup` / `highlight`
  / `syntax` / `nnoremap` / `inoremap` / `map` / `command` / `normal` /
  `silent` / `source` …), special `v:` variables (`v:true` `v:false` `v:null`
  `v:count` `v:version` `v:val` `v:key` `v:exception` `v:lnum` `v:shell_error`
  …), built-in functions (`substitute` `printf` `has` `split` `join` `map`
  `filter` `matchstr` `escape` `json_encode` `json_decode` `getenv` `string`
  `type` `len` `sort` `range` `reduce` …), scope-sigil variables (`g:` `s:`
  `b:` `w:` `t:` `l:` `a:`), options (`&number`), environment (`$HOME`),
  registers (`@a`), single- and double-quoted strings, numbers, comments, and
  operators.
- Editor configuration: line comment `"`, brackets, auto-closing / surrounding
  pairs (including both quote styles), word pattern, and block-keyword
  indentation.
- Language server integration via `vimlrs --lsp` (vscode-languageclient). The
  transport is omitted so the client spawns bare `vimlrs --lsp` and never
  appends `--stdio` (the arg-rejection / "connection got disposed" failure mode
  learned from vscode-stryke).
- Running: `VimL: Run File` command (Ctrl+F5, editor-title ▶, command palette)
  saves and runs the active `.vim` file as `vimlrs <file>` in a terminal.
- Debugging via `vimlrs --dap`: gutter breakpoints, step over/into/out, call
  stack, scopes, variables, watch / hover-to-evaluate, and run-without-debugging.
  F5 on a `.vim` file works with no `launch.json`; launch attributes
  `program` / `args` / `cwd` / `stopOnEntry` / `noDebug` / `interpreterArgs` /
  `vimlrsPath` are supported. The adapter binary is resolved like the language
  server, so it works under the macOS GUI `$PATH`.
