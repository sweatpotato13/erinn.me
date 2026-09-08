export interface Miniature {
    id: number;
    itemId: number;
    name: string;
    itemName: string;
    description: string;
    effects: Partial<Record<string, number>>;
    extra: boolean;
    searchable: boolean;
}

export interface MiniatureReference {
    version: string;
    sourceVersion: number;
    collectedAt: string;
    coverage: string[];
    miniatures: Miniature[];
}

// Units are checked against item descriptions by build-miniature-reference.ts.
export const MINIATURE_EFFECTS: Record<
    string,
    { label: string; unit: string }
> = {
    AttackMax: { label: "최대 대미지", unit: "" },
    MagicAttack: { label: "마법 공격력", unit: "" },
    Strength: { label: "체력", unit: "" },
    Will: { label: "의지", unit: "" },
    Intelligence: { label: "지력", unit: "" },
    Dexterity: { label: "솜씨", unit: "" },
    Luck: { label: "행운", unit: "" },
    Life: { label: "최대 생명력", unit: "" },
    Mana: { label: "최대 마나", unit: "" },
    Stamina: { label: "최대 스태미나", unit: "" },
    MusicSkill: { label: "음악 버프 스킬 효과", unit: "" },
    BonusDamage: { label: "보너스 대미지", unit: "%" },
    CriticalDamage: { label: "크리티컬 대미지", unit: "%" },
    MoveSpeed: { label: "이동 속도", unit: "%" },
    Defense: { label: "방어", unit: "" },
    Protect: { label: "보호", unit: "" },
    MagicDefense: { label: "마법 방어", unit: "" },
    MagicProtect: { label: "마법 보호", unit: "" },
    AllAlchemy: { label: "모든 연금술 대미지", unit: "" },
    HealingEffect: { label: "힐링 효과", unit: "" },
    CriticalRateLimitUp: { label: "크리티컬 상한 증가", unit: "%" },
};

export const knownEffect = (key: string) =>
    Object.hasOwn(MINIATURE_EFFECTS, key);
export const effectLabel = (key: string) =>
    knownEffect(key) ? MINIATURE_EFFECTS[key].label : key;
export const miniatureNumber = (n: number) =>
    n.toLocaleString("ko-KR", { maximumFractionDigits: 6 });
export function effectValue(key: string, value = 0, delta = false) {
    if (!knownEffect(key))
        return `${miniatureNumber(value)} (단위·계산 규칙 미확인)`;
    return `${delta && value > 0 ? "+" : ""}${miniatureNumber(value)}${MINIATURE_EFFECTS[key].unit === "%" ? (delta ? "%p" : "%") : ""}`;
}

export function miniatureTotals(items: Miniature[], ids: number[]) {
    const installed = new Set(ids);
    const normal: Record<string, number> = {};
    const extra: Record<string, number> = {};
    for (const item of items) {
        if (!installed.has(item.id)) continue;
        const group = item.extra ? extra : normal;
        for (const [key, value] of Object.entries(item.effects)) {
            if (
                knownEffect(key) &&
                typeof value === "number" &&
                Number.isFinite(value) &&
                value >= 0
            )
                group[key] = Math.max(group[key] ?? 0, value);
        }
    }
    const total = Object.fromEntries(
        Object.keys(MINIATURE_EFFECTS).map(key => [
            key,
            (normal[key] ?? 0) + (extra[key] ?? 0),
        ])
    );
    return { normal, extra, total };
}

export function miniatureDelta(
    items: Miniature[],
    installed: number[],
    candidates: number[]
) {
    const before = miniatureTotals(items, installed);
    const after = miniatureTotals(items, [...installed, ...candidates]);
    const delta = Object.fromEntries(
        Object.keys(MINIATURE_EFFECTS).map(key => [
            key,
            after.total[key] - before.total[key],
        ])
    );
    return { before, after, delta };
}

export function miniatureGold(value: string): number | null {
    if (!/^(0|[1-9]\d{0,15})$/.test(value)) return null;
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : null;
}

export function marketGold(summary?: {
    minPrice: number;
    availableQuantity: number;
}) {
    return summary &&
        summary.availableQuantity > 0 &&
        Number.isSafeInteger(summary.minPrice) &&
        summary.minPrice > 0
        ? summary.minPrice
        : null;
}

export function benefitCost(
    price: number | null,
    benefit: number
): number | null {
    if (price === null || price <= 0 || benefit <= 0) return null;
    const ratio = price / benefit;
    return Number.isFinite(ratio) ? ratio : null;
}

export function basketCost(prices: Array<number | null>) {
    const missing = prices.filter(p => p === null).length;
    const subtotal = prices.reduce<number>((n, p) => n + (p ?? 0), 0);
    return {
        missing,
        subtotal: Number.isSafeInteger(subtotal) ? subtotal : null,
    };
}

export const miniatureSearchText = (text: string) =>
    text.toLocaleLowerCase("ko-KR").replace(/\s/g, "");
export function matchesMiniature(
    item: Miniature,
    search: string,
    type = "all"
) {
    if ((type === "normal" && item.extra) || (type === "extra" && !item.extra))
        return false;
    const text = [
        item.name,
        item.itemName,
        item.description,
        ...Object.keys(item.effects).map(effectLabel),
    ].join(" ");
    return search
        .trim()
        .split(/\s+/)
        .every(word =>
            miniatureSearchText(text).includes(miniatureSearchText(word))
        );
}

export function filterMiniatures(
    items: Miniature[],
    options: {
        search: string;
        type: string;
        stat: string;
        minimum: number | null;
        auctionOnly: boolean;
    }
) {
    return items
        .filter(
            item =>
                matchesMiniature(item, options.search, options.type) &&
                (options.stat === "all" ||
                    (item.effects[options.stat] ?? 0) > 0) &&
                (!options.auctionOnly || item.searchable) &&
                (options.stat === "all" ||
                    options.minimum === null ||
                    (item.effects[options.stat] ?? 0) >= options.minimum)
        )
        .sort(
            (a, b) =>
                (options.stat === "all"
                    ? b.id - a.id
                    : (b.effects[options.stat] ?? 0) -
                      (a.effects[options.stat] ?? 0)) ||
                a.name.localeCompare(b.name, "ko") ||
                a.id - b.id
        );
}
