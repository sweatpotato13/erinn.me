import { checkRateLimit } from "@vercel/firewall";
import { NextRequest, NextResponse } from "next/server";

type Bucket = "contact" | "upstream" | "image" | "suggest";
type RateLimitCheck = typeof checkRateLimit;
type RateLimitEnvironment = {
    NODE_ENV?: string;
    VERCEL_ENV?: string;
    ENABLE_PREVIEW_RATE_LIMIT?: string;
};

const LIMITS: Readonly<Record<Bucket, number>> = {
    contact: 3,
    upstream: 60,
    image: 120,
    suggest: 120,
};
const RATE_LIMIT_IDS: Readonly<Record<Bucket, string>> = {
    contact: "erinn-contact",
    upstream: "erinn-upstream",
    image: "erinn-image",
    suggest: "erinn-suggest",
};
const upstreamRoutes = new Set([
    "/api/auction",
    "/api/auction/keyword-search",
    "/api/auction/price-summary",
    "/api/horn",
    "/api/npc-shop",
]);

/**
 * Determines the rate-limit bucket for an API route.
 *
 * @param pathname - The request path to classify
 * @returns The matching rate-limit bucket, or `null` when the path has no configured bucket
 */
export function resolveBucket(pathname: string): Bucket | null {
    if (pathname === "/api/contact") return "contact";
    if (pathname === "/api/item-image") return "image";
    if (pathname === "/api/suggest") return "suggest";
    if (upstreamRoutes.has(pathname)) return "upstream";
    return null;
}

/**
 * Identifies the client using the final non-empty value in the trusted forwarding header.
 *
 * @param headers - Request headers containing the trusted client forwarding value
 * @returns The client key, or `127.0.0.1` when no forwarded client value is available
 */
export function resolveClientKey(headers: Headers): string {
    const trustedForwarded = headers.get("x-vercel-forwarded-for");
    return (
        trustedForwarded
            ?.split(",")
            .map(value => value.trim())
            .filter(Boolean)
            .at(-1) ?? "127.0.0.1"
    );
}

/**
 * Creates a response indicating that the rate-limit service is temporarily unavailable.
 *
 * @returns An HTTP 503 response with a one-second retry interval.
 */
function unavailableResponse() {
    return NextResponse.json(
        { error: "Rate limit service unavailable" },
        { status: 503, headers: { "Retry-After": "1" } }
    );
}

/**
 * Creates a response indicating that the request exceeded its rate limit.
 *
 * @param bucket - The rate-limit bucket that determines the request limit header.
 * @returns A 429 response with retry guidance and the configured bucket limit.
 */
function limitedResponse(bucket: Bucket) {
    return NextResponse.json(
        { error: "Too many requests" },
        {
            status: 429,
            headers: {
                "Retry-After": "60",
                "X-RateLimit-Limit": LIMITS[bucket].toString(),
            },
        }
    );
}

/**
 * Applies rate limiting to recognized API routes and forwards allowed requests.
 *
 * @param request - The incoming request to evaluate.
 * @param check - The rate-limit service used to evaluate the request.
 * @returns A response that forwards the request, indicates rate limiting, or reports service unavailability.
 */
export async function applyRateLimit(
    request: NextRequest,
    check: RateLimitCheck = checkRateLimit
): Promise<NextResponse> {
    const bucket = resolveBucket(request.nextUrl.pathname);
    if (!bucket) return NextResponse.next();

    try {
        const result = await check(RATE_LIMIT_IDS[bucket], {
            request,
            rateLimitKey: resolveClientKey(request.headers),
        });
        if (result.error === "not-found") return unavailableResponse();
        if (result.rateLimited) return limitedResponse(bucket);
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", LIMITS[bucket].toString());
        return response;
    } catch {
        console.error({
            route: request.nextUrl.pathname,
            failureClass: "rate_limit_service",
        });
        return unavailableResponse();
    }
}

export function shouldApplyRateLimit(
    environment: RateLimitEnvironment = process.env
): boolean {
    if (environment.NODE_ENV !== "production") return false;
    return (
        environment.VERCEL_ENV !== "preview" ||
        environment.ENABLE_PREVIEW_RATE_LIMIT === "true"
    );
}

/**
 * Applies API rate limiting in production and forwards requests unchanged in other environments.
 *
 * @returns The response produced by rate-limit processing or request forwarding.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
    if (!shouldApplyRateLimit()) return NextResponse.next();
    return applyRateLimit(request);
}

export const config = {
    matcher: "/api/:path*",
};
