import { z } from "zod";

import {
    knownEffect,
    miniatureGold,
    type MiniatureReference,
} from "@/lib/miniatures";

export const MINIATURE_PATH = "/tools/miniatures";
export const MINIATURE_STORAGE_KEY = "erinn-miniatures-v1";
export const MAX_MINIATURE_URL = 4000;
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const ids = z.array(id).max(1000);
const version = z.string().regex(/^[1-9]\d{0,14}:[a-f0-9]{64}$/);
const baseSchema = z
    .object({
        formatVersion: z.literal(1),
        snapshotVersion: version,
        installedIds: ids,
    })
    .strict();
const gold = z
    .string()
    .max(16)
    .refine(v => v === "" || miniatureGold(v) !== null);
const shareSchema = baseSchema
    .extend({
        candidateIds: z.array(id).max(4),
        targetStat: z.string().max(80).refine(knownEffect),
        manualPrices: z
            .record(z.string().regex(/^[1-9]\d{0,15}$/), gold)
            .refine(v => Object.keys(v).length <= 4)
            .default({}),
    })
    .strict();
export type MiniatureConfig = z.infer<typeof shareSchema>;

export function defaultMiniatureConfig(
    data: MiniatureReference
): MiniatureConfig {
    return {
        formatVersion: 1,
        snapshotVersion: data.version,
        installedIds: [],
        candidateIds: [],
        targetStat: "AttackMax",
        manualPrices: {},
    };
}
function reconcile(ids: number[], data: MiniatureReference) {
    const valid = new Set(data.miniatures.map(r => r.id));
    const unique = [...new Set(ids)];
    return {
        ids: unique.filter(id => valid.has(id)),
        removed: unique.filter(id => !valid.has(id)),
    };
}
function reconciliationNotice(removed: number[], changed: boolean) {
    return [
        changed ? "데이터 버전이 바뀌어 현재 데이터로 다시 계산했습니다." : "",
        removed.length
            ? `지원이 끝난 항목 제외: ${[...new Set(removed)].join(", ")}`
            : "",
    ]
        .filter(Boolean)
        .join(" ");
}
export function parseMiniatureStorage(
    raw: string | null,
    data: MiniatureReference
) {
    if (raw === null) return { installedIds: [], notice: "" };
    try {
        if (raw.length > 65536) throw new Error("oversize");
        const parsed = baseSchema.parse(JSON.parse(raw));
        const valid = reconcile(parsed.installedIds, data);
        return {
            installedIds: valid.ids,
            notice: reconciliationNotice(
                valid.removed,
                parsed.snapshotVersion !== data.version
            ),
        };
    } catch {
        return {
            installedIds: [],
            notice: "저장된 설치 목록을 읽지 못했습니다. 설치 목록을 다시 설정해 주세요.",
        };
    }
}
export function parseMiniatureShare(
    url: URL,
    data: MiniatureReference
): { config: MiniatureConfig | null; notice: string } {
    if (!url.searchParams.has("s")) return { config: null, notice: "" };
    try {
        if (
            url.href.length > MAX_MINIATURE_URL ||
            url.searchParams.getAll("s").length !== 1 ||
            [...url.searchParams.keys()].some(k => k !== "s")
        )
            throw new Error("invalid URL");
        const config = shareSchema.parse(
            JSON.parse(url.searchParams.get("s")!)
        );
        // Validate prices against the original candidate identities before dropping removed IDs.
        const originalItems = new Set(
            data.miniatures
                .filter(r => config.candidateIds.includes(r.id))
                .map(r => String(r.itemId))
        );
        const removedCandidates = config.candidateIds.some(
            id => !data.miniatures.some(r => r.id === id)
        );
        if (
            Object.keys(config.manualPrices).some(
                k =>
                    !Number.isSafeInteger(Number(k)) ||
                    (!originalItems.has(k) && !removedCandidates)
            )
        )
            throw new Error("unrelated price");
        const installed = reconcile(config.installedIds, data);
        const candidates = reconcile(config.candidateIds, data);
        const notice = reconciliationNotice(
            [...installed.removed, ...candidates.removed],
            config.snapshotVersion !== data.version
        );
        return {
            config: {
                ...config,
                snapshotVersion: data.version,
                installedIds: installed.ids,
                candidateIds: candidates.ids,
                manualPrices: Object.fromEntries(
                    Object.entries(config.manualPrices).filter(([k]) =>
                        originalItems.has(k)
                    )
                ),
            },
            notice,
        };
    } catch {
        return {
            config: null,
            notice: "공유 설정이 올바르지 않거나 너무 깁니다. 내 설치 목록을 사용합니다.",
        };
    }
}
export function miniatureShareUrl(
    config: MiniatureConfig,
    origin: string,
    data: MiniatureReference
) {
    const checked = shareSchema.parse(config);
    const url = new URL(MINIATURE_PATH, origin);
    url.searchParams.set("s", JSON.stringify(checked));
    const parsed = parseMiniatureShare(url, data);
    if (!parsed.config || parsed.notice)
        throw new Error(
            "공유 설정을 확인하거나 항목을 줄여 주세요. URL은 4,000자 이하여야 합니다."
        );
    return url.href;
}
