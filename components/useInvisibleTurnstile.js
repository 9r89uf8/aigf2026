"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Ensure we load the Turnstile script at most once
let scriptLoadPromise;

/** Load the Turnstile API exactly once (works even if layout already added it). */
function loadTurnstileScriptOnce() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  // If another part of the app already added the script, just wait for it
  const existing = document.querySelector(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
  );
  if (existing) {
    return new Promise((resolve) => {
      const check = () =>
          window.turnstile ? resolve() : setTimeout(check, 30);
      check();
    });
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      // Explicit mode since we call turnstile.render() ourselves
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }
  return scriptLoadPromise;
}

/**
 * Renders a single (invisible-like) Turnstile widget and exposes getToken().
 * Key points:
 *  - execution: 'execute' → the widget won't auto-run; we decide when to run it
 *  - appearance: 'execute' → stays hidden unless CF needs an interactive challenge
 *  - getToken() is single-flight and does reset() before execute() to avoid races
 */
export function useInvisibleTurnstile() {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Single-flight promise so overlapping callers share the same execution
  const inFlightRef = useRef(null);

  useEffect(() => {
    let unmounted = false;

    (async () => {
      try {
        await loadTurnstileScriptOnce();
        if (unmounted) return;

        // Create an off-screen container once
        if (!containerRef.current) {
          const el = document.createElement("div");
          el.style.position = "absolute";
          el.style.left = "-9999px";
          el.style.width = "0";
          el.style.height = "0";
          document.body.appendChild(el);
          containerRef.current = el;
        }

        // Render exactly once
        if (!widgetIdRef.current) {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            appearance: "execute",
            size: "flexible",
            execution: "execute", // <-- important: do not auto-run on render
            retry: "auto",
            "error-callback": () => {
              try { window.turnstile.reset(widgetIdRef.current); } catch {}
            },
            "timeout-callback": () => {
              try { window.turnstile.reset(widgetIdRef.current); } catch {}
            },
          });
        }

        setReady(true);
      } catch (e) {
        console.error("Turnstile script failed to load", e);
      }
    })();

    return () => {
      unmounted = true;
      // Optional cleanup (uncomment for production if you want to fully remove on unmount):
      // if (window.turnstile && widgetIdRef.current) {
      //   window.turnstile.remove(widgetIdRef.current);
      //   widgetIdRef.current = null;
      // }
      // if (containerRef.current?.parentElement === document.body) {
      //   document.body.removeChild(containerRef.current);
      //   containerRef.current = null;
      // }
    };
  }, []);

  const getToken = useCallback(async () => {
    if (!ready || !window.turnstile || !widgetIdRef.current) {
      throw new Error("Turnstile not ready");
    }

    if (inFlightRef.current) return inFlightRef.current;

    inFlightRef.current = new Promise((resolve, reject) => {
      const ts = window.turnstile;
      try {
        // Always reset before executing to avoid "already executing" warnings
        ts.reset(widgetIdRef.current);
        ts.execute(widgetIdRef.current, {
          action: "chat_send",
          callback: (token) => {
            inFlightRef.current = null;
            resolve(token);
          },
          "error-callback": (code) => {
            inFlightRef.current = null;
            try { ts.reset(widgetIdRef.current); } catch {}
            reject(new Error(`turnstile:${code}`));
          },
          "timeout-callback": () => {
            inFlightRef.current = null;
            try { ts.reset(widgetIdRef.current); } catch {}
            reject(new Error("turnstile:timeout"));
          },
        });
      } catch (e) {
        inFlightRef.current = null;
        reject(e);
      }
    });

    return inFlightRef.current;
  }, [ready]);

  return { ready, getToken };
}
