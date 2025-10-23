"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import StoryViewer from "../profile/StoryViewer";

export default function HomeStoryModal({
  open,
  onClose,
  stories, // [{ url, text?, createdAt?, user?: { name?, avatarUrl? } }]
}) {
  const [idx, setIdx] = useState(0);
  const [portalEl, setPortalEl] = useState(null);

  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-home-story-modal-root", "true");
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!open || !portalEl) return null;

  const total = stories.length;
  const current = stories[idx];

  const handleNext = () => {
    if (idx + 1 >= total) onClose?.();
    else setIdx((i) => i + 1);
  };
  const handlePrev = () => {
    if (idx === 0) onClose?.();
    else setIdx((i) => i - 1);
  };

  return createPortal(
    (
      <StoryViewer
        // Keep your viewer API exactly as-is
        story={{
          kind: "image",
          text: current?.text,
          createdAt: current?.createdAt,
          user: current?.user,
        }}
        signedUrl={current?.url}
        nextUrl={stories[idx + 1]?.url ?? null}
        prevUrl={stories[idx - 1]?.url ?? null}
        onClose={onClose}
        onNext={handleNext}
        onPrev={handlePrev}
        currentIndex={idx}
        totalCount={total}
        canPrev={idx > 0}
        canNext={idx < total - 1}
        autoAdvance
        imageDurationMs={5000}
      />
    ),
    portalEl
  );
}
