// app/plans/page.js
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { currencyForCountry, formatMoney} from "@/app/lib/currency";

export default function PlansPage() {
  const listPlans = useAction(api.payments_actions.listPlansCached);
  const start = useAction(api.payments_actions.checkoutStart);
  const router = useRouter();

  // Logged-in profile (has country when set at sign-up)
  const me = useQuery(api.profile.getMine); // returns { email, profile: { country, ... } } or null
  const isLoggedIn = !!me;
  const hasCountry = !!me?.profile?.country;

  // Only display these three when not logged in
  const PUBLIC_DISPLAY = [
    { currency: "MXN", country: "México" },
    { currency: "EUR", country: "España" },
    { currency: "ARS", country: "Argentina" },
  ];
  const PUBLIC_CODES = new Set(PUBLIC_DISPLAY.map(p => p.currency));
  const COUNTRY_BY_CURRENCY = Object.fromEntries(PUBLIC_DISPLAY.map(p => [p.currency, p.country]));

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listPlans()
        .then(setPlans)
        .catch(() => setError("Error al cargar planes. Por favor intenta más tarde."))
        .finally(() => setLoading(false));
  }, [listPlans]);

  async function buy(productId) {
    try {
      const { url } = await start({ productId });
      window.location.href = url;
    } catch {
      alert("Error al iniciar pago. Por favor intenta de nuevo.");
    }
  }

  const selectedCurrency = useMemo(() => {
    const country = me?.profile?.country;
    return country ? currencyForCountry(country) : null;
  }, [me]);

  if (loading) {
    return (
        <main className="mx-auto max-w-screen-md p-6">
          <div className="text-center">Cargando planes...</div>
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

  const explain = (isLoggedIn && hasCountry && selectedCurrency && PUBLIC_CODES.has(selectedCurrency))
    ? `Precios mostrados para ${COUNTRY_BY_CURRENCY[selectedCurrency]}.`
    : `No has iniciado sesión — mostrando precios para México, España y Argentina.`;

  return (
      <main className="mx-auto max-w-screen-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Planes Premium</h1>
          <p className="text-gray-600 mb-3">{explain}</p>
          <p className="text-sm text-blue-600">
            <Link href="/novia-virtual#preguntas-usuarios" className="font-semibold hover:underline">
              Resuelve dudas comunes sobre novia virtual gratis antes de elegir un plan
            </Link>
          </p>
        </div>

        {plans.length === 0 ? (
            <div className="text-center text-gray-600">
              No hay planes disponibles en este momento. Por favor vuelve más tarde.
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                // Build a currency→amount map, but **exclude USD** entirely
                const localized = Object.fromEntries(
                  Object.entries(plan.localized || {})
                    .map(([k, v]) => [k.toUpperCase(), v])
                    .filter(([_, v]) => v != null)
                );
                // Never show the base USD price
                const priceMap = { ...localized }; // no USD

                // Determine which currencies to render
                const renderSingle =
                  (isLoggedIn && hasCountry && selectedCurrency && PUBLIC_CODES.has(selectedCurrency) && priceMap[selectedCurrency] != null);

                // When not logged in, only show MX/EU/AR (country names)
                const visiblePublic = PUBLIC_DISPLAY
                  .filter(p => priceMap[p.currency] != null);

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
                                {plan.durationDays} día{plan.durationDays !== 1 ? "s" : ""} de acceso
                              </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-700">
                              <div className="grid grid-cols-1 gap-2">
                                {visiblePublic.map(({ currency, country }) => (
                                  <div key={currency} className="flex items-center justify-between rounded-md border px-3 py-2">
                                    <span className="font-medium">{country}</span>
                                    <span className="tabular-nums">
                                      {formatMoney(currency, priceMap[currency])}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {plan.durationDays} día{plan.durationDays !== 1 ? "s" : ""} de acceso
                              </div>
                            </div>
                        )}

                        {plan.features?.length > 0 && (
                            <div>
                              <h3 className="font-medium text-sm mb-2">Características incluidas:</h3>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="text-green-500 mr-2">✓</span>
                                      {feature}
                                    </li>
                                ))}
                              </ul>
                            </div>
                        )}

                        {/*
                          Button text:
                          - "Buy Now" if logged in AND has country (regardless of which country)
                          - "Check Price" otherwise
                        */}
                        <button
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
                            onClick={() => {
                              if (isLoggedIn && hasCountry) {
                                buy(plan.productId);
                              } else {
                                router.push("/signin?next=/plans");
                              }
                            }}
                        >
                          {(isLoggedIn && hasCountry) ? "Comprar Ahora" : "Ver Precio"}
                        </button>
                      </div>
                    </div>
                );
              })}
            </div>
        )}

        <div className="text-center mt-8">
          <a href="/account" className="text-blue-600 hover:text-blue-800 underline">
            ← Volver a Cuenta
          </a>
        </div>
      </main>
  );
}
