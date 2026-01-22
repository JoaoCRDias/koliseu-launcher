import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';
import { UpdateInfo, ClientVersionInfo } from '../types';
import { CONFIG } from '../config';

/**
 * Get the client installation directory
 */
export function getClientDir(): string {
  const appDataPath = app.getPath('userData');
  return path.join(appDataPath, 'client');
}

/**
 * Get the current installed client version
 */
export async function getCurrentClientVersion(): Promise<string> {
  try {
    const clientDir = getClientDir();
    const versionFile = path.join(clientDir, 'version.txt');
    console.log('[DEBUG] Reading version file at:', versionFile);
    if (await fs.pathExists(versionFile)) {
      const version = await fs.readFile(versionFile, 'utf-8');
      return version.trim();
    }

    return '0.0.0';
  } catch (error) {
    console.error('Error reading version file:', error);
    return '0.0.0';
  }
}

/**
 * Check for client updates from the server
 */
export async function checkClientUpdate(): Promise<UpdateInfo> {
  console.log('[DEBUG] Checking for client updates...');

  try {
    const currentVersion = await getCurrentClientVersion();
    console.log('[DEBUG] Current version:', currentVersion);

    // Fetch latest version info from server
    console.log('[DEBUG] Fetching latest version from server...');
    const response = await axios.get<ClientVersionInfo>(`${CONFIG.API_BASE_URL}/client/version`);
    const versionInfo = response.data;

    console.log('[DEBUG] Server version info:', versionInfo);

    const available = versionInfo.version !== currentVersion;
    console.log('[DEBUG] Update available:', available);

    return {
      available,
      current_version: currentVersion,
      latest_version: available ? versionInfo.version : undefined,
      download_url: available ? versionInfo.download_url : undefined,
    };
  } catch (error) {
    console.error('[ERROR] Failed to check for updates:', error);
    throw new Error(`Failed to fetch version info: ${error}`);
  }
}
