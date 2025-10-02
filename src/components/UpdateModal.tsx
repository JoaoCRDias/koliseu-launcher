interface UpdateModalProps {
  type: "launcher" | "client";
  currentVersion: string;
  latestVersion: string;
  onUpdate: () => void;
}

export default function UpdateModal({
  type,
  currentVersion,
  latestVersion,
  onUpdate,
}: UpdateModalProps) {
  const title = type === "launcher" ? "Launcher Update Available" : "Client Update Available";
  const description =
    type === "launcher"
      ? "A new version of the launcher is available. Update now to get the latest features and improvements."
      : "A new version of the game client is available. Update now to ensure compatibility with the server.";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-secondary rounded-2xl shadow-2xl max-w-md w-full border border-accent/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-highlight to-pink-600 p-6">
          <div className="flex items-center space-x-3">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6">{description}</p>

          <div className="bg-primary/50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Current Version:</span>
              <span className="text-white font-semibold">{currentVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Latest Version:</span>
              <span className="text-highlight font-semibold">{latestVersion}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onUpdate}
            className="w-full py-3 bg-gradient-to-r from-highlight to-pink-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-highlight transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Update Now
          </button>

          {type === "client" && (
            <button
              onClick={() => window.location.reload()}
              className="w-full mt-3 py-3 bg-accent/50 text-gray-300 font-medium rounded-lg hover:bg-accent transition-all"
            >
              Remind Me Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
