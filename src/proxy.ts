import { NextRequest, NextResponse } from "next/server";

type Bucket = "contact" | "upstream" | "image" | "suggest";
type RateLimitEntry = { count: number; resetAt: number };
type RateLimitResult = {
    success: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
};

const WINDOW_MS = 60_000;
const SWEEP_INTERVAL_MS = 120_000;
const limits: Record<Bucket, number> = {
    contact: 3,
    upstream: 60,
    image: 120,
    suggest: 120,
};
const upstreamRoutes = new Set([
    "/api/auction",
    "/api/auction/keyword-search",
    "/api/auction/price-summary",
    "/api/horn",
    "/api/npc-shop",
]);
const requests = new Map<string, RateLimitEntry>();
let lastSweep = Date.now();

export function resolveBucket(pathname: string): Bucket | null {
    if (pathname === "/api/contact") return "contact";
    if (pathname === "/api/item-image") return "image";
    if (pathname === "/api/suggest") return "suggest";
    if (upstreamRoutes.has(pathname)) return "upstream";
    return null;
}

export function consumeRateLimit(
    store: Map<string, RateLimitEntry>,
    bucket: Bucket,
    clientKey: string,
    now = Date.now()
): RateLimitResult {
    const limit = limits[bucket];
    const key = `${bucket}:${clientKey}`;
    let entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
        entry = { count: 1, resetAt: now + WINDOW_MS };
        store.set(key, entry);
        return {
            success: true,
            limit,
            remaining: limit - 1,
            resetAt: entry.resetAt,
        };
    }

    if (entry.count >= limit) {
        return {
            success: false,
            limit,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    entry.count++;
    return {
        success: true,
        limit,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
    };
}

function maybeSweep(now: number) {
    if (now - lastSweep < SWEEP_INTERVAL_MS) return;
    lastSweep = now;
    requests.forEach((entry, key) => {
        if (now >= entry.resetAt) requests.delete(key);
    });
}

function rateLimitHeaders(result: RateLimitResult) {
    return {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
    };
}

export function proxy(request: NextRequest) {
    const bucket = resolveBucket(request.nextUrl.pathname);
    if (!bucket) return NextResponse.next();

    const now = Date.now();
    maybeSweep(now);
    const forwarded = request.headers.get("x-forwarded-for");
    const clientKey = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
    const result = consumeRateLimit(requests, bucket, clientKey, now);
    const headers = rateLimitHeaders(result);

    if (!result.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            {
                status: 429,
                headers: {
                    ...headers,
                    "Retry-After": Math.max(
                        1,
                        Math.ceil((result.resetAt - now) / 1000)
                    ).toString(),
                },
            }
        );
    }

    const response = NextResponse.next();
    for (const [name, value] of Object.entries(headers)) {
        response.headers.set(name, value);
    }
    return response;
}

export const config = {
    matcher: "/api/:path*",
};
