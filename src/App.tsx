import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import Launcher from "./components/Launcher";

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

function App() {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const [clientUpToDate, setClientUpToDate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    stage: "",
    message: "",
    percent: 0
  });
  const checkingRef = React.useRef(false);

  useEffect(() => {
    // Prevent double execution in React strict mode
    if (!checkingRef.current) {
      checkingRef.current = true;
      checkForUpdates();
    }

    // Listen for download progress events
    const unlisten = listen<DownloadProgress>(
      "download-progress",
      (event) => {
        setDownloadProgress(event.payload);
      }
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function checkForUpdates() {
    if (isCheckingUpdates) {
      return;
    }

    setIsCheckingUpdates(true);

    try {
      // Check client update
      const clientUpdateInfo = await invoke<UpdateInfo>("check_client_update");

      if (clientUpdateInfo.available) {
        setIsCheckingUpdates(false);
        setClientUpToDate(false);
        // Automatically download and install client update
        await handleClientUpdate(clientUpdateInfo);
      } else {
        setIsCheckingUpdates(false);
        setClientUpToDate(true);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      setErrorMessage(`Erro ao verificar atualizações: ${error}`);
      setIsCheckingUpdates(false);
      // Allow playing even if update check fails
      setClientUpToDate(true);
    }
  }

  async function handleClientUpdate(updateInfo: UpdateInfo, retryCount: number = 0) {
    const MAX_RETRIES = 3;
    setIsUpdatingClient(true);
    setErrorMessage("");

    try {
      const params = {
        download_url: updateInfo.download_url,
        version: updateInfo.latest_version,
      };

      await invoke("download_client_update", params);

      // Success
      setClientUpToDate(true);
      setDownloadProgress({ stage: "", message: "", percent: 0 });

    } catch (error) {
      console.error(`Failed to update client (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

      // Check if we should retry
      if (retryCount < MAX_RETRIES - 1) {
        setDownloadProgress({
          stage: "retrying",
          message: `Erro no download. Tentando novamente... (${retryCount + 2}/${MAX_RETRIES})`,
          percent: 0
        });

        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Retry
        return handleClientUpdate(updateInfo, retryCount + 1);
      } else {
        // Max retries reached
        const errorMsg = typeof error === 'string' ? error : 'Falha ao atualizar o cliente após 3 tentativas.';
        setErrorMessage(`${errorMsg}\n\nPor favor, verifique sua conexão e tente novamente mais tarde.`);
        // Allow playing even if update fails
        setClientUpToDate(true);
        setDownloadProgress({ stage: "", message: "", percent: 0 });
      }
    } finally {
      if (retryCount === 0 || retryCount >= MAX_RETRIES - 1) {
        setIsUpdatingClient(false);
      }
    }
  }

  return (
    <div className="w-full h-full">
      <Launcher
        isCheckingUpdates={isCheckingUpdates}
        isUpdatingClient={isUpdatingClient}
        clientUpToDate={clientUpToDate}
        downloadProgress={downloadProgress}
        errorMessage={errorMessage}
      />
    </div>
  );
}

export default App;
