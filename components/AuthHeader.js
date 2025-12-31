"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthHeader() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <nav
      className="
        sticky top-2 z-50 mx-auto mt-2 w-[calc(100%-2rem)] max-w-6xl
        h-14
        rounded-full border border-white/60 bg-white/90 shadow-lg ring-1 ring-black/5
        backdrop-blur-md supports-[backdrop-filter]:bg-white/90
        px-6 relative flex items-center justify-between
      "
      style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
      aria-label="Auth"
    >
      <Link
        href="/"
        className="
          font-semibold text-lg text-gray-900 tracking-tight leading-none
          supports-[line-height:1cap]:leading-[1cap]
        "
      >
        NOVIACHAT
      </Link>

      <button
        type="button"
        onClick={handleBack}
        className="rounded-full px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors active:scale-95"
        aria-label="Volver"
      >
        Volver
      </button>
    </nav>
  );
}
