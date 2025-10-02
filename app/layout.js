//app/layout.js
import "./globals.css";
import Script from "next/script";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Navbar } from "@/components/Navbar";
import Providers from "@/app/providers";
import {BottomNav} from "@/components/BottomNav";

export default function RootLayout({ children }) {
  return (
      <ConvexAuthNextjsServerProvider>
    <html lang="en">
      <body className="pb-[76px] sm:pb-0">
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
