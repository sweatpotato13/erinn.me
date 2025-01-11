/** @type {import('next').NextConfig} */

const nextConfig = {
    async rewrites() {
        return [
        ];
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/auction",
                permanent: true,
            },
        ];
    },
    images: {
        domains: ["mabires2.pril.cc"],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'mabires2.pril.cc',
            },
        ],
        deviceSizes: [40, 120, 200],
        imageSizes: [40, 120, 200],
    },
};

module.exports = nextConfig;
