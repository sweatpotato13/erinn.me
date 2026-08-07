/** @jest-environment node */

import { NextRequest } from "next/server";

import {
    applyRateLimit,
    proxy,
    resolveBucket,
    resolveClientKey,
} from "@/proxy";

function request(path: string, ip = "203.0.113.8") {
    return new NextRequest(`http://localhost${path}`, {
        headers: { "x-vercel-forwarded-for": ip },
    });
}

describe("rate limiter", () => {
    it("resolves only the four exact route buckets", () => {
        expect(resolveBucket("/api/contact")).toBe("contact");
        expect(resolveBucket("/api/auction/price-summary")).toBe("upstream");
        expect(resolveBucket("/api/item-image")).toBe("image");
        expect(resolveBucket("/api/suggest")).toBe("suggest");
        expect(resolveBucket("/api/unknown")).toBeNull();
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
    });

    it("checks the matching WAF rule with the trusted identity", async () => {
        const check = jest.fn().mockResolvedValue({ rateLimited: false });
        const response = await applyRateLimit(request("/api/contact"), check);
        expect(check).toHaveBeenCalledWith("erinn-contact", {
            request: expect.any(Request),
            rateLimitKey: "203.0.113.8",
        });
        expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
    });

    it.each([
        ["/api/contact", "3"],
        ["/api/auction", "60"],
        ["/api/item-image", "120"],
        ["/api/suggest", "120"],
    ])("returns 429 for an exhausted %s WAF rule", async (path, limit) => {
        const check = jest.fn().mockResolvedValue({ rateLimited: true });
        const response = await applyRateLimit(request(path), check);
        expect(response.status).toBe(429);
        expect(response.headers.get("Retry-After")).toBe("60");
        expect(response.headers.get("X-RateLimit-Limit")).toBe(limit);
    });

    it("fails closed when the WAF rule is missing or unavailable", async () => {
        const missing = jest.fn().mockResolvedValue({
            rateLimited: false,
            error: "not-found",
        });
        expect(
            (await applyRateLimit(request("/api/contact"), missing)).status
        ).toBe(503);

        const log = jest.spyOn(console, "error").mockImplementation();
        const failing = jest.fn().mockRejectedValue(new Error("secret"));
        expect(
            (await applyRateLimit(request("/api/contact"), failing)).status
        ).toBe(503);
        expect(log).toHaveBeenCalledWith({
            route: "/api/contact",
            failureClass: "rate_limit_service",
        });
        log.mockRestore();
    });

    it("bypasses unrelated routes and WAF checks in development", async () => {
        const check = jest.fn();
        expect(
            (await applyRateLimit(request("/api/unknown"), check)).status
        ).toBe(200);
        expect(check).not.toHaveBeenCalled();
        expect((await proxy(request("/api/contact"))).status).toBe(200);
    });
});
