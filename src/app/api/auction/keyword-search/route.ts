import { NextResponse } from "next/server";
import * as z from "zod";

import { parseQuery } from "@/lib/api/request";
import {
    createRequestDeadline,
    fetchUpstream,
    parseUpstreamJson,
    throwIfDeadlineExpired,
    upstreamErrorResponse,
} from "@/lib/api/upstream";
import { AuctionListResponseSchema } from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const MAX_PAGES = 5;
const querySchema = z.object({
    keyword: z.string().trim().min(1).max(100),
    cursor: z.string().max(2048).optional(),
});

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;

    const deadline = createRequestDeadline(request.signal);
    const allItems: Record<string, unknown>[] = [];
    let nextCursor: string | null = query.data.cursor ?? "";
    let pageCount = 0;

    try {
        do {
            throwIfDeadlineExpired(deadline);
            const url = new URL(
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
        return NextResponse.json({
            items: allItems,
            hasMore: !!nextCursor,
            nextCursor,
        });
    } catch (error) {
        return upstreamErrorResponse("/api/auction/keyword-search", error);
    }
}
