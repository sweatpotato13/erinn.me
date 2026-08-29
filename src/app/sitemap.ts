import type { MetadataRoute } from "next";

import {
    getAuctionCatalogItems,
    getAuctionItemPath,
} from "@/lib/auction-item-catalog";

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = [
        "/",
        "/auction",
        "/horn",
        "/npc-shop",
        "/changelog",
        "/auction/items",
        ...getAuctionCatalogItems().map(getAuctionItemPath),
    ];
    return paths.map(path => ({
        url: new URL(path, "https://erinn.me").toString(),
    }));
}
