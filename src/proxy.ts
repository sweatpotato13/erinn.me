import { checkRateLimit } from "@vercel/firewall";
import { NextRequest, NextResponse } from "next/server";

type Bucket = "contact" | "upstream" | "image" | "suggest";
type RateLimitCheck = typeof checkRateLimit;

const limits: Record<Bucket, number> = {
    contact: 3,
    upstream: 60,
    image: 120,
    suggest: 120,
};
const rateLimitIds: Record<Bucket, string> = {
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

export function resolveBucket(pathname: string): Bucket | null {
    if (pathname === "/api/contact") return "contact";
    if (pathname === "/api/item-image") return "image";
    if (pathname === "/api/suggest") return "suggest";
    if (upstreamRoutes.has(pathname)) return "upstream";
    return null;
}

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

function unavailableResponse() {
    return NextResponse.json(
        { error: "Rate limit service unavailable" },
        { status: 503, headers: { "Retry-After": "1" } }
    );
}

function limitedResponse(bucket: Bucket) {
    return NextResponse.json(
        { error: "Too many requests" },
        {
            status: 429,
            headers: {
                "Retry-After": "60",
                "X-RateLimit-Limit": limits[bucket].toString(),
            },
        }
    );
}

export async function applyRateLimit(
    request: NextRequest,
    check: RateLimitCheck = checkRateLimit
) {
    const bucket = resolveBucket(request.nextUrl.pathname);
    if (!bucket) return NextResponse.next();

    try {
        const result = await check(rateLimitIds[bucket], {
            request,
            rateLimitKey: resolveClientKey(request.headers),
        });
        if (result.error === "not-found") return unavailableResponse();
        if (result.rateLimited) return limitedResponse(bucket);
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", limits[bucket].toString());
        return response;
    } catch {
        console.error({
            route: request.nextUrl.pathname,
            failureClass: "rate_limit_service",
        });
        return unavailableResponse();
    }
}

export async function proxy(request: NextRequest) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return applyRateLimit(request);
}

export const config = {
    matcher: "/api/:path*",
};
