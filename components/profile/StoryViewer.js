"use client";
// components/profile/StoryViewer.js
// Instagram-like Story Viewer with progress bars, tap-zones, hold-to-pause, swipe-to-close,
// image preloading, and optional video sound toggle. TailwindCSS only.

import { useEffect, useMemo, useRef, useState } from "react";

// -------- utils --------
function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - Number(timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  const date = new Date(Number(timestamp));
  return date.toLocaleDateString();
}

function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);
}

function preloadImage(url) {
  if (!url) return;
  const img = new Image();
  img.src = url;
}

// -------- component --------
export default function StoryViewer({
                                      story, // { kind: 'text' | 'image' | 'video', text?, createdAt, user?, ... }
                                      signedUrl, // current story media URL (image/video)
                                      onClose,
                                      onNext,
                                      onPrev,
                                      // Optional extras (highly recommended for a more IG-like feel)
                                      currentIndex = 0, // zero-based index in the current stack of stories (for progress segments)
                                      totalCount = 1, // total stories in the current stack
                                      nextUrl = null, // for preloading the next media (image)
                                      prevUrl = null, // optional preload previous image
                                      autoAdvance = true,
                                      imageDurationMs = 5000, // how long an image stays before auto-advancing
                                    }) {
  const isText = story?.kind === "text";
  const isVideo = story?.kind === "video";
  const timeAgo = story?.createdAt ? formatTimeAgo(story.createdAt) : null;

  // State
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 for the *current* item
  const [muted, setMuted] = useState(true); // videos default muted like IG
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseStartRef = useRef(null);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Scroll lock while viewer is open
  useBodyScrollLock(true);

  // Reset timing & progress when story changes
  useEffect(() => {
    setProgress(0);
    setPaused(false);
    pausedAccumRef.current = 0;
    pauseStartRef.current = null;
    startRef.current = performance.now();
  }, [story]);

  // Preload neighbors (images)
  useEffect(() => {
    if (nextUrl) preloadImage(nextUrl);
    if (prevUrl) preloadImage(prevUrl);
  }, [nextUrl, prevUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "ArrowLeft") onPrev?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  // Image progress via rAF
  useEffect(() => {
    if (!autoAdvance || isVideo || isText) return; // videos handled by timeupdate; text has no timer

    const tick = (now) => {
      const pausedNow = pauseStartRef.current
          ? now - pauseStartRef.current
          : 0;
      const elapsed = now - startRef.current - pausedAccumRef.current - pausedNow;
      const pct = Math.max(0, Math.min(1, elapsed / imageDurationMs));
      setProgress(pct);
      if (pct >= 1) {
        cancelAnimationFrame(rafRef.current);
        onNext?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, isText, imageDurationMs, autoAdvance, story, paused]);

  // Pause/resume side effects for timer bookkeeping & video playback
  useEffect(() => {
    if (paused) {
      if (!pauseStartRef.current) pauseStartRef.current = performance.now();
      if (isVideo && videoRef.current && !videoRef.current.paused) {
        try { videoRef.current.pause(); } catch {}
      }
    } else {
      if (pauseStartRef.current) {
        pausedAccumRef.current += performance.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      if (isVideo && videoRef.current && videoRef.current.paused) {
        try { videoRef.current.play(); } catch {}
      }
    }
  }, [paused, isVideo]);

  // Video progress binding
  const onVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = Math.min(1, v.currentTime / v.duration);
    setProgress(pct);
  };

  const onVideoEnded = () => {
    onNext?.();
  };

  // Drag to close (swipe down)
  const handlePointerDown = (e) => {
    setDragging(true);
    setPaused(true); // hold to pause while dragging
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setDragY(0);
    containerRef.current?.setPointerCapture?.(e.pointerId ?? 1);
    containerRef.current.dataset.startY = String(y);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const startY = Number(containerRef.current?.dataset.startY || 0);
    const delta = y - startY;
    setDragY(Math.max(0, delta));
  };

  const handlePointerUp = () => {
    setDragging(false);
    setPaused(false);
    if (dragY > 120) {
      onClose?.();
    } else {
      setDragY(0);
    }
  };

  const bgStyles = useMemo(() => (
      signedUrl && !isText
          ? { backgroundImage: `url(${signedUrl})` }
          : {}
  ), [signedUrl, isText]);

  const userName = story?.user?.name || "";
  const userAvatar = story?.user?.avatarUrl || "";

  return (
      <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
      >
        {/* blurred backdrop from media */}
        {!isText && signedUrl && (
            <div
                aria-hidden
                style={bgStyles}
                className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-30 blur-2xl scale-110"
            />
        )}

        {/* Top bar: segments + user + time */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 select-none">
          {/* Segments */}
          <div className="flex gap-1 mb-3">
            {Array.from({ length: Math.max(1, totalCount) }).map((_, i) => {
              const filled = i < currentIndex ? 1 : i === currentIndex ? progress : 0;
              return (
                  <div key={i} className="h-1 flex-1 rounded bg-white/30 overflow-hidden">
                    <div
                        className="h-full bg-white transition-[width] duration-75"
                        style={{ width: `${Math.min(100, Math.max(0, filled * 100))}%` }}
                    />
                  </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                  <img src={userAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                  <div className="h-8 w-8 rounded-full bg-white/20" />
              )}
              <div className="leading-tight">
                <div className="text-sm font-semibold">{userName || "Story"}</div>
                {timeAgo && <div className="text-xs text-white/70">{timeAgo}</div>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isVideo && (
                  <button
                      onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
                  >
                    {muted ? "Sound Off" : "Sound On"}
                  </button>
              )}
              <button
                  onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                  aria-label="Close"
                  className="p-1 rounded hover:bg-white/10"
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation arrows (optional) */}
        {onPrev && (
            <button
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/40 text-white"
                aria-label="Previous"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
        )}
        {onNext && (
            <button
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/40 text-white"
                aria-label="Next"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
        )}

        {/* Story content card */}
        <div
            ref={containerRef}
            className="relative max-w-[420px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{
              transform: dragY ? `translateY(${dragY}px) scale(${Math.max(0.9, 1 - dragY / 1200)})` : undefined,
              transition: dragging ? "none" : "transform 180ms ease",
            }}
        >
          <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-2xl bg-black">
            {/* Tap zones (left/right third) like IG */}
            <button
                className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                aria-label="Tap left to go back"
            />
            <button
                className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                aria-label="Tap right to go next"
            />
            {/* Middle zone: hold to pause */}
            <div
                className="absolute inset-0 z-0"
                onPointerDown={() => setPaused(true)}
                onPointerUp={() => setPaused(false)}
                onMouseLeave={() => setPaused(false)}
            />

            {isText ? (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-8">
                  <p className="text-white text-2xl font-medium text-center whitespace-pre-wrap break-words">
                    {story?.text}
                  </p>
                </div>
            ) : signedUrl ? (
                <>
                  {isVideo ? (
                      <video
                          ref={videoRef}
                          src={signedUrl}
                          className="w-full h-full object-contain bg-black"
                          autoPlay
                          playsInline
                          muted={muted}
                          onTimeUpdate={onVideoTimeUpdate}
                          onEnded={onVideoEnded}
                          onLoadedMetadata={onVideoTimeUpdate}
                      />
                  ) : (
                      <img
                          src={signedUrl}
                          alt="Story"
                          className="w-full h-full object-contain bg-black select-none"
                          draggable={false}
                      />
                  )}
                </>
            ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
                </div>
            )}

            {/* Caption overlay for image/video stories */}
            {story?.text && !isText && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white text-sm whitespace-pre-wrap break-words">{story.text}</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
