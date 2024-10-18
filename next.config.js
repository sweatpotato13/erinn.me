/** @type {import('next').NextConfig} */

const nextConfig = {
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
