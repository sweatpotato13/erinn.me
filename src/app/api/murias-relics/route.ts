import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRelicSnapshot, MURIAS_CACHE_TAG } from "@/lib/api/murias-relics";
import { parseQuery } from "@/lib/api/request";
import { checkOrigin } from "@/lib/utils/check-origin";

export const maxDuration = 120;

const querySchema = z.object({}).strict();

async function respond(request: Request, refresh: boolean) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;
    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;
    if (refresh) revalidateTag(MURIAS_CACHE_TAG, { expire: 0 });
    return NextResponse.json(await getRelicSnapshot(), {
        headers: { "Cache-Control": "no-store" },
    });
}

export async function GET(request: Request) {
    return respond(request, false);
}
export async function POST(request: Request) {
    return respond(request, true);
}
