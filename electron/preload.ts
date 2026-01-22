import { contextBridge, ipcRenderer } from 'electron';
import { UpdateInfo, IntegrityCheckResult, DownloadProgress, LauncherUpdateStatus } from './types';

/**
 * Expose safe Electron APIs to the renderer process
 * This replaces @tauri-apps/api
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Update functions
  checkClientUpdate: (): Promise<UpdateInfo> =>
    ipcRenderer.invoke('check-client-update'),

  downloadClientUpdate: (args: { download_url: string; version: string }): Promise<void> =>
    ipcRenderer.invoke('download-client-update', args),

  // Integrity functions
  checkIntegrity: (): Promise<IntegrityCheckResult> =>
    ipcRenderer.invoke('check-integrity'),

  downloadCorruptedFiles: (args: { download_url: string; corrupted_files: string[] }): Promise<void> =>
    ipcRenderer.invoke('download-corrupted-files', args),

  // Process management functions
  launchClient: (): Promise<void> =>
    ipcRenderer.invoke('launch-client'),

  killProcessByName: (processName: string): Promise<number> =>
    ipcRenderer.invoke('kill-process-by-name', processName),

  // Shell functions (replaces @tauri-apps/api/shell)
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('open-external', url),

  // Event listeners
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const listener = (_event: any, progress: DownloadProgress) => callback(progress);
    ipcRenderer.on('download-progress', listener);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('download-progress', listener);
    };
  },

  // ============================================
  // Launcher Auto-Update functions
  // ============================================

  getLauncherVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-launcher-version'),

  checkLauncherUpdate: (): Promise<void> =>
    ipcRenderer.invoke('check-launcher-update'),

  downloadLauncherUpdate: (): Promise<void> =>
    ipcRenderer.invoke('download-launcher-update'),

  installLauncherUpdate: (): Promise<void> =>
    ipcRenderer.invoke('install-launcher-update'),

  onLauncherUpdateStatus: (callback: (status: LauncherUpdateStatus) => void) => {
    const listener = (_event: any, status: LauncherUpdateStatus) => callback(status);
    ipcRenderer.on('launcher-update-status', listener);

    return () => {
      ipcRenderer.removeListener('launcher-update-status', listener);
    };
  },
});

// Type definitions for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      checkClientUpdate: () => Promise<UpdateInfo>;
      downloadClientUpdate: (args: { download_url: string; version: string }) => Promise<void>;
      checkIntegrity: () => Promise<IntegrityCheckResult>;
      downloadCorruptedFiles: (args: { download_url: string; corrupted_files: string[] }) => Promise<void>;
      launchClient: () => Promise<void>;
      killProcessByName: (processName: string) => Promise<number>;
      openExternal: (url: string) => Promise<void>;
      onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
      // Launcher auto-update
      getLauncherVersion: () => Promise<string>;
      checkLauncherUpdate: () => Promise<void>;
      downloadLauncherUpdate: () => Promise<void>;
      installLauncherUpdate: () => Promise<void>;
      onLauncherUpdateStatus: (callback: (status: LauncherUpdateStatus) => void) => () => void;
    };
  }
}
