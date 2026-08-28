import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return ["/", "/auction", "/horn", "/npc-shop", "/changelog"].map(path => ({
        url: new URL(path, "https://erinn.me").toString(),
    }));
}
