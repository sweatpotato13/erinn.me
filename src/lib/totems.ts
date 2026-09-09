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
