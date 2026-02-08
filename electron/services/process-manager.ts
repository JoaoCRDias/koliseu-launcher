import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { getClientDir } from './updater';
import kill from 'tree-kill';

// Client executable name
const CLIENT_PROCESS_NAME = 'client.exe';

/**
 * Check if a process is running by name (Windows-compatible)
 */
export async function isProcessRunning(processName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const normalizedName = processName.toLowerCase().endsWith('.exe')
      ? processName
      : `${processName}.exe`;

    if (process.platform === 'win32') {
      exec(`tasklist /FI "IMAGENAME eq ${normalizedName}" /NH`, (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }
        // If process is running, stdout will contain the process name
        resolve(stdout.toLowerCase().includes(normalizedName.toLowerCase()));
      });
    } else {
      exec(`pgrep -f ${processName}`, (error) => {
        resolve(!error);
      });
    }
  });
}

/**
 * Check if the game client is running
 */
export async function isClientRunning(): Promise<boolean> {
  return isProcessRunning(CLIENT_PROCESS_NAME);
}

/**
 * Kill the game client process if running
 * Returns true if killed, false if wasn't running
 */
export async function killClientProcess(): Promise<boolean> {
  const isRunning = await isClientRunning();
  if (!isRunning) {
    return false;
  }

  try {
    await killProcessByName(CLIENT_PROCESS_NAME);
    // Wait a bit for the process to fully terminate
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill process by name (Windows-compatible)
 */
export async function killProcessByName(processName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // Normalize process name
    const normalizedName = processName.toLowerCase().endsWith('.exe')
      ? processName
      : `${processName}.exe`;

    if (process.platform === 'win32') {
      // Windows: use taskkill
      exec(`taskkill /F /IM ${normalizedName}`, (error, stdout, stderr) => {
        if (error) {
          // If error is "not found", that's fine - process wasn't running
          if (stderr.includes('not found') || stderr.includes('n�o foi encontrado')) {
            console.log(`No process found with name: ${normalizedName}`);
            reject(new Error(`No process found with name: ${processName}`));
          } else {
            console.error(`Failed to kill process: ${stderr}`);
            reject(new Error(`Failed to kill process: ${stderr}`));
          }
        } else {
          console.log(`Process ${normalizedName} killed successfully`);
          console.log(stdout);
          resolve(1); // Return count of 1 for successful kill
        }
      });
    } else {
      // Linux/Mac: use pkill
      exec(`pkill -f ${processName}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`No process found with name: ${processName}`);
          reject(new Error(`No process found with name: ${processName}`));
        } else {
          console.log(`Process ${processName} killed successfully`);
          resolve(1);
        }
      });
    }
  });
}

/**
 * Launch the client executable
 */
export async function launchClient(): Promise<void> {
  const clientDir = getClientDir();
  const clientExe = path.join(clientDir, 'bin', 'client.exe');

  if (!(await fs.pathExists(clientExe))) {
    throw new Error('Client executable not found. Please update the client first.');
  }

  console.log(`Launching client: ${clientExe}`);

  // Launch the client
  const child = spawn(clientExe, [], {
    cwd: clientDir,
    detached: true,
    stdio: 'ignore',
  });

  // Detach from parent process
  child.unref();

  console.log(`Client launched successfully with PID: ${child.pid}`);
}
