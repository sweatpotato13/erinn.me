/** @jest-environment node */

import {
    barterSeasonExpiresAtMs,
    catalogEvidenceExpiresAtMs,
    classifyExpiry,
    evaluateDataExpiry,
    EXPIRY_WARNING_MS,
    formatExpiryInstantSeoul,
    parseVerifiedAtMs,
} from "../check-data-expiry";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("check-data-expiry", () => {
    it("parses verifiedAt and rejects malformed timestamps", () => {
        expect(parseVerifiedAtMs("2026-10-12T05:37:50.437Z")).toBe(
            Date.parse("2026-10-12T05:37:50.437Z")
        );
        expect(() => parseVerifiedAtMs("not-a-date")).toThrow(
            /invalid verifiedAt/
        );
    });

    it("computes catalog expiry from the earliest verifiedAt plus 30 days", () => {
        const expiresAt = catalogEvidenceExpiresAtMs([
            { verifiedAt: "2026-10-12T05:37:50.437Z" },
            { verifiedAt: "2026-10-12T05:37:51.526Z" },
        ]);
        expect(expiresAt).toBe(
            Date.parse("2026-10-12T05:37:50.437Z") + 30 * DAY_MS
        );
    });

    it("classifies expired, boundary, warning window, and valid states", () => {
        const expiresAt = Date.parse("2026-11-05T07:00:00+09:00");
        expect(classifyExpiry(expiresAt, expiresAt)).toBe("expired");
        expect(classifyExpiry(expiresAt, expiresAt - 1)).toBe("warning");
        expect(
            classifyExpiry(expiresAt, expiresAt - EXPIRY_WARNING_MS - 1)
        ).toBe("valid");
        expect(classifyExpiry(expiresAt, expiresAt - EXPIRY_WARNING_MS)).toBe(
            "warning"
        );
    });

    it("fails when a dataset is expired or inside the warning window", () => {
        const expiresAt = Date.parse("2026-11-05T07:00:00+09:00");
        const comfortable = evaluateDataExpiry({
            catalogItems: [{ verifiedAt: "2026-10-12T05:37:50.437Z" }],
            barterSeasonEndAtMs: expiresAt,
            now: new Date(expiresAt - EXPIRY_WARNING_MS - DAY_MS),
        });
        expect(comfortable.ok).toBe(true);
        expect(comfortable.results.map(result => result.severity)).toEqual([
            "valid",
            "valid",
        ]);

        const warning = evaluateDataExpiry({
            catalogItems: [{ verifiedAt: "2026-10-12T05:37:50.437Z" }],
            barterSeasonEndAtMs: expiresAt,
            now: new Date(expiresAt - EXPIRY_WARNING_MS),
        });
        expect(warning.ok).toBe(false);
        expect(warning.results[1]?.severity).toBe("warning");

        const expired = evaluateDataExpiry({
            catalogItems: [{ verifiedAt: "2026-10-12T05:37:50.437Z" }],
            barterSeasonEndAtMs: expiresAt,
            now: new Date(expiresAt),
        });
        expect(expired.ok).toBe(false);
        expect(expired.results[1]?.severity).toBe("expired");
    });

    it("formats expiry instants in Asia/Seoul", () => {
        expect(formatExpiryInstantSeoul(Date.parse("2026-11-05T07:00:00+09:00"))).toBe(
            "2026-11-05 07:00:00 Asia/Seoul"
        );
    });

    it("rejects invalid barter season end timestamps", () => {
        expect(() => barterSeasonExpiresAtMs(Number.NaN)).toThrow(/endAt/);
    });
});
