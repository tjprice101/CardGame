import { app, BrowserWindow, ipcMain } from 'electron';
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

ipcMain.on('heavenly-save:read', (event) => {
  event.returnValue = readSaveFile();
});

ipcMain.on('heavenly-save:write', (event, payload) => {
  event.returnValue = writeSaveFile(String(payload ?? ''));
});

ipcMain.on('heavenly-save:remove', (event) => {
  event.returnValue = removeSaveFile();
});

async function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.mjs');
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 760,
    backgroundColor: '#120d0b',
    title: 'Heavenly Retribution',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    await window.loadURL('http://localhost:5173');
    window.webContents.openDevTools({ mode: 'detach' });
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