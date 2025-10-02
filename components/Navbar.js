"use client";
//components/Navbar.js
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";

export function Navbar() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.getMe) ?? null;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-md">
      <div className="font-semibold text-lg text-white">NOVIACHAT</div>

      <AuthLoading>
        <div className="text-sm text-gray-300">Loading...</div>
      </AuthLoading>

      <Authenticated>
        <div className="flex items-center gap-3">
          {/*<span className="text-sm text-gray-200">{me?.email ?? "Account"}</span>*/}
          <button
            className="btn-gradient-black text-sm"
            onClick={() => void signOut()}
          >
            Salir
          </button>
        </div>
      </Authenticated>

      <Unauthenticated>
        <a
          className="bg-white text-gray-900 px-6 py-2.5 text-sm font-medium hover:bg-gray-100 transition-all duration-200 active:scale-95"
          href="/signin"
        >
          mi cuenta
        </a>
      </Unauthenticated>
    </nav>
  );
}