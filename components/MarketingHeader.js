import Link from "next/link";

export function MarketingHeader() {
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
      aria-label="Marketing"
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

      <div className="hidden lg:flex flex-1 items-center justify-center gap-4 text-sm font-semibold text-gray-700">
        <Link
          href="/chicas"
          className="rounded-full px-3 py-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          Ver chicas
        </Link>
      </div>

      <div className="flex items-center">
        <Link
          href="/signin"
          className="ml-2 text-gray-900 px-4 py-2 text-sm font-medium hover:text-gray-700 transition-all duration-200 active:scale-95"
        >
          Comenzar gratis
        </Link>
      </div>
    </nav>
  );
}
