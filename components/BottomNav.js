"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Item = ({ href, active, label, children }) => (
    <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`group flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
            active ? "text-blue-600" : "text-gray-900 hover:text-gray-600"
        }`}
    >
        <div className="relative">
            {children}
            <span
                className={`pointer-events-none absolute -bottom-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full transition-all ${
                    active ? "scale-100 bg-blue-500/70" : "scale-0 bg-transparent"
                }`}
            />
        </div>
        <span className="text-[11px] font-medium leading-none">{label}</span>
    </Link>
);

export function BottomNav() {
    const pathname = usePathname() || "/";

    // Hide on individual chat pages (e.g., /chat/[conversationId])
    if (pathname.startsWith("/chat/")) return null;

    const isGirls = pathname.startsWith("/chicas");
    const isChat = pathname.startsWith("/chat");
    const isAccount = pathname.startsWith("/account");

    return (
        <div className="fixed inset-x-0 bottom-4 z-50 sm:hidden">
            <nav
                aria-label="Bottom navigation"
                className="mx-auto max-w-md px-4 safe-bottom"
            >
                <div
                    className="
            grid grid-cols-3
            rounded-2xl border shadow-lg
            border-white/30
            bg-white/70
            backdrop-blur-xl
            supports-[backdrop-filter]:bg-white/50
            ring-1 ring-black/5
            transition
          "
                    style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
                >
                    <Item href="/chicas" active={isGirls}>
                        {/* Existing icon for /chicas */}
                        <svg
                            viewBox="0 0 24 24"
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </Item>

                    <Item href="/chat" active={isChat}>
                        {/* Existing icon for /chat */}
                        <svg
                            viewBox="0 0 24 24"
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                        </svg>
                    </Item>

                    <Item href="/account" active={isAccount}>
                        {/* Improved account icon: user-circle */}
                        <svg
                            viewBox="0 0 24 24"
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="10" r="3" />
                            <path d="M16 18a4 4 0 0 0-8 0" />
                        </svg>
                    </Item>
                </div>
            </nav>
        </div>
    );
}

