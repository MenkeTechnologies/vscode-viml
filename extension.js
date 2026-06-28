// vscode-viml — language support, running, and debugging for VimL (Vimscript,
// the vimlrs Rust implementation).
//
// Syntax highlighting and filetype detection are declarative (see package.json
// + syntaxes/vim.tmLanguage.json). This module wires up the runtime pieces:
//   --lsp   Language Server (JSON-RPC on stdio) — diagnostics / hover / completion
//   --dap   Debug Adapter (DAP on stdio)        — breakpoints / stepping / variables
// Both flags are passed to the vimlrs binary; a missing flag/binary degrades to
// a single non-fatal warning (syntax highlighting keeps working).

const vscode = require('vscode');
const { LanguageClient } = require('vscode-languageclient/node');
const { resolveVimlrsBinary } = require('./lib/resolveBinary');

let client;
let runTerminal;

function activate(context) {
  registerExecutionAndDebug(context);

  const config = vscode.workspace.getConfiguration('vim');
  if (config.get('lsp.enabled', true)) {
    startLanguageServer(context, config);
  }
}

// Resolve the vimlrs binary or warn once, returning undefined when not found.
function resolveOrWarn(configured, action) {
  const command = resolveVimlrsBinary(configured);
  if (!command) {
    vscode.window.showWarningMessage(
      `vimlrs not found for ${action}: could not find the \`${configured}\` binary. ` +
      `Set "vim.path" to the absolute path (e.g. /opt/homebrew/bin/vimlrs) or install it (\`cargo install vimlrs\`).`
    );
  }
  return command;
}

// Shell-quote a path for `Terminal.sendText` (POSIX shells vs Windows).
function shellQuote(s) {
  if (process.platform === 'win32') {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

function activeVimEditor(action) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'vim') {
    vscode.window.showWarningMessage(`VimL: open a .vim file to ${action}.`);
    return undefined;
  }
  return editor;
}

// `vim.run` — execute the active file in an integrated terminal as `vimlrs <file>`.
function runFile() {
  const editor = activeVimEditor('run');
  if (!editor) return;
  const configured = vscode.workspace.getConfiguration('vim').get('path', 'vimlrs');
  const command = resolveOrWarn(configured, 'running');
  if (!command) return;
  editor.document.save().then(() => {
    if (!runTerminal || runTerminal.exitStatus !== undefined) {
      runTerminal = vscode.window.createTerminal('vim');
    }
    runTerminal.show(true);
    runTerminal.sendText(`${shellQuote(command)} ${shellQuote(editor.document.uri.fsPath)}`);
  });
}

// `vim.debug` — launch a debug session for the active file.
function debugFile() {
  const editor = activeVimEditor('debug');
  if (!editor) return;
  editor.document.save().then(() => {
    vscode.debug.startDebugging(vscode.workspace.getWorkspaceFolder(editor.document.uri), {
      type: 'vim',
      request: 'launch',
      name: 'VimL: Debug Current File',
      program: editor.document.uri.fsPath,
      cwd: '${workspaceFolder}',
      stopOnEntry: false
    });
  });
}

// Fills in a debug config for F5-with-no-launch.json, and aborts cleanly if no
// program can be determined.
const debugConfigProvider = {
  resolveDebugConfiguration(_folder, config) {
    if (!config.type && !config.request && !config.name) {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'vim') {
        config.type = 'vim';
        config.request = 'launch';
        config.name = 'VimL: Debug Current File';
        config.program = '${file}';
        config.cwd = '${workspaceFolder}';
        config.stopOnEntry = false;
      }
    }
    if (!config.program) {
      vscode.window.showWarningMessage('VimL debug: no `program` to debug (open a .vim file or set one in launch.json).');
      return undefined; // abort the session
    }
    return config;
  }
};

// Builds the debug adapter: `vimlrs --dap` over stdio. The binary is resolved
// the same way as the LSP, so it works under the GUI PATH; a per-session
// `vimlrsPath` in the launch config overrides the `vim.path` setting.
const debugAdapterFactory = {
  createDebugAdapterDescriptor(session) {
    const configured = session.configuration.vimlrsPath
      || vscode.workspace.getConfiguration('vim').get('path', 'vimlrs');
    const command = resolveVimlrsBinary(configured);
    if (!command) {
      vscode.window.showErrorMessage(
        `vimlrs not found for debugging: could not find the \`${configured}\` binary. Set "vim.path".`
      );
      return undefined;
    }
    return new vscode.DebugAdapterExecutable(command, ['--dap']);
  }
};

function registerExecutionAndDebug(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vim.run', runFile),
    vscode.commands.registerCommand('vim.debug', debugFile),
    vscode.debug.registerDebugConfigurationProvider('vim', debugConfigProvider),
    vscode.debug.registerDebugAdapterDescriptorFactory('vim', debugAdapterFactory)
  );
}

function startLanguageServer(context, config) {
  const configured = config.get('path', 'vimlrs');
  const command = resolveVimlrsBinary(configured);
  const args = config.get('lsp.args', ['--lsp']);

  // Binary not found — do NOT start the client. Starting it would spawn-fail
  // and trigger the internal retry/stop cascade described above. Warn once and
  // leave syntax highlighting (which needs no server) working.
  if (!command) {
    vscode.window.showWarningMessage(
      `vim language server not started: could not find the \`${configured}\` binary. ` +
      `Set "vim.path" to the absolute path (e.g. /opt/homebrew/bin/vimlrs), ` +
      `install it (\`cargo install vimlrs\`), or disable "vim.lsp.enabled". ` +
      `Syntax highlighting still works.`
    );
    return;
  }

  // NOTE: do NOT set `transport: TransportKind.stdio`. For a command-based
  // server, vscode-languageclient reacts to that by appending `--stdio` to the
  // argv (see vscode-languageclient/lib/node/main.js — the Executable branch),
  // so it would spawn `vimlrs --lsp --stdio`. vimlrs's CLI rejects the extra
  // arg and exits before the JSON-RPC handshake — which the client reports as
  // "Pending response rejected since connection got disposed" plus the
  // StartFailed retry cascade. With transport omitted the client still talks
  // JSON-RPC over the process stdout/stdin (the `transport === undefined` path
  // uses StreamMessageReader/Writer), but spawns bare `vimlrs --lsp`, which is
  // what the binary expects. (Same root cause that bit vscode-stryke.)
  const serverOptions = {
    run: { command, args },
    debug: { command, args }
  };

  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'vim' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.vim')
    }
  };

  client = new LanguageClient(
    'vim',
    'vim Language Server',
    serverOptions,
    clientOptions
  );

  // Defensive: if start() still rejects (server crashes after a successful
  // spawn), surface it once instead of letting the rejection go uncaught.
  client.start().catch((err) => {
    vscode.window.showWarningMessage(
      `vim language server failed to start (${command} --lsp): ${err.message}. ` +
      `Syntax highlighting still works.`
    );
  });

  context.subscriptions.push({ dispose: stopClient });
}

// stop() throws synchronously unless the client is actually Running — in the
// Starting / StartFailed states it raises "Client is not running and can't be
// stopped". Only stop a running client, and swallow any late rejection.
function stopClient() {
  if (!client || !client.isRunning()) {
    return undefined;
  }
  try {
    return Promise.resolve(client.stop()).catch(() => undefined);
  } catch (_e) {
    return undefined;
  }
}

function deactivate() {
  return stopClient();
}

module.exports = { activate, deactivate };
