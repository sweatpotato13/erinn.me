/** @jest-environment node */

import { NextRequest } from "next/server";

import {
    applyRateLimit,
    isApiRoute,
    isRateLimitedRoute,
    proxy,
    resolveClientKey,
    shouldApplyRateLimit,
} from "@/proxy";

function request(path: string, options: { method?: string; ip?: string } = {}) {
    const { method = "GET", ip = "203.0.113.8" } = options;
    return new NextRequest(`http://localhost${path}`, {
        method,
        headers: { "x-vercel-forwarded-for": ip },
    });
}

function parseLog(spy: jest.SpyInstance) {
    expect(spy).toHaveBeenCalledTimes(1);
    return JSON.parse(String(spy.mock.calls[0][0])) as {
        event: string;
        reason: string;
        method: string;
        path: string;
        failClosed: boolean;
    };
}

describe("rate limiter", () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    it("identifies API routes for rate limiting", () => {
        expect(isApiRoute("/api/contact")).toBe(true);
        expect(isApiRoute("/api/auction/price-summary")).toBe(true);
        expect(isApiRoute("/api/item-image")).toBe(true);
        expect(isApiRoute("/api/suggest")).toBe(true);
        expect(isApiRoute("/about")).toBe(false);
        expect(isApiRoute("/")).toBe(false);
    });

    it("also rate-limits the calculator preview route", () => {
        expect(isRateLimitedRoute("/calculator/preview")).toBe(true);
        expect(isRateLimitedRoute("/calculator")).toBe(false);
    });

    it("uses the trusted edge identity and ignores client headers", () => {
        expect(
            resolveClientKey(
                new Headers({ "x-forwarded-for": "198.51.100.20" })
            )
        ).toBe("127.0.0.1");
        expect(
            resolveClientKey(
                new Headers({
                    "x-vercel-forwarded-for": "198.51.100.20, 203.0.113.10",
                })
            )
        ).toBe("203.0.113.10");
        expect(
            resolveClientKey(new Headers({ "x-vercel-forwarded-for": " , , " }))
        ).toBe("127.0.0.1");
    });

    it("calls the unified WAF rule with the trusted identity and timeout", async () => {
        const check = jest.fn().mockResolvedValue({ rateLimited: false });
        const response = await applyRateLimit(
            request("/api/contact", { method: "POST" }),
            check
        );
        expect(check).toHaveBeenCalledWith("erinn-api", {
            request: expect.any(Request),
            rateLimitKey: "203.0.113.8",
            timeout: 1500,
        });
        expect(response.headers.get("X-RateLimit-Limit")).toBe("120");
    });

    it("returns 429 when the WAF rule reports rate limited", async () => {
        const check = jest.fn().mockResolvedValue({ rateLimited: true });
        const response = await applyRateLimit(request("/api/auction"), check);
        expect(response.status).toBe(429);
        expect(response.headers.get("Retry-After")).toBe("60");
        expect(response.headers.get("X-RateLimit-Limit")).toBe("120");
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it("fails open on not-found for GET /api/auction and logs without IP", async () => {
        const check = jest.fn().mockResolvedValue({
            rateLimited: false,
            error: "not-found",
        });
        const response = await applyRateLimit(request("/api/auction"), check);
        expect(response.status).toBe(200);
        const log = parseLog(errorSpy);
        expect(log).toEqual({
            event: "rate_limit_unavailable",
            reason: "not-found",
            method: "GET",
            path: "/api/auction",
            failClosed: false,
        });
        expect(JSON.stringify(log)).not.toContain("203.0.113.8");
    });

    it("fails open on blocked for GET /api/auction and logs", async () => {
        const check = jest.fn().mockResolvedValue({
            rateLimited: false,
            error: "blocked",
        });
        const response = await applyRateLimit(request("/api/auction"), check);
        expect(response.status).toBe(200);
        expect(parseLog(errorSpy).reason).toBe("blocked");
    });

    it("fails closed when POST /api/contact throws", async () => {
        const check = jest.fn().mockRejectedValue(new Error("secret"));
        const response = await applyRateLimit(
            request("/api/contact", { method: "POST" }),
            check
        );
        expect(response.status).toBe(503);
        expect(response.headers.get("Retry-After")).toBe("60");
        expect(parseLog(errorSpy).reason).toBe("error");
        expect(JSON.stringify(errorSpy.mock.calls[0][0])).not.toContain(
            "203.0.113.8"
        );
    });

    it("fails closed on TimeoutError for POST /api/murias-relics", async () => {
        const timeout = new Error("timed out");
        timeout.name = "TimeoutError";
        const check = jest.fn().mockRejectedValue(timeout);
        const response = await applyRateLimit(
            request("/api/murias-relics", { method: "POST" }),
            check
        );
        expect(response.status).toBe(503);
        expect(parseLog(errorSpy).reason).toBe("timeout");
    });

    it("fails open on GET /api/murias-relics when the WAF is missing", async () => {
        const check = jest.fn().mockResolvedValue({
            rateLimited: false,
            error: "not-found",
        });
        const response = await applyRateLimit(
            request("/api/murias-relics"),
            check
        );
        expect(response.status).toBe(200);
        expect(parseLog(errorSpy).failClosed).toBe(false);
    });

    it("bypasses non-API routes without calling WAF", async () => {
        const check = jest.fn();
        expect((await applyRateLimit(request("/about"), check)).status).toBe(
            200
        );
        expect(check).not.toHaveBeenCalled();
    });

    it("checks the preview route with the unified WAF rule", async () => {
        const check = jest.fn().mockResolvedValue({ rateLimited: false });
        await applyRateLimit(request("/calculator/preview"), check);
        expect(check).toHaveBeenCalledWith("erinn-api", {
            request: expect.any(Request),
            rateLimitKey: "203.0.113.8",
            timeout: 1500,
        });
    });

    it("bypasses WAF checks in development", async () => {
        expect((await proxy(request("/api/contact"))).status).toBe(200);
    });

    it("bypasses WAF checks in Vercel preview deployments", async () => {
        const originalVercelEnv = process.env.VERCEL_ENV;
        const nodeEnv = jest.replaceProperty(
            process.env,
            "NODE_ENV",
            "production"
        );
        process.env.VERCEL_ENV = "preview";

        try {
            expect((await proxy(request("/api/contact"))).status).toBe(200);
        } finally {
            nodeEnv.restore();
            if (originalVercelEnv === undefined) {
                delete process.env.VERCEL_ENV;
            } else {
                process.env.VERCEL_ENV = originalVercelEnv;
            }
        }
    });

    it.each([
        ["development", { NODE_ENV: "development" }, false],
        [
            "preview by default",
            { NODE_ENV: "production", VERCEL_ENV: "preview" },
            false,
        ],
        [
            "opted-in preview",
            {
                NODE_ENV: "production",
                VERCEL_ENV: "preview",
                ENABLE_PREVIEW_RATE_LIMIT: "true",
            },
            true,
        ],
        [
            "production deployment",
            { NODE_ENV: "production", VERCEL_ENV: "production" },
            true,
        ],
    ])("selects the WAF path for %s", (_case, environment, expected) => {
        expect(shouldApplyRateLimit(environment)).toBe(expected);
    });
});

test("relic POST fails closed on missing or failing WAF, but GET and permitted POST pass", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const post = new NextRequest("http://localhost/api/murias-relics", {
        method: "POST",
    });
    try {
        for (const check of [
            jest
                .fn()
                .mockResolvedValue({ rateLimited: false, error: "not-found" }),
            jest.fn().mockRejectedValue(new Error("unavailable")),
        ]) {
            errorSpy.mockClear();
            const response = await applyRateLimit(post, check);
            expect(response.status).toBe(503);
            expect(response.headers.get("x-middleware-next")).toBeNull();
            expect(response.headers.get("Retry-After")).toBe("60");
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(
                (await applyRateLimit(new NextRequest(post.url), check)).status
            ).toBe(200);
        }
        const permitted = await applyRateLimit(
            post,
            jest.fn().mockResolvedValue({ rateLimited: false })
        );
        expect(permitted.headers.get("x-middleware-next")).toBe("1");
        expect(
            (
                await applyRateLimit(
                    post,
                    jest.fn().mockResolvedValue({ rateLimited: true })
                )
            ).status
        ).toBe(429);
    } finally {
        errorSpy.mockRestore();
    }
});
