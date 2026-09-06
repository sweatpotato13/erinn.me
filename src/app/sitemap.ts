import type { MetadataRoute } from "next";

import {
    getAuctionCatalogItems,
    getAuctionItemPath,
} from "@/lib/auction-item-catalog";
import { FEATURE_LINKS } from "@/lib/feature-links";

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = [
        "/",
        ...FEATURE_LINKS.filter(link => link.searchVisible).map(
            link => link.url
        ),
        "/auction/items",
        ...getAuctionCatalogItems().map(getAuctionItemPath),
    ];
    return paths.map(path => ({
        url: new URL(path, "https://erinn.me").toString(),
    }));
}
