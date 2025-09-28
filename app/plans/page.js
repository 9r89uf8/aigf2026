"use client";

import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PlansPage() {
  const listPlans = useAction(api.payments_actions.listPlansCached);
  const start = useAction(api.payments_actions.checkoutStart);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch(err => {
        console.error("Failed to load plans:", err);
        setError("Failed to load plans. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [listPlans]);

  async function buy(productId) {
    try {
      const { url } = await start({ productId });
      window.location.href = url;
    } catch (err) {
      console.error("Failed to start checkout:", err);
      alert("Failed to start checkout. Please try again.");
    }
  }

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

  return (
    <main className="mx-auto max-w-screen-md p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Premium Plans</h1>
        <p className="text-gray-600 mb-6">
          Unlock premium features with our affordable plans
        </p>
      </div>

      {plans.length > 0 && (
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            Prices shown in {plans[0]?.currency?.toUpperCase() || "USD"}.
            <br />
            <strong>Final amount is localized at Stripe Checkout</strong> based on your country.
          </p>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center text-gray-600">
          No plans available at the moment. Please check back later.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
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

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {(plan.unitAmount / 100).toFixed(2)} {plan.currency.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {plan.durationDays} day{plan.durationDays !== 1 ? 's' : ''} access
                  </div>
                </div>

                {plan.features?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-2">Features included:</h3>
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

                <button
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => buy(plan.productId)}
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <a
          href="/account"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to Account
        </a>
      </div>
    </main>
  );
}