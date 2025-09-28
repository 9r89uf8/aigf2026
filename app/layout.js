//app/layout.js
import "./globals.css";
import Script from "next/script";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Navbar } from "@/components/Navbar";
import Providers from "@/app/providers";


export default function RootLayout({ children }) {
  return (
      <ConvexAuthNextjsServerProvider>
    <html lang="en">
      <body>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
      </ConvexAuthNextjsServerProvider>
  );
}
