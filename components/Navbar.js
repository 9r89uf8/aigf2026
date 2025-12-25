"use client";
// components/Navbar.js
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.getMe) ?? null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = useRef([]);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Click outside closes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Escape closes
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      }
    };
    if (isMenuOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isMenuOpen]);

  // Focus first item when opening
  useEffect(() => {
    if (isMenuOpen) {
      itemRefs.current[0]?.focus();
    }
  }, [isMenuOpen]);

  // Keyboard nav within menu
  const onMenuKeyDown = (e) => {
    const items = itemRefs.current.filter(Boolean);
    if (!items.length) return;

    const currentIndex = items.findIndex((el) => el === document.activeElement);
    const focusAt = (idx) => {
      const next = (idx + items.length) % items.length;
      items[next]?.focus();
    };

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(currentIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(currentIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      default:
        break;
    }
  };

  const navLinks = [
    { href: "/chicas-virtuales", label: "Chicas virtuales" },
    { href: "/chat-novia-virtual", label: "Chat novia virtual" },
    { href: "/novia-virtual", label: "Novia virtual" },
    { href: "/planes", label: "Planes" },
    { href: "/como-funciona", label: "Como funciona" },
  ];

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
      >

        <a
            href="/"
            className="
    font-semibold text-lg text-gray-900 tracking-tight leading-none
    supports-[line-height:1cap]:leading-[1cap]
  "
        >
          NOVIACHAT
        </a>

        <div className="hidden lg:flex flex-1 items-center justify-center gap-4 text-sm font-semibold text-gray-700">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center">
          <AuthLoading>
            <div className="text-sm text-gray-700">Cargando...</div>
          </AuthLoading>

          <Authenticated>
            <div className="relative" ref={menuRef}>
              <button
                  ref={buttonRef}
                  className="flex flex-col justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors duration-200 hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  onClick={() => setIsMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  aria-label="Abrir menú"
              >
              <span
                  className={`block h-0.5 w-6 rounded-full bg-gray-900 transition-transform duration-200 ${
                      isMenuOpen ? "translate-y-2 rotate-45" : ""
                  }`}
              />
                <span
                    className={`block h-0.5 w-6 rounded-full bg-gray-900 transition-opacity duration-200 ${
                        isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                />
                <span
                    className={`block h-0.5 w-6 rounded-full bg-gray-900 transition-transform duration-200 ${
                        isMenuOpen ? "-translate-y-2 -rotate-45" : ""
                    }`}
                />
              </button>

              {isMenuOpen && (
                  <div
                      role="menu"
                      aria-orientation="vertical"
                      aria-label="Menú de usuario"
                      onKeyDown={onMenuKeyDown}
                      className="
                  absolute right-0 w-56 origin-top-right
                  rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5
                  animate-in fade-in-0 zoom-in-95 duration-150
                "
                      // Drop the menu ~50px lower than usual
                      style={{ top: "calc(100% + 20px)" }}
                  >
                    <div className="px-3 py-2">
                      <p className="text-xs text-gray-600 truncate">
                        {me?.name || me?.email || "Mi cuenta"}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-gray-200" />

                    <a
                        href="/account"
                        role="menuitem"
                        ref={(el) => (itemRefs.current[0] = el)}
                        tabIndex={-1}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => setIsMenuOpen(false)}
                    >
                      Mi cuenta
                    </a>

                    <button
                        role="menuitem"
                        ref={(el) => (itemRefs.current[1] = el)}
                        tabIndex={-1}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                        onClick={() => {
                          setIsMenuOpen(false);
                          void signOut();
                        }}
                    >
                      Salir
                    </button>
                  </div>
              )}
            </div>
          </Authenticated>

          <Unauthenticated>
            <a
                className="ml-2 text-gray-900 px-4 py-2 text-sm font-medium hover:text-gray-700 transition-all duration-200 active:scale-95"
                href="/signin"
            >
              mi cuenta
            </a>
          </Unauthenticated>
        </div>
      </nav>
  );
}
