import * as fs from 'fs-extra';
import * as path from 'path';
import { getClientDir } from './updater';
import { calculateFileChecksum } from './downloader';
import { IntegrityCheckResult, FileChecksums } from '../types';

/**
 * Load checksums from file
 */
export async function loadChecksums(clientDir: string): Promise<FileChecksums> {
  const checksumsPath = path.join(clientDir, 'checksums.json');

  if (!(await fs.pathExists(checksumsPath))) {
    throw new Error('Checksums file not found');
  }

  const checksums = await fs.readJson(checksumsPath);
  return checksums;
}

/**
 * Check if file should be verified (only bin/ and assets/ folders)
 */
function shouldVerifyFile(relativePath: string): boolean {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return normalizedPath.startsWith('bin/') || normalizedPath.startsWith('assets/');
}

/**
 * Check a single file's integrity
 */
async function checkSingleFile(
  clientDir: string,
  relativePath: string,
  expectedChecksum: string
): Promise<{ relativePath: string; status: 'valid' | 'corrupted' | 'missing' }> {
  const filePath = path.join(clientDir, relativePath);

  if (!(await fs.pathExists(filePath))) {
    return { relativePath, status: 'missing' };
  }

  const actualChecksum = await calculateFileChecksum(filePath);
  if (actualChecksum !== expectedChecksum) {
    return { relativePath, status: 'corrupted' };
  }

  return { relativePath, status: 'valid' };
}

/**
 * Check integrity of client files in parallel for faster verification
 */
export async function checkFileIntegrity(clientDir: string): Promise<IntegrityCheckResult> {
  try {
    const checksums = await loadChecksums(clientDir);

    // Filter files that should be verified
    const filesToCheck = Object.entries(checksums.files).filter(([relativePath]) =>
      shouldVerifyFile(relativePath)
    );

    // Process files in parallel batches for better performance
    const BATCH_SIZE = 10;
    const corruptedFiles: string[] = [];
    const missingFiles: string[] = [];

    for (let i = 0; i < filesToCheck.length; i += BATCH_SIZE) {
      const batch = filesToCheck.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(([relativePath, expectedChecksum]) =>
          checkSingleFile(clientDir, relativePath, expectedChecksum as string)
        )
      );

      for (const result of results) {
        if (result.status === 'missing') {
          missingFiles.push(result.relativePath);
        } else if (result.status === 'corrupted') {
          corruptedFiles.push(result.relativePath);
        }
      }
    }

    const isValid = corruptedFiles.length === 0 && missingFiles.length === 0;

    return {
      is_valid: isValid,
      corrupted_files: corruptedFiles,
      missing_files: missingFiles,
    };
  } catch (error) {
    console.error('Error checking integrity:', error);
    throw error;
  }
}

/**
 * Check integrity of installed client files
 */
export async function checkIntegrity(): Promise<IntegrityCheckResult> {
  const clientDir = getClientDir();

  if (!(await fs.pathExists(clientDir))) {
    return {
      is_valid: false,
      corrupted_files: [],
      missing_files: [],
    };
  }

  return checkFileIntegrity(clientDir);
}
