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
const MAX_PAGES = 10;
const querySchema = z.object({ item_name: z.string().trim().min(1).max(100) });

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;

    const deadline = createRequestDeadline(request.signal);
    const prices: { price: number; quantity: number }[] = [];
    let nextCursor: string | null = "";
    let pageCount = 0;
    let previousMinimum: number | null = null;
    let runningMinimum = Infinity;
    let stableCount = 0;

    try {
        do {
            throwIfDeadlineExpired(deadline);
            const url = new URL("/mabinogi/v1/auction/list", NXOPEN_API_URL);
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
                AuctionListResponseSchema,
                deadline
            );

            for (const item of data.auction_item) {
                prices.push({
                    price: item.auction_price_per_unit,
                    quantity: item.item_count,
                });
                runningMinimum = Math.min(
                    runningMinimum,
                    item.auction_price_per_unit
                );
            }

            nextCursor = data.next_cursor ?? null;
            pageCount++;
            if (
                runningMinimum !== Infinity &&
                runningMinimum === previousMinimum
            ) {
                stableCount++;
                if (stableCount >= 2) break;
            } else {
                stableCount = 0;
            }
            previousMinimum = runningMinimum;
        } while (nextCursor && pageCount < MAX_PAGES);

        throwIfDeadlineExpired(deadline);
        if (prices.length === 0) {
            return NextResponse.json({
                minPrice: 0,
                averagePrice: 0,
                availableQuantity: 0,
                isComplete: true,
            });
        }

        return NextResponse.json({
            minPrice: runningMinimum,
            averagePrice: Math.round(
                prices.reduce((sum, item) => sum + item.price, 0) /
                    prices.length
            ),
            availableQuantity: prices.reduce(
                (sum, item) => sum + item.quantity,
                0
            ),
            isComplete: !nextCursor || stableCount >= 2,
        });
    } catch (error) {
        return upstreamErrorResponse("/api/auction/price-summary", error);
    }
}
