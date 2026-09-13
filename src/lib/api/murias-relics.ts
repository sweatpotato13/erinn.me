import { unstable_cache } from "next/cache";

import { fetchCurrentItemMarket } from "@/lib/api/auction-market";
import {
    createRequestDeadline,
    createUpstreamUrl,
    fetchUpstream,
    parseUpstreamJson,
    type RequestDeadline,
    throwIfDeadlineExpired,
    UpstreamFailure,
} from "@/lib/api/upstream";
import {
    aggregateRelicListings,
    muriasReference,
    type RelicListing,
    type RelicMarketSnapshot,
    type RelicSnapshot,
} from "@/lib/murias-relics";
import {
    type AuctionListResponse,
    AuctionListResponseSchema,
} from "@/lib/schemas/nexon";

export const MURIAS_CACHE_TAG = "murias-market-v2-full";

// ponytail: fallback survives warm-instance requests only; use shared storage
// if fallback must survive cold starts or be shared across serverless instances.
let lastSuccessfulRelics: RelicMarketSnapshot | null = null;

function rememberRelics(snapshot: RelicMarketSnapshot): void {
    if (
        snapshot.isComplete &&
        snapshot.fetchedAt &&
        (!lastSuccessfulRelics?.fetchedAt ||
            snapshot.fetchedAt >= lastSuccessfulRelics.fetchedAt)
    ) {
        lastSuccessfulRelics = snapshot;
    }
}

// Project documented fields only; never return arbitrary upstream extras.
function projectListing(
    item: AuctionListResponse["auction_item"][number]
): RelicListing {
    return {
        item_name: item.item_name,
        item_display_name: item.item_display_name,
        item_count: item.item_count,
        auction_price_per_unit: item.auction_price_per_unit,
        date_auction_expire: item.date_auction_expire,
        item_option: item.item_option?.map(option => ({
            option_type: option.option_type,
            option_sub_type: option.option_sub_type,
            option_value: option.option_value,
            option_value2: option.option_value2,
            option_desc: option.option_desc,
        })),
    };
}

async function fetchRelicPage(
    cursor: string | null,
    deadline: RequestDeadline
): Promise<AuctionListResponse> {
    const url = createUpstreamUrl(
        "/mabinogi/v1/auction/list",
        process.env.NXOPEN_API_URL
    );
    url.searchParams.set("item_name", muriasReference.item.name);
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetchUpstream(
        url,
        {
            cache: "no-store",
            headers: { "x-nxopen-api-key": process.env.NXOPEN_API_KEY || "" },
        },
        deadline
    );
    return parseUpstreamJson(response, AuctionListResponseSchema, deadline);
}

// Complete scans are time-bounded, never silently truncated by page count.
export async function fetchRelicMarket(): Promise<RelicMarketSnapshot> {
    const deadline = createRequestDeadline(undefined, 50_000);
    const listings: RelicListing[] = [];
    const cursors = new Set<string>();
    let nextCursor: string | null = null;
    let pages = 0;
    do {
        const data = await fetchRelicPage(nextCursor, deadline);
        listings.push(...data.auction_item.map(projectListing));
        pages++;
        nextCursor = data.next_cursor || null;
        if (nextCursor && cursors.has(nextCursor))
            throw new UpstreamFailure("upstream_schema", "Repeated cursor");
        if (nextCursor) cursors.add(nextCursor);
    } while (nextCursor);
    throwIfDeadlineExpired(deadline);
    const snapshot = {
        ...aggregateRelicListings(listings),
        fetchedAt: new Date().toISOString(),
        pages,
        nextCursor,
        isComplete: true,
    };
    rememberRelics(snapshot);
    return snapshot;
}

// Project uses the Data Cache without Cache Components; keep its existing
// compatible cache API rather than enabling Cache Components globally.
const cachedRelics = unstable_cache(
    fetchRelicMarket,
    [MURIAS_CACHE_TAG, muriasReference.version],
    { revalidate: 600, tags: [MURIAS_CACHE_TAG] }
);
const cachedIdea = unstable_cache(
    () => fetchCurrentItemMarket(muriasReference.idea.name, undefined, true),
    ["murias-idea-v1"],
    { revalidate: 600, tags: [MURIAS_CACHE_TAG] }
);

export async function getRelicSnapshot(): Promise<RelicSnapshot> {
    const [relic, idea] = await Promise.allSettled([
        cachedRelics(),
        cachedIdea(),
    ]);
    if (relic.status === "fulfilled") rememberRelics(relic.value);
    return {
        referenceVersion: muriasReference.version,
        ...(relic.status === "fulfilled"
            ? relic.value
            : (lastSuccessfulRelics ?? {
                  ...aggregateRelicListings([]),
                  fetchedAt: null,
                  pages: 0,
                  nextCursor: null,
                  isComplete: false,
              })),
        relicError:
            relic.status === "rejected"
                ? "전체 유물 매물 조회를 완료하지 못했습니다. 다시 조회해 주세요."
                : null,
        ideaPrice:
            idea.status === "fulfilled" &&
            idea.value.listingCount > 0 &&
            idea.value.minPrice > 0
                ? idea.value.minPrice
                : null,
        ideaFetchedAt:
            idea.status === "fulfilled" ? idea.value.fetchedAt : null,
        ideaIsComplete: idea.status === "fulfilled" && idea.value.isComplete,
        ideaError:
            idea.status === "rejected"
                ? "이데아 가격을 불러오지 못했습니다."
                : null,
    };
}
