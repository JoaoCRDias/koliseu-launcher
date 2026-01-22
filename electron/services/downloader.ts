import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import extract from 'extract-zip';
import { BrowserWindow } from 'electron';
import { getClientDir } from './updater';
import { DownloadProgress, FileChecksums } from '../types';

// Folders that should never be replaced when updating (user data, configs, etc.)
const KEPT_FOLDERS = ['characterdata', 'conf', 'minimap', 'screenshots'];

/**
 * Calculate SHA256 checksum of a file
 */
export async function calculateFileChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Recursively collect files for checksumming (skip version.txt and checksums.json)
 */
async function collectFilesForChecksum(
  dir: string,
  basePath: string,
  files: Record<string, string>
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    // Skip version.txt and checksums.json
    if (relativePath === 'version.txt' || relativePath === 'checksums.json') {
      continue;
    }

    if (entry.isDirectory()) {
      await collectFilesForChecksum(fullPath, basePath, files);
    } else {
      const checksum = await calculateFileChecksum(fullPath);
      files[relativePath.replace(/\\/g, '/')] = checksum;
    }
  }
}

/**
 * Remove all entries in the client directory except the kept folders
 */
async function removeNonKeptEntries(clientDir: string): Promise<void> {
  if (!(await fs.pathExists(clientDir))) {
    return;
  }

  const entries = await fs.readdir(clientDir);
  for (const entry of entries) {
    if (KEPT_FOLDERS.includes(entry)) {
      continue;
    }

    await fs.remove(path.join(clientDir, entry));
  }
}

/**
 * Copy extracted files into the client directory while preserving kept folders
 */
async function copyExtractedFiles(sourceDir: string, targetDir: string): Promise<void> {
  const entries = await fs.readdir(sourceDir);

  for (const entry of entries) {
    if (KEPT_FOLDERS.includes(entry)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry);
    const destinationPath = path.join(targetDir, entry);
    await fs.copy(sourcePath, destinationPath, { overwrite: true });
  }
}

/**
 * Generate checksums.json for all files in client directory
 */
export async function generateChecksums(clientDir: string, version: string): Promise<FileChecksums> {
  const files: Record<string, string> = {};

  if (await fs.pathExists(clientDir)) {
    await collectFilesForChecksum(clientDir, clientDir, files);
  }

  return {
    version,
    files,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Send progress update to renderer
 */
function sendProgress(mainWindow: BrowserWindow | null, progress: DownloadProgress): void {
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progress);
  }
}

/**
 * Download and install client update
 */
export async function downloadClientUpdate(
  downloadUrl: string,
  version: string,
  mainWindow: BrowserWindow | null
): Promise<void> {
  const clientDir = getClientDir();

  // Create client directory if it doesn't exist
  await fs.ensureDir(clientDir);

  // Clean up any partial downloads from previous failed attempts
  const zipPath = path.join(clientDir, 'client.zip');
  if (await fs.pathExists(zipPath)) {
    console.log('Removing old partial download...');
    await fs.remove(zipPath);
  }

  // Emit progress: Starting download
  sendProgress(mainWindow, {
    stage: 'downloading',
    message: 'Baixando o cliente...',
    percent: 0,
  });

  try {
    // Download the client zip file
    const response = await axios.get(downloadUrl, {
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          const downloadedMB = (progressEvent.loaded / 1_048_576).toFixed(1);
          const totalMB = (progressEvent.total / 1_048_576).toFixed(1);

          sendProgress(mainWindow, {
            stage: 'downloading',
            message: `Baixando o cliente... ${downloadedMB} MB / ${totalMB} MB`,
            percent,
          });
        }
      },
    });

    // Emit progress: Saving file
    sendProgress(mainWindow, {
      stage: 'saving',
      message: 'Salvando arquivos...',
      percent: 100,
    });

    // Save zip file
    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Verify file was written
    const stats = await fs.stat(zipPath);
    if (stats.size === 0) {
      throw new Error('Saved zip file is empty');
    }

    console.log(`ZIP file saved successfully: ${stats.size} bytes`);

    const tempExtractDir = await fs.mkdtemp(path.join(os.tmpdir(), 'koliseu-client-'));

    try {
      // Emit progress: Extracting
      sendProgress(mainWindow, {
        stage: 'extracting',
        message: 'Extraindo...',
        percent: 0,
      });

      // Extract zip file with selective replacement
      await extract(zipPath, {
        dir: tempExtractDir,
        onEntry: (entry, zipfile) => {
          const totalEntries = zipfile.entryCount;
          const currentIndex = zipfile.entriesRead;
          const percent = Math.round((currentIndex / totalEntries) * 100);

          sendProgress(mainWindow, {
            stage: 'extracting',
            message: `Extraindo... ${currentIndex} / ${totalEntries}`,
            percent,
          });
        },
      });

      sendProgress(mainWindow, {
        stage: 'extracting',
        message: 'Removendo arquivos antigos...',
        percent: 90,
      });
      await removeNonKeptEntries(clientDir);

      sendProgress(mainWindow, {
        stage: 'extracting',
        message: 'Aplicando nova versão...',
        percent: 95,
      });
      await copyExtractedFiles(tempExtractDir, clientDir);
    } finally {
      await fs.remove(tempExtractDir);
    }

    // Clean up zip file
    if (await fs.pathExists(zipPath)) {
      await fs.remove(zipPath);
    }

    // Emit progress: Finalizing
    sendProgress(mainWindow, {
      stage: 'finalizing',
      message: 'Finalizando instalação...',
      percent: 100,
    });

    // Update version file
    const versionFile = path.join(clientDir, 'version.txt');
    await fs.writeFile(versionFile, version);

    // Generate checksums for integrity checking
    sendProgress(mainWindow, {
      stage: 'finalizing',
      message: 'Gerando checksums para verificação de integridade...',
      percent: 95,
    });

    const checksums = await generateChecksums(clientDir, version);
    const checksumsPath = path.join(clientDir, 'checksums.json');
    await fs.writeJson(checksumsPath, checksums, { spaces: 2 });

    console.log(`Generated ${Object.keys(checksums.files).length} file checksums`);

    // Emit progress: Complete
    sendProgress(mainWindow, {
      stage: 'complete',
      message: 'Atualização completa!',
      percent: 100,
    });
  } catch (error) {
    console.error('Failed to download/extract client:', error);
    // Clean up on error
    if (await fs.pathExists(zipPath)) {
      await fs.remove(zipPath);
    }
    throw error;
  }
}

/**
 * Download specific corrupted files (selective update)
 */
export async function downloadCorruptedFiles(
  downloadUrl: string,
  corruptedFiles: string[],
  mainWindow: BrowserWindow | null
): Promise<void> {
  const clientDir = getClientDir();

  if (corruptedFiles.length === 0) {
    return;
  }

  // Emit progress: Starting download
  sendProgress(mainWindow, {
    stage: 'downloading',
    message: `Baixando ${corruptedFiles.length} arquivos corrompidos...`,
    percent: 0,
  });

  // For simplicity, we'll re-download the full client and extract only corrupted files
  // A more advanced implementation would use a server API to download individual files

  const tempZipPath = path.join(clientDir, 'temp-repair.zip');

  try {
    // Download the full client zip
    const response = await axios.get(downloadUrl, {
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          const downloadedMB = (progressEvent.loaded / 1_048_576).toFixed(1);
          const totalMB = (progressEvent.total / 1_048_576).toFixed(1);

          sendProgress(mainWindow, {
            stage: 'downloading',
            message: `Baixando... ${downloadedMB} MB / ${totalMB} MB`,
            percent,
          });
        }
      },
    });

    // Save zip file
    const writer = fs.createWriteStream(tempZipPath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Emit progress: Extracting
    sendProgress(mainWindow, {
      stage: 'extracting',
      message: 'Extraindo arquivos corrompidos...',
      percent: 0,
    });

    // Extract only corrupted files
    // Note: extract-zip extracts all files, so we'll extract to temp dir and copy
    const tempExtractDir = path.join(clientDir, 'temp-extract');
    await fs.ensureDir(tempExtractDir);

    await extract(tempZipPath, { dir: tempExtractDir });

    // Copy only the corrupted files
    let extractedCount = 0;
    for (const relativePath of corruptedFiles) {
      const sourcePath = path.join(tempExtractDir, relativePath);
      const destPath = path.join(clientDir, relativePath);

      if (await fs.pathExists(sourcePath)) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath, { overwrite: true });
        console.log(`Extracted corrupted file: ${relativePath}`);
        extractedCount++;

        sendProgress(mainWindow, {
          stage: 'extracting',
          message: `Extraindo... ${extractedCount} / ${corruptedFiles.length}`,
          percent: Math.round((extractedCount / corruptedFiles.length) * 100),
        });
      }
    }

    // Clean up temp files
    await fs.remove(tempZipPath);
    await fs.remove(tempExtractDir);

    // Emit progress: Complete
    sendProgress(mainWindow, {
      stage: 'complete',
      message: 'Arquivos corrompidos reparados!',
      percent: 100,
    });
  } catch (error) {
    console.error('Failed to repair corrupted files:', error);
    // Clean up on error
    if (await fs.pathExists(tempZipPath)) {
      await fs.remove(tempZipPath);
    }
    throw error;
  }
}
