import {
    benefitCost,
    miniatureGold,
    miniatureSearchText,
} from "@/lib/miniatures";
import type { ItemOption } from "@/types/item-option";

export interface TotemBonus {
    StatName: string;
    Min: number;
    Max: number;
}

export interface TotemRange {
    min: number;
    max: number;
}

export interface Totem {
    id: number;
    name: string;
    description: string;
    type: string;
    isExtra: boolean;
    isPet: boolean;
    searchable: boolean;
    bonuses: TotemBonus[];
    ranges: Partial<Record<string, TotemRange>>;
}

export interface TotemReference {
    version: string;
    sourceVersion: number;
    collectedAt: string;
    coverage: string[];
    totems: Totem[];
}

// Source and API scales are deliberately separate. Evidence: docs/totem-reference.md.
// Empty units retain the game's numeric stat convention; they do not imply percent.
export const TOTEM_STATS: Record<
    string,
    { label: string; subtype: string; unit: string; precision: number }
> = {
    maxdamage: {
        label: "최대 대미지",
        subtype: "최대대미지",
        unit: "",
        precision: 0,
    },
    mindamage: {
        label: "최소 대미지",
        subtype: "최소대미지",
        unit: "",
        precision: 0,
    },
    magicattack: {
        label: "마법 공격력",
        subtype: "마법 공격력",
        unit: "",
        precision: 0,
    },
    bonusdamage: {
        label: "보너스 대미지",
        subtype: "보너스 대미지",
        unit: "%",
        precision: 1,
    },
    critical: {
        label: "크리티컬",
        subtype: "크리티컬",
        unit: "",
        precision: 0,
    },
    strength: { label: "체력", subtype: "체력", unit: "", precision: 0 },
    dexterity: { label: "솜씨", subtype: "솜씨", unit: "", precision: 0 },
    intelligence: { label: "지력", subtype: "지력", unit: "", precision: 0 },
    will: { label: "의지", subtype: "의지", unit: "", precision: 0 },
    luck: { label: "행운", subtype: "행운", unit: "", precision: 0 },
    life: {
        label: "최대 생명력",
        subtype: "최대생명력",
        unit: "",
        precision: 0,
    },
    mana: { label: "최대 마나", subtype: "최대마나", unit: "", precision: 0 },
    stamina: {
        label: "최대 스태미나",
        subtype: "최대스태미나",
        unit: "",
        precision: 0,
    },
    speed: {
        label: "이동 속도",
        subtype: "이동속도 증가",
        unit: "%",
        precision: 0,
    },
    def: { label: "방어", subtype: "방어력", unit: "", precision: 0 },
    magic_defense: {
        label: "마법 방어",
        subtype: "마법 방어력",
        unit: "",
        precision: 0,
    },
    healing: {
        label: "힐링 효과",
        subtype: "힐링 효과",
        unit: "",
        precision: 6,
    },
    alchemy: {
        label: "모든 연금술 대미지",
        subtype: "모든 연금술 대미지",
        unit: "",
        precision: 0,
    },
    musicduration: {
        label: "음악 버프 지속 시간 (API 수치)",
        subtype: "음악 버프 지속 시간",
        unit: "",
        precision: 0,
    },
};

export const ALL_TOTEM_STATS = [
    "strength",
    "dexterity",
    "intelligence",
    "will",
    "luck",
];
export const TOTEM_SOURCE_KEYS: Record<string, string[]> = {
    critical: ["critical"],
    stamina: ["stamina"],
    magicattack: ["magicattack"],
    allstat: ALL_TOTEM_STATS,
    maxdamage: ["maxdamage"],
    bonusdamage: ["bonusdamage"],
    life: ["life"],
    mana: ["mana"],
    speed: ["speed"],
    def: ["def"],
    magic_defense: ["magic_defense"],
    stat_int: ["intelligence"],
    mindamage: ["mindamage"],
};

// Full effect sets, not a first-stat heuristic. Unlisted types stay unverified.
export const TOTEM_TYPE_STATS: Record<string, string[]> = {
    critical: ["critical"],
    stamina: ["stamina"],
    magicattack: ["magicattack"],
    allstat: ALL_TOTEM_STATS,
    maxdamage: ["maxdamage"],
    bonusdamage: ["bonusdamage"],
    life: ["life"],
    mana: ["mana"],
    speedup: ["speed"],
    def_magicdef: ["def", "magic_defense"],
    intmagicattack: ["intelligence", "magicattack"],
    minmaxdamage: ["mindamage", "maxdamage"],
    healingeffect: ["healing"],
    allalchemydamage: ["alchemy"],
};

export const ROYAL_TOTEM_IDS = [
    5160005, 5160090, 5160091, 5160092, 5160099, 5160100,
];
export const knownTotemStat = (key: string): boolean =>
    Object.hasOwn(TOTEM_STATS, key);
export const totemStatLabel = (key: string): string =>
    knownTotemStat(key) ? TOTEM_STATS[key].label : key;

/** Parse the entire displayed number; never mine digits from an explanation. */
export function totemTicks(key: string, input: unknown): number | null {
    if (!knownTotemStat(key) || typeof input !== "string" || input.length > 64)
        return null;
    const stat = TOTEM_STATS[key];
    const match = input.trim().match(/^(\d+)(?:\.(\d{1,6}))?\s*(%?)$/);
    if (!match || (match[3] && stat.unit !== match[3])) return null;
    const fraction = (match[2] ?? "").replace(/0+$/, "");
    if (fraction.length > stat.precision) return null;
    const factor = 10 ** stat.precision;
    const ticks =
        Number(match[1]) * factor +
        Number(fraction.padEnd(stat.precision, "0"));
    return Number.isSafeInteger(ticks) && ticks <= 1_000_000 * factor
        ? ticks
        : null;
}

export function totemValue(key: string, input: unknown): number | null {
    const ticks = totemTicks(key, input);
    return ticks === null ? null : ticks / 10 ** TOTEM_STATS[key].precision;
}

export function totemRanges(bonuses: TotemBonus[]): Totem["ranges"] {
    const ranges: Totem["ranges"] = {};
    const seen = new Set<string>();
    for (const bonus of bonuses) {
        if (
            !Number.isFinite(bonus.Min) ||
            !Number.isFinite(bonus.Max) ||
            bonus.Min < 0 ||
            bonus.Min > bonus.Max
        )
            throw new Error(`Invalid totem bounds: ${bonus.StatName}`);
        if (seen.has(bonus.StatName))
            throw new Error(`Duplicate totem stat: ${bonus.StatName}`);
        seen.add(bonus.StatName);
        if (!Object.hasOwn(TOTEM_SOURCE_KEYS, bonus.StatName)) continue;
        const scale = bonus.StatName === "bonusdamage" ? 10 : 1;
        for (const key of TOTEM_SOURCE_KEYS[bonus.StatName]) {
            const min = totemValue(key, String(bonus.Min / scale));
            const max = totemValue(key, String(bonus.Max / scale));
            if (min === null || max === null || ranges[key])
                throw new Error(`Review totem scale: ${key}`);
            ranges[key] = { min, max };
        }
    }
    return ranges;
}

export type TotemValues = Partial<Record<string, string>>;
export type TotemRelation =
    "replaceable" | "coexist" | "different-target" | "unverified";
export const TOTEM_RELATION_LABELS: Record<TotemRelation, string> = {
    replaceable: "교체 비교 가능",
    coexist: "함께 적용되는 종류",
    "different-target": "적용 대상이 다름",
    unverified: "교체 규칙 확인 필요",
};

export function totemEffectKeys(item: Totem): string[] {
    return [
        ...new Set([
            ...(Object.hasOwn(TOTEM_TYPE_STATS, item.type)
                ? TOTEM_TYPE_STATS[item.type]
                : []),
            ...Object.keys(item.ranges),
        ]),
    ];
}

function verifiedEffectSet(item: Totem): boolean {
    return (
        Object.hasOwn(TOTEM_TYPE_STATS, item.type) &&
        item.bonuses.every(b => Object.hasOwn(TOTEM_SOURCE_KEYS, b.StatName)) &&
        Object.keys(item.ranges).every(key =>
            TOTEM_TYPE_STATS[item.type].includes(key)
        )
    );
}

export function totemRelation(
    a?: Totem | null,
    b?: Totem | null
): TotemRelation {
    if (!a || !b) return "unverified";
    if (a.isPet !== b.isPet) return "different-target";
    if (!verifiedEffectSet(a) || !verifiedEffectSet(b)) return "unverified";
    if ((a.id === 52495 || b.id === 52495) && a.id !== b.id)
        return "unverified";
    if (a.isExtra !== b.isExtra) return "coexist";
    if (
        a.type === b.type ||
        (ROYAL_TOTEM_IDS.includes(a.id) && ROYAL_TOTEM_IDS.includes(b.id))
    )
        return "replaceable";
    return "coexist";
}

export interface TotemRoll {
    reference: Totem | null;
    matches: Totem[];
    status: "matched" | "missing" | "ambiguous" | "conflicting";
    values: Partial<Record<string, number | null>>;
    rawOptions: ItemOption[];
    unknownOptions: ItemOption[];
    duplicateKeys: string[];
    effectSetKnown: boolean;
}

export function resolveTotemName(items: Totem[], name: string): Totem[] {
    return items.filter(item => item.name === name);
}

function rollFromOptions(matches: Totem[], options: ItemOption[]): TotemRoll {
    const reference = matches.length === 1 ? matches[0] : null;
    const values: TotemRoll["values"] = {};
    const unknownOptions: ItemOption[] = [];
    const duplicateKeys: string[] = [];
    for (const option of options) {
        if (option.option_type !== "토템 효과") continue;
        const key = Object.keys(TOTEM_STATS).find(
            k => TOTEM_STATS[k].subtype === option.option_sub_type
        );
        if (!key) {
            unknownOptions.push(option);
            continue;
        }
        if (Object.hasOwn(values, key)) {
            values[key] = null;
            if (!duplicateKeys.includes(key)) duplicateKeys.push(key);
        } else values[key] = totemValue(key, option.option_value);
    }
    const expected = reference ? totemEffectKeys(reference) : [];
    const conflicting =
        !!reference &&
        verifiedEffectSet(reference) &&
        Object.keys(values).some(key => !expected.includes(key));
    return {
        reference,
        matches,
        values,
        rawOptions: options,
        unknownOptions,
        duplicateKeys,
        status: !matches.length
            ? "missing"
            : matches.length > 1
              ? "ambiguous"
              : conflicting
                ? "conflicting"
                : "matched",
        effectSetKnown:
            !!reference &&
            verifiedEffectSet(reference) &&
            !conflicting &&
            !unknownOptions.length,
    };
}

export function listingTotemRoll(
    items: Totem[],
    name: string,
    options?: ItemOption[] | null
): TotemRoll {
    return rollFromOptions(resolveTotemName(items, name), options ?? []);
}

export function manualTotemRoll(
    item: Totem | undefined,
    values: TotemValues
): TotemRoll {
    return rollFromOptions(
        item ? [item] : [],
        Object.entries(values).map(([key, value]) => ({
            option_type: "토템 효과",
            option_sub_type: knownTotemStat(key)
                ? TOTEM_STATS[key].subtype
                : key,
            option_value: value,
        }))
    );
}

export function maximumTotemValues(item: Totem): Record<string, string> {
    return Object.fromEntries(
        Object.entries(item.ranges)
            .filter((entry): entry is [string, TotemRange] => !!entry[1])
            .map(([key, range]) => [key, String(range.max)])
    );
}

/** Absence in a verified effect set is different from a missing rolled value. */
export function totemContribution(roll: TotemRoll, key: string): number | null {
    if (!knownTotemStat(key)) return null;
    if (Object.hasOwn(roll.values, key)) return roll.values[key] ?? null;
    if (
        roll.effectSetKnown &&
        roll.reference &&
        !totemEffectKeys(roll.reference).includes(key)
    )
        return 0;
    return null;
}

export interface TotemEvaluation {
    key: string;
    value: number | null;
    absent: boolean;
    baseline: number | null;
    delta: number | null;
    range: TotemRange | null;
    rangeStatus:
        | "within"
        | "fixed"
        | "outside"
        | "missing"
        | "unknown"
        | "ambiguous"
        | "conflicting";
    position: number | null;
    gap: number | null;
    relation: TotemRelation;
}

export function evaluateTotem(
    key: string,
    candidate: TotemRoll,
    baseline?: TotemRoll | null
): TotemEvaluation {
    const value = totemContribution(candidate, key);
    const before = baseline ? totemContribution(baseline, key) : null;
    const relation =
        baseline &&
        candidate.status === "matched" &&
        baseline.status === "matched"
            ? totemRelation(candidate.reference, baseline.reference)
            : "unverified";
    const factor = knownTotemStat(key) ? 10 ** TOTEM_STATS[key].precision : 1;
    const difference = (a: number, b: number) =>
        (Math.round(a * factor) - Math.round(b * factor)) / factor;
    const delta =
        relation === "replaceable" && value !== null && before !== null
            ? difference(value, before)
            : null;
    const range =
        candidate.status === "matched"
            ? (candidate.reference?.ranges[key] ?? null)
            : null;
    let rangeStatus: TotemEvaluation["rangeStatus"] = "missing";
    let position: number | null = null;
    let gap: number | null = null;
    if (candidate.status === "ambiguous" || candidate.status === "conflicting")
        rangeStatus = candidate.status;
    else if (value === null) rangeStatus = "unknown";
    else if (
        range &&
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min <= range.max
    ) {
        gap = difference(range.max, value);
        if (value < range.min || value > range.max) rangeStatus = "outside";
        else if (range.min === range.max) rangeStatus = "fixed";
        else {
            rangeStatus = "within";
            position =
                difference(value, range.min) / difference(range.max, range.min);
        }
    }
    return {
        key,
        value,
        absent:
            knownTotemStat(key) &&
            candidate.effectSetKnown &&
            !!candidate.reference &&
            !totemEffectKeys(candidate.reference).includes(key),
        baseline: before,
        delta,
        range,
        rangeStatus,
        position,
        gap,
        relation,
    };
}

export function comparisonTotemKeys(rolls: TotemRoll[]): string[] {
    const keys = new Set(
        rolls.flatMap(r => [
            ...Object.keys(r.values),
            ...(r.reference ? totemEffectKeys(r.reference) : []),
        ])
    );
    return [
        ...Object.keys(TOTEM_STATS).filter(k => keys.has(k)),
        ...[...keys].filter(k => !knownTotemStat(k)),
    ];
}

export function formatTotemValue(
    key: string,
    value: number | null,
    delta = false
): string {
    if (value === null) return "미확인";
    if (!knownTotemStat(key))
        return `${value.toLocaleString("ko-KR")} (단위 미확인)`;
    const unit = TOTEM_STATS[key].unit;
    return `${delta && value > 0 ? "+" : ""}${value.toLocaleString("ko-KR", { maximumFractionDigits: TOTEM_STATS[key].precision })}${delta && unit === "%" ? "%p" : unit}`;
}

export const parseTotemGold = miniatureGold;
export function positiveTotemGold(value: unknown): number | null {
    return typeof value === "number" && Number.isSafeInteger(value) && value > 0
        ? value
        : null;
}
export function totemBundleTotal(
    price: unknown,
    quantity: unknown
): string | null {
    const p = positiveTotemGold(price);
    const q = positiveTotemGold(quantity);
    return p === null || q === null ? null : (BigInt(p) * BigInt(q)).toString();
}
export function totemPricePerGain(
    price: unknown,
    evaluation: TotemEvaluation
): number | null {
    if (evaluation.delta === null || !Number.isFinite(evaluation.delta))
        return null;
    return benefitCost(positiveTotemGold(price), evaluation.delta);
}
export function totemBudgetState(
    price: unknown,
    budget: number | null
): "within" | "over" | "unknown" | "unset" {
    if (budget === null || !Number.isSafeInteger(budget) || budget < 0)
        return "unset";
    const p = positiveTotemGold(price);
    return p === null ? "unknown" : p <= budget ? "within" : "over";
}
export type TotemSort = "price" | "value" | "delta" | "efficiency";
export function sortTotemCandidates<T>(
    items: T[],
    metric: (item: T) => number | null,
    descending = false
): T[] {
    return items
        .map((item, index) => ({ item, index, value: metric(item) }))
        .sort((a, b) => {
            const av =
                a.value !== null && Number.isFinite(a.value) ? a.value : null;
            const bv =
                b.value !== null && Number.isFinite(b.value) ? b.value : null;
            return av === null
                ? bv === null
                    ? a.index - b.index
                    : 1
                : bv === null
                  ? -1
                  : (descending ? bv - av : av - bv) || a.index - b.index;
        })
        .map(r => r.item);
}

export function totemDominated(
    a: TotemRoll,
    aPrice: unknown,
    b: TotemRoll,
    bPrice: unknown,
    keys: string[]
): boolean {
    const ap = positiveTotemGold(aPrice),
        bp = positiveTotemGold(bPrice);
    if (
        !keys.length ||
        ap === null ||
        bp === null ||
        ap < bp ||
        !a.effectSetKnown ||
        !b.effectSetKnown ||
        totemRelation(a.reference, b.reference) !== "replaceable"
    )
        return false;
    let strict = ap > bp;
    for (const key of keys) {
        const av = totemContribution(a, key),
            bv = totemContribution(b, key);
        if (av === null || bv === null || av > bv) return false;
        if (av < bv) strict = true;
    }
    return strict;
}

export function filterTotems(
    items: Totem[],
    options: {
        search: string;
        type: string;
        target: string;
        stat: string;
        auctionOnly: boolean;
    }
): Totem[] {
    const filtered = items.filter(item => {
        if (
            options.type !== "all" &&
            item.isExtra !== (options.type === "extra")
        )
            return false;
        if (
            options.target !== "all" &&
            item.isPet !== (options.target === "pet")
        )
            return false;
        if (options.auctionOnly && !item.searchable) return false;
        if (
            options.stat !== "all" &&
            !totemEffectKeys(item).includes(options.stat)
        )
            return false;
        const text = miniatureSearchText(
            [
                item.name,
                item.description,
                item.type,
                ...totemEffectKeys(item).map(totemStatLabel),
            ].join(" ")
        );
        return options.search
            .trim()
            .split(/\s+/)
            .every(word => text.includes(miniatureSearchText(word)));
    });
    const stat =
        options.stat !== "all"
            ? options.stat
            : Object.keys(TOTEM_STATS).find(
                  key =>
                      miniatureSearchText(totemStatLabel(key)) ===
                      miniatureSearchText(options.search)
              );
    return stat
        ? sortTotemCandidates(
              filtered,
              item => item.ranges[stat]?.max ?? null,
              true
          )
        : filtered;
}
