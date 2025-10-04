You’re hitting this because `ensureCountry` is being called **before the Convex client has an authenticated token**. Immediately after `await signIn("password", fd)`, the auth cookie has been set, but the Convex React client hasn’t finished fetching/validating the token yet—so `getAuthUserId(ctx)` returns `null` and your mutation throws **“Unauthenticated.”**

Convex’s docs recommend gating any “do something right after sign‑in” work on the **`useConvexAuth()`** hook, which flips to `isAuthenticated=true` only after the browser has fetched the token and the backend has validated it. ([docs.convex.dev][1])

Below is a **drop‑in fix** plus a belt‑and‑suspenders fallback so you can’t miss setting the country.

---

## ✅ Fix: wait for `useConvexAuth().isAuthenticated` before calling the mutation

**What changes:**

* Don’t call `ensureCountry` inside `handleSubmit`.
* Instead, mark that a sign‑up just happened, and run `ensureCountry` in an effect that watches `isAuthenticated`.
* This guarantees the Convex client is carrying a valid token by the time your mutation runs. ([docs.convex.dev][1])

### Patch for `app/(auth)/signin/page.js`

```diff
 "use client";

-import { useEffect, useState } from "react";
+import { useEffect, useRef, useState } from "react";
 import { useAuthActions } from "@convex-dev/auth/react";
-import { useAction, useMutation } from "convex/react";
+import { useAction, useMutation, useConvexAuth } from "convex/react";
 import { api } from "../../../convex/_generated/api";

 export default function SignInPage() {
   const { signIn } = useAuthActions();
+  const { isAuthenticated } = useConvexAuth(); // ← ensures Convex token is ready
   const [flow, setFlow] = useState("signIn");
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState("");
   const [countryGuess, setCountryGuess] = useState("");  // NEW
   const verifyTurnstile = useAction(api.turnstile.verify);
   const ensureCountry = useMutation(api.profile.ensureCountry); // NEW
+  const justSignedUp = useRef(false); // tracks a signUp that needs country set

   useEffect(() => {
     fetch("/api/geo")
       .then((r) => r.json())
       .then(({ country }) => setCountryGuess(country || ""))
       .catch(() => setCountryGuess(""));
   }, []);

+  // Run AFTER Convex auth is live so the mutation is authenticated
+  useEffect(() => {
+    if (!justSignedUp.current) return;
+    if (!isAuthenticated) return;
+    if (!countryGuess) { justSignedUp.current = false; return; }
+    (async () => {
+      try {
+        await ensureCountry({ country: countryGuess });
+      } catch (e) {
+        // non-fatal; ignore
+      } finally {
+        justSignedUp.current = false;
+      }
+    })();
+  }, [isAuthenticated, countryGuess, ensureCountry]);

   const handleSubmit = async (e) => {
     e.preventDefault();
     setIsLoading(true);
     setError("");

     try {
       const fd = new FormData(e.currentTarget);

       // 1) Server-verify Turnstile
       const ts = fd.get("cf-turnstile-response");
       await verifyTurnstile({ token: String(ts || "") });

       // 2) Add country to form only for signUp (optional, harmless)
       if (flow === "signUp" && countryGuess) {
         fd.set("country", countryGuess);
       }

       // 3) Proceed with Convex Auth
       await signIn("password", fd);
-
-      // 4) Persist country ONCE (no extra UI, idempotent)
-      if (flow === "signUp" && countryGuess) {
-        try { await ensureCountry({ country: countryGuess }); } catch {}
-      }
+      // 4) Flag for post-auth effect to run ensureCountry when isAuthenticated flips
+      if (flow === "signUp") {
+        justSignedUp.current = true;
+      }
       // Let auth state/middleware handle navigation
     } catch (err) {
       const generic =
         flow === "signIn"
           ? "Sign in failed. Check your email/password and try again."
           : "Could not create account. Try a different email or try again.";
       setError(generic);
     } finally {
       setIsLoading(false);
     }
   };
```

> Why this works: `useConvexAuth()` sets `isAuthenticated` only after the browser has fetched the Convex token and the Convex backend has validated it. That’s the earliest moment a mutation like `ensureCountry` will see a non‑null `getAuthUserId(ctx)`. ([docs.convex.dev][1])

---

## 🧷 Safety net: also set country on the first authenticated page view

In case middleware navigates away from the sign‑in page before the effect fires, add a tiny “ensure once” to any page you always hit post‑auth (e.g., **Account**). It’s idempotent and cheap.

### Minimal add to `AccountForm` (optional but robust)

```diff
 // inside AccountForm component
 import { useAction, useMutation, useQuery } from "convex/react";
 import { api } from "../convex/_generated/api";
+import { useEffect, useState } from "react";

+const getCountryGuess = async () => {
+  try { const r = await fetch("/api/geo"); const { country } = await r.json(); return country || ""; }
+  catch { return ""; }
+};

 export default function AccountForm() {
   const data = useQuery(api.profile.getMine);
+  const ensureCountry = useMutation(api.profile.ensureCountry);

+  const [countryGuess, setCountryGuess] = useState("");
+  useEffect(() => { getCountryGuess().then(setCountryGuess); }, []);
+  useEffect(() => {
+    if (!data?.profile) return;
+    if (data.profile.country) return;
+    if (!countryGuess) return;
+    ensureCountry({ country: countryGuess }).catch(() => {});
+  }, [data?.profile?.country, countryGuess, ensureCountry]);
```

This way, even if the post‑sign‑up effect is skipped by a fast redirect, the country is set **the first time** the user lands on a signed‑in page.

---

## Other quick checks (if it still says Unauthenticated)

1. **Provider wiring**: Ensure your app is wrapped in **`<ConvexProviderWithAuth>`** from `@convex-dev/auth/react` and that your `ConvexReactClient` is the one it manages. If the provider is missing (or there are two clients), mutations won’t carry tokens. ([docs.convex.dev][2])
2. **Call site**: Make sure you aren’t calling `ensureCountry` from anywhere that can run **before** auth initializes (e.g., immediately on mount in the sign‑in page without the `isAuthenticated` guard).
3. **Network tab**: If you want to be extra sure, watch the Convex request that calls `profile:ensureCountry`—it should appear **after** a token fetch. Convex’s auth debugging guide suggests checking the traffic to confirm the token is being sent. ([docs.convex.dev][3])

---

### Why not set it inside the sign‑up request itself?

You can—using Convex Auth **callbacks**. If you prefer 100% server‑side, use `callbacks.afterUserCreatedOrUpdated` to write `profiles.country` during account creation (and read `country` from your submitted `FormData`). It runs as part of the auth flow, before the token is returned. This removes all client‑side races; it’s a great follow‑up once things are stable. ([Convex Labs][4])

---

That should stop the “Unauthenticated” errors and reliably capture the user’s country.

[1]: https://docs.convex.dev/auth/authkit?utm_source=chatgpt.com "Convex & WorkOS AuthKit | Convex Developer Hub"
[2]: https://docs.convex.dev/auth?utm_source=chatgpt.com "Authentication | Convex Developer Hub"
[3]: https://docs.convex.dev/auth/debug?utm_source=chatgpt.com "Debugging Authentication | Convex Developer Hub"
[4]: https://labs.convex.dev/auth/advanced?utm_source=chatgpt.com "Advanced: Details - Convex Auth"
