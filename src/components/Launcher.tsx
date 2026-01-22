import { useState } from "react";
import backgroundImage from "../assets/background.png";
import { CONFIG } from "../config";

// Access Electron API from window object
const { electronAPI } = window as any;

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

interface LauncherProps {
  isCheckingUpdates: boolean;
  isDownloading: boolean;
  isCheckingIntegrity: boolean;
  isRepairingClient: boolean;
  needsUpdate: boolean;
  clientReady: boolean;
  downloadProgress: DownloadProgress;
  errorMessage: string;
  corruptedFiles: string[];
  onDownloadClient: () => void;
  onCheckIntegrity: () => void;
  // Launcher update props
  launcherVersion: string;
  launcherUpdate: LauncherUpdateStatus | null;
  onDownloadLauncherUpdate: () => void;
  onInstallLauncherUpdate: () => void;
}


export default function Launcher({
  isCheckingUpdates,
  isDownloading,
  isCheckingIntegrity,
  isRepairingClient,
  needsUpdate,
  clientReady,
  downloadProgress,
  errorMessage,
  onDownloadClient,
  onCheckIntegrity,
  launcherVersion,
  launcherUpdate,
  onDownloadLauncherUpdate,
  onInstallLauncherUpdate,
}: LauncherProps) {
  const [isLaunching, setIsLaunching] = useState(false);

  async function handleLaunch() {
    setIsLaunching(true);
    try {
      await electronAPI.launchClient();
    } catch (error) {
      console.error("Failed to launch client:", error);
      alert("Failed to launch client. Please try again.");
    } finally {
      setIsLaunching(false);
    }
  }

  async function handleDiscordClick() {
    try {
      await electronAPI.openExternal(CONFIG.DISCORD_URL);
    } catch (error) {
      console.error("Failed to open Discord link:", error);
    }
  }

  async function handleWhatsAppClick() {
    try {
      await electronAPI.openExternal(CONFIG.WHATSAPP_URL);
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
        backgroundRepeat: "no-repeat",
        backgroundColor: "#0a0604"
      }}
    >
      {/* Overlay medieval com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>

      {/* Efeito de fogo/iluminação nas bordas */}
      <div className="absolute inset-0 opacity-20" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(139, 46, 46, 0.3) 100%)'
      }}></div>

      {/* Launcher Update Banner */}
      {launcherUpdate && (launcherUpdate.status === 'available' || launcherUpdate.status === 'downloading' || launcherUpdate.status === 'downloaded') && (
        <div className="absolute top-0 left-0 right-0 z-30 p-3" style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(30, 64, 175, 0.95) 100%)',
          borderBottom: '2px solid #60a5fa'
        }}>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚀</span>
              <div>
                {launcherUpdate.status === 'available' && (
                  <p className="text-white text-sm font-medium">
                    Nova versão do launcher disponível: <span className="font-bold">v{launcherUpdate.version}</span>
                  </p>
                )}
                {launcherUpdate.status === 'downloading' && (
                  <p className="text-white text-sm font-medium">
                    Baixando atualização... {launcherUpdate.progress?.percent || 0}%
                  </p>
                )}
                {launcherUpdate.status === 'downloaded' && (
                  <p className="text-white text-sm font-medium">
                    Atualização pronta! Reinicie para aplicar.
                  </p>
                )}
              </div>
            </div>
            <div>
              {launcherUpdate.status === 'available' && (
                <button
                  onClick={onDownloadLauncherUpdate}
                  className="px-4 py-1.5 bg-white text-blue-600 font-medium text-sm rounded hover:bg-blue-50 transition-colors"
                >
                  Atualizar
                </button>
              )}
              {launcherUpdate.status === 'downloading' && (
                <div className="w-24 h-2 bg-blue-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${launcherUpdate.progress?.percent || 0}%` }}
                  />
                </div>
              )}
              {launcherUpdate.status === 'downloaded' && (
                <button
                  onClick={onInstallLauncherUpdate}
                  className="px-4 py-1.5 bg-green-500 text-white font-medium text-sm rounded hover:bg-green-400 transition-colors"
                >
                  Reiniciar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Header Medieval */}
        <div className="text-center mb-12 relative">

          {/* Título principal com efeito de ouro */}
          <h1 className="text-7xl font-bold mb-2 drop-shadow-2xl" style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f0e68c 50%, #d4af37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
            fontFamily: '"Georgia", serif'
          }}>
            KOLISEUOT
          </h1>

          {/* Decoração inferior */}
          <div className="flex items-center justify-center gap-4 mt-4 opacity-80">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
            <div className="text-2xl">🏰</div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
          </div>
        </div>

        {/* Main Card Medieval */}
        <div className="relative w-full max-w-md">
          {/* Efeito de pedra com textura */}
          <div className="absolute inset-0 rounded-none" style={{
            background: 'linear-gradient(135deg, #2b1f1a 0%, #1a1410 50%, #0f0a08 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.8), 0 20px 50px rgba(0, 0, 0, 0.8)'
          }}></div>

          {/* Bordas ornamentadas */}
          <div className="absolute inset-0 border-8 pointer-events-none" style={{
            borderImage: 'linear-gradient(135deg, #d4af37, #8b6f47, #5a4a3a, #8b6f47, #d4af37) 1'
          }}></div>

          {/* Conteúdo do card */}
          <div className="relative z-10 backdrop-blur-sm p-8 w-full" style={{
            background: 'rgba(43, 31, 26, 0.95)'
          }}>
            {/* Error Message Medieval */}
            {errorMessage && (
              <div className="mb-6 p-4 border-2 border-[#8b2e2e]" style={{
                background: 'linear-gradient(135deg, rgba(139, 46, 46, 0.3) 0%, rgba(97, 24, 24, 0.3) 100%)',
                boxShadow: 'inset 0 0 10px rgba(139, 46, 46, 0.2)'
              }}>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-xs text-[#ff8787] mt-1 whitespace-pre-line font-medium">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Info Medieval */}
            {(isCheckingUpdates || isDownloading || isCheckingIntegrity || isRepairingClient) && (
              <div className="mb-6 p-4 border border-[#d4af37]/50" style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(139, 111, 71, 0.1) 100%)',
                boxShadow: 'inset 0 0 10px rgba(212, 175, 55, 0.05)'
              }}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#d4af37]"></div>
                      <p className="text-sm font-medium" style={{ color: '#d4af37' }}>
                        {isCheckingUpdates ? "Verificando versão do cliente..." :
                          isDownloading ? downloadProgress.message || "Baixando cliente..." :
                            isCheckingIntegrity ? "Verificando integridade dos arquivos..." :
                              isRepairingClient ? downloadProgress.message || "Reparando arquivos corrompidos..." :
                                "Processando..."}
                      </p>
                    </div>
                    {(isDownloading || isRepairingClient) && downloadProgress.percent > 0 && (
                      <span className="text-sm font-bold" style={{ color: '#d4af37' }}>{downloadProgress.percent}%</span>
                    )}
                  </div>
                  {(isDownloading || isRepairingClient) && downloadProgress.percent > 0 && (
                    <div className="w-full h-3 border border-[#8b6f47]" style={{
                      background: 'linear-gradient(90deg, #2b1f1a 0%, #1a1410 100%)',
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)'
                    }}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          background: 'linear-gradient(90deg, #d4af37 0%, #f0e68c 50%, #d4af37 100%)',
                          boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
                          width: `${downloadProgress.percent}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Download/Update Button - shown when client needs update */}
            {needsUpdate && !isDownloading && !isCheckingUpdates && (
              <button
                onClick={onDownloadClient}
                className="w-full py-4 mb-4 relative group transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4a90d9 0%, #2563eb 50%, #4a90d9 100%)',
                  boxShadow: '0 8px 0 #1e40af, 0 12px 20px rgba(37, 99, 235, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
                  border: '2px solid #60a5fa'
                }}
              >
                <span className="flex items-center justify-center font-bold text-lg text-white">
                  ⬇️ BAIXAR CLIENTE ⬇️
                </span>
              </button>
            )}

            {/* Launch Button Medieval */}
            <button
              onClick={handleLaunch}
              disabled={isLaunching || isCheckingUpdates || isDownloading || isCheckingIntegrity || isRepairingClient || needsUpdate || !clientReady}
              className="w-full py-4 relative group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f0e68c 50%, #d4af37 100%)',
                boxShadow: '0 8px 0 #5a4a3a, 0 12px 20px rgba(212, 175, 55, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
                border: '2px solid #8b6f47'
              }}
              onMouseDown={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.boxShadow = '0 4px 0 #5a4a3a, 0 8px 15px rgba(212, 175, 55, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateY(4px)';
                }
              }}
              onMouseUp={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.boxShadow = '0 8px 0 #5a4a3a, 0 12px 20px rgba(212, 175, 55, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isLaunching ? (
                <span className="flex items-center justify-center font-bold text-lg" style={{ color: '#5C4B3D' }}>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#5C4B3D' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Lançando...
                </span>
              ) : (
                <span className="flex items-center justify-center font-bold text-lg" style={{ color: '#5C4B3D' }}>
                  ⚔️ ENTRAR NO REINO ⚔️
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Social Media Buttons Medieval */}
        <div className="mt-12 flex gap-4 justify-center">
          <button
            onClick={handleDiscordClick}
            className="group flex items-center gap-2 px-6 py-3 font-medium transition-all transform hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
              border: '2px solid #d4af37',
              color: '#d4af37',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.3), 0 4px 8px rgba(0, 0, 0, 0.4)'
            }}
          >
            <svg className="w-5 h-5 group-hover:drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>Discord</span>
          </button>

          <button
            onClick={handleWhatsAppClick}
            className="group flex items-center gap-2 px-6 py-3 font-medium transition-all transform hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #22543d 0%, #1f2937 100%)',
              border: '2px solid #d4af37',
              color: '#d4af37',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.3), 0 4px 8px rgba(0, 0, 0, 0.4)'
            }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Footer Medieval */}
        <div className="mt-12 text-center">
          <p style={{ color: '#d4af37' }} className="text-xs uppercase tracking-wider font-semibold">
            KoliseuOT Kingdom © 2025
          </p>
          {launcherVersion && (
            <p className="text-xs mt-1 opacity-50" style={{ color: '#8b6f47' }}>
              Launcher v{launcherVersion}
            </p>
          )}
        </div>
      </div>

      {/* Integrity Check Button - Bottom Right */}
      <button
        onClick={onCheckIntegrity}
        disabled={isDownloading || isCheckingIntegrity || isRepairingClient || needsUpdate || !clientReady}
        title="Verificar integridade dos arquivos"
        className="absolute bottom-4 right-4 z-20 p-2 rounded-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, rgba(43, 31, 26, 0.9) 0%, rgba(26, 20, 16, 0.9) 100%)',
          border: '2px solid #8b6f47',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
        }}
      >
        {isCheckingIntegrity ? (
          <div className="animate-spin h-5 w-5 border-2 border-[#d4af37] border-t-transparent rounded-full"></div>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="#d4af37"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
