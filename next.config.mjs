/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    poweredByHeader: false,
    images: {
        formats: ["image/avif", "image/webp"],
    },
    htmlLimitedBots: /Googlebot|bingbot|Slackbot|Twitterbot/i,
};

export default nextConfig;

