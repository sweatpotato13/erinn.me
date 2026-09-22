import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import catalogData from "@/data/cash-packages.json";
import { fetchCurrentItemMarket } from "@/lib/api/auction-market";
import { parseQuery } from "@/lib/api/request";
import { upstreamErrorResponse } from "@/lib/api/upstream";
import {
    type CashPackageCatalog,
    type CashPackageMarketItem,
    cashPackageMarketItems,
} from "@/lib/cash-packages";
import type { AuctionListResponse } from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const marketItems = new Map(
    cashPackageMarketItems(catalogData as CashPackageCatalog).map(item => [
        item.itemId,
        item,
    ])
);
const querySchema = z
    .object({
        item_id: z
            .string()
            .max(80)
            .refine(itemId => marketItems.has(itemId)),
    })
    .strict();

type Listing = AuctionListResponse["auction_item"][number];

export function matchesCashPackageListing(
    item: CashPackageMarketItem,
    listing: Listing
): boolean {
    if (item.pricing === "colorVariants") {
        return (
            listing.item_name.startsWith(item.name) &&
            listing.item_display_name.startsWith(item.name)
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

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;

    try {
        const market = await getCachedCashPackageMarket(query.data.item_id);
        const available = market.listingCount > 0;
        return NextResponse.json({
            itemId: query.data.item_id,
            status: available ? "available" : "empty",
            marketUnitGold: available ? market.minPrice : null,
            fetchedAt: market.fetchedAt,
            isComplete: market.isComplete,
            availableQuantity: market.availableQuantity,
            cause: available
                ? null
                : market.isComplete
                  ? "현재 등록된 매물이 없습니다."
                  : "확인한 범위에서 매물을 찾지 못했습니다.",
        });
    } catch (error) {
        return upstreamErrorResponse("/api/auction/cash-package-prices", error);
    }
}
