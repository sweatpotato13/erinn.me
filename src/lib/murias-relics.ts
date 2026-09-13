import reference from "@/data/murias-reference.json";
import type { AuctionListResponse } from "@/lib/schemas/nexon";

export { reference as muriasReference };
export type RelicEffect = (typeof reference.effects)[number];
export type RelicListing = Pick<
    AuctionListResponse["auction_item"][number],
    | "item_name"
    | "item_display_name"
    | "item_count"
    | "auction_price_per_unit"
    | "date_auction_expire"
    | "item_option"
>;
export interface RelicCell {
    effectId: number;
    level: number;
    minUnitPrice: number | null;
    listingCount: number;
    listings: RelicListing[];
}
export interface RelicSnapshot {
    referenceVersion: string;
    fetchedAt: string | null;
    isComplete: boolean;
    pages: number;
    nextCursor: string | null;
    cells: RelicCell[];
    receivedCount: number;
    unclassifiedCount: number;
    excludedCount: number;
    rejected: { reason: string; item: RelicListing }[];
    relicError: string | null;
    ideaPrice: number | null;
    ideaFetchedAt: string | null;
    ideaIsComplete: boolean;
    ideaError: string | null;
}

export type RelicMatch = Pick<RelicCell, "effectId" | "level">;
export type RelicAggregation = Pick<
    RelicSnapshot,
    | "cells"
    | "receivedCount"
    | "unclassifiedCount"
    | "excludedCount"
    | "rejected"
>;
export type RelicMarketSnapshot = RelicAggregation &
    Pick<RelicSnapshot, "fetchedAt" | "pages" | "nextCursor" | "isComplete">;

// Match complete rendered templates: fixed numbers (e.g. "4개") and maxima
// must never be mistaken for the rolled value. No numeric tolerance/rounding.
const matches = new Map(
    reference.effects.flatMap(effect =>
        effect.values.map(
            (value, index) =>
                [
                    effect.template.replace("{0}", String(value)),
                    { effectId: effect.id, level: index + 1 },
                ] as const
        )
    )
);

export function matchRelicOption(
    options: RelicListing["item_option"]
): RelicMatch | null {
    const relics =
        options?.filter(option => option.option_type === "무리아스 유물") ?? [];
    if (relics.length !== 1) return null;
    const option = relics[0];
    if (option.option_sub_type || option.option_value2 || option.option_desc)
        return null;
    return matches.get(option.option_value ?? "") ?? null;
}

export function emptyRelicCells(): RelicCell[] {
    return reference.effects.flatMap(effect =>
        effect.values.map((_, index) => ({
            effectId: effect.id,
            level: index + 1,
            minUnitPrice: null,
            listingCount: 0,
            listings: [],
        }))
    );
}

function rejectionReason(item: RelicListing): string | null {
    let reason: string | null = null;
    if (item.item_name !== reference.item.name)
        reason = "유물 기본 이름과 다른 아이템";
    else if (item.item_display_name !== reference.item.name)
        reason = "인챈트·변형된 표시 이름";
    else if (
        !Number.isSafeInteger(item.auction_price_per_unit) ||
        item.auction_price_per_unit <= 0 ||
        !Number.isSafeInteger(item.item_count) ||
        item.item_count <= 0
    )
        reason = "유효하지 않은 가격·수량";
    else if (
        item.item_option?.some(option =>
            /인챈트|개조|세공|에르그|내구도|전용화|남은 거래/.test(
                option.option_type
            )
        )
    )
        reason = "인챈트·개조·상태 정보가 있는 매물 (복원 기준 비교 제외)";
    return reason;
}

export function aggregateRelicListings(
    items: RelicListing[]
): RelicAggregation {
    const cells = emptyRelicCells();
    const byKey = new Map(
        cells.map(cell => [`${cell.effectId}:${cell.level}`, cell])
    );
    const rejected: RelicSnapshot["rejected"] = [];
    let unclassifiedCount = 0;
    for (const item of items) {
        let reason = rejectionReason(item);
        const match = reason ? null : matchRelicOption(item.item_option);
        if (!reason && !match) {
            reason = "효과·레벨 미분류 (알 수 없거나 중복·상충하는 옵션)";
            unclassifiedCount++;
        }
        if (reason) {
            rejected.push({ reason, item });
            continue;
        }
        const cell = byKey.get(`${match!.effectId}:${match!.level}`)!;
        cell.listings.push(item);
        cell.listingCount++;
        cell.minUnitPrice = Math.min(
            cell.minUnitPrice ?? Infinity,
            item.auction_price_per_unit
        );
    }
    for (const cell of cells)
        cell.listings.sort(
            (a, b) => a.auction_price_per_unit - b.auction_price_per_unit
        );
    return {
        cells,
        receivedCount: items.length,
        unclassifiedCount,
        excludedCount: rejected.length - unclassifiedCount,
        rejected,
    };
}
