//app/layout.js
// app/layout.js
import "./globals.css";
import Script from "next/script";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Navbar } from "@/components/Navbar";
import Providers from "@/app/providers";
import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";

export const viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

// ✅ Add canonical defaults here so every page inherits good values
export const metadata = {
    metadataBase: new URL("https://www.noviachat.com"),
    title: {
        default: "NoviaChat",
        template: "%s | NoviaChat",
    },
    description:
        "Conoce a tu compañera virtual perfecta en NoviaChat. Chatea con chicas IA hermosas disponibles 24/7.",
    robots: { index: true, follow: true },
    alternates: {
        languages: {
            "es-MX": "/",
            "es-ES": "/",
            "es-AR": "/",
        },
    },
    openGraph: {
        type: "website",
        url: "https://www.noviachat.com",
        siteName: "NoviaChat",
        images: [{ url: "/second.webp", width: 1200, height: 630, alt: "NoviaChat" }],
        locale: "es_MX",
        alternateLocale: ["es_ES", "es_AR"],
    },
    twitter: {
        card: "summary_large_image",
        title: "NoviaChat - Tu Novia Virtual y Compañera de IA",
        description:
            "Chatea con chicas IA hermosas 24/7. Privado, personalizado y siempre disponible.",
        images: ["/second.webp"], // resolves to absolute via metadataBase
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
        <body className="sm:pb-0 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[100dvh] flex flex-col overflow-x-hidden">
        <ConvexAuthNextjsServerProvider>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="afterInteractive"
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
              var referrer = document.referrer || "";
              var refHost = "";
              try { refHost = new URL(referrer).hostname.toLowerCase(); } catch (e) {}

              var url = new URL(window.location.href);
              var params = url.searchParams;
              var utmSource = (params.get("utm_source") || "").toLowerCase();
              var utmMedium = (params.get("utm_medium") || "").toLowerCase();
              var refParam = (params.get("ref") || params.get("source") || "").toLowerCase();

              var isChatgptReferrer =
                refHost === "chat.openai.com" ||
                refHost === "chatgpt.com" ||
                refHost.endsWith(".chatgpt.com");

              var isChatgptParam =
                utmSource === "chatgpt" ||
                utmMedium === "chatgpt" ||
                refParam === "chatgpt";

              var isChatgpt = isChatgptReferrer || isChatgptParam;
              var config = { page_path: window.location.pathname };
              if (isChatgpt) {
                config.campaign_source = "chatgpt";
                config.campaign_medium = "referral";
                config.campaign_name = "chatgpt";
              }
              gtag('config', 'G-ENZST04463', config);

              if (isChatgpt) {
                gtag('event', 'chatgpt_referral', {
                  referrer: referrer,
                  referrer_host: refHost,
                  page_location: window.location.href,
                });
              }
            `}
            </Script>
            <Providers>
                <Navbar />
                <main className="flex-1 min-h-0 flex flex-col">{children}</main>
                <SiteFooter />
                <BottomNav />
            </Providers>
        </ConvexAuthNextjsServerProvider>
        </body>
        </html>
    );
}
