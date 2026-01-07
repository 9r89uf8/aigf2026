"use client";

import { useEffect, useState } from "react";

export default function MediaCard({
  media,
  signedUrls,
  isLiked,
  onLikeToggle,
  onImageClick
}) {
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(media.likeCount);
  const [activeIndex, setActiveIndex] = useState(0);

  const mediaUrls = Array.isArray(signedUrls)
    ? signedUrls
    : signedUrls
      ? [signedUrls]
      : [];

  const totalImages = media.kind === "image" ? mediaUrls.length : 0;
  const hasMultipleImages = totalImages > 1;
  const currentUrl = media.kind === "image" ? mediaUrls[activeIndex] : mediaUrls[0];

  useEffect(() => {
    setActiveIndex(0);
  }, [media?.id, media?._id, mediaUrls.length]);

  function handleImageClick() {
    if (media.kind !== "image" || !currentUrl || !onImageClick) return;
    onImageClick({ media, signedUrls: mediaUrls, index: activeIndex });
  }

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

  function handlePrevImage(event) {
    event.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }

  function handleNextImage(event) {
    event.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % totalImages);
  }

  const formattedDate = media.createdAt
    ? new Date(media.createdAt).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "";

  return (
    <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Media Content */}
      <div className="relative aspect-[4/5] bg-gray-100">
        {currentUrl ? (
          media.kind === "video" ? (
            <video
              src={currentUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : media.kind === "audio" ? (
            <div className="flex h-full w-full items-center justify-center">
              <audio src={currentUrl} controls className="w-11/12" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleImageClick}
              className="block w-full h-full focus:outline-none"
            >
              <img
                src={currentUrl}
                alt={media.text || "Media"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 w-full h-full" />
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/70"
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/70"
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white">
              {activeIndex + 1}/{totalImages}
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
              {mediaUrls.map((_, index) => (
                <span
                  key={`dot-${media.id || media._id}-${index}`}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Media Info */}
      <div className="p-3 bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400">
        {media.text && (
          <p className="text-sm text-white mb-2 line-clamp-2">{media.text}</p>
        )}

        <div className="flex items-center justify-between text-xs text-white/90">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className={media.location ? "text-white" : "text-white/70"}>
              {media.location || "Sin ubicacion"}
            </span>
          </span>
          {formattedDate && <span>{formattedDate}</span>}
        </div>

        <div className="mt-2 flex items-center justify-between">
          {/* Like Button */}
          {media.canBeLiked ? (
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
          ) : (
            <div className="flex items-center gap-1.5 text-white/80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm font-medium">{localLikeCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
