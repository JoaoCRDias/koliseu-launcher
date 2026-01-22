import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { checkClientUpdate } from './services/updater';
import { downloadClientUpdate, downloadCorruptedFiles } from './services/downloader';
import { checkIntegrity } from './services/integrity';
import { launchClient, killProcessByName } from './services/process-manager';
import {
  initAutoUpdater,
  checkForLauncherUpdate,
  downloadLauncherUpdate,
  installLauncherUpdate,
  getAppVersion
} from './services/auto-updater';

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'KoliseuOT Launcher',
    autoHideMenuBar: true,
    resizable: true,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // Development mode: load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Setup IPC handlers for communication with renderer process
 */
function setupIpcHandlers(): void {
  // Check for client updates
  ipcMain.handle('check-client-update', async () => {
    try {
      return await checkClientUpdate();
    } catch (error) {
      console.error('Error checking client update:', error);
      throw error;
    }
  });

  // Download client update
  ipcMain.handle('download-client-update', async (_event, args: { download_url: string; version: string }) => {
    try {
      await downloadClientUpdate(args.download_url, args.version, mainWindow);
    } catch (error) {
      console.error('Error downloading client update:', error);
      throw error;
    }
  });

  // Check integrity
  ipcMain.handle('check-integrity', async () => {
    try {
      return await checkIntegrity();
    } catch (error) {
      console.error('Error checking integrity:', error);
      throw error;
    }
  });

  // Download corrupted files
  ipcMain.handle('download-corrupted-files', async (_event, args: { download_url: string; corrupted_files: string[] }) => {
    try {
      await downloadCorruptedFiles(args.download_url, args.corrupted_files, mainWindow);
    } catch (error) {
      console.error('Error downloading corrupted files:', error);
      throw error;
    }
  });

  // Launch client
  ipcMain.handle('launch-client', async () => {
    try {
      await launchClient();
    } catch (error) {
      console.error('Error launching client:', error);
      throw error;
    }
  });

  // Kill process by name
  ipcMain.handle('kill-process-by-name', async (_event, processName: string) => {
    try {
      return await killProcessByName(processName);
    } catch (error) {
      console.error('Error killing process:', error);
      throw error;
    }
  });

  // Open external URL
  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url);
    } catch (error) {
      console.error('Error opening external URL:', error);
      throw error;
    }
  });

  // ============================================
  // Launcher Auto-Update handlers
  // ============================================

  // Get launcher version
  ipcMain.handle('get-launcher-version', () => {
    return getAppVersion();
  });

  // Check for launcher updates
  ipcMain.handle('check-launcher-update', async () => {
    try {
      await checkForLauncherUpdate();
    } catch (error) {
      console.error('Error checking launcher update:', error);
      throw error;
    }
  });

  // Download launcher update
  ipcMain.handle('download-launcher-update', async () => {
    try {
      await downloadLauncherUpdate();
    } catch (error) {
      console.error('Error downloading launcher update:', error);
      throw error;
    }
  });

  // Install launcher update (quit and install)
  ipcMain.handle('install-launcher-update', () => {
    installLauncherUpdate();
  });
}

// App lifecycle events
app.whenReady().then(() => {
  console.log('Application starting...');

  setupIpcHandlers();
  createWindow();

  // Initialize auto-updater after window is created (only in production)
  if (app.isPackaged && mainWindow) {
    initAutoUpdater(mainWindow);
    // Check for launcher updates on startup
    checkForLauncherUpdate().catch(err => {
      console.error('Failed to check for launcher updates on startup:', err);
    });
  }

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
