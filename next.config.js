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
};

module.exports = nextConfig;
