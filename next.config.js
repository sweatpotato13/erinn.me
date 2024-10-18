/** @type {import('next').NextConfig} */

const { NXOPEN_API_URL } = process.env;

const nextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/mabinogi/npc-shop",
                destination: `${NXOPEN_API_URL}/mabinogi/v1/npcshop/list`,
            },
            {
                source: "/api/mabinogi/auction",
                destination: `${NXOPEN_API_URL}/mabinogi/v1/auction/list`,
            },
            {
                source: "/api/mabinogi/horn",
                destination: `${NXOPEN_API_URL}/mabinogi/v1/horn-bugle-world/history`,
            },
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
