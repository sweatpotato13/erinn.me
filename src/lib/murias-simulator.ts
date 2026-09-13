import {
    calculateAuctionDistribution,
    createEmptyCouponPrices,
    MAX_GOLD,
} from "@/lib/auction-calculator";
import { muriasReference, type RelicSnapshot } from "@/lib/murias-relics";

export function validSimulationGold(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= 0 &&
        value <= MAX_GOLD
    );
}

export function parseSimulationGold(value: string): number | null {
    if (!/^\d+$/.test(value)) return null;
    const amount = Number(value);
    return validSimulationGold(amount) ? amount : null;
}

export interface SimulationPrice {
    value: number | null;
    source: "manual" | "market" | "unknown";
    at: string | null;
}

export interface RelicOpening {
    sequence: number;
    effectId: number;
    level: number;
    description: string;
    referenceVersion: string;
    idea: SimulationPrice & { value: number };
    valuation: SimulationPrice;
}

export function restoreRelic(
    settings: {
        idea: SimulationPrice;
        snapshot: RelicSnapshot | null;
    },
    sequence: number,
    rng: () => number = Math.random
): RelicOpening {
    if (!validSimulationGold(settings.idea.value))
        throw new Error("이데아 가격을 유효한 Gold 정수로 입력해 주세요.");
    if (!Number.isSafeInteger(sequence) || sequence < 1)
        throw new Error("복원 횟수 한도를 초과했습니다.");
    const draws = [rng(), rng()];
    if (draws.some(value => !Number.isFinite(value) || value < 0 || value >= 1))
        throw new Error("유효하지 않은 난수입니다.");
    const effect =
        muriasReference.effects[
            Math.floor(draws[0] * muriasReference.effects.length)
        ];
    const level = 1 + Math.floor(draws[1] * 10);
    const snapshot = settings.snapshot;
    if (snapshot && snapshot.referenceVersion !== muriasReference.version)
        throw new Error(
            "참조 데이터가 변경되었습니다. 페이지를 새로고침해 주세요."
        );
    const cell = snapshot?.cells.find(
        cell => cell.effectId === effect.id && cell.level === level
    );
    const marketPrice = cell?.minUnitPrice;
    const valuation: SimulationPrice = {
        value: validSimulationGold(marketPrice) ? marketPrice : null,
        source: validSimulationGold(marketPrice) ? "market" : "unknown",
        at: snapshot?.fetchedAt ?? null,
    };
    return {
        sequence,
        effectId: effect.id,
        level,
        description: effect.template.replace(
            "{0}",
            String(effect.values[level - 1])
        ),
        referenceVersion: muriasReference.version,
        idea: { ...settings.idea, value: settings.idea.value },
        valuation: { ...valuation },
    };
}

export function openingAmounts(opening: RelicOpening) {
    const value = opening.valuation.value;
    const fee =
        value === null
            ? null
            : value === 0
              ? 0
              : calculateAuctionDistribution({
                    salePrice: value,
                    memberCount: 1,
                    hasMembership: false,
                    additionalCost: 0,
                    couponPrices: createEmptyCouponPrices(),
                }).recommended.auctionFee;
    const cost = opening.idea.value;
    const net = value === null ? null : value - fee!;
    return { fee, cost, net, profit: net === null ? null : net - cost };
}

function safeSum(a: number, b: number): number {
    const value = a + b;
    if (!Number.isSafeInteger(value))
        throw new Error(
            "누적 금액 한도를 초과했습니다. 세션을 초기화해 주세요."
        );
    return value;
}

// ponytail: recompute the in-memory ledger in O(n); use incremental totals
// if sessions become large enough to make restoration noticeably slow.
export function summarizeOpenings(openings: RelicOpening[]) {
    let idea = 0,
        gross = 0,
        fees = 0,
        net = 0,
        valued = 0;
    for (const opening of openings) {
        const amounts = openingAmounts(opening);
        idea = safeSum(idea, opening.idea.value);
        if (opening.valuation.value !== null) {
            valued++;
            gross = safeSum(gross, opening.valuation.value);
            fees = safeSum(fees, amounts.fee!);
            net = safeSum(net, amounts.net!);
        }
    }
    const complete = valued === openings.length;
    return {
        count: openings.length,
        valued,
        idea,
        gross,
        fees,
        net,
        profit: complete ? net - idea : null,
    };
}
