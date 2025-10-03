You’re right—this is Strict Mode double‑invocation plus concurrent `execute()` calls. You don’t need a full rewrite; just **serialize token requests** and trim the effect deps so prefetch runs once.

Below are **only the changes** to make in `app/chat/[conversationId]/page.js`.

---

### 1) Remove the module flag & unused guard

```diff
- // Module-level flag to prevent double prefetch in React Strict Mode
- let prefetchAttempted = false;
...
- const prefetchGuard = useRef(false);
```

---

### 2) Add refs + a serialized `acquireToken()` helper

Put these **inside** `ConversationPage` (top-level, after state):

```diff
+ // Keep latest permit in a ref (so effect doesn't depend on it)
+ const permitRef = useRef(permit);
+ useEffect(() => { permitRef.current = permit; }, [permit]);

+ // Keep latest mint function in a ref to avoid effect churn
+ const mintPermitRef = useRef(mintPermit);
+ useEffect(() => { mintPermitRef.current = mintPermit; }, [mintPermit]);

+ // Ensure only ONE turnstile execute() runs at a time
+ const tokenInFlightRef = useRef(null);
+ async function acquireToken() {
+   if (tokenInFlightRef.current) return tokenInFlightRef.current;
+   tokenInFlightRef.current = (async () => {
+     try {
+       return await getToken(); // your hook’s getToken
+     } finally {
+       tokenInFlightRef.current = null;
+     }
+   })();
+   return tokenInFlightRef.current;
+ }
```

---

### 3) Prefetch effect: trim deps + use `acquireToken()`

Replace your entire **prefetch** effect:

```diff
- // Optional: prefetch a permit once the Turnstile script is ready
- useEffect(() => {
-   (async () => {
-     if (!turnstileReady || permit || prefetchAttempted) return;
-     prefetchAttempted = true;
-     try {
-       const token = await getToken();
-       const p = await mintPermit({ token, scope: "chat_send" });
-       setPermit(p);
-     } catch (e) {
-       console.warn("Permit prefetch failed", e);
-       prefetchAttempted = false;
-     }
-   })();
-   return () => {
-     if (conversationId) prefetchAttempted = false;
-   };
- }, [turnstileReady, permit, getToken, mintPermit, conversationId]);
+ // Optional: prefetch a permit once Turnstile is ready (serialized; Strict Mode safe)
+ useEffect(() => {
+   let cancelled = false;
+   (async () => {
+     if (!turnstileReady || permitRef.current) return;
+     try {
+       const token = await acquireToken();
+       if (cancelled) return;
+       const p = await mintPermitRef.current({ token, scope: "chat_send" });
+       if (cancelled) return;
+       setPermit(p);
+     } catch (e) {
+       // Non-fatal — permit will mint on first send
+       console.warn("Permit prefetch failed", e);
+     }
+   })();
+   return () => { cancelled = true; };
+ }, [turnstileReady, conversationId]);
```

---

### 4) Use `acquireToken()` in `ensurePermit()`

```diff
- async function ensurePermit() {
-   if (permitValid(permit)) return permit;
-   const token = await getToken();
-   const p = await mintPermit({ token, scope: "chat_send" });
-   setPermit(p);
-   return p;
- }
+ async function ensurePermit() {
+   const cur = permitRef.current ?? permit;
+   if (permitValid(cur)) return cur;
+   const token = await acquireToken();
+   const p = await mintPermitRef.current({ token, scope: "chat_send" });
+   setPermit(p);
+   return p;
+ }
```

This prevents overlapping `execute()` calls (which caused the **“already executing”** warning), even under Strict Mode’s mount/unmount cycle.

---

### 5) (Optional) Quiet the Turnstile **preload** warning

If you have a manual preload anywhere (in your Turnstile hook or `<Head>`):

```diff
- <link rel="preload" href="https://challenges.cloudflare.com/..." />
+ <!-- Remove manual preload entirely -->
+ <!-- or, if you keep it, set the correct type: -->
+ <link rel="preload" href="https://challenges.cloudflare.com/turnstile/v0/api.js" as="script" />
+ <!-- If still noisy in dev, prefer: -->
+ <link rel="prefetch" href="https://challenges.cloudflare.com/turnstile/v0/api.js" />
+ <link rel="preconnect" href="https://challenges.cloudflare.com" crossorigin />
```

Turnstile lazily pulls subresources; manual preloading often fires too early in dev, triggering that console note. Removing it (or switching to `prefetch`/`preconnect`) is usually best.

---

That’s it—no behavioral changes in prod, and the dev warnings should disappear.
