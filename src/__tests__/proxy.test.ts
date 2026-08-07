/** @jest-environment node */

import { NextRequest } from "next/server";

import {
    consumeRateLimit,
    proxy,
    resolveBucket,
    resolveClientKey,
} from "@/proxy";

describe("rate limiter", () => {
    it("resolves only the four exact route buckets", () => {
        expect(resolveBucket("/api/contact")).toBe("contact");
        expect(resolveBucket("/api/auction/price-summary")).toBe("upstream");
        expect(resolveBucket("/api/item-image")).toBe("image");
        expect(resolveBucket("/api/suggest")).toBe("suggest");
        expect(resolveBucket("/api/unknown")).toBeNull();
    });

    it("enforces the boundary and renews exactly at reset", () => {
        const store = new Map();
        expect(consumeRateLimit(store, "contact", "ip", 1000).remaining).toBe(
            2
        );
        expect(consumeRateLimit(store, "contact", "ip", 1001).remaining).toBe(
            1
        );
        expect(consumeRateLimit(store, "contact", "ip", 1002).remaining).toBe(
            0
        );
        expect(consumeRateLimit(store, "contact", "ip", 1003).success).toBe(
            false
        );
        expect(consumeRateLimit(store, "contact", "ip", 61000)).toMatchObject({
            success: true,
            remaining: 2,
        });
    });

    it("isolates buckets and emits deterministic response headers", () => {
        const store = new Map();
        expect(consumeRateLimit(store, "contact", "ip", 0).remaining).toBe(2);
        expect(consumeRateLimit(store, "suggest", "ip", 0).remaining).toBe(119);

        const allowed = proxy(
            new NextRequest("http://localhost/api/contact", {
                headers: { "x-vercel-forwarded-for": "203.0.113.8" },
            })
        );
        expect(allowed.headers.get("X-RateLimit-Limit")).toBe("3");
        expect(allowed.headers.get("X-RateLimit-Remaining")).toBe("2");
        expect(allowed.headers.get("X-RateLimit-Reset")).toBeTruthy();

        const bypass = proxy(new NextRequest("http://localhost/api/unknown"));
        expect(bypass.headers.get("X-RateLimit-Limit")).toBeNull();
    });

    it("uses the trusted edge identity and ignores client forwarding headers", () => {
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

    it("returns 429 with retry-after after the last allowed request", () => {
        const ip = `198.51.100.${Math.floor(Math.random() * 100)}`;
        const request = () =>
            new NextRequest("http://localhost/api/contact", {
                headers: { "x-vercel-forwarded-for": ip },
            });
        proxy(request());
        proxy(request());
        const last = proxy(request());
        expect(last.headers.get("X-RateLimit-Remaining")).toBe("0");
        const rejected = proxy(request());
        expect(rejected.status).toBe(429);
        expect(rejected.headers.get("Retry-After")).toBeTruthy();
        expect(rejected.headers.get("X-RateLimit-Limit")).toBe("3");
    });

    it("sweeps expired entries on the maintenance interval", () => {
        const now = Date.now();
        const clock = jest.spyOn(Date, "now").mockReturnValue(now + 180_000);
        const response = proxy(
            new NextRequest("http://localhost/api/suggest", {
                headers: { "x-vercel-forwarded-for": "192.0.2.10" },
            })
        );
        expect(response.status).toBe(200);
        clock.mockRestore();
    });
});
