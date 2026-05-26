import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isDev = !app.isPackaged;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const saveFileName = 'save-data.json';

function getSaveFilePath() {
  return path.join(app.getPath('userData'), saveFileName);
}

function readSaveFile() {
  try {
    return fs.readFileSync(getSaveFilePath(), 'utf8');
  } catch {
    return null;
  }
}

function writeSaveFile(payload) {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(getSaveFilePath(), payload, 'utf8');
    return true;
  } catch {
    return false;
  }
}

function removeSaveFile() {
  try {
    fs.rmSync(getSaveFilePath(), { force: true });
    return true;
  } catch {
    return false;
  }
}

ipcMain.on('pantheon-save:read', (event) => {
  event.returnValue = readSaveFile();
});

ipcMain.on('pantheon-save:write', (event, payload) => {
  event.returnValue = writeSaveFile(String(payload ?? ''));
});

ipcMain.on('pantheon-save:remove', (event) => {
  event.returnValue = removeSaveFile();
});

// ── Desktop notifications (Phase 6 social) ─────────────────────────────────
// Renderer asks the main process to display an OS notification when a new DM,
// gift, or friend request arrives while the window is unfocused. The window
// reference is captured by createWindow() so we can also flash the taskbar.

let mainWindowRef = null;

ipcMain.on('pantheon-notify:is-focused', (event) => {
  event.returnValue = mainWindowRef?.isFocused() === true;
});

ipcMain.handle('pantheon-notify:show', (_event, payload) => {
  try {
    if (!Notification.isSupported()) return false;
    const title = String(payload?.title ?? 'Pantheon').slice(0, 120);
    const body = String(payload?.body ?? '').slice(0, 400);
    const silent = Boolean(payload?.silent);
    const notification = new Notification({ title, body, silent });
    notification.on('click', () => {
      if (mainWindowRef) {
        if (mainWindowRef.isMinimized()) mainWindowRef.restore();
        mainWindowRef.show();
        mainWindowRef.focus();
      }
    });
    notification.show();
    if (mainWindowRef && !mainWindowRef.isFocused()) {
      try { mainWindowRef.flashFrame(true); } catch { /* non-fatal */ }
    }
    return true;
  } catch {
    return false;
  }
});

async function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.mjs');
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 760,
    backgroundColor: '#120d0b',
    title: 'Pantheon',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindowRef = window;
  window.on('focus', () => {
    try { window.flashFrame(false); } catch { /* non-fatal */ }
  });
  window.on('closed', () => {
    if (mainWindowRef === window) mainWindowRef = null;
  });

  if (isDev) {
    await window.loadURL('http://localhost:5173');
    // DevTools is no longer opened automatically. Press F12 or Ctrl+Shift+I to toggle.
    return;
  }

  await window.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
}

app.whenReady().then(() => {
  void createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});