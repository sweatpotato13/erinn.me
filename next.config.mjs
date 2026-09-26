export const NEXT_DEFAULT_HTML_LIMITED_BOTS =
    "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";

/** @type {import('next').NextConfig} */
const nextConfig = {
    htmlLimitedBots: new RegExp(
        `${NEXT_DEFAULT_HTML_LIMITED_BOTS}|kakaotalk-scrap`,
        "i"
    ),
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
            {
                protocol: "https",
                hostname: "open.api.nexon.com",
                pathname: "/static/mabinogi/img/**",
            },
            {
                protocol: "https",
                hostname: "ssl.nexon.com",
                pathname: "/s2/game/mabinogi/ItemShop/ItemImage/**",
            },
        ],
        deviceSizes: [40, 120, 200],
        imageSizes: [40, 120, 200],
    },
    // Security headers for PWA
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
