"use client";

import { useState } from "react";

export default function StoryChip({ story, signedUrl, onClick }) {
  const isText = story.kind === "text";
  const isVideo = story.kind === "video";

  return (
    <div
      onClick={() => onClick?.(story)}
      className="flex-shrink-0 w-24 cursor-pointer group"
    >
      <div className="relative aspect-[9/16] rounded-lg overflow-hidden border-2 border-purple-500 shadow-md group-hover:shadow-lg transition-shadow">
        {isText ? (
          // Text Story
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-3">
            <p className="text-white text-xs font-medium text-center line-clamp-6">
              {story.text}
            </p>
          </div>
        ) : signedUrl ? (
          // Image/Video Story
          <>
            {isVideo ? (
              <video
                src={signedUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={signedUrl}
                alt="Story"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {/* Play icon for videos */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <svg
                  className="w-8 h-8 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </>
        ) : (
          // Loading placeholder
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        )}
      </div>

      {/* Optional caption indicator */}
      {story.text && !isText && (
        <div className="mt-1 px-1">
          <p className="text-xs text-gray-600 truncate">{story.text}</p>
        </div>
      )}
    </div>
  );
}
