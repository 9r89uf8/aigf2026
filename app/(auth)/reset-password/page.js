"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { loadTurnstileScriptOnce } from "@/components/useInvisibleTurnstile";

export default function ResetPasswordPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const verifyTurnstile = useAction(api.turnstile.verify);

  // --- Turnstile state/refs ---
  const [tsSize, setTsSize] = useState("normal"); // "normal" | "compact"
  const tsRef = useRef(null);        // container to render into
  const widgetId = useRef(null);     // track widget instance id

  // Pick compact on very small screens (e.g., Galaxy S8 @ 360px)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTsSize(window.innerWidth <= 360 ? "compact" : "normal");
    }
  }, []);

  // Programmatic Turnstile render (centers + reliable load)
  useEffect(() => {
    const el = tsRef.current;
    if (!el || typeof window === "undefined") return;

    let cancelled = false;

    const renderWidget = async () => {
      try {
        await loadTurnstileScriptOnce();
        if (cancelled || widgetId.current !== null || !window.turnstile) return;
        widgetId.current = window.turnstile.render(el, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          action: "reset",
          retry: "auto",
          "refresh-expired": "auto",
          size: tsSize, // "normal" or "compact"
        });
      } catch {
        // ignore; verification will fail and surface a generic error
      }
    };

    renderWidget();

    // cleanup on step change/unmount
    return () => {
      cancelled = true;
      if (widgetId.current !== null) {
        try { window.turnstile?.remove(widgetId.current); } catch {}
        widgetId.current = null;
      }
    };
  }, [tsSize, email]); // re-run when size changes or when returning to step 1

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
      setEmail(String(fd.get("email") || ""));
      setSuccess("Revisa tu correo para el código de recuperación");
    } catch {
      setError("Error al enviar código de recuperación. Verifica tu correo e intenta de nuevo.");
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
      setSuccess("¡Contraseña restablecida exitosamente! Redirigiendo a iniciar sesión...");
      setTimeout(() => router.push("/signin"), 2000);
    } catch {
      setError("Código inválido o expirado. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <main className="min-h-dvh w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-sm px-4 sm:px-6 mt-20 pb-12">
          <h1 className="text-2xl font-semibold mb-6 text-center">Restablecer tu contraseña</h1>

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
                    Correo electrónico
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

                <input name="flow" type="hidden" value="reset" />

                {/* Turnstile: centered + programmatically rendered */}
                <div className="w-full flex justify-center">
                  <div ref={tsRef} className="inline-block min-h-[70px]" />
                </div>

                <button
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar código de recuperación"}
                </button>
              </form>
          ) : (
              // Step 2: verify + set new password
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Código de recuperación
                  </label>
                  <input
                      id="code"
                      name="code"
                      type="text"
                      placeholder="Ingresa el código de 8 dígitos"
                      required
                      autoComplete="one-time-code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="Elige una nueva contraseña (8+ caracteres)"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <input name="email" type="hidden" value={email || ""} />
                <input name="flow" type="hidden" value="reset-verification" />

                <button
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                >
                  {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
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
                  Usar otro correo
                </button>
              </form>
          )}

          <div className="mt-6 text-center">
            <a className="text-blue-500 hover:text-blue-600 text-sm" href="/signin">
              Volver a iniciar sesión
            </a>
          </div>
        </div>
      </main>
  );
}
