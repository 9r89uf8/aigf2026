Awesome—here are **minimal, copy‑paste diffs** that implement exactly what you asked:

* **Chat page**

    * When the user runs out of free messages, show a **conversion‑friendly banner**: “**Premium starts at …**” using the **cheapest plan** for that user’s country (if logged in) or the cheapest among **MX / ES / AR** (if not).
    * Include little **trust badges** (“Secure checkout”, “One‑time payment”, “Powered by Stripe”) with icons.

---

## 2) `app/chat/[conversationId]/page.js` — patch

```diff
--- a/app/chat/[conversationId]/page.js
+++ b/app/chat/[conversationId]/page.js
@@ -1,10 +1,13 @@
 "use client";
 import { useParams, useRouter } from "next/navigation";
-import { useQuery, useMutation, useAction } from "convex/react";
+import { useQuery, useMutation, useAction } from "convex/react";
 import { api } from "@/convex/_generated/api";
 import { useEffect, useRef, useState } from "react";
 import { useInvisibleTurnstile } from "@/components/useInvisibleTurnstile";
 import { useSignedMediaUrls } from "@/components/chat/useSignedMediaUrls";
 import MediaComposer from "@/components/chat/MediaComposer";
 import AudioComposer from "@/components/chat/AudioComposer";
+import { currencyForCountry, formatMoney } from "@/app/lib/currency";
 
@@ -63,6 +66,12 @@ export default function ConversationPage() {
   const clearConversation = useMutation(api.chat.clearConversation);
 
+  // For upsell banner (cheapest plan)
+  const listPlans = useAction(api.payments_actions.listPlansCached);
+  const me = useQuery(api.profile.getMine);
+  const [plans, setPlans] = useState([]);
+  const CURRENCIES_OK = ["EUR", "MXN", "ARS"];
+  const CURRENCY_TO_COUNTRY = { EUR: "Spain", MXN: "Mexico", ARS: "Argentina" };
   const [text, setText] = useState("");
   const [isSending, setIsSending] = useState(false);
   const [permit, setPermit] = useState(null); // { permitId, usesLeft, expiresAt }
@@ -89,6 +98,18 @@ export default function ConversationPage() {
   useEffect(() => { signBatchRef.current = signBatch; }, [signBatch]);
 
   // Serialize turnstile execute() calls
   const tokenInFlightRef = useRef(null);
   async function acquireToken() {
@@ -148,6 +169,55 @@ export default function ConversationPage() {
     return () => { cancelled = true; };
   }, [data?.girlAvatarKey]);
 
+  // Load plans (once) for the upsell computation
+  useEffect(() => {
+    let cancelled = false;
+    (async () => {
+      try {
+        const r = await listPlans();
+        if (!cancelled) setPlans(r || []);
+      } catch {
+        // silently ignore
+      }
+    })();
+    return () => { cancelled = true; };
+  }, [listPlans]);
+
+  // Determine the user's selected currency (only the ones we show)
+  const selectedCurrency = (() => {
+    const ctry = me?.profile?.country;
+    const cur = ctry ? currencyForCountry(ctry) : null;
+    return cur && CURRENCIES_OK.includes(cur) ? cur : null;
+  })();
+
+  // Find the cheapest plan for desired currencies
+  function cheapest(plansArr, wantedCurrencies) {
+    let best = null;
+    for (const p of plansArr || []) {
+      const localized = Object.fromEntries(
+        Object.entries(p.localized || {})
+          .map(([k, v]) => [k.toUpperCase(), v])
+          .filter(([_, v]) => v != null)
+      );
+      for (const cur of wantedCurrencies) {
+        const v = localized[cur];
+        if (v != null && (best === null || v < best.amount)) {
+          best = { amount: v, currency: cur };
+        }
+      }
+    }
+    return best; // { amount, currency } or null
+  }
+
+  const cheapestForUser = selectedCurrency
+    ? cheapest(plans, [selectedCurrency])
+    : cheapest(plans, CURRENCIES_OK);
+
+  const cheapestLabel = cheapestForUser
+    ? formatMoney(cheapestForUser.currency, cheapestForUser.amount)
+    : null;
+  const cheapestCountry = cheapestForUser ? CURRENCY_TO_COUNTRY[cheapestForUser.currency] : null;
+
   // Auto-hide delete button after 5 seconds
   useEffect(() => {
     if (showDeleteButton) {
@@ -343,13 +413,64 @@ export default function ConversationPage() {
         <div ref={bottomRef} />
       </div>
 
-      {!data?.premiumActive && quotaOut && (
-        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-sm">
-          Free text messages for this girl are used up.{" "}
-          <a href="/plans" className="text-blue-600 underline font-medium">Upgrade</a> for unlimited messages.
-        </div>
-      )}
+      {!data?.premiumActive && quotaOut && (
+        <div className="px-4 py-3 border-t bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200">
+          <div className="flex items-center justify-between gap-3">
+            <div className="min-w-0">
+              <div className="text-sm text-gray-900">
+                Free messages are used up.
+                {" "}
+                <span className="font-semibold">
+                  Premium starts at{" "}
+                  {cheapestLabel ? (
+                    <>
+                      {cheapestLabel}
+                      {!selectedCurrency && cheapestCountry ? ` in ${cheapestCountry}` : ""}
+                    </>
+                  ) : (
+                    "our lowest regional price"
+                  )}
+                  .
+                </span>
+              </div>
+              {/* Trust badges */}
+              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
+                <span className="inline-flex items-center gap-1">
+                  {/* Lock */}
+                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M6 10V8a6 6 0 1112 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1h1zm2 0h8V8a4 4 0 10-8 0v2z" fill="currentColor"/></svg>
+                  Secure checkout
+                </span>
+                <span className="inline-flex items-center gap-1">
+                  {/* Shield */}
+                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M12 2l8 4v6c0 5-3.4 9.3-8 10-4.6-.7-8-5-8-10V6l8-4z" fill="currentColor"/></svg>
+                  One‑time payment
+                </span>
+                <span className="inline-flex items-center gap-1">
+                  {/* Card */}
+                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M3 5h18a2 2 0 012 2v1H1V7a2 2 0 012-2zm-2 6h22v6a2 2 0 01-2 2H3a2 2 0 01-2-2v-6zm4 4h6v2H5v-2z" fill="currentColor"/></svg>
+                  Powered by Stripe
+                </span>
+              </div>
+            </div>
+            <a
+              href="/plans"
+              className="flex-shrink-0 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
+            >
+              See plans
+            </a>
+          </div>
+        </div>
+      )}
 
       {/* Instagram-style input area */}
       <div className="px-4 py-3 border-t border-gray-200 bg-white" >
```

**What this does**

* Loads the **cached plans** and computes the **cheapest** price:

    * If the user is logged in **and** we know their country → show the lowest **in that currency** (EUR/MXN/ARS only).
    * Otherwise → show the lowest among **EUR / MXN / ARS**, with the **country name**.
* Replaces the old generic banner with a **conversion‑focused upsell** + trust badges.

---

### Notes / tiny gotchas

* The plans action you already have (`listPlansCached`) exposes `localized` amounts. If any country doesn’t have a configured `currency_option` for a product, its entry will be `null`. The code above **filters nulls** so you never show a blank price.


