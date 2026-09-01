import type { MetadataRoute } from "next";

import {
    getAuctionCatalogItems,
    getAuctionItemPath,
} from "@/lib/auction-item-catalog";

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = [
        "/",
        "/auction",
        "/calculator",
        "/horn",
        "/npc-shop",
        "/auction/items",
        ...getAuctionCatalogItems().map(getAuctionItemPath),
    ];
    return paths.map(path => ({
        url: new URL(path, "https://erinn.me").toString(),
    }));
}
