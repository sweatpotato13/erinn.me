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
import { HornResponseSchema, serverNameSchema } from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const querySchema = z.object({ server_name: serverNameSchema });

/**
 * Retrieves horn-bugle history for the requested server.
 *
 * @param request - The incoming request containing the server query parameter.
 * @returns The horn-bugle history, a validation or origin error response, or an upstream error response.
 */
export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;
    const deadline = createRequestDeadline(request.signal);

    try {
        const url = createUpstreamUrl(
            "/mabinogi/v1/horn-bugle-world/history",
            NXOPEN_API_URL
        );
        url.searchParams.set("server_name", query.data.server_name);
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
            HornResponseSchema,
            deadline
        );
        return NextResponse.json(data);
    } catch (error) {
        return upstreamErrorResponse("/api/horn", error);
    }
}
