import { NextResponse } from "next/server";
import * as z from "zod";

import { parseQuery, serverNameSchema } from "@/lib/api/request";
import {
    createRequestDeadline,
    createUpstreamUrl,
    fetchUpstream,
    parseUpstreamJson,
    upstreamErrorResponse,
} from "@/lib/api/upstream";
import { NpcShopResponseSchema } from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const querySchema = z.object({
    npc_name: z.string().trim().min(1).max(50),
    server_name: serverNameSchema,
    channel: z.coerce.number().int().min(1).max(42),
});

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;
    const deadline = createRequestDeadline(request.signal);

    try {
        const url = createUpstreamUrl(
            "/mabinogi/v1/npcshop/list",
            NXOPEN_API_URL
        );
        url.searchParams.set("npc_name", query.data.npc_name);
        url.searchParams.set("server_name", query.data.server_name);
        url.searchParams.set("channel", query.data.channel.toString());
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
            NpcShopResponseSchema,
            deadline
        );
        return NextResponse.json(data);
    } catch (error) {
        return upstreamErrorResponse("/api/npc-shop", error);
    }
}
