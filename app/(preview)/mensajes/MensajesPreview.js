"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import avatarImage from "@/public/first.webp";
import { AuthHeader } from "@/components/AuthHeader";

export default function MensajesPreview() {
  const [draft, setDraft] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const trimmedDraft = draft.trim();

  const handleSend = () => {
    if (!trimmedDraft) return;
    setShowAuthPrompt(true);
  };

  return (
    <main className="font-sans text-gray-900 min-h-[100dvh] bg-white flex flex-col">
      <AuthHeader />
      <div className="mx-auto w-full max-w-screen-sm flex-1 min-h-0 flex flex-col overflow-hidden pt-4">


        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 bg-white">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Image
                  src={avatarImage}
                  alt="Andrea"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-[25px] font-semibold text-gray-900">Andrea</p>
                  <p className="text-[17px] text-gray-500">18 años - Activa hace 5 minutos</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
                <p className="mt-1 text-[20px] text-gray-700">Ando aburrida 😘</p>
              </div>
              <Link
                href="/chicas/k974t5vzammwgg6b986fsx65hn7s55eg"
                className="mt-4 inline-flex w-full items-center justify-center px-6 py-3 bg-blue-500 text-[22px] text-white font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Ver perfil
              </Link>
            </div>
          </div>
        </div>

        <div
          className="px-4 py-3 border-t border-gray-200 bg-white"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-gray-300">
              <button
                type="button"
                disabled
                className="p-2 rounded-full border border-gray-200 cursor-not-allowed"
                aria-label="Adjuntar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                </svg>
              </button>
              <button
                type="button"
                disabled
                className="p-2 rounded-full border border-gray-200 cursor-not-allowed"
                aria-label="Audio"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v11m0 0a3 3 0 103 3V5a3 3 0 10-6 0v7zM5 10v2a7 7 0 0014 0v-2" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-full text-[21px] leading-tight text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Escribe un mensaje..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                aria-label="Mensaje"
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!trimmedDraft}
              className={`p-2 transition-colors ${
                trimmedDraft ? "text-blue-500 hover:text-blue-600" : "text-gray-300 cursor-not-allowed"
              }`}
              aria-label="Enviar"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showAuthPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowAuthPrompt(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-prompt-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="auth-prompt-title" className="text-[25px] font-semibold text-gray-900">
                  Inicia sesión o crea tu cuenta
                </h2>
                <p className="mt-2 text-[20px] text-gray-600">
                  Es completamente gratis y anónimo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthPrompt(false)}
                className="rounded-full p-1 text-gray-400 hover:text-gray-500"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/signin"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-[20px] font-semibold text-white hover:bg-blue-700"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signin"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-[20px] font-semibold text-gray-900 hover:bg-gray-50"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
