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
      <body className="pb-[76px] sm:pb-0 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />
        <Providers>
          <Navbar />
          {children}
          <BottomNav/>
        </Providers>
      </body>
    </html>
      </ConvexAuthNextjsServerProvider>
  );
}
