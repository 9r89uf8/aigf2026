"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

let scriptLoadPromise;

/** Load the Turnstile API exactly once. */
function loadTurnstileScriptOnce() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  // If another part of the app already added the script, reuse it.
  const existing = document.querySelector('script[src*="turnstile/v0/api.js"]');
  if (existing) {
    // When it finishes, window.turnstile will be set.
    return new Promise((resolve) => {
      const check = () => (window.turnstile ? resolve() : setTimeout(check, 30));
      check();
    });
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }
  return scriptLoadPromise;
}

/**
 * Renders a single invisible-like widget and exposes getToken().
 * - Uses appearance: "execute" so the widget stays hidden unless CF needs to challenge.
 * - Serializes execute() calls to avoid "already executing" errors.
 */
export function useInvisibleTurnstile() {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Serialize execute() calls to prevent overlapping executions
  const executingRef = useRef(null); // holds a pending promise when executing

  useEffect(() => {
    let removed = false;

    (async () => {
      try {
        await loadTurnstileScriptOnce();
        if (removed) return;

        // Create a hidden container if needed
        if (!containerRef.current) {
          const el = document.createElement("div");
          // Keep in DOM but off-screen; appearance:"execute" will hide it.
          el.style.position = "absolute";
          el.style.left = "-9999px";
          el.style.width = "0";
          el.style.height = "0";
          document.body.appendChild(el);
          containerRef.current = el;
        }

        // If a widget already exists (e.g., Fast Refresh), do not render twice
        if (!widgetIdRef.current) {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            // keep widget hidden unless a challenge is needed:
            appearance: "execute",
            size: "flexible",
            // We will call execute() ourselves.
          });
        }

        setReady(true);
      } catch (e) {
        console.error("Turnstile script failed to load", e);
      }
    })();

    return () => {
      removed = true;
      // Do not remove the widget in dev to avoid churn during Fast Refresh.
      // In production you may remove if desired:
      // if (window.turnstile && widgetIdRef.current) window.turnstile.remove(widgetIdRef.current);
      // if (containerRef.current && containerRef.current.parentElement === document.body)
      //   document.body.removeChild(containerRef.current);
    };
  }, []);

  const getToken = useCallback(async () => {
    if (!ready || !window.turnstile || !widgetIdRef.current) throw new Error("Turnstile not ready");

    // If already executing, return the existing promise
    if (executingRef.current) return executingRef.current;

    executingRef.current = new Promise((resolve, reject) => {
      try {
        window.turnstile.execute(widgetIdRef.current, {
          action: "chat_send",
          callback: (token) => {
            executingRef.current = null;
            resolve(token);
          },
          "error-callback": (err) => {
            executingRef.current = null;
            // After errors, resetting can help next runs
            try { window.turnstile.reset(widgetIdRef.current); } catch {}
            reject(err || new Error("Turnstile error"));
          },
          "timeout-callback": () => {
            executingRef.current = null;
            try { window.turnstile.reset(widgetIdRef.current); } catch {}
            reject(new Error("Turnstile timeout"));
          },
        });
      } catch (e) {
        executingRef.current = null;
        reject(e);
      }
    });

    return executingRef.current;
  }, [ready]);

  return { ready, getToken };
}