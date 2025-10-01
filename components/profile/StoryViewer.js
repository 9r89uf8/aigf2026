"use client";
//components/profile/StoryViewer.js
import { useEffect } from "react";

export default function StoryViewer({ story, signedUrl, onClose, onNext, onPrev }) {
  const isText = story.kind === "text";
  const isVideo = story.kind === "video";

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "ArrowLeft") onPrev?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation Buttons */}
      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Story Content */}
      <div
        className="relative max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[9/16] rounded-lg overflow-hidden shadow-2xl">
          {isText ? (
            // Text Story
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-8">
              <p className="text-white text-2xl font-medium text-center">
                {story.text}
              </p>
            </div>
          ) : signedUrl ? (
            // Image/Video Story
            <>
              {isVideo ? (
                <video
                  src={signedUrl}
                  className="w-full h-full object-contain bg-black"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={signedUrl}
                  alt="Story"
                  className="w-full h-full object-contain bg-black"
                />
              )}
            </>
          ) : (
            // Loading
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
            </div>
          )}

          {/* Caption overlay for image/video stories */}
          {story.text && !isText && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm">{story.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
