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
const querySchema = z
    .object({
        auction_item_category: z.string().max(50).optional(),
        item_name: z.string().max(100).optional(),
        cursor: z.string().max(2048).optional(),
    })
    .refine(
        q =>
            (q.auction_item_category?.trim().length ?? 0) > 0 ||
            (q.item_name?.trim().length ?? 0) > 0,
        { message: "At least one search field is required" }
    );

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
            const url = new URL("/mabinogi/v1/auction/list", NXOPEN_API_URL);
            if (query.data.auction_item_category) {
                url.searchParams.set(
                    "auction_item_category",
                    query.data.auction_item_category
                );
            }
            if (query.data.item_name) {
                url.searchParams.set("item_name", query.data.item_name);
            }
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
        return upstreamErrorResponse("/api/auction", error);
    }
}
