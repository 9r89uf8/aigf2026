"use client";

import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CheckoutSuccessPage() {
  const verify = useAction(api.payments_actions.checkoutVerify);
  const [state, setState] = useState({
    loading: true,
    success: false,
    premiumUntil: 0,
    alreadyProcessed: false,
    error: null
  });

  useEffect(() => {
    const handleVerification = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const returnTo = urlParams.get("returnTo");

      if (!sessionId) {
        setState({
          loading: false,
          success: false,
          premiumUntil: 0,
          alreadyProcessed: false,
          error: "No session ID found. Invalid checkout session."
        });
        return;
      }

      try {
        const result = await verify({ sessionId });
        setState({
          loading: false,
          success: true,
          premiumUntil: result.premiumUntil,
          alreadyProcessed: result.alreadyProcessed,
          error: null,
          returnTo
        });
      } catch (err) {
        console.error("Payment verification failed:", err);
        setState({
          loading: false,
          success: false,
          premiumUntil: 0,
          alreadyProcessed: false,
          error: err.message || "Payment verification failed. Please contact support."
        });
      }
    };

    handleVerification();
  }, [verify]);

  if (state.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Confirming your purchase...</h1>
          <p className="text-gray-600">Please wait while we verify your payment.</p>
        </div>
      </main>
    );
  }

  if (!state.success) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            {state.error}
          </p>
          <div className="space-y-3">
            <a
              href="/plans"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </a>
            <a
              href="/account"
              className="block w-full text-gray-600 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Go to Account
            </a>
          </div>
        </div>
      </main>
    );
  }

  const expiryDate = new Date(state.premiumUntil);
  const isValidDate = !isNaN(expiryDate.getTime());

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="text-green-500 text-6xl mb-4">🎉</div>

        <h1 className="text-3xl font-bold mb-2 text-green-600">
          {state.alreadyProcessed ? "Payment Confirmed!" : "Thank You!"}
        </h1>

        <p className="text-lg text-gray-700 mb-6">
          {state.alreadyProcessed
            ? "Your payment has already been processed."
            : "Your payment was successful!"}
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-green-800 mb-2">Premium Status</h2>
          <p className="text-green-700">
            Your premium access is active until{" "}
            <strong>
              {isValidDate
                ? expiryDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "Invalid date"}
            </strong>
          </p>
        </div>

        <div className="space-y-3">
          {state.returnTo ? (
            <a
              href={state.returnTo}
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Continue
            </a>
          ) : (
            <a
              href="/"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Start Chatting
            </a>
          )}

          <a
            href="/account"
            className="block w-full text-gray-600 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            View Account Details
          </a>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Need help? Contact our{" "}
            <a href="/support" className="text-blue-600 hover:underline">
              support team
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}