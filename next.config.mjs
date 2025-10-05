/** @type {import('next').NextConfig} */
const nextConfig = {
    compress: true,
    poweredByHeader: false,
    images: {
        formats: ["image/avif", "image/webp"],
    },
};

export default nextConfig;

