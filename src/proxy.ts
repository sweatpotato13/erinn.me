import { checkRateLimit } from "@vercel/firewall";
import { NextRequest, NextResponse } from "next/server";

type RateLimitCheck = typeof checkRateLimit;
type RateLimitEnvironment = {
    NODE_ENV?: string;
    VERCEL_ENV?: string;
    ENABLE_PREVIEW_RATE_LIMIT?: string;
};

type UnavailableReason = "not-found" | "blocked" | "timeout" | "error";

const RATE_LIMIT_ID = "erinn-api";
const RATE_LIMIT = 120;
const RATE_LIMIT_CHECK_TIMEOUT_MS = 1500;
const CALCULATOR_PREVIEW_PATH = "/calculator/preview";

const FAIL_CLOSED_ROUTES = [
    { method: "POST", path: "/api/contact" },
    { method: "POST", path: "/api/murias-relics" },
] as const;

/**
 * Checks whether the request targets an API route that should be rate-limited.
 *
 * @param pathname - The request path to classify
 * @returns `true` when the path falls under the `/api/` namespace
 */
export function isApiRoute(pathname: string): boolean {
    return pathname.startsWith("/api/");
}

export function isRateLimitedRoute(pathname: string): boolean {
    return isApiRoute(pathname) || pathname === CALCULATOR_PREVIEW_PATH;
}

function isFailClosed(request: NextRequest): boolean {
    const pathname = request.nextUrl.pathname;
    return FAIL_CLOSED_ROUTES.some(
        route => route.method === request.method && route.path === pathname
    );
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

function logRateLimitUnavailable(
    reason: UnavailableReason,
    request: NextRequest,
    failClosed: boolean
): void {
    console.error(
        JSON.stringify({
            event: "rate_limit_unavailable",
            reason,
            method: request.method,
            path: request.nextUrl.pathname,
            failClosed,
        })
    );
}

function unavailableReasonFromError(error: unknown): UnavailableReason {
    if (error instanceof Error && error.name === "TimeoutError") {
        return "timeout";
    }
    return "error";
}

function limitedResponse() {
    return NextResponse.json(
        { error: "Too many requests" },
        {
            status: 429,
            headers: {
                "Retry-After": "60",
                "X-RateLimit-Limit": RATE_LIMIT.toString(),
            },
        }
    );
}

function failClosedResponse(request: NextRequest): NextResponse {
    const message =
        request.nextUrl.pathname === "/api/murias-relics"
            ? "Price refresh is temporarily unavailable"
            : "Contact delivery is temporarily unavailable";
    return NextResponse.json(
        { error: message },
        { status: 503, headers: { "Retry-After": "60" } }
    );
}

function handleUnavailableCheck(
    reason: UnavailableReason,
    request: NextRequest
): NextResponse {
    const failClosed = isFailClosed(request);
    logRateLimitUnavailable(reason, request, failClosed);
    if (failClosed) {
        return failClosedResponse(request);
    }
    return NextResponse.next();
}

/**
 * Applies rate limiting to configured public routes via Vercel Firewall WAF.
 * Mail and cache-bust routes fail closed when the WAF is unavailable; others fail open.
 *
 * @param request - The incoming request to evaluate.
 * @param check - The rate-limit service used to evaluate the request.
 * @returns A response that forwards the request or indicates rate limiting.
 */
export async function applyRateLimit(
    request: NextRequest,
    check: RateLimitCheck = checkRateLimit
): Promise<NextResponse> {
    if (!isRateLimitedRoute(request.nextUrl.pathname)) {
        return NextResponse.next();
    }

    try {
        const result = await check(RATE_LIMIT_ID, {
            request,
            rateLimitKey: resolveClientKey(request.headers),
            timeout: RATE_LIMIT_CHECK_TIMEOUT_MS,
        });
        if (result.error) {
            return handleUnavailableCheck(result.error, request);
        }
        if (result.rateLimited) return limitedResponse();
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", RATE_LIMIT.toString());
        return response;
    } catch (error) {
        return handleUnavailableCheck(
            unavailableReasonFromError(error),
            request
        );
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
 * Applies public-route rate limiting in production and forwards requests unchanged in other environments.
 *
 * @returns The response produced by rate-limit processing or request forwarding.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
    if (!shouldApplyRateLimit()) return NextResponse.next();
    return applyRateLimit(request);
}

export const config = {
    matcher: ["/api/:path*", "/calculator/preview"],
};
