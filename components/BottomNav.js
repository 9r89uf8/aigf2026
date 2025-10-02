"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Item = ({ href, active, label, children }) => (
    <Link
        href={href}
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
            active ? "text-blue-600" : "text-gray-900 hover:text-gray-600"
        }`}
        aria-label={label}
    >
        {children}
        <span className="text-[11px] font-medium leading-none">{label}</span>
    </Link>
);

export function BottomNav() {
    const pathname = usePathname() || "/";
    const isGirls = pathname.startsWith("/girls");
    const isChat = pathname.startsWith("/chat");
    const isAccount = pathname.startsWith("/account");

    return (
        <div className="fixed inset-x-0 bottom-4 z-50 sm:hidden">
            <nav className="mx-auto max-w-md px-4 safe-bottom">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 grid grid-cols-3">
                    <Item href="/girls" active={isGirls}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </Item>

                    <Item href="/chat" active={isChat}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                        </svg>
                    </Item>

                    <Item href="/account" active={isAccount}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm7 9a7 7 0 1 0-14 0" />
                        </svg>
                    </Item>
                </div>
            </nav>
        </div>
    );
}
