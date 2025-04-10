/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
    async rewrites() {
        return [];
    },
    async redirects() {
        return [];
    },
    images: {
        domains: ["mabires2.pril.cc"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "mabires2.pril.cc",
            },
        ],
        deviceSizes: [40, 120, 200],
        imageSizes: [40, 120, 200],
    },
};

module.exports = withPWA(nextConfig);
