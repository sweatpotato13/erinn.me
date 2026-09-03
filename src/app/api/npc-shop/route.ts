import { NextResponse } from "next/server";
import * as z from "zod";

import { parseQuery } from "@/lib/api/request";
import {
    createRequestDeadline,
    createUpstreamUrl,
    fetchUpstream,
    parseUpstreamJson,
    upstreamErrorResponse,
} from "@/lib/api/upstream";
import {
    NpcShopChannelQuerySchema,
    NpcShopNameSchema,
    NpcShopResponseSchema,
    serverNameSchema,
} from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const querySchema = z.object({
    npc_name: NpcShopNameSchema,
    server_name: serverNameSchema,
    channel: NpcShopChannelQuerySchema,
});

/**
 * Retrieves NPC shop data for a specified character, server, and channel.
 *
 * @returns A JSON response containing the validated NPC shop data or an error response.
 */
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
