Got it—let’s fix all four issues without adding complexity or extra DB load. Below are *surgical* changes you can drop in.

---

## What we’re fixing (summary)

1. **Password visible by default**
   → Make the password field **type="text"** by default with a small **Mostrar/Ocultar** toggle.

2. **Turnstile sometimes doesn’t appear**
   → Load the Turnstile script earlier (`afterInteractive`), force a **remount on tab switch** (`key={flow}`), and add a tiny effect that **explicitly renders** the widget if auto‑render fails.

3. **Default tab should be Register**
   → Initialize `flow` with `"signUp"`.

4. **Country sometimes not set on registration**
   → Don’t prematurely clear the “just signed up” flag. Always call `ensureCountry` once the user is authenticated, **even if the country isn’t known yet**, and then call it again automatically when the guess arrives—*at most twice*, only on sign‑up.

---

## 1) Load Turnstile more reliably

**app/layout.js** — change the script strategy so the widget initializes right after hydration (more consistent than `lazyOnload`):

```diff
// app/layout.js
-        <Script
-          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
-          strategy="lazyOnload"
-        />
+        <Script
+          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
+          strategy="afterInteractive" // CHANGED: load right after hydration
+        />
```

---

## 2) Robust geo endpoint (works on Vercel, Cloudflare, etc.)

This endpoint reads common country headers so your client can get a fast 2‑letter code.

**app/api/geo/route.js**

```js
// app/api/geo/route.js
import { headers } from "next/headers";

export async function GET() {
  const h = headers();
  const country = (
    h.get("x-vercel-ip-country") || // Vercel
    h.get("cf-ipcountry") ||        // Cloudflare
    h.get("cf-ip-country") ||       // Some CF setups
    h.get("x-country") ||           // Custom reverse proxies
    ""
  ).toUpperCase();

  return Response.json({ country });
}
```

---

## 3) Sign-in page fixes (password visibility, default tab, Turnstile reliability, country set)

**app/(auth)/signin/page.js** — only the changed/added parts are commented.

```diff
 "use client";

 import { useEffect, useRef, useState } from "react";
 import { useAuthActions } from "@convex-dev/auth/react";
 import { useAction, useMutation, useConvexAuth } from "convex/react";
 import { api } from "../../../convex/_generated/api";

 export default function SignInPage() {
   const { signIn } = useAuthActions();
   const { isAuthenticated } = useConvexAuth();
-  const [flow, setFlow] = useState("signIn");
+  const [flow, setFlow] = useState("signUp"); // CHANGED: default to Register
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState("");
   const [countryGuess, setCountryGuess] = useState("");  // NEW
+  const [showPwd, setShowPwd] = useState(true);          // NEW: visible by default

   const verifyTurnstile = useAction(api.turnstile.verify);
   const ensureCountry = useMutation(api.profile.ensureCountry); // NEW
   const justSignedUp = useRef(false);
+  const tsRef = useRef(null);                             // NEW: Turnstile container ref

   useEffect(() => {
     // Light-weight, server-sourced country
     fetch("/api/geo")
         .then((r) => r.json())
         .then(({ country }) => setCountryGuess(country || ""))
         .catch(() => setCountryGuess(""));
   }, []);

-  // Run AFTER Convex auth is live so the mutation is authenticated
+  // Run AFTER Convex auth is live so the mutation is authenticated.
+  // Strategy: call ensureCountry *once* immediately after signup (even if guess missing),
+  // then call *once more* automatically when guess becomes available.
   useEffect(() => {
-    if (!justSignedUp.current) return;
-    if (!isAuthenticated) return;
-    if (!countryGuess) { justSignedUp.current = false; return; }
-    (async () => {
-      try {
-        await ensureCountry({ country: countryGuess });
-      } catch (e) {
-        // non-fatal; ignore
-      } finally {
-        justSignedUp.current = false;
-      }
-    })();
+    if (!justSignedUp.current || !isAuthenticated) return;
+    (async () => {
+      try {
+        await ensureCountry({ country: countryGuess || undefined });
+      } catch {
+        // non-fatal; ignore
+      } finally {
+        // If we still don't have a guess, keep the flag true so we can try once more
+        if (countryGuess) {
+          justSignedUp.current = false;
+        }
+      }
+    })();
   }, [isAuthenticated, countryGuess, ensureCountry]);

+  // Extra safety: sometimes auto-render misses; explicitly render if needed.
+  useEffect(() => {
+    const el = tsRef.current;
+    if (!el) return;
+    const tryRender = () => {
+      const hasIframe = el.querySelector && el.querySelector("iframe");
+      if (!hasIframe && typeof window !== "undefined" && window.turnstile) {
+        try {
+          window.turnstile.render(el, {
+            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
+            action: flow,
+            retry: "auto",
+          });
+        } catch {}
+      }
+    };
+    // Try now, then a couple of retries shortly after mount/switch
+    tryRender();
+    const t1 = setTimeout(tryRender, 250);
+    const t2 = setTimeout(tryRender, 1000);
+    return () => { clearTimeout(t1); clearTimeout(t2); };
+  }, [flow]);

   const handleSubmit = async (e) => {
     e.preventDefault();
     setIsLoading(true);
     setError("");

     try {
       const fd = new FormData(e.currentTarget);

       // 1) Server-verify Turnstile
       const ts = fd.get("cf-turnstile-response");
       await verifyTurnstile({ token: String(ts || "") });

       // 2) Add country to form only for signUp
       if (flow === "signUp" && countryGuess) {
         fd.set("country", countryGuess);
       }

       // 3) Proceed with Convex Auth
       await signIn("password", fd);

       // 4) Flag for post-auth effect to run ensureCountry when isAuthenticated flips
       if (flow === "signUp") {
         justSignedUp.current = true;
       }
       // Let auth state/middleware handle navigation
     } catch (err) {
       const generic =
           flow === "signIn"
               ? "Error al iniciar sesión. Verifica tu correo/contraseña e intenta de nuevo."
               : "No se pudo crear la cuenta. Prueba con otro correo o intenta de nuevo.";
       setError(generic);
     } finally {
       setIsLoading(false);
     }
   };

   return (
     <main className="mx-auto max-w-sm p-6 mt-8">
       {/* Tab-style toggle */}
       <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
         <button
           type="button"
           onClick={() => {
             setFlow("signUp");
             setError("");
           }}
           className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
             flow === "signUp"
               ? "bg-white text-blue-600 shadow-sm"
               : "text-gray-600 hover:text-gray-900"
           }`}
         >
           Crear Cuenta
         </button>
         <button
           type="button"
           onClick={() => {
             setFlow("signIn");
             setError("");
           }}
           className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
             flow === "signIn"
               ? "bg-white text-blue-600 shadow-sm"
               : "text-gray-600 hover:text-gray-900"
           }`}
         >
           Iniciar Sesión
         </button>
       </div>

       <h1 className="text-2xl font-semibold mb-6 text-center">
         {flow === "signIn" ? "Bienvenido de nuevo" : "Crear una cuenta"}
       </h1>

       {error && (
         <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
           {error}
         </div>
       )}

       <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
             Correo Electrónico
           </label>
           <input
             id="email"
             name="email"
             type="email"
             placeholder="tu@ejemplo.com"
             required
             autoComplete="email"
             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
           />
         </div>

         <div>
           <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
             Contraseña
           </label>
+          <div className="relative">
+            <input
+              id="password"
+              name="password"
+              type={showPwd ? "text" : "password"}  // CHANGED: visible by default
+              placeholder={flow === "signIn" ? "Ingresa tu contraseña" : "Elige una contraseña (8+ caracteres)"}
+              required
+              minLength={8}
+              autoComplete={flow === "signIn" ? "current-password" : "new-password"}
+              className="w-full pr-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
+            />
+            <button
+              type="button"
+              onClick={() => setShowPwd((s) => !s)}
+              className="absolute inset-y-0 right-2 my-auto text-sm px-2 py-1 rounded hover:bg-gray-100"
+              aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
+            >
+              {showPwd ? "Ocultar" : "Mostrar"}
+            </button>
+          </div>
-          {/* (old input removed) */}
         </div>

         <input name="flow" type="hidden" value={flow} />

         {/* Include country ONLY on signUp – does nothing on signIn */}
         {flow === "signUp" && (
             <input name="country" type="hidden" value={countryGuess} />
         )}

         {/* Cloudflare Turnstile widget */}
-        <div
-          className="cf-turnstile"
-          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
-          data-action={flow}
-          data-retry="auto"
-        />
+        <div
+          key={flow} // Force remount when switching tabs so token/action are fresh
+          ref={tsRef}
+          className="cf-turnstile min-h-[70px]" // reserve space; avoids layout shift
+          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
+          data-action={flow}
+          data-retry="auto"
+          data-refresh-expired="auto"
+        />

         <button
           type="submit"
           disabled={isLoading}
           className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isLoading ? "Cargando..." : (flow === "signIn" ? "Iniciar sesión" : "Crear cuenta")}
         </button>
       </form>

       {flow === "signIn" && (
         <div className="mt-6 text-center">
           <a className="text-blue-500 hover:text-blue-600 text-sm" href="/reset-password">
             ¿Olvidaste tu contraseña?
           </a>
         </div>
       )}
     </main>
   );
 }
```

---

## Why these changes fix your issues

* **Password visibility (Problem #1):**
  The field is now `type="text"` by default (with a clear **Mostrar/Ocultar** toggle). Minimal code; no extra libs.

* **Turnstile missing (Problem #2):**

    * Load the script **right after hydration** (`afterInteractive`) so it consistently initializes on the first paint.
    * The widget container now has `key={flow}`, forcing a **fresh mount** when switching tabs—this prevents stale or missing widgets when `data-action` changes.
    * The small `useEffect` calls `turnstile.render(...)` if auto‑render didn’t fire (rare race condition on SPA pages). This is a no-op if the iframe already exists.

* **Default tab (Problem #3):**
  `useState("signUp")` makes **Register** the first view, while keeping your toggle logic unchanged.

* **Country not set (Problem #4):**
  Previously, if `countryGuess` wasn’t ready the moment `isAuthenticated` flipped, you cleared the `justSignedUp` flag and **never** retried—so the country stayed empty.
  Now we:

    * Call `ensureCountry({ country: countryGuess || undefined })` once right after sign‑up to **create the profile row** cheaply, even if the country isn’t known yet.
    * When `countryGuess` later arrives, the effect runs **one more time** to set it—thanks to the flag staying `true` until we have a value.
    * Max **2 DB mutations** on first sign‑up; zero calls on normal sign‑in.

---

## Small checklist to avoid surprises

* Ensure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is defined at build time.
* If you ever render this page via a client-side route transition, our explicit `render(...)` still covers the race condition.
* For local development (no geo headers), `/api/geo` returns an empty string; the logic will still work and will set the country when deployed.


