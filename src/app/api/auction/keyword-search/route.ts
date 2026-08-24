import { NextResponse } from "next/server";
import * as z from "zod";

import { parseQuery } from "@/lib/api/request";
import {
    createRequestDeadline,
    createUpstreamUrl,
    fetchUpstream,
    parseUpstreamJson,
    throwIfDeadlineExpired,
    upstreamErrorResponse,
} from "@/lib/api/upstream";
import {
    evaluateAuctionItemOptions,
    parseAuctionOptionFilterQuery,
} from "@/lib/auction-options";
import {
    type AuctionListResponse,
    AuctionListResponseSchema,
} from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const MAX_PAGES = 5;
const querySchema = z.object({
    keyword: z.string().trim().min(1).max(100),
    cursor: z.string().max(2048).optional(),
});

/**
 * Searches auction items by keyword and returns aggregated paginated results.
 *
 * @returns A JSON response containing the matching items, whether more results are available, and the next pagination cursor.
 */
export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;
    const filterQuery = parseAuctionOptionFilterQuery(
        new URL(request.url).searchParams
    );
    if (!filterQuery.success) {
        return NextResponse.json({ error: filterQuery.error }, { status: 400 });
    }

    const deadline = createRequestDeadline(request.signal);
    const allItems: AuctionListResponse["auction_item"] = [];
    let nextCursor: string | null = query.data.cursor ?? "";
    let pageCount = 0;

    try {
        do {
            throwIfDeadlineExpired(deadline);
            const url = createUpstreamUrl(
                "/mabinogi/v1/auction/keyword-search",
                NXOPEN_API_URL
            );
            url.searchParams.set("keyword", query.data.keyword);
            if (nextCursor) url.searchParams.set("cursor", nextCursor);

            const response = await fetchUpstream(
                url,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-nxopen-api-key": NXOPEN_API_KEY || "",
                    },
                },
                deadline
            );
            const data = await parseUpstreamJson(
                response,
                AuctionListResponseSchema,
                deadline
            );
            allItems.push(...data.auction_item);
            nextCursor = data.next_cursor ?? null;
            pageCount++;
        } while (nextCursor && pageCount < MAX_PAGES);

        throwIfDeadlineExpired(deadline);
        const evaluation = filterQuery.filters
            ? evaluateAuctionItemOptions(allItems, filterQuery.filters)
            : null;
        return NextResponse.json({
            items: evaluation?.items ?? allItems,
            hasMore: !!nextCursor,
            nextCursor,
            ...(evaluation && {
                evaluation: {
                    scannedCount: evaluation.scannedCount,
                    unevaluableCount: evaluation.unevaluableCount,
                },
            }),
        });
    } catch (error) {
        return upstreamErrorResponse("/api/auction/keyword-search", error);
    }
}
