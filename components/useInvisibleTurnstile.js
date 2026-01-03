"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_SELECTOR =
  'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]';
const LOAD_TIMEOUT_MS = 8000;

// Ensure we load the Turnstile script at most once
let scriptLoadPromise;

/** Load the Turnstile API exactly once (works even if layout already added it). */
export function loadTurnstileScriptOnce({
  forceReload = false,
  timeoutMs,
} = {}) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  if (forceReload) {
    scriptLoadPromise = null;
    document.querySelectorAll(SCRIPT_SELECTOR).forEach((node) => {
      node.parentElement?.removeChild(node);
    });
  }

  if (scriptLoadPromise) return scriptLoadPromise;

  const promise = new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      err ? reject(err) : resolve();
    };

    const start = Date.now();
    const tick = () => {
      if (settled) return;
      if (window.turnstile) return finish();
      if (typeof timeoutMs === "number" && Date.now() - start >= timeoutMs) {
        return finish(new Error("Turnstile script load timed out"));
      }
      setTimeout(tick, 50);
    };

    const existing = document.querySelector(SCRIPT_SELECTOR);
    if (!existing) {
      const s = document.createElement("script");
      s.src = forceReload ? `${SCRIPT_SRC}&cb=${Date.now()}` : SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.dataset.turnstileScript = "1";
      s.onload = () => {
        if (window.turnstile) finish();
      };
      s.onerror = () => finish(new Error("Turnstile script failed to load"));
      document.head.appendChild(s);
    }

    tick();
  });

  scriptLoadPromise = promise.catch((err) => {
    if (scriptLoadPromise === promise) {
      scriptLoadPromise = null;
    }
    throw err;
  });

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
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Single-flight promise so overlapping callers share the same execution
  const inFlightRef = useRef(null);

  useEffect(() => {
    let unmounted = false;

    (async () => {
      try {
        setReady(false);
        setError(null);
        await loadTurnstileScriptOnce({
          forceReload: reloadKey > 0,
          timeoutMs: LOAD_TIMEOUT_MS,
        });
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

        if (reloadKey > 0 && widgetIdRef.current) {
          try { window.turnstile?.remove(widgetIdRef.current); } catch {}
          widgetIdRef.current = null;
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
        if (unmounted) return;
        setError("Turnstile failed to load");
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
  }, [reloadKey]);

  const retry = useCallback(() => {
    setReloadKey((k) => k + 1);
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

  return { ready, error, retry, getToken };
}
