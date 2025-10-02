"use client";

import { useState } from "react";

export default function MediaCard({
  media,
  signedUrl,
  isLiked,
  onLikeToggle
}) {
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(media.likeCount);

  async function handleLikeClick() {
    if (!media.canBeLiked || isLiking) return;

    setIsLiking(true);

    // Optimistic update
    const newLiked = !localLiked;
    const newCount = newLiked ? localLikeCount + 1 : Math.max(0, localLikeCount - 1);
    setLocalLiked(newLiked);
    setLocalLikeCount(newCount);

    try {
      const result = await onLikeToggle(media.id);
      // Update with actual server response
      if (result) {
        setLocalLiked(result.liked);
        setLocalLikeCount(result.likeCount);
      }
    } catch (error) {
      // Revert on error
      setLocalLiked(isLiked);
      setLocalLikeCount(media.likeCount);
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Media Content */}
      <div className="relative aspect-[4/5] bg-gray-100">
        {signedUrl ? (
          media.kind === "video" ? (
            <video
              src={signedUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={signedUrl}
              alt={media.text || "Media"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 w-full h-full" />
          </div>
        )}
      </div>

      {/* Media Info */}
      <div className="p-3 bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400">
        {media.text && (
          <p className="text-sm text-white mb-2 line-clamp-2">{media.text}</p>
        )}

        <div className="flex items-center justify-between">
          {/* Like Button */}
          {media.canBeLiked && (
            <button
              onClick={handleLikeClick}
              disabled={isLiking}
              className={`flex items-center gap-1.5 transition-colors ${
                localLiked
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              } disabled:opacity-50`}
            >
              <svg
                className="w-5 h-5"
                fill={localLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm font-medium">{localLikeCount}</span>
            </button>
          )}

          {/* Location (for posts) */}
          {media.location && (
            <span className="text-xs text-white/80 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {media.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
