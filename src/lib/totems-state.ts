import { z } from "zod";

import {
    knownTotemStat,
    listingTotemRoll,
    manualTotemRoll,
    maximumTotemValues,
    parseTotemGold,
    type Totem,
    type TotemReference,
    type TotemRoll,
} from "@/lib/totems";
import type { TotemListing } from "@/lib/totems-market";

export const TOTEM_PATH = "/tools/totems";
export const TOTEM_STORAGE_KEY = "erinn-totems-v1";
export const TOTEM_QUERY_LIMIT = 8192;
export const TOTEM_JSON_LIMIT = 16384;
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const key = z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9:-]+$/);
const version = z.string().regex(/^[1-9]\d{0,14}:[a-f0-9]{64}$/);
const statKey = z.string().refine(knownTotemStat);
const values = z.record(statKey, z.string().max(64));
const gold = z
    .string()
    .max(16)
    .refine(v => v === "" || parseTotemGold(v) !== null);
const timestamp = z.iso.datetime({ offset: true });
const optionText = z.string().max(256).nullish();
const optionSchema = z
    .object({
        option_type: z.string().max(256),
        option_sub_type: optionText,
        option_value: optionText,
        option_value2: optionText,
        option_desc: optionText,
    })
    .strict();
const itemSchema = z
    .object({
        item_name: z.string().min(1).max(100),
        item_display_name: z.string().max(200),
        auction_price_per_unit: z.number().nonnegative(),
        item_count: z.number().nonnegative(),
        date_auction_expire: timestamp,
        item_option: z.array(optionSchema).max(32).nullish(),
    })
    .strict();
const baselineSchema = z.object({ id, values }).strict();
const sourceSchema = z
    .object({
        kind: z.literal("source"),
        key,
        id,
        assumeMaximum: z.boolean(),
        values,
    })
    .strict()
    .refine(r => r.assumeMaximum || Object.keys(r.values).length === 0);
const manualSchema = z
    .object({ kind: z.literal("manual"), key, id, values, price: gold })
    .strict();
const listingSchema = z
    .object({
        kind: z.literal("listing"),
        key,
        observedAt: timestamp,
        item: itemSchema,
    })
    .strict();
export const TotemConfigSchema = z
    .object({
        formatVersion: z.literal(1),
        snapshotVersion: version,
        baseline: baselineSchema.nullable(),
        targetStat: z.union([z.literal("all"), statKey]),
        budget: gold,
        candidates: z
            .array(z.union([sourceSchema, manualSchema, listingSchema]))
            .max(4),
    })
    .strict()
    .refine(
        c => new Set(c.candidates.map(r => r.key)).size === c.candidates.length
    );
export type TotemConfig = z.infer<typeof TotemConfigSchema>;
export type TotemCandidate = TotemConfig["candidates"][number];
export type TotemBaseline = z.infer<typeof baselineSchema>;

export function emptyTotemConfig(data: TotemReference): TotemConfig {
    return {
        formatVersion: 1,
        snapshotVersion: data.version,
        baseline: null,
        targetStat: "all",
        budget: "",
        candidates: [],
    };
}

export function sourceTotemCandidate(
    item: Totem,
    assumeMaximum = false
): TotemCandidate {
    return {
        kind: "source",
        key: `source:${item.id}:${assumeMaximum ? "max" : "range"}`,
        id: item.id,
        assumeMaximum,
        values: assumeMaximum ? maximumTotemValues(item) : {},
    };
}

/** Keep the allowed snapshot fields, without shortening names, options, or values. */
export function snapshotTotemListing(listing: TotemListing): TotemCandidate {
    const r = listing.item;
    return {
        kind: "listing",
        key: listing.key,
        observedAt: listing.observedAt,
        item: {
            item_name: r.item_name,
            item_display_name: r.item_display_name,
            auction_price_per_unit: r.auction_price_per_unit,
            item_count: r.item_count,
            date_auction_expire: r.date_auction_expire,
            item_option:
                r.item_option?.map(o => ({
                    option_type: o.option_type,
                    option_sub_type: o.option_sub_type,
                    option_value: o.option_value,
                    option_value2: o.option_value2,
                    option_desc: o.option_desc,
                })) ?? r.item_option,
        },
    };
}

export function candidateTotemRoll(
    candidate: TotemCandidate,
    data: TotemReference
): TotemRoll {
    return candidate.kind === "listing"
        ? listingTotemRoll(
              data.totems,
              candidate.item.item_name,
              candidate.item.item_option
          )
        : manualTotemRoll(
              data.totems.find(r => r.id === candidate.id),
              candidate.values
          );
}
export function candidateTotemPrice(candidate: TotemCandidate): number | null {
    return candidate.kind === "listing"
        ? candidate.item.auction_price_per_unit
        : candidate.kind === "manual"
          ? parseTotemGold(candidate.price)
          : null;
}

function reconcileNotice(config: TotemConfig, data: TotemReference): string {
    const ids = new Set(data.totems.map(r => r.id));
    const missing = [
        config.baseline?.id,
        ...config.candidates.flatMap(c => (c.kind === "listing" ? [] : [c.id])),
    ].filter((id): id is number => id !== undefined && !ids.has(id));
    return [
        config.snapshotVersion !== data.version
            ? "데이터 버전이 바뀌어 현재 범위로 다시 비교합니다. 입력한 값과 당시 매물은 유지합니다."
            : "",
        missing.length
            ? `현재 데이터에 없는 토템 ID: ${[...new Set(missing)].join(", ")}. 입력값은 남겨 두며 교체·범위 평가는 보류합니다.`
            : "",
    ]
        .filter(Boolean)
        .join(" ");
}

// encodeURIComponent counts UTF-8 octets without requiring a Node-only Buffer.
function jsonBytes(raw: string): number {
    return encodeURIComponent(raw).replace(/%[A-F\d]{2}/g, "x").length;
}

export function parseTotemQuery(
    query: string | URLSearchParams,
    data: TotemReference
): { config: TotemConfig | null; notice: string } {
    try {
        const rawQuery =
            typeof query === "string"
                ? query.replace(/^\?/, "")
                : query.toString();
        if (rawQuery.length > TOTEM_QUERY_LIMIT)
            throw new Error("oversize query");
        const params = new URLSearchParams(rawQuery);
        if (![...params.keys()].length) return { config: null, notice: "" };
        if (
            params.getAll("s").length !== 1 ||
            [...params.keys()].some(k => k !== "s")
        )
            throw new Error("unknown/duplicate query key");
        const raw = params.get("s")!;
        if (jsonBytes(raw) > TOTEM_JSON_LIMIT) throw new Error("oversize JSON");
        const config = TotemConfigSchema.parse(JSON.parse(raw));
        return { config, notice: reconcileNotice(config, data) };
    } catch {
        return {
            config: null,
            notice: "공유 링크를 읽지 못했습니다. 길이·형식 또는 지원 버전을 확인해 주세요.",
        };
    }
}

export function buildTotemShare(
    config: TotemConfig,
    settingsOnly = false
): { path: string | null; notice: string } {
    try {
        const input = settingsOnly
            ? {
                  ...config,
                  candidates: config.candidates.filter(
                      c => c.kind !== "listing"
                  ),
              }
            : config;
        const parsed = TotemConfigSchema.parse(input);
        const raw = JSON.stringify(parsed);
        const query = new URLSearchParams({ s: raw }).toString();
        if (
            jsonBytes(raw) > TOTEM_JSON_LIMIT ||
            query.length > TOTEM_QUERY_LIMIT
        )
            throw new Error("oversize");
        return {
            path: `${TOTEM_PATH}?${query}`,
            notice: settingsOnly ? "실제 매물을 제외한 설정만 공유합니다." : "",
        };
    } catch {
        return {
            path: null,
            notice: "매물 정보가 길거나 입력 형식이 맞지 않아 링크에 담을 수 없습니다. 입력을 확인하거나 설정만 공유해 주세요.",
        };
    }
}

const storageSchema = z
    .object({
        formatVersion: z.literal(1),
        snapshotVersion: version,
        baseline: baselineSchema.nullable(),
    })
    .strict();
export function parseTotemStorage(
    raw: string | null,
    data: TotemReference
): { baseline: TotemBaseline | null; notice: string } {
    if (raw === null) return { baseline: null, notice: "" };
    try {
        if (raw.length > TOTEM_JSON_LIMIT || jsonBytes(raw) > TOTEM_JSON_LIMIT)
            throw new Error("oversize storage");
        const parsed = storageSchema.parse(JSON.parse(raw));
        return {
            baseline: parsed.baseline,
            notice: reconcileNotice(
                { ...emptyTotemConfig(data), ...parsed },
                data
            ),
        };
    } catch {
        return {
            baseline: null,
            notice: "저장된 토템 기준을 읽지 못했습니다. 현재 화면에서 다시 입력할 수 있습니다.",
        };
    }
}
export function serializeTotemStorage(
    baseline: TotemBaseline | null,
    data: TotemReference
): string {
    return JSON.stringify(
        storageSchema.parse({
            formatVersion: 1,
            snapshotVersion: data.version,
            baseline,
        })
    );
}
