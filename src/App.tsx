import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";
import Launcher from "./components/Launcher";
import UpdateModal from "./components/UpdateModal";

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  downloadUrl?: string;
}

function App() {
  const [launcherUpdate, setLauncherUpdate] = useState<UpdateInfo | null>(null);
  const [clientUpdate, setClientUpdate] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(true);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);
  const [clientUpToDate, setClientUpToDate] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    setIsCheckingUpdates(true);

    try {
      // Check if running in Tauri environment
      if (typeof window.__TAURI_IPC__ === 'undefined') {
        console.warn("Not running in Tauri environment - skipping update checks");
        return;
      }

      // Check launcher update
      const update = await checkUpdate();
      if (update?.shouldUpdate) {
        setLauncherUpdate({
          available: true,
          currentVersion: update.manifest?.version || "unknown",
          latestVersion: update.manifest?.version,
        });
      }

      // Check client update
      const clientUpdateInfo = await invoke<UpdateInfo>("check_client_update");
      if (clientUpdateInfo.available) {
        setClientUpdate(clientUpdateInfo);
        setClientUpToDate(false);
        // Automatically download and install client update
        await handleClientUpdate(clientUpdateInfo);
      } else {
        setClientUpToDate(true);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      // Allow playing even if update check fails
      setClientUpToDate(true);
    } finally {
      setIsCheckingUpdates(false);
    }
  }

  async function handleLauncherUpdate() {
    try {
      await installUpdate();
      await relaunch();
    } catch (error) {
      console.error("Failed to update launcher:", error);
    }
  }

  async function handleClientUpdate(updateInfo?: UpdateInfo) {
    const updateToProcess = updateInfo || clientUpdate;
    if (!updateToProcess) return;

    setIsUpdatingClient(true);
    try {
      await invoke("download_client_update", {
        downloadUrl: updateToProcess.downloadUrl,
        version: updateToProcess.latestVersion,
      });
      setClientUpdate(null);
      setClientUpToDate(true);
    } catch (error) {
      console.error("Failed to update client:", error);
      // Allow playing even if update fails
      setClientUpToDate(true);
    } finally {
      setIsUpdatingClient(false);
    }
  }

  return (
    <div className="w-full h-full">
      {launcherUpdate?.available && (
        <UpdateModal
          type="launcher"
          currentVersion={launcherUpdate.currentVersion}
          latestVersion={launcherUpdate.latestVersion || ""}
          onUpdate={handleLauncherUpdate}
        />
      )}

      {clientUpdate?.available && !launcherUpdate?.available && (
        <UpdateModal
          type="client"
          currentVersion={clientUpdate.currentVersion}
          latestVersion={clientUpdate.latestVersion || ""}
          onUpdate={handleClientUpdate}
        />
      )}

      <Launcher
        isCheckingUpdates={isCheckingUpdates}
        isUpdatingClient={isUpdatingClient}
        clientUpToDate={clientUpToDate}
        onCheckUpdates={checkForUpdates}
      />
    </div>
  );
}

export default App;
