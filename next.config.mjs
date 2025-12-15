/** @type {import('next').NextConfig} */
const noindexHeaders = [
    { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
    compress: true,
    poweredByHeader: false,
    images: {
        formats: ["image/avif", "image/webp"],
    },
    htmlLimitedBots: /Googlebot|bingbot|Slackbot|Twitterbot/i,
    async headers() {
        return [
            { source: "/api/:path*", headers: noindexHeaders },
            { source: "/admin/:path*", headers: noindexHeaders },
            { source: "/account/:path*", headers: noindexHeaders },
            { source: "/chat/:path*", headers: noindexHeaders },
            { source: "/checkout/:path*", headers: noindexHeaders },
            { source: "/dashboard/:path*", headers: noindexHeaders },
            { source: "/girls/:id", headers: noindexHeaders },
            { source: "/signin", headers: noindexHeaders },
            { source: "/reset-password", headers: noindexHeaders },
            { source: "/stories/:path*", headers: noindexHeaders },
        ];
    },
};

export default nextConfig;
