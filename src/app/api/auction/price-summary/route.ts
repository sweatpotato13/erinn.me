import { NextResponse } from "next/server";
import * as z from "zod";

import { fetchCurrentItemMarket } from "@/lib/api/auction-market";
import { parseQuery } from "@/lib/api/request";
import { upstreamErrorResponse } from "@/lib/api/upstream";
import { checkOrigin } from "@/lib/utils/check-origin";

const querySchema = z.object({ item_name: z.string().trim().min(1).max(100) });

/**
 * Summarizes auction pricing and availability for the requested item.
 *
 * @returns A response containing the minimum price, rounded average unit price, available quantity, and pagination completeness.
 */
export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;

    try {
        return NextResponse.json(
            await fetchCurrentItemMarket(query.data.item_name, request.signal)
        );
    } catch (error) {
        return upstreamErrorResponse("/api/auction/price-summary", error);
    }
}
