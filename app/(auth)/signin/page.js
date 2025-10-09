// app/(auth)/signin/page.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const [flow, setFlow] = useState("signUp");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countryGuess, setCountryGuess] = useState("");
  const [showPwd, setShowPwd] = useState(true);

  const verifyTurnstile = useAction(api.turnstile.verify);
  const ensureCountry = useMutation(api.profile.ensureCountry);
  const justSignedUp = useRef(false);

  const tsRef = useRef(null);
  const widgetId = useRef(null);
  const [tsSize, setTsSize] = useState("normal"); // NEW: pick compact on tiny screens

  useEffect(() => {
    // Light-weight, server-sourced country
    fetch("/api/geo")
        .then((r) => r.json())
        .then(({ country }) => setCountryGuess(country || ""))
        .catch(() => setCountryGuess(""));
  }, []);

  // Pick Turnstile size based on viewport width
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTsSize(window.innerWidth <= 360 ? "compact" : "normal");
    }
  }, []);

  // Run AFTER Convex auth is live
  useEffect(() => {
    if (!justSignedUp.current || !isAuthenticated) return;
    (async () => {
      try {
        await ensureCountry({ country: countryGuess || undefined });
      } catch {
        // ignore
      } finally {
        if (countryGuess) {
          justSignedUp.current = false;
        }
      }
    })();
  }, [isAuthenticated, countryGuess, ensureCountry]);

  // Turnstile lifecycle with retry logic
  useEffect(() => {
    const el = tsRef.current;
    if (!el || typeof window === "undefined") return;

    const timeouts = [];
    const tryRender = () => {
      if (!window.turnstile) return false;
      if (widgetId.current !== null) return true;
      try {
        widgetId.current = window.turnstile.render(el, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          action: flow,
          retry: "auto",
          "refresh-expired": "auto",
          size: tsSize, // NEW
        });
        return true;
      } catch {
        return false;
      }
    };

    if (!tryRender()) {
      [100, 250, 500, 1000, 2000].forEach((delay) => {
        timeouts.push(setTimeout(() => { tryRender(); }, delay));
      });
    }

    return () => {
      timeouts.forEach(clearTimeout);
      if (widgetId.current !== null) {
        try { window.turnstile?.remove(widgetId.current); } catch {}
        widgetId.current = null;
      }
    };
  }, [flow, tsSize]); // include tsSize so it re-renders if needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const fd = new FormData(e.currentTarget);
      const ts = fd.get("cf-turnstile-response");
      await verifyTurnstile({ token: String(ts || "") });

      if (flow === "signUp" && countryGuess) {
        fd.set("country", countryGuess);
      }

      await signIn("password", fd);

      if (flow === "signUp") {
        justSignedUp.current = true;
      }
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
      <main className="min-h-dvh w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-sm px-4 sm:px-6 pt-8 pb-[90px]">
          {/* Tab-style toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
                type="button"
                onClick={() => { setFlow("signUp"); setError(""); }}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium text-[19px] transition-all ${
                    flow === "signUp" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Crear Cuenta
            </button>
            <button
                type="button"
                onClick={() => { setFlow("signIn"); setError(""); }}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium text-[19px] transition-all ${
                    flow === "signIn" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Iniciar Sesión
            </button>
          </div>

          <h1 className="text-3xl font-semibold mb-6 text-center">
            {flow === "signIn" ? "Bienvenido de nuevo" : "Crear una cuenta"}
          </h1>

          {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-[19px]">
                {error}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[19px] font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-[19px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[19px] font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    placeholder={flow === "signIn" ? "Ingresa tu contraseña" : "Elige una contraseña (8+ caracteres)"}
                    required
                    minLength={8}
                    autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                    className="w-full pr-24 px-3 py-2 border border-gray-300 rounded-md text-[19px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto text-base px-2 py-1 rounded hover:bg-gray-100"
                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <input name="flow" type="hidden" value={flow} />
            {flow === "signUp" && <input name="country" type="hidden" value={countryGuess} />}

            {/* Turnstile */}
            <div className="w-full flex justify-center">
              <div
                  key={`${flow}-${tsSize}`}
                  ref={tsRef}
                  className="inline-block min-h-[70px]"
              />
            </div>


            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-500 text-white text-[19px] rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Cargando..." : (flow === "signIn" ? "Iniciar sesión" : "Crear cuenta")}
            </button>
          </form>

          {flow === "signIn" && (
              <div className="mt-6 text-center">
                <a className="text-blue-500 hover:text-blue-600 text-[19px]" href="/reset-password">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
          )}
        </div>
      </main>
  );
}
