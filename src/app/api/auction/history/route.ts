import { NextResponse } from "next/server";
import * as z from "zod";

import { fetchRecentItemSales } from "@/lib/api/auction-market";
import { parseQuery } from "@/lib/api/request";
import { upstreamErrorResponse, UpstreamFailure } from "@/lib/api/upstream";
import { checkOrigin } from "@/lib/utils/check-origin";

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

    try {
        return NextResponse.json(
            await fetchRecentItemSales(query.data.item_name, request.signal)
        );
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
