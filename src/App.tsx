import React, { useState, useEffect, useCallback } from "react";
import Launcher from "./components/Launcher";

// Access Electron API from window object
const { electronAPI } = window as any;

interface UpdateInfo {
  available: boolean;
  current_version: string;
  latest_version?: string;
  download_url?: string;
}

interface DownloadProgress {
  stage: string;
  message: string;
  percent: number;
}

interface LauncherUpdateStatus {
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

function App() {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [isRepairingClient, setIsRepairingClient] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    stage: "",
    message: "",
    percent: 0
  });
  const [corruptedFiles, setCorruptedFiles] = useState<string[]>([]);
  const checkingRef = React.useRef(false);

  // Launcher auto-update state
  const [launcherVersion, setLauncherVersion] = useState<string>("");
  const [launcherUpdate, setLauncherUpdate] = useState<LauncherUpdateStatus | null>(null);

  useEffect(() => {
    // Prevent double execution in React strict mode
    if (!checkingRef.current) {
      checkingRef.current = true;
      checkForUpdates();
      // Get launcher version
      electronAPI.getLauncherVersion?.().then((version: string) => {
        setLauncherVersion(version);
      }).catch(() => {
        // Ignore errors in dev mode
      });
    }

    // Listen for download progress events
    const unsubscribe = electronAPI.onDownloadProgress((progress: DownloadProgress) => {
      setDownloadProgress(progress);
    });

    // Listen for launcher update status events
    const unsubscribeLauncher = electronAPI.onLauncherUpdateStatus?.((status: LauncherUpdateStatus) => {
      setLauncherUpdate(status);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeLauncher) unsubscribeLauncher();
    };
  }, []);

  async function checkForUpdates() {
    setIsCheckingUpdates(true);
    setErrorMessage("");

    try {
      const clientUpdateInfo = await electronAPI.checkClientUpdate();
      setUpdateInfo(clientUpdateInfo);

      if (clientUpdateInfo.available) {
        // Client needs update or doesn't exist
        setNeedsUpdate(true);
        setClientReady(false);
      } else {
        // Client is up to date
        setNeedsUpdate(false);
        setClientReady(true);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      setErrorMessage(`Erro ao verificar atualizações: ${error}`);
      // Allow playing if we can't check (offline mode)
      setClientReady(true);
      setNeedsUpdate(false);
    } finally {
      setIsCheckingUpdates(false);
    }
  }

  const handleDownloadClient = useCallback(async () => {
    if (!updateInfo?.download_url || !updateInfo?.latest_version) {
      setErrorMessage("Informações de download não disponíveis. Tente novamente.");
      return;
    }

    setIsDownloading(true);
    setErrorMessage("");

    const MAX_RETRIES = 3;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        const params = {
          download_url: updateInfo.download_url,
          version: updateInfo.latest_version,
        };

        await electronAPI.downloadClientUpdate(params);

        // Success
        setClientReady(true);
        setNeedsUpdate(false);
        setDownloadProgress({ stage: "", message: "", percent: 0 });
        setIsDownloading(false);
        return;

      } catch (error) {
        console.error(`Failed to update client (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
        retryCount++;

        if (retryCount < MAX_RETRIES) {
          setDownloadProgress({
            stage: "retrying",
            message: `Erro no download. Tentando novamente... (${retryCount + 1}/${MAX_RETRIES})`,
            percent: 0
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          const errorMsg = typeof error === 'string' ? error : 'Falha ao baixar o cliente após 3 tentativas.';
          setErrorMessage(`${errorMsg}\n\nPor favor, verifique sua conexão e tente novamente.`);
          setDownloadProgress({ stage: "", message: "", percent: 0 });
        }
      }
    }

    setIsDownloading(false);
  }, [updateInfo]);

  const handleCheckIntegrity = useCallback(async () => {
    if (isDownloading || isCheckingIntegrity || isRepairingClient) return;

    setIsCheckingIntegrity(true);
    setErrorMessage("");
    setCorruptedFiles([]);

    try {
      const result = await electronAPI.checkIntegrity();

      if (!result.is_valid) {
        const allCorrupted = [...result.corrupted_files, ...result.missing_files];
        setCorruptedFiles(allCorrupted);

        if (allCorrupted.length > 0) {
          // Fetch update info to get download URL for repair
          const clientUpdateInfo = await electronAPI.checkClientUpdate();

          if (clientUpdateInfo.download_url) {
            await handleClientRepair(clientUpdateInfo.download_url, allCorrupted);
          } else {
            setErrorMessage(
              `${allCorrupted.length} arquivo(s) corrompido(s) detectado(s). ` +
              `Por favor, baixe o cliente novamente.`
            );
          }
        }
      } else {
        // All files are valid - could show a success message briefly
        setDownloadProgress({
          stage: "success",
          message: "Todos os arquivos estão íntegros!",
          percent: 100
        });
        setTimeout(() => {
          setDownloadProgress({ stage: "", message: "", percent: 0 });
        }, 2000);
      }
    } catch (error) {
      console.warn("Integrity check failed:", error);
      setErrorMessage("Falha ao verificar integridade. O cliente pode não estar instalado.");
    } finally {
      setIsCheckingIntegrity(false);
    }
  }, [isDownloading, isCheckingIntegrity, isRepairingClient]);

  async function handleClientRepair(downloadUrl: string, filesToRepair: string[]) {
    setIsRepairingClient(true);

    try {
      const params = {
        download_url: downloadUrl,
        corrupted_files: filesToRepair,
      };

      await electronAPI.downloadCorruptedFiles(params);

      // Clear corrupted files list after repair
      setCorruptedFiles([]);
      setDownloadProgress({ stage: "", message: "", percent: 0 });
    } catch (error) {
      console.error("Failed to repair client:", error);
      setErrorMessage(`Falha ao reparar arquivos corrompidos: ${error}`);
    } finally {
      setIsRepairingClient(false);
    }
  }

  // Launcher update handlers
  const handleDownloadLauncherUpdate = useCallback(async () => {
    try {
      await electronAPI.downloadLauncherUpdate?.();
    } catch (error) {
      console.error("Failed to download launcher update:", error);
    }
  }, []);

  const handleInstallLauncherUpdate = useCallback(() => {
    electronAPI.installLauncherUpdate?.();
  }, []);

  return (
    <div className="w-full h-full">
      <Launcher
        isCheckingUpdates={isCheckingUpdates}
        isDownloading={isDownloading}
        isCheckingIntegrity={isCheckingIntegrity}
        isRepairingClient={isRepairingClient}
        needsUpdate={needsUpdate}
        clientReady={clientReady}
        downloadProgress={downloadProgress}
        errorMessage={errorMessage}
        corruptedFiles={corruptedFiles}
        onDownloadClient={handleDownloadClient}
        onCheckIntegrity={handleCheckIntegrity}
        launcherVersion={launcherVersion}
        launcherUpdate={launcherUpdate}
        onDownloadLauncherUpdate={handleDownloadLauncherUpdate}
        onInstallLauncherUpdate={handleInstallLauncherUpdate}
      />
    </div>
  );
}

export default App;
