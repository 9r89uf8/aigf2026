// app/(auth)/signin/page.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const [flow, setFlow] = useState("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countryGuess, setCountryGuess] = useState("");  // NEW
  const verifyTurnstile = useAction(api.turnstile.verify);
  const ensureCountry = useMutation(api.profile.ensureCountry); // NEW
  const justSignedUp = useRef(false);

  useEffect(() => {
    // Light-weight, server-sourced country
    fetch("/api/geo")
        .then((r) => r.json())
        .then(({ country }) => setCountryGuess(country || ""))
        .catch(() => setCountryGuess(""));
  }, []);

  // Run AFTER Convex auth is live so the mutation is authenticated
  useEffect(() => {
    if (!justSignedUp.current) return;
    if (!isAuthenticated) return;
    if (!countryGuess) { justSignedUp.current = false; return; }
    (async () => {
      try {
        await ensureCountry({ country: countryGuess });
      } catch (e) {
        // non-fatal; ignore
      } finally {
        justSignedUp.current = false;
      }
    })();
  }, [isAuthenticated, countryGuess, ensureCountry]);

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
          <input
            id="password"
            name="password"
            type="password"
            placeholder={flow === "signIn" ? "Ingresa tu contraseña" : "Elige una contraseña (8+ caracteres)"}
            required
            minLength={8}
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <input name="flow" type="hidden" value={flow} />

        {/* Include country ONLY on signUp – does nothing on signIn */}
        {flow === "signUp" && (
            <input name="country" type="hidden" value={countryGuess} />
        )}

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