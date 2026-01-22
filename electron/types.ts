export interface UpdateInfo {
  available: boolean;
  current_version: string;
  latest_version?: string;
  download_url?: string;
}

export interface ClientVersionInfo {
  version: string;
  download_url: string;
}

export interface IntegrityCheckResult {
  is_valid: boolean;
  corrupted_files: string[];
  missing_files: string[];
}

export interface FileChecksums {
  version: string;
  files: Record<string, string>; // path -> sha256
  generated_at: string;
}

export interface DownloadProgress {
  stage: 'downloading' | 'saving' | 'extracting' | 'finalizing' | 'complete' | 'retrying';
  message: string;
  percent: number;
}

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
