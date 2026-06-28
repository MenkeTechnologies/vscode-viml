```
██╗   ██╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗    ██╗   ██╗██╗███╗   ███╗
██║   ██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝    ██║   ██║██║████╗ ████║
██║   ██║███████╗██║     ██║   ██║██║  ██║█████╗█████╗██║   ██║██║██╔████╔██║
╚██╗ ██╔╝╚════██║██║     ██║   ██║██║  ██║██╔══╝╚════╝╚██╗ ██╔╝██║██║╚██╔╝██║
 ╚████╔╝ ███████║╚██████╗╚██████╔╝██████╔╝███████╗     ╚████╔╝ ██║██║ ╚═╝ ██║
  ╚═══╝  ╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝      ╚═══╝  ╚═╝╚═╝     ╚═╝
```

[![CI](https://img.shields.io/badge/CI-passing-39ff14.svg?labelColor=0d0221)](https://github.com/MenkeTechnologies/vscode-viml/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-online-05d9e8.svg?labelColor=0d0221)](https://menketechnologies.github.io/vscode-viml/)
[![Report](https://img.shields.io/badge/engineering-report-d300c5.svg?labelColor=0d0221)](https://menketechnologies.github.io/vscode-viml/report.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff2a6d.svg?labelColor=0d0221)](https://opensource.org/licenses/MIT)

### `[VS CODE EXTENSION // NEON GRAMMAR // EX COMMANDS // LSP + DAP]`

> *"Open a `.vim`. Functions, scope sigils, ex commands, and `v:` vars light up — and `vimlrs` jacks in."*

VS Code / VSCodium support for **VimL (Vimscript)** — driven by **[vimlrs](https://github.com/MenkeTechnologies)**, a standalone Vimscript interpreter written in Rust (a port of Neovim's eval engine on fusevm). A standalone TextMate grammar, filetype detection, language-server integration via `vimlrs --lsp`, one-key running, and full debugging (breakpoints, stepping, variables) via `vimlrs --dap`.

### [`Read the Docs`](https://menketechnologies.github.io/vscode-viml/) &middot; [`Engineering Report`](https://menketechnologies.github.io/vscode-viml/report.html) · [`vscode-stryke`](https://github.com/MenkeTechnologies/vscode-stryke) · [`zshrs`](https://github.com/MenkeTechnologies/zshrs)

---

## [0x00] OVERVIEW

**vscode-viml** is the VS Code / VSCodium extension for **VimL (Vimscript)**, backed by the `vimlrs` interpreter. It provides:

- **Filetype detection** — `*.vim` files, the well-known config filenames (`vimrc`, `.vimrc`, `init.vim`, …), and files whose first line is a VimL shebang (`#!/usr/bin/env vimlrs`, `#!/usr/bin/vim`).
- **Syntax highlighting** — a standalone TextMate grammar (`source.viml`).
- **Language server** — `vimlrs --lsp` via [vscode-languageclient](https://github.com/microsoft/vscode-languageserver-node) (diagnostics, hover, completion — whatever the server provides).
- **Run** — `VimL: Run File` (Ctrl+F5) executes the active script in a terminal as `vimlrs <file>`.
- **Debugging** — breakpoints, stepping, call stack, variables, and watch via `vimlrs --dap`.

The grammar covers the VimL surface: the statement keywords (`if` / `function` / `let` / `try` / `echo` …), common ex commands (`set`, `autocmd`, `nnoremap`, `highlight` …), scope-sigil variables (`g:`, `s:`, `b:`, `l:`, `a:` …), the special `v:` variables (`v:true`, `v:version`, `v:val` …), the built-in functions (`substitute`, `printf`, `has`, `split`, `matchstr`, `json_encode`, …), options (`&number`), environment (`$HOME`), registers (`@a`), single- and double-quoted strings, numbers, and operators.

Created by **[MenkeTechnologies](https://github.com/MenkeTechnologies)**.

---

## [0x01] FEATURE MATRIX

| Capability | Status |
|---|---|
| Filetype detection — `*.vim` | **Implemented** — `contributes.languages` extension map |
| Filetype detection — config filenames | **Implemented** — `filenames` (`vimrc`, `.vimrc`, `init.vim`, …) |
| Filetype detection — shebang | **Implemented** — `firstLine` regex `^#!.*\b(vimlrs|vim|nvim)\b` |
| Syntax highlighting | **Implemented** — TextMate grammar (`source.viml`) |
| Comments / brackets / autoclose | **Implemented** — `language-configuration.json` |
| Indentation | **Implemented** — block-keyword `indentationRules` |
| Language server | **Implemented** — `vimlrs --lsp` via vscode-languageclient |
| Run | **Implemented** — `VimL: Run File` (Ctrl+F5 / editor-title ▶) runs `vimlrs <file>` in a terminal |
| Debugging | **Implemented** — breakpoints, step over/into/out, call stack, scopes, variables, watch/hover, run-without-debugging, via `vimlrs --dap` (native DAP) |
| Config | `vim.path`, `vim.lsp.enabled`, `vim.lsp.args` |

> The language server needs the `vimlrs` binary. The extension resolves it from
> `$PATH` plus the common install locations (`/opt/homebrew/bin`, `/usr/local/bin`,
> `~/.cargo/bin`, `~/.local/bin`) — so it works even when the editor is launched
> from the macOS Dock / Finder, which doesn't inherit your shell `$PATH`. Install
> with `cargo install vimlrs`. If it lives elsewhere, set `vim.path` to the
> absolute path.

---

## [0x02] INSTALL

This extension is not yet on the Marketplace. Build and install the `.vsix` locally:

```bash
git clone https://github.com/MenkeTechnologies/vscode-viml
cd vscode-viml
npm install
npx @vscode/vsce package          # produces vscode-viml-<version>.vsix
code --install-extension vscode-viml-*.vsix
```

Or drop the folder into your extensions dir for development:

```bash
git clone https://github.com/MenkeTechnologies/vscode-viml \
    ~/.vscode/extensions/vscode-viml
```

Open any `.vim` file — it lights up. The language server starts automatically when `vimlrs` is on `$PATH`.

---

## [0x03] RUN & DEBUG

**Run** — open a `.vim` file and press **Ctrl+F5**, click the **▶** in the editor
title bar, or run **VimL: Run File** from the command palette. The file is saved
and executed as `vimlrs <file>` in an integrated terminal.

**Debug** — set breakpoints in the gutter and press **F5** (or click the **debug**
icon in the editor title bar). No `launch.json` is required: F5 on a `.vim` file
debugs the active file. You get the full debugger — breakpoints, step
over/into/out, call stack, scopes, local + global variables, watch expressions,
and hover-to-evaluate — driven by the native debug adapter (`vimlrs --dap`).

For a saved configuration, add to `.vscode/launch.json`:

```json
{
  "type": "vim",
  "request": "launch",
  "name": "VimL: Debug Current File",
  "program": "${file}",
  "cwd": "${workspaceFolder}",
  "stopOnEntry": false,
  "args": []
}
```

Launch attributes: `program`, `args`, `cwd`, `stopOnEntry`, `noDebug`,
`interpreterArgs`, and `vimlrsPath` (override the binary for one session). The
adapter binary is resolved the same way as the language server, so it works under
the macOS GUI `$PATH`.

---

## [0x04] SYNTAX // SCOPES

The grammar maps VimL tokens to standard TextMate scopes, so every VS Code theme colors them:

| Token group | Scope | Sample |
|---|---|---|
| Statement keywords | `keyword.control.viml` | `if` `elseif` `else` `endif` `while` `for` `function` `endfunction` `return` `try` `catch` `let` `const` `call` `echo` `throw` `finish` |
| Ex commands | `keyword.other.command.viml` | `set` `setlocal` `autocmd` `augroup` `highlight` `syntax` `nnoremap` `inoremap` `map` `command` `normal` `silent` `source` |
| Special `v:` variables | `constant.language.viml` | `v:true` `v:false` `v:null` `v:count` `v:version` `v:val` `v:key` `v:exception` `v:lnum` `v:shell_error` |
| Built-in functions | `support.function.viml` | `substitute` `printf` `has` `split` `join` `map` `filter` `matchstr` `escape` `json_encode` `getenv` `string` `type` `len` |
| Scope-sigil variables | `variable.other.viml` | `g:foo` `s:bar` `b:baz` `w:x` `t:y` `l:tmp` `a:000` |
| Options | `variable.other.option.viml` | `&number` `&l:shiftwidth` `&g:wrap` |
| Environment | `variable.other.environment.viml` | `$HOME` `$PATH` |
| Registers | `variable.other.register.viml` | `@a` `@"` `@+` |
| Function intro | `entity.name.function.viml` | `function! s:Trim` |

Strings (single-quoted literal, double-quoted with escapes), numbers (integer,
float, scientific, hex), comments (`"` line comments), and the full operator set
(assignment, comparison, `is` / `isnot`, `=~` / `!~`, logical, arithmetic, `..`
concatenation, ternary) are scoped too.

---

## [0x05] LANGUAGE SERVER

The extension launches `vimlrs --lsp` (stdio JSON-RPC) through `vscode-languageclient`. Configure it in Settings:

| Setting | Default | Effect |
|---|---|---|
| `vim.path` | `vimlrs` | Path to the vimlrs executable |
| `vim.lsp.enabled` | `true` | Start the language server (set `false` for highlighting only) |
| `vim.lsp.args` | `["--lsp"]` | Args passed to start the server |

The transport is omitted so the client spawns bare `vimlrs --lsp` and never
appends `--stdio` — the arg-rejection / "connection got disposed" failure mode
learned from vscode-stryke. If the binary is missing, the extension shows one
non-fatal warning and syntax highlighting keeps working.

---

## [0x06] VERIFYING THE GRAMMAR

Verify the grammar tokenizes correctly with the real VS Code grammar engine
(`vscode-textmate` + `vscode-oniguruma`, the engine VS Code itself uses):

```bash
npm install
node scripts/tokenize_test.js
```

---

## [0x07] LAYOUT

```
vscode-viml/
├── package.json                 # extension manifest (language, grammar, config, LSP, DAP)
├── language-configuration.json  # comments, brackets, autoclose, indent rules
├── extension.js                 # LSP client (vimlrs --lsp) + run + debug (vimlrs --dap)
├── lib/resolveBinary.js         # GUI-PATH-safe vimlrs binary resolver
├── syntaxes/vim.tmLanguage.json # TextMate grammar (source.viml)
├── scripts/tokenize_test.js     # tokenizes a sample with vscode-textmate + asserts scopes
├── scripts/resolver_test.js     # unit tests for the binary resolver
└── scripts/activate_test.js     # LSP/DAP spawn-contract regression tests
```

---

## [0x08] LICENSE

MIT © **[MenkeTechnologies](https://github.com/MenkeTechnologies)**
