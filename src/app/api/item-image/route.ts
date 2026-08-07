import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

import itemIdMap from "@/data/item-id-map.json";
import { parseQuery } from "@/lib/api/request";
import {
    createRequestDeadline,
    fetchUpstream,
    readUpstreamArrayBuffer,
    upstreamErrorResponse,
    UpstreamFailure,
} from "@/lib/api/upstream";
import { checkOrigin } from "@/lib/utils/check-origin";

const idMap: Record<string, string> = itemIdMap;
const querySchema = z
    .object({
        id: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[A-Za-z0-9_-]+$/)
            .optional(),
        name: z.string().trim().min(1).max(100).optional(),
    })
    .refine(value => value.id || value.name);

/**
 * Serves an item image identified by its query parameters.
 *
 * @param request - The incoming request containing the item ID or name.
 * @returns The item image, a validation response, a not-found response, or an upstream error response.
 */
export async function GET(request: NextRequest) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;
    const itemName = query.data.name ?? "";
    const mappedId = Object.hasOwn(idMap, itemName)
        ? idMap[itemName]
        : undefined;
    const itemId = query.data.id ?? mappedId ?? "1000";
    const deadline = createRequestDeadline(request.signal);

    try {
        const imageUrl = new URL(
            `/invimage/kr/${itemId}/${itemId}.png`,
            "https://mabires2.pril.cc"
        );
        const imageResponse = await fetchUpstream(imageUrl, {}, deadline);
        const imageBuffer = await readUpstreamArrayBuffer(
            imageResponse,
            deadline
        );

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=86400",
                "X-Frame-Options": "DENY",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        if (error instanceof UpstreamFailure && error.upstreamStatus === 404) {
            return new NextResponse("Image not found", { status: 404 });
        }
        return upstreamErrorResponse("/api/item-image", error);
    }
}
