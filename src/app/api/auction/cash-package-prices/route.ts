import { NextResponse } from "next/server";
import { z } from "zod";

import {
    getCachedCashPackageMarket,
    hasCashPackageMarketItem,
} from "@/app/api/auction/cash-package-prices/cash-package-market";
import { parseQuery } from "@/lib/api/request";
import { upstreamErrorResponse } from "@/lib/api/upstream";
import { checkOrigin } from "@/lib/utils/check-origin";

const querySchema = z
    .object({
        item_id: z.string().max(80).refine(hasCashPackageMarketItem),
    })
    .strict();

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;

    try {
        const market = await getCachedCashPackageMarket(query.data.item_id);
        const available = market.listingCount > 0;
        return NextResponse.json({
            itemId: query.data.item_id,
            status: available ? "available" : "empty",
            marketUnitGold: available ? market.minPrice : null,
            fetchedAt: market.fetchedAt,
            isComplete: market.isComplete,
            availableQuantity: market.availableQuantity,
            cause: available
                ? null
                : market.isComplete
                  ? "현재 등록된 매물이 없습니다."
                  : "확인한 범위에서 매물을 찾지 못했습니다.",
        });
    } catch (error) {
        return upstreamErrorResponse("/api/auction/cash-package-prices", error);
    }
}
