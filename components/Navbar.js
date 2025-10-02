"use client";
//components/Navbar.js
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";

export function Navbar() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.getMe) ?? null;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md rounded-full mx-auto mt-4 max-w-6xl w-[calc(100%-2rem)]">
      <div className="font-semibold text-lg text-gray-900">NOVIACHAT</div>

      <AuthLoading>
        <div className="text-sm text-gray-600">Loading...</div>
      </AuthLoading>

      <Authenticated>
        <div className="flex items-center gap-3">
          {/*<span className="text-sm text-gray-700">{me?.email ?? "Account"}</span>*/}
          <button
            className="text-sm"
            onClick={() => void signOut()}
          >
            Salir
          </button>
        </div>
      </Authenticated>

      <Unauthenticated>
        <a
          className="text-gray-900 px-6 py-2.5 text-sm font-medium hover:text-gray-700 transition-all duration-200 active:scale-95"
          href="/signin"
        >
          mi cuenta
        </a>
      </Unauthenticated>
    </nav>
  );
}