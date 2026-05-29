const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isDev = Boolean(process.env.ELECTRON_START_URL);

let mainWindow = null;
let backendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

function resolveBackendPaths() {
  const devBackendDir = path.join(__dirname, '../../Backend');
  const packagedBackendDir = path.join(process.resourcesPath, 'Backend');

  if (!isDev && fs.existsSync(path.join(packagedBackendDir, 'src/index.js'))) {
    return {
      entry: path.join(packagedBackendDir, 'src/index.js'),
      cwd: packagedBackendDir,
    };
  }

  return {
    entry: path.join(devBackendDir, 'src/index.js'),
    cwd: devBackendDir,
  };
}

function startBackend() {
  if (isDev) return;

  const { entry, cwd } = resolveBackendPaths();

  if (!fs.existsSync(entry)) {
    console.error('[backend] Backend entry not found:', entry);
    return;
  }

  backendProcess = spawn('node', [entry], {
    cwd,
    env: process.env,
  });

  backendProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });

  backendProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[backend] process exited with code ${code}`);
    backendProcess = null;
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function getDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.from(data);
  if (data?.type === 'Buffer' && Array.isArray(data.data)) {
    return Buffer.from(data.data);
  }
  if (data?.data) return Buffer.from(data.data);
  return Buffer.from(data);
}

ipcMain.handle('save-excel', async (_event, buffer) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `SSCO_Expenses_${getDateStamp()}.xlsx`,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  await fs.promises.writeFile(filePath, toBuffer(buffer));
  return { success: true, path: filePath };
});

ipcMain.handle('save-pdf', async (_event, buffer) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `SSCO_Report_${getDateStamp()}.pdf`,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  await fs.promises.writeFile(filePath, toBuffer(buffer));
  return { success: true, path: filePath };
});

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackend();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopBackend();
});
