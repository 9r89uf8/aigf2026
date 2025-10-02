//app/(auth)/signin/page.js
"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const verifyTurnstile = useAction(api.turnstile.verify);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const fd = new FormData(e.currentTarget);

      // 1) Server-verify Turnstile
      const ts = fd.get("cf-turnstile-response");
      await verifyTurnstile({ token: String(ts || "") });

      // 2) Proceed with Convex Auth
      await signIn("password", fd);
      // Let auth state/middleware handle navigation
    } catch (err) {
      const generic = flow === "signIn"
        ? "Sign in failed. Check your email/password and try again."
        : "Could not create account. Try a different email or try again.";
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
          Create Account
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
          Sign In
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6 text-center">
        {flow === "signIn" ? "Welcome back" : "Join AI Girls"}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder={flow === "signIn" ? "Enter your password" : "Choose a password (8+ chars)"}
            required
            minLength={8}
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <input name="flow" type="hidden" value={flow} />

        {/* Cloudflare Turnstile widget inside the form so it posts cf-turnstile-response */}
        <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-action={flow}
          data-retry="auto"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : (flow === "signIn" ? "Sign in" : "Create account")}
        </button>
      </form>

      {flow === "signIn" && (
        <div className="mt-6 text-center">
          <a className="text-blue-500 hover:text-blue-600 text-sm" href="/reset-password">
            Forgot your password?
          </a>
        </div>
      )}
    </main>
  );
}