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
    UpstreamFailure,
} from "@/lib/api/upstream";
import {
    type AuctionHistoryResponse,
    AuctionHistoryResponseSchema,
} from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const MAX_PAGES = 5;
const querySchema = z.object({
    item_name: z.string().trim().min(1).max(100),
});

/**
 * Returns completed sales for the one-hour window provided by Nexon Open API.
 *
 * @param request - The request containing the exact auction item name.
 * @returns Aggregated sales and whether more upstream pages remain.
 */
export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;

    const deadline = createRequestDeadline(request.signal, 15_000);
    const sales: AuctionHistoryResponse["auction_history"] = [];
    let nextCursor: string | null = null;
    let pageCount = 0;

    try {
        do {
            throwIfDeadlineExpired(deadline);
            const url = createUpstreamUrl(
                "/mabinogi/v1/auction/history",
                NXOPEN_API_URL
            );
            url.searchParams.set("item_name", query.data.item_name);
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
                AuctionHistoryResponseSchema,
                deadline
            );
            sales.push(...data.auction_history);
            nextCursor = data.next_cursor ?? null;
            pageCount++;
        } while (nextCursor && pageCount < MAX_PAGES);

        throwIfDeadlineExpired(deadline);
        return NextResponse.json({ sales, hasMore: !!nextCursor });
    } catch (error) {
        if (error instanceof UpstreamFailure && error.upstreamStatus === 400) {
            return NextResponse.json(
                { error: "Exact item name required" },
                { status: 422 }
            );
        }
        return upstreamErrorResponse("/api/auction/history", error);
    }
}
