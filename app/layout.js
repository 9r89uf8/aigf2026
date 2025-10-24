//app/layout.js
import "./globals.css";
import Script from "next/script";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Navbar } from "@/components/Navbar";
import Providers from "@/app/providers";
import {BottomNav} from "@/components/BottomNav";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }) {
  return (
      <ConvexAuthNextjsServerProvider>
    <html lang="es">
      <body className="sm:pb-0 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[100dvh] flex flex-col overflow-x-hidden">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive" // CHANGED: load right after hydration
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ENZST04463"
          strategy="lazyOnload"
        />
        <Script id="ga4-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ENZST04463', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        <Providers>
          <Navbar />
          <main className="flex-1 min-h-0 flex flex-col">
            {children}
          </main>
          <BottomNav/>
        </Providers>
      </body>
    </html>
      </ConvexAuthNextjsServerProvider>
  );
}
