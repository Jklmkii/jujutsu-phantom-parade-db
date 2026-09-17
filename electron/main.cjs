const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Configuracao do autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;
let splashWindow = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 320,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: true,
    backgroundColor: '#0a0614',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashPath = path.join(__dirname, 'splash.html');
  if (fs.existsSync(splashPath)) {
    splashWindow.loadFile(splashPath);
  }
}

function createWindow() {
  createSplashWindow();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'Jujutsu Kaisen: Phantom Parade DB (Offline)',
    backgroundColor: '#0a0614',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Sleek native look without standard top menu bar
  mainWindow.setMenuBarVisibility(false);

  // Load URL or built files
  const distPath = path.join(__dirname, '../dist/index.html');
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    // Fallback to local dev server
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.destroy();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
    }, 450);
  });

  // External links open in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
        shell.openExternal(parsedUrl.href);
      }
    } catch {
      // Ignored
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Backup & Restore
ipcMain.handle('dialog:saveFile', async (event, { defaultName, content, filters }) => {
  if (!mainWindow) return { success: false, error: 'No main window' };

  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName || 'jjk-backup.json',
      filters: filters || [{ name: 'JSON', extensions: ['json'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('dialog:openFile', async (event, { filters }) => {
  if (!mainWindow) return { success: false, error: 'No main window' };

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'JSON', extensions: ['json'] }],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { success: true, content, filePath: filePaths[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Auto-Updater status helper
function sendUpdateStatus(data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', data);
  }
}

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus({ status: 'checking', message: 'Buscando atualizações no GitHub...' });
});

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus({
    status: 'available',
    version: info.version,
    releaseDate: info.releaseDate,
    message: `Nova versão ${info.version} disponível! Baixando atualização...`,
  });
});

autoUpdater.on('update-not-available', () => {
  sendUpdateStatus({
    status: 'not-available',
    message: 'O JJKPPDB já está atualizado com a versão mais recente.',
  });
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus({
    status: 'downloading',
    percent: Math.floor(progress.percent),
    bytesPerSecond: progress.bytesPerSecond,
    transferred: progress.transferred,
    total: progress.total,
    message: `Baixando atualização: ${Math.floor(progress.percent)}%`,
  });
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus({
    status: 'downloaded',
    version: info.version,
    message: `Versão ${info.version} pronta! Reinicie para atualizar.`,
  });
});

autoUpdater.on('error', (err) => {
  sendUpdateStatus({
    status: 'error',
    message: err.message || 'Não foi possível verificar atualizações no momento.',
  });
});

ipcMain.handle('updater:check', async () => {
  if (isDev) {
    return { success: true, message: 'Atualizações desativadas em ambiente de desenvolvimento.' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});

app.whenReady().then(() => {
  createWindow();

  // Check for updates silently on startup after 3 seconds
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
