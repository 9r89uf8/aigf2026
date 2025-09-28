"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ResetPasswordPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const verifyTurnstile = useAction(api.turnstile.verify);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData(e.currentTarget);

      // 1) Server-verify Turnstile
      const ts = fd.get("cf-turnstile-response");
      await verifyTurnstile({ token: String(ts || "") });

      // 2) Proceed with reset request
      await signIn("password", fd);
      setEmail(fd.get("email"));
      setSuccess("Check your email for the reset code");
    } catch (err) {
      setError("Failed to send reset code. Please check your email and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const fd = new FormData(e.currentTarget);
      await signIn("password", fd);
      setSuccess("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm p-6 mt-20">
      <h1 className="text-2xl font-semibold mb-6 text-center">Reset your password</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4 text-sm">
          {success}
        </div>
      )}

      {!email ? (
        // Step 1: request code
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
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

          <input name="flow" type="hidden" value="reset" />

          {/* Protect the reset request with Turnstile too */}
          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            data-action="reset"
            data-retry="auto"
          />

          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send reset code"}
          </button>
        </form>
      ) : (
        // Step 2: verify + set new password
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Reset code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              placeholder="Enter the 8-digit code"
              required
              autoComplete="one-time-code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Choose a new password (8+ chars)"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <input name="email" type="hidden" value={email} />
          <input name="flow" type="hidden" value="reset-verification" />

          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail(null);
              setError("");
              setSuccess("");
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <a className="text-blue-500 hover:text-blue-600 text-sm" href="/signin">
          Back to sign in
        </a>
      </div>
    </main>
  );
}