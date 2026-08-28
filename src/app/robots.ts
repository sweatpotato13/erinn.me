import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/_offline"],
        },
        sitemap: "https://erinn.me/sitemap.xml",
        host: "https://erinn.me",
    };
}
