"use client";
//components/Navbar.js
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";

export function Navbar() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.getMe) ?? null;

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b">
      <div className="font-semibold text-lg">AI Girls</div>

      <AuthLoading>
        <div className="text-sm text-gray-500">Loading...</div>
      </AuthLoading>

      <Authenticated>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{me?.email ?? "Account"}</span>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </Authenticated>

      <Unauthenticated>
        <a
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          href="/signin"
        >
          Sign in
        </a>
      </Unauthenticated>
    </nav>
  );
}