import { unstable_cache } from "next/cache";

import {
    createRequestDeadline,
    createUpstreamUrl,
    fetchUpstream,
    parseUpstreamJson,
    throwIfDeadlineExpired,
} from "@/lib/api/upstream";
import { prepareAuctionResults } from "@/lib/auction-market";
import {
    type AuctionHistoryResponse,
    AuctionHistoryResponseSchema,
    type AuctionListResponse,
    AuctionListResponseSchema,
} from "@/lib/schemas/nexon";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const CURRENT_MAX_PAGES = 10;
const HISTORY_MAX_PAGES = 5;

function upstreamHeaders() {
    return {
        "Content-Type": "application/json",
        "x-nxopen-api-key": NXOPEN_API_KEY || "",
    };
}

function summarizeCurrentMarket(
    listings: AuctionListResponse["auction_item"],
    nextCursor: string | null
) {
    const prepared = prepareAuctionResults(listings);
    return {
        minPrice: prepared.summary?.lowestUnitPrice ?? 0,
        averagePrice:
            prepared.items.length === 0
                ? 0
                : Math.round(
                      prepared.items.reduce(
                          (sum, item) => sum + item.auction_price_per_unit,
                          0
                      ) / prepared.items.length
                  ),
        availableQuantity: prepared.summary?.totalQuantity ?? 0,
        listingCount: prepared.summary?.listingCount ?? 0,
        isComplete: !nextCursor,
        fetchedAt: new Date().toISOString(),
    };
}

export async function fetchCurrentItemMarket(
    itemName: string,
    signal?: AbortSignal
) {
    const deadline = createRequestDeadline(signal, 20_000);
    const listings: AuctionListResponse["auction_item"] = [];
    let nextCursor: string | null = null;
    let pageCount = 0;

    do {
        throwIfDeadlineExpired(deadline);
        const url = createUpstreamUrl(
            "/mabinogi/v1/auction/list",
            NXOPEN_API_URL
        );
        url.searchParams.set("item_name", itemName);
        if (nextCursor) url.searchParams.set("cursor", nextCursor);
        const response = await fetchUpstream(
            url,
            { headers: upstreamHeaders() },
            deadline
        );
        const data = await parseUpstreamJson(
            response,
            AuctionListResponseSchema,
            deadline
        );
        listings.push(...data.auction_item);
        nextCursor = data.next_cursor ?? null;
        pageCount++;
    } while (nextCursor && pageCount < CURRENT_MAX_PAGES);

    throwIfDeadlineExpired(deadline);
    return summarizeCurrentMarket(listings, nextCursor);
}

export async function fetchRecentItemSales(
    itemName: string,
    signal?: AbortSignal
) {
    const deadline = createRequestDeadline(signal, 15_000);
    const sales: AuctionHistoryResponse["auction_history"] = [];
    let nextCursor: string | null = null;
    let pageCount = 0;

    do {
        throwIfDeadlineExpired(deadline);
        const url = createUpstreamUrl(
            "/mabinogi/v1/auction/history",
            NXOPEN_API_URL
        );
        url.searchParams.set("item_name", itemName);
        if (nextCursor) url.searchParams.set("cursor", nextCursor);
        const response = await fetchUpstream(
            url,
            { headers: upstreamHeaders() },
            deadline
        );
        const data = await parseUpstreamJson(
            response,
            AuctionHistoryResponseSchema,
            deadline
        );
        sales.push(...data.auction_history);
        nextCursor = data.next_cursor ?? null;
        pageCount++;
    } while (nextCursor && pageCount < HISTORY_MAX_PAGES);

    throwIfDeadlineExpired(deadline);
    return {
        sales,
        hasMore: !!nextCursor,
        fetchedAt: new Date().toISOString(),
    };
}

export const getCachedCurrentItemMarket = unstable_cache(
    (itemName: string) => fetchCurrentItemMarket(itemName),
    ["auction-current-market-v1"],
    { revalidate: 600 }
);

export const getCachedRecentItemSales = unstable_cache(
    (itemName: string) => fetchRecentItemSales(itemName),
    ["auction-recent-sales-v1"],
    { revalidate: 600 }
);
