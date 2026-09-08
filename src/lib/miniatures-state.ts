import { z } from "zod";

import type { MiniatureReference } from "@/lib/miniatures";

export const MINIATURE_PATH = "/tools/miniatures";
export const MINIATURE_STORAGE_KEY = "erinn-miniatures-v1";
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
