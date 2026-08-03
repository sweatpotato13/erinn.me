import { NextRequest, NextResponse } from "next/server";

const GENERAL_LIMIT = 30;
const GENERAL_WINDOW_MS = 60_000;
const generalRequests = new Map<string, { count: number; resetAt: number }>();

const CONTACT_LIMIT = 3;
const CONTACT_WINDOW_MS = 60_000;
const contactRequests = new Map<string, { count: number; resetAt: number }>();

const SWEEP_INTERVAL_MS = 120_000;
let lastSweep = Date.now();

function sweep(
    map: Map<string, { count: number; resetAt: number }>,
    now: number
) {
    const expired: string[] = [];
    map.forEach((entry, key) => {
        if (now > entry.resetAt) {
            expired.push(key);
        }
    });
    expired.forEach(key => map.delete(key));
}

function maybeSweep() {
    const now = Date.now();
    if (now - lastSweep < SWEEP_INTERVAL_MS) return;
    lastSweep = now;
    sweep(generalRequests, now);
    sweep(contactRequests, now);
}

function inMemoryLimit(
    map: Map<string, { count: number; resetAt: number }>,
    key: string,
    limit: number,
    windowMs: number
): { success: boolean; remaining: number } {
    const now = Date.now();
    const entry = map.get(key);

    if (!entry || now > entry.resetAt) {
        if (entry) map.delete(key);
        map.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0 };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count };
}

export function middleware(request: NextRequest) {
    maybeSweep();

    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "127.0.0.1";

    const isContact = request.nextUrl.pathname === "/api/contact";

    const { success, remaining } = inMemoryLimit(
        isContact ? contactRequests : generalRequests,
        ip,
        isContact ? CONTACT_LIMIT : GENERAL_LIMIT,
        isContact ? CONTACT_WINDOW_MS : GENERAL_WINDOW_MS
    );

    if (!success) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429 }
        );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return response;
}

export const config = {
    matcher: "/api/:path*",
};
