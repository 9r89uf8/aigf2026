"use client";

export default function HighlightChip({ highlight, signedUrl, onClick }) {
  const cover = highlight?.cover;
  const isVideo = cover?.kind === "video";
  const isText = cover?.kind === "text";

  return (
    <button
      type="button"
      onClick={() => onClick?.(highlight)}
      className="flex-shrink-0 w-20 text-center"
    >
      <div className="relative w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 shadow-sm">
        {signedUrl && !isText ? (
          isVideo ? (
            <video
              src={signedUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={signedUrl}
              alt={highlight?.title || "Highlight"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center px-2">
            <span className="text-white text-[10px] font-semibold leading-tight line-clamp-2">
              {cover?.text || highlight?.title || "Highlight"}
            </span>
          </div>
        )}

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/15">
            <svg className="w-6 h-6 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>
      <span className="mt-2 block text-xs text-gray-700 truncate">{highlight?.title}</span>
    </button>
  );
}
