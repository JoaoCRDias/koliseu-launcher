import { autoUpdater, UpdateInfo } from 'electron-updater';
import { BrowserWindow, app } from 'electron';

export interface LauncherUpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseNotes?: string;
  progress?: {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  };
  error?: string;
}

let mainWindow: BrowserWindow | null = null;

/**
 * Send update status to renderer process
 */
function sendStatusToRenderer(status: LauncherUpdateStatus): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('launcher-update-status', status);
  }
}

/**
 * Initialize the auto-updater
 */
export function initAutoUpdater(window: BrowserWindow): void {
  mainWindow = window;

  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // GitHub provider is configured in electron-builder.json
  // No need to manually set feed URL

  // Event: Checking for updates
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for launcher updates...');
    sendStatusToRenderer({ status: 'checking' });
  });

  // Event: Update available
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log('[AutoUpdater] Update available:', info.version);
    sendStatusToRenderer({
      status: 'available',
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
          ? info.releaseNotes.map(n => n.note).join('\n')
          : undefined,
    });
  });

  // Event: No update available
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log('[AutoUpdater] No update available. Current version:', info.version);
    sendStatusToRenderer({
      status: 'not-available',
      version: info.version,
    });
  });

  // Event: Download progress
  autoUpdater.on('download-progress', (progress) => {
    console.log(`[AutoUpdater] Download progress: ${progress.percent.toFixed(1)}%`);
    sendStatusToRenderer({
      status: 'downloading',
      progress: {
        percent: Math.round(progress.percent),
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      },
    });
  });

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    sendStatusToRenderer({
      status: 'downloaded',
      version: info.version,
    });
  });

  // Event: Error
  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] Error:', error.message);
    sendStatusToRenderer({
      status: 'error',
      error: error.message,
    });
  });
}

/**
 * Check for launcher updates
 */
export async function checkForLauncherUpdate(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('[AutoUpdater] Failed to check for updates:', error);
    throw error;
  }
}

/**
 * Download the available update
 */
export async function downloadLauncherUpdate(): Promise<void> {
  try {
    console.log('[AutoUpdater] Starting download...');
    // Send immediate feedback that download is starting
    sendStatusToRenderer({
      status: 'downloading',
      progress: {
        percent: 0,
        bytesPerSecond: 0,
        transferred: 0,
        total: 0,
      },
    });
    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error('[AutoUpdater] Failed to download update:', error);
    sendStatusToRenderer({
      status: 'error',
      error: error instanceof Error ? error.message : 'Falha ao baixar atualização',
    });
    throw error;
  }
}

/**
 * Install the update and restart the app
 * @param isSilent - If true, installs silently without showing installer UI (default: true)
 * @param isForceRunAfter - If true, forces app to run after install (default: true)
 */
export function installLauncherUpdate(isSilent: boolean = true, isForceRunAfter: boolean = true): void {
  // isSilent=true: Runs the installer in silent mode (no UI)
  // isForceRunAfter=true: Forces the app to restart after installation
  autoUpdater.quitAndInstall(isSilent, isForceRunAfter);
}

/**
 * Get current app version
 */
export function getAppVersion(): string {
  return app.getVersion();
}
