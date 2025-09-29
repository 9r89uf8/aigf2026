"use client";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";

export function useSignedMediaUrls(messages) {
  const signBatch = useAction(api.cdn.signViewBatch);
  const [urls, setUrls] = useState({});

  useEffect(() => {
    const keys = (messages || [])
      .filter(m => (m.kind === "image" || m.kind === "video") && m.mediaKey)
      .map(m => m.mediaKey);
    const uniq = Array.from(new Set(keys));
    if (uniq.length === 0) { setUrls({}); return; }

    let cancelled = false;
    (async () => {
      try {
        const r = await signBatch({ keys: uniq });
        if (!cancelled) setUrls(r.urls || {});
      } catch (e) {
        console.warn("signViewBatch failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [messages, signBatch]);

  return urls; // { mediaKey: signedUrl }
}