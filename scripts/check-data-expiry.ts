/**
 * Offline guard for time-limited committed datasets.
 *
 * Usage: pnpm data:expiry
 * Inject clock (ISO-8601): DATA_EXPIRY_NOW=2026-10-29T07:00:00+09:00 pnpm data:expiry
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Must stay aligned with validateAuctionItemCatalog evidence window. */
export const EVIDENCE_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;
export const EXPIRY_WARNING_MS = 7 * 24 * 60 * 60 * 1000;

export type ExpirySeverity = "valid" | "warning" | "expired";

export type DatasetExpiryResult = {
    id: "auction-item-catalog" | "barter-season";
    severity: ExpirySeverity;
    expiresAtMs: number;
    line: string;
};

const readJson = (path: string) =>
    JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));

export function parseVerifiedAtMs(verifiedAt: string): number {
    const parsed = Date.parse(verifiedAt);
    if (Number.isNaN(parsed)) {
        throw new Error(`invalid verifiedAt timestamp: ${verifiedAt}`);
    }
    return parsed;
}

export function catalogEvidenceExpiresAtMs(
    items: readonly { verifiedAt: string }[]
): number {
    if (items.length === 0) {
        throw new Error("catalog must contain at least one item");
    }
    let earliestVerifiedAt = Number.POSITIVE_INFINITY;
    for (const item of items) {
        earliestVerifiedAt = Math.min(
            earliestVerifiedAt,
            parseVerifiedAtMs(item.verifiedAt)
        );
    }
    return earliestVerifiedAt + EVIDENCE_VALIDITY_MS;
}

export function barterSeasonExpiresAtMs(endAtMs: number): number {
    if (!Number.isFinite(endAtMs)) {
        throw new Error("barter season endAt must be a finite epoch millisecond");
    }
    return endAtMs;
}

export function classifyExpiry(
    expiresAtMs: number,
    nowMs: number,
    warningMs = EXPIRY_WARNING_MS
): ExpirySeverity {
    if (nowMs >= expiresAtMs) return "expired";
    if (nowMs >= expiresAtMs - warningMs) return "warning";
    return "valid";
}

export function formatExpiryInstantSeoul(ms: number): string {
    const formatted = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date(ms));
    return `${formatted} Asia/Seoul`;
}

function formatLine(
    id: DatasetExpiryResult["id"],
    severity: ExpirySeverity,
    expiresAtMs: number
): string {
    const instant = formatExpiryInstantSeoul(expiresAtMs);
    if (severity === "valid") {
        return `${id}: valid until ${instant}`;
    }
    if (severity === "warning") {
        return `${id}: within 7 days of expiry at ${instant}`;
    }
    return `${id}: expired at ${instant}`;
}

export function evaluateDataExpiry(input: {
    catalogItems: readonly { verifiedAt: string }[];
    barterSeasonEndAtMs: number;
    now?: Date;
    warningMs?: number;
}): { ok: boolean; results: DatasetExpiryResult[] } {
    const nowMs = (input.now ?? new Date()).getTime();
    const warningMs = input.warningMs ?? EXPIRY_WARNING_MS;
    const datasets: Array<{
        id: DatasetExpiryResult["id"];
        expiresAtMs: number;
    }> = [
        {
            id: "auction-item-catalog",
            expiresAtMs: catalogEvidenceExpiresAtMs(input.catalogItems),
        },
        {
            id: "barter-season",
            expiresAtMs: barterSeasonExpiresAtMs(input.barterSeasonEndAtMs),
        },
    ];
    const results = datasets.map(({ id, expiresAtMs }) => {
        const severity = classifyExpiry(expiresAtMs, nowMs, warningMs);
        return {
            id,
            severity,
            expiresAtMs,
            line: formatLine(id, severity, expiresAtMs),
        };
    });
    const ok = results.every(result => result.severity === "valid");
    return { ok, results };
}

function resolveNowFromEnv(): Date | undefined {
    const raw = process.env.DATA_EXPIRY_NOW?.trim();
    if (!raw) return undefined;
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
        throw new Error(`invalid DATA_EXPIRY_NOW: ${raw}`);
    }
    return new Date(parsed);
}

function main() {
    const catalog = readJson("src/data/auction-item-catalog.json") as {
        items: { verifiedAt: string }[];
    };
    const season = readJson("src/data/barter-season.json") as {
        period: { endAt: number };
    };
    const { ok, results } = evaluateDataExpiry({
        catalogItems: catalog.items,
        barterSeasonEndAtMs: season.period.endAt,
        now: resolveNowFromEnv(),
    });
    for (const result of results) {
        console.log(result.line);
    }
    if (!ok) process.exitCode = 1;
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
