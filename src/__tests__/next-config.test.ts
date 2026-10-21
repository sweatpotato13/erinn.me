import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

import nextConfig, {
    NEXT_DEFAULT_HTML_LIMITED_BOTS,
} from "../../next.config.mjs";

describe("next.config security headers", () => {
    it("sets Content-Security-Policy-Report-Only on all routes without enforcing CSP", async () => {
        const routes = await nextConfig.headers?.();
        expect(routes).toBeDefined();
        const globalHeaders =
            routes!.find(entry => entry.source === "/(.*)")?.headers ?? [];
        const reportOnly = globalHeaders.find(
            entry => entry.key === "Content-Security-Policy-Report-Only"
        )?.value;
        const enforcing = globalHeaders.find(
            entry => entry.key === "Content-Security-Policy"
        )?.value;

        expect(reportOnly).toBeDefined();
        expect(enforcing).toBeUndefined();
        expect(reportOnly).toContain("default-src 'self'");
        expect(reportOnly).toContain("report-uri /api/csp-report");
        expect(reportOnly).toContain("object-src 'none'");

        const production = process.env.NODE_ENV === "production";
        if (production) {
            expect(reportOnly).not.toContain("'unsafe-eval'");
        } else {
            expect(reportOnly).toContain("'unsafe-eval'");
        }
    });
});

describe("next.config htmlLimitedBots", () => {
    it("keeps Next's default bot list in sync", () => {
        expect(NEXT_DEFAULT_HTML_LIMITED_BOTS).toBe(
            HTML_LIMITED_BOT_UA_RE.source
        );
    });

    it("adds kakaotalk-scrap on top of the defaults", () => {
        const bots = nextConfig.htmlLimitedBots as RegExp;
        expect(bots.test("kakaotalk-scrap/1.0")).toBe(true);
        expect(bots.test("Mozilla/5.0 (compatible; Bingbot/2.0)")).toBe(true);
        expect(bots.test("Mozilla/5.0 (Macintosh) Chrome/140")).toBe(false);
    });
});
