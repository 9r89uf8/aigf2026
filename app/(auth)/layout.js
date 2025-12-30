import Script from "next/script";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import Providers from "@/app/providers";

export default function AuthLayout({ children }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <Providers>
        <div className="flex-1 min-h-0">{children}</div>
      </Providers>
    </ConvexAuthNextjsServerProvider>
  );
}
