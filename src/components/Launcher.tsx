import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/shell";
import backgroundImage from "../assets/background.png";

interface DownloadProgress {
  stage: string;
  message: string;
  percent: number;
}

interface LauncherProps {
  isCheckingUpdates: boolean;
  isUpdatingClient: boolean;
  clientUpToDate: boolean;
  downloadProgress: DownloadProgress;
  errorMessage: string;
}

// Social media links
const DISCORD_URL = "https://discord.gg/qwaqFUFYRj"; // Substitua com seu link do Discord
const WHATSAPP_URL = "https://chat.whatsapp.com/FcYKv24HyOg87EV5pmEhWL"; // Substitua com seu link do WhatsApp

export default function Launcher({
  isCheckingUpdates,
  isUpdatingClient,
  clientUpToDate,
  downloadProgress,
  errorMessage,
}: LauncherProps) {
  const [isLaunching, setIsLaunching] = useState(false);

  async function handleLaunch() {
    setIsLaunching(true);
    try {
      await invoke("launch_client");
    } catch (error) {
      console.error("Failed to launch client:", error);
      alert("Failed to launch client. Please try again.");
    } finally {
      setIsLaunching(false);
    }
  }

  async function handleDiscordClick() {
    try {
      await open(DISCORD_URL);
    } catch (error) {
      console.error("Failed to open Discord link:", error);
    }
  }

  async function handleWhatsAppClick() {
    try {
      await open(WHATSAPP_URL);
    } catch (error) {
      console.error("Failed to open WhatsApp link:", error);
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full p-8 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Overlay escuro para melhor legibilidade */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            KoliseuOT
          </h1>
          <p className="text-xl text-gray-300">Game Launcher</p>
        </div>

        {/* Main Card */}
        <div className="bg-secondary/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-accent/30">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-900/30 rounded-lg border border-red-500/50">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-200">Erro na atualização</p>
                  <p className="text-xs text-red-300 mt-1 whitespace-pre-line">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Info */}
          {(isCheckingUpdates || isUpdatingClient) && (
            <div className="mb-6 p-4 bg-accent/30 rounded-lg border border-accent/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-highlight"></div>
                    <p className="text-sm font-medium text-gray-200">
                      {isCheckingUpdates ? "Verificando versão do cliente..." : downloadProgress.message || "Atualizando cliente..."}
                    </p>
                  </div>
                  {isUpdatingClient && downloadProgress.percent > 0 && (
                    <span className="text-sm font-bold text-highlight">{downloadProgress.percent}%</span>
                  )}
                </div>
                {isUpdatingClient && downloadProgress.percent > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-highlight to-pink-600 h-full transition-all duration-300"
                      style={{ width: `${downloadProgress.percent}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={handleLaunch}
            disabled={isLaunching || isCheckingUpdates || isUpdatingClient || !clientUpToDate}
            className="w-full py-4 bg-gradient-to-r from-[#D4BC8F] to-[#B8A06B] hover:from-[#C8B17D] hover:to-[#A89359] text-[#5C4B3D] font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isLaunching ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#5C4B3D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Launching...
              </span>
            ) : (
              "🎮 PLAY NOW"
            )}
          </button>
        </div>

        {/* Social Media Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={handleDiscordClick}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Discord
          </button>

          <button
            onClick={handleWhatsAppClick}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-300 text-sm">
          <p>KoliseuOT © 2025 - Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
