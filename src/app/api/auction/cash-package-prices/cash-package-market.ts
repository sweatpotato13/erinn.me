import { unstable_cache } from "next/cache";

import catalogData from "@/data/cash-packages.json";
import { fetchCurrentItemMarket } from "@/lib/api/auction-market";
import {
    type CashPackageCatalog,
    type CashPackageMarketItem,
    cashPackageMarketItems,
} from "@/lib/cash-packages";
import type { AuctionListResponse } from "@/lib/schemas/nexon";

const marketItems = new Map(
    cashPackageMarketItems(catalogData as CashPackageCatalog).map(item => [
        item.itemId,
        item,
    ])
);

type Listing = AuctionListResponse["auction_item"][number];

function matchesColorVariant(value: string, name: string) {
    if (value === name) return true;
    const suffix = value.slice(name.length);
    return value.startsWith(name) && /^\([^()]+\)$/.test(suffix);
}

export function hasCashPackageMarketItem(itemId: string) {
    return marketItems.has(itemId);
}

export function matchesCashPackageListing(
    item: CashPackageMarketItem,
    listing: Listing
): boolean {
    if (item.pricing === "colorVariants") {
        return (
            matchesColorVariant(listing.item_name, item.name) &&
            matchesColorVariant(listing.item_display_name, item.name)
        );
    }
    return (
        listing.item_name === item.name &&
        listing.item_display_name === item.name
    );
}

export const getCachedCashPackageMarket = unstable_cache(
    async (itemId: string) => {
        const item = marketItems.get(itemId);
        if (!item) throw new Error("Unknown cash package item");
        return fetchCurrentItemMarket(item.name, undefined, false, listing =>
            matchesCashPackageListing(item, listing)
        );
    },
    ["cash-package-market-v1"],
    { revalidate: 600 }
);
