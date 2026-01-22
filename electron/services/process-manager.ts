import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { getClientDir } from './updater';
import kill from 'tree-kill';

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
