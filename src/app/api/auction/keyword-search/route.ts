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
const querySchema = z
    .object({
        keyword: z.string().trim().min(1).max(100),
        cursor: z.string().max(2048).optional(),
        search_mode: z.literal("fallback").optional(),
    })
    .refine(
        query =>
            query.search_mode !== "fallback" ||
            (!!query.cursor && query.keyword.split(/\s+/).length > 1),
        { message: "Fallback mode requires a multiword keyword and cursor" }
    );

async function fetchKeywordPages(
    keyword: string,
    cursor: string | undefined,
    pageLimit: number,
    deadline: ReturnType<typeof createRequestDeadline>
) {
    const items: AuctionListResponse["auction_item"] = [];
    let nextCursor: string | null = cursor ?? "";
    let pageCount = 0;

    do {
        throwIfDeadlineExpired(deadline);
        const url = createUpstreamUrl(
            "/mabinogi/v1/auction/keyword-search",
            NXOPEN_API_URL
        );
        url.searchParams.set("keyword", keyword);
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
        items.push(...data.auction_item);
        nextCursor = data.next_cursor ?? null;
        pageCount++;
    } while (nextCursor && pageCount < pageLimit);

    return { items, nextCursor, pageCount };
}

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

    const normalizedPhrase = query.data.keyword.replace(/\s+/g, " ");
    const words = normalizedPhrase.split(" ");
    const fallbackKeyword = words.slice(0, -1).join(" ");
    const deadline = createRequestDeadline(request.signal);

    try {
        let searchMode =
            query.data.search_mode === "fallback"
                ? ("fallback" as const)
                : undefined;
        let result = await fetchKeywordPages(
            searchMode ? fallbackKeyword : normalizedPhrase,
            query.data.cursor,
            MAX_PAGES,
            deadline
        );
        if (
            !searchMode &&
            !query.data.cursor &&
            words.length > 1 &&
            result.items.length === 0 &&
            !result.nextCursor &&
            result.pageCount < MAX_PAGES
        ) {
            searchMode = "fallback";
            result = await fetchKeywordPages(
                fallbackKeyword,
                undefined,
                MAX_PAGES - result.pageCount,
                deadline
            );
        }

        throwIfDeadlineExpired(deadline);
        const candidates = searchMode
            ? result.items.filter(item =>
                  item.item_name.includes(normalizedPhrase)
              )
            : result.items;
        const evaluation = filterQuery.filters
            ? evaluateAuctionItemOptions(candidates, filterQuery.filters)
            : null;
        return NextResponse.json({
            items: evaluation?.items ?? candidates,
            hasMore: !!result.nextCursor,
            nextCursor: result.nextCursor,
            ...(evaluation && {
                evaluation: {
                    scannedCount: evaluation.scannedCount,
                    unevaluableCount: evaluation.unevaluableCount,
                },
            }),
            ...(searchMode && { searchMode }),
        });
    } catch (error) {
        return upstreamErrorResponse("/api/auction/keyword-search", error);
    }
}
