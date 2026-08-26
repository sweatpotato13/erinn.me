/** @jest-environment node */

import { NextRequest } from "next/server";

import {
    applyRateLimit,
    isApiRoute,
    proxy,
    resolveClientKey,
    shouldApplyRateLimit,
} from "@/proxy";

function request(path: string, ip = "203.0.113.8") {
    return new NextRequest(`http://localhost${path}`, {
        headers: { "x-vercel-forwarded-for": ip },
    });
}

describe("rate limiter", () => {
    it("identifies API routes for rate limiting", () => {
        expect(isApiRoute("/api/contact")).toBe(true);
        expect(isApiRoute("/api/auction/price-summary")).toBe(true);
        expect(isApiRoute("/api/item-image")).toBe(true);
        expect(isApiRoute("/api/suggest")).toBe(true);
        expect(isApiRoute("/about")).toBe(false);
        expect(isApiRoute("/")).toBe(false);
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

    it("calls the unified WAF rule with the trusted identity", async () => {
        const check = jest.fn().mockResolvedValue({ rateLimited: false });
        const response = await applyRateLimit(request("/api/contact"), check);
        expect(check).toHaveBeenCalledWith("erinn-api", {
            request: expect.any(Request),
            rateLimitKey: "203.0.113.8",
        });
        expect(response.headers.get("X-RateLimit-Limit")).toBe("120");
    });

    it("returns 429 when the WAF rule reports rate limited", async () => {
        const check = jest.fn().mockResolvedValue({ rateLimited: true });
        const response = await applyRateLimit(request("/api/auction"), check);
        expect(response.status).toBe(429);
        expect(response.headers.get("Retry-After")).toBe("60");
        expect(response.headers.get("X-RateLimit-Limit")).toBe("120");
    });

    it("fails open when the WAF rule is missing or unavailable", async () => {
        const missing = jest.fn().mockResolvedValue({
            rateLimited: false,
            error: "not-found",
        });
        expect(
            (await applyRateLimit(request("/api/contact"), missing)).status
        ).toBe(200);

        const failing = jest.fn().mockRejectedValue(new Error("secret"));
        expect(
            (await applyRateLimit(request("/api/contact"), failing)).status
        ).toBe(200);
    });

    it("bypasses non-API routes without calling WAF", async () => {
        const check = jest.fn();
        expect((await applyRateLimit(request("/about"), check)).status).toBe(
            200
        );
        expect(check).not.toHaveBeenCalled();
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
