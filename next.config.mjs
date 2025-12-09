/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [];
    },
    async redirects() {
        return [];
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "mabires2.pril.cc",
            },
        ],
        deviceSizes: [40, 120, 200],
        imageSizes: [40, 120, 200],
    },
    // Security headers for PWA
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            }
        ];
    },
};

export default nextConfig;
