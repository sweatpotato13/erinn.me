import { NextResponse } from "next/server";

const { BASE_URL } = process.env;

function extractOrigin(value: string): string | null {
    try {
        const parsed = new URL(value);
        return parsed.origin;
    } catch {
        return null;
    }
}

export function checkOrigin(request: Request): NextResponse | null {
    const allowedDomain = BASE_URL || "http://localhost:3000";
    const allowedOrigin = extractOrigin(allowedDomain);

    const referer = request.headers.get("referer");
    const origin = request.headers.get("origin");

    const refererOrigin = referer ? extractOrigin(referer) : null;

    const isAllowed =
        (refererOrigin && refererOrigin === allowedOrigin) ||
        (origin && origin === allowedOrigin);

    if (!isAllowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
}
