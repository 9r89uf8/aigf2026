--- a/app/plans/page.js
+++ b/app/plans/page.js
@@ -1,15 +1,33 @@
"use client";

-import React, { useState, useEffect, useMemo } from "react";
+import React, { useState, useEffect, useMemo } from "react";
+import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { currencyForCountry, formatMoney} from "@/app/lib/currency";

export default function PlansPage() {
const listPlans = useAction(api.payments_actions.listPlansCached);
const start = useAction(api.payments_actions.checkoutStart);
+  const router = useRouter();

   // Logged-in profile (has country when set at sign-up)
   const me = useQuery(api.profile.getMine); // returns { email, profile: { country, ... } } or null
+  const isLoggedIn = !!me;
+  const hasCountry = !!me?.profile?.country;
+
+  // Only display these three when not logged in
+  const PUBLIC_DISPLAY = [
+    { currency: "MXN", country: "Mexico" },
+    { currency: "EUR", country: "Spain" },
+    { currency: "ARS", country: "Argentina" },
+  ];
+  const PUBLIC_CODES = new Set(PUBLIC_DISPLAY.map(p => p.currency));
+  const COUNTRY_BY_CURRENCY = Object.fromEntries(PUBLIC_DISPLAY.map(p => [p.currency, p.country]));

   const [plans, setPlans] = useState([]);
   const [loading, setLoading] = useState(true);
   @@ -40,19 +58,28 @@
   const selectedCurrency = useMemo(() => {
   const country = me?.profile?.country;
   return country ? currencyForCountry(country) : null;
   }, [me]);

   if (loading) {
   return (
   <main className="mx-auto max-w-screen-md p-6">
   <div className="text-center">Loading plans...</div>
   </main>
   );
   }
   if (error) {
   return (
   <main className="mx-auto max-w-screen-md p-6">
   <div className="text-center text-red-600">{error}</div>
   </main>
   );
   }

-  const explain =
-      selectedCurrency
-          ? `Prices shown in your local currency (${selectedCurrency}).`
-          : `Not signed in—showing all available currencies per plan.`;
+  const explain = (isLoggedIn && hasCountry && selectedCurrency && PUBLIC_CODES.has(selectedCurrency))
+    ? `Prices shown for ${COUNTRY_BY_CURRENCY[selectedCurrency]}.`
+    : `Not signed in — showing prices for Mexico, Spain and Argentina.`;

return (
<main className="mx-auto max-w-screen-md p-6 space-y-6">
@@ -67,42 +94,77 @@
<div className="text-center text-gray-600">
No plans available at the moment. Please check back later.
</div>
) : (
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
{plans.map((plan) => {
-                // Build a currency→amount map: base + localized overrides
-                const base = { [plan.currency.toUpperCase()]: plan.unitAmount };
-                const localized = Object.fromEntries(
-                    Object.entries(plan.localized || {}).map(([k, v]) => [k.toUpperCase(), v])
-                );
-                const priceMap = { ...base, ...localized };
+                // Build a currency→amount map, but **exclude USD** entirely
+                const localized = Object.fromEntries(
+                  Object.entries(plan.localized || {})
+                    .map(([k, v]) => [k.toUpperCase(), v])
+                    .filter(([_, v]) => v != null)
+                );
+                // Never show the base USD price
+                const priceMap = { ...localized }; // no USD

-                const allCurrencies = Object.keys(priceMap);
+                // Determine which currencies to render
+                const renderSingle =
+                  (isLoggedIn && hasCountry && selectedCurrency && PUBLIC_CODES.has(selectedCurrency) && priceMap[selectedCurrency] != null);

-                const renderSingle =
-                    selectedCurrency && priceMap[selectedCurrency] != null;
+                // When not logged in, only show MX/EU/AR (country names)
+                const visiblePublic = PUBLIC_DISPLAY
+                  .filter(p => priceMap[p.currency] != null);

                 return (
                     <div key={plan.productId} className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                       {plan.image && (
                           <img
                               src={plan.image}
                               alt={plan.name}
                               className="w-full h-32 object-cover rounded-md mb-4"
                           />
                       )}

                       <div className="space-y-4">
                         <div>
                           <h2 className="text-xl font-semibold">{plan.name}</h2>
                           {plan.description && (
                               <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                           )}
                         </div>

                         {/* Price */}
                         {renderSingle ? (
                             <div className="text-center">
                               <div className="text-3xl font-bold text-blue-600">
                                 {formatMoney(selectedCurrency, priceMap[selectedCurrency])}
                               </div>
                               <div className="text-sm text-gray-500">
                                 {plan.durationDays} day{plan.durationDays !== 1 ? "s" : ""} access
                               </div>
                             </div>
                         ) : (
-                            <div className="text-sm text-gray-700">
-                              <div className="grid grid-cols-2 gap-2">
-                                {allCurrencies.map((ccy) => (
-                                    <div key={ccy} className="flex items-center justify-between rounded-md border px-3 py-2">
-                                      <span className="font-medium">{ccy}</span>
-                                      <span className="tabular-nums">
-                              {formatMoney(ccy, priceMap[ccy])}
-                            </span>
-                                    </div>
-                                ))}
-                              </div>
-                              <div className="text-xs text-gray-500 mt-2">
-                                {plan.durationDays} day{plan.durationDays !== 1 ? "s" : ""} access
-                              </div>
-                            </div>
+                            <div className="text-sm text-gray-700">
+                              <div className="grid grid-cols-1 gap-2">
+                                {visiblePublic.map(({ currency, country }) => (
+                                  <div key={currency} className="flex items-center justify-between rounded-md border px-3 py-2">
+                                    <span className="font-medium">{country}</span>
+                                    <span className="tabular-nums">
+                                      {formatMoney(currency, priceMap[currency])}
+                                    </span>
+                                  </div>
+                                ))}
+                              </div>
+                              <div className="text-xs text-gray-500 mt-2">
+                                {plan.durationDays} day{plan.durationDays !== 1 ? "s" : ""} access
+                              </div>
+                            </div>
                         )}

+                        {/*
+                          Button text:
+                          - "Buy Now" if logged in AND has country (regardless of which country)
+                          - "Check Price" otherwise
+                        */}
                         <button
                             className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
-                            onClick={() => buy(plan.productId)}
+                            onClick={() => {
+                              if (isLoggedIn && hasCountry) {
+                                buy(plan.productId);
+                              } else {
+                                router.push("/signin?next=/plans");
+                              }
+                            }}
                         >
-                          Buy Now
+                          {(isLoggedIn && hasCountry) ? "Buy Now" : "Check Price"}
                         </button>
                       </div>
                     </div>
                 );
               })}
             </div>
