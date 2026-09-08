export interface Miniature {
    id: number;
    itemId: number;
    name: string;
    itemName: string;
    description: string;
    effects: Record<string, number>;
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
export function effectValue(key: string, value: number, delta = false) {
    if (!knownEffect(key))
        return `${miniatureNumber(value)} (단위·계산 규칙 미확인)`;
    return `${delta && value > 0 ? "+" : ""}${miniatureNumber(value)}${MINIATURE_EFFECTS[key].unit === "%" ? (delta ? "%p" : "%") : ""}`;
}
