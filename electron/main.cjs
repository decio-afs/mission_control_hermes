// Electron main process for Mission Control (local desktop app).
// Responsibilities:
//   1. Launch the Hermes bridge (hermes-bridge.py) as a child process.
//   2. Wait for the bridge to answer, then open the desktop window.
//   3. Tear the bridge down when the app quits.
const { app, BrowserWindow, shell, session } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const BRIDGE_PORT = process.env.BRIDGE_PORT || '8767';
// In dev, set MC_DEV_URL=http://localhost:3001 and run `npm run dev` separately.
const DEV_URL = process.env.MC_DEV_URL || '';

let bridgeProc = null;
let win = null;

function startBridge() {
  const py = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  console.log(`[mc] starting Hermes bridge: ${py} hermes-bridge.py (port ${BRIDGE_PORT})`);
  bridgeProc = spawn(py, ['hermes-bridge.py'], {
    cwd: ROOT,
    env: { ...process.env, BRIDGE_PORT },
    stdio: 'inherit',
  });
  bridgeProc.on('error', (e) => console.error('[mc] bridge failed to start:', e.message));
  bridgeProc.on('exit', (code) => console.log('[mc] bridge exited with code', code));
}

function waitForBridge(retries = 40) {
  return new Promise((resolve) => {
    const attempt = (n) => {
      const req = http.get(
        { host: '127.0.0.1', port: BRIDGE_PORT, path: '/api/hermes/status', timeout: 1000 },
        (res) => { res.resume(); resolve(true); },
      );
      req.on('error', () => (n <= 0 ? resolve(false) : setTimeout(() => attempt(n - 1), 500)));
      req.on('timeout', () => { req.destroy(); n <= 0 ? resolve(false) : setTimeout(() => attempt(n - 1), 500); });
    };
    attempt(retries);
  });
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#050505',
    title: 'Mission Control · Hermes',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Allow microphone access (used by the chat voice-dictation feature). This is a
  // local-only desktop app, so auto-grant media permission rather than prompting.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media' || permission === 'microphone');
  });

  // Open external links in the system browser, not inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_URL) {
    await win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await win.loadFile(path.join(ROOT, 'dist', 'index.html'));
  }
}

// Single-instance lock so we never run two bridges at once.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    startBridge();
    await waitForBridge();
    await createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

function shutdown() {
  if (bridgeProc && !bridgeProc.killed) {
    try { bridgeProc.kill(); } catch { /* already gone */ }
    bridgeProc = null;
  }
}

app.on('window-all-closed', () => {
  shutdown();
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', shutdown);
process.on('exit', shutdown);
