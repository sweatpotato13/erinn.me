import { NextResponse } from "next/server";

import { getCachedCouponItemMarkets } from "@/lib/api/auction-market";
import { checkOrigin } from "@/lib/utils/check-origin";

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    return NextResponse.json(await getCachedCouponItemMarkets());
}
