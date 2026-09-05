import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/feature-links";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: SITE_TITLE,
        short_name: "Erinn",
        description: SITE_DESCRIPTION,
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icons/icon-384x384.png",
                sizes: "384x384",
                type: "image/png",
            },
            {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
