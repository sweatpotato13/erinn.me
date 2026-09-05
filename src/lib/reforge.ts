export interface ReforgeEquipment {
    id: number;
    name: string;
    type: string;
    races: number;
    unsupported?: string;
}
export interface ReforgeTool {
    id: number;
    itemId: number;
    name: string;
    lines: number;
    minFactor: number;
    maxFactor: number;
    breakRate: number;
    legacy: boolean;
    unsupported?: string;
}
export interface ReforgeAbility {
    id: number;
    name: string;
    unit: string;
    types: string[];
    tools: number[];
    races: number;
    max: number[];
    initial: number;
    perLevel: number;
    standard: number;
    limitBreak: boolean;
}
export interface ReforgeLevel {
    level: number;
    min: number;
    max: number;
    breakMin: number;
    breakMax: number;
}
export interface ReforgeOption {
    id: number;
    name: string;
    unit: string;
    initial: number;
    perLevel: number;
    standard: number;
    min: number;
    max: number;
    breakMin: number;
    breakMax: number;
    breakRate: number;
}
export interface ReforgeModel {
    version: string;
    equipment: ReforgeEquipment;
    tool: ReforgeTool;
    pool: ReforgeOption[];
}
export interface ReforgeTarget {
    id: number;
    level: number;
}
export type TargetMode = "and" | "or";

// Official 2021 equipment table; OHAxe is deliberately not an OH exception.
export const EQUIPMENT_TYPES: Record<string, string> = {
    Accessary: "액세서리",
    Armorboots: "중갑 신발",
    Atlatl: "아틀라틀",
    BlacksmithHammer: "대장장이 망치",
    Bow: "활",
    CarpentryKit: "목공 도구",
    Chainblade: "체인 블레이드",
    ClothArmor: "천옷",
    ClothArmorComm: "교역 강화 의상",
    CollectingTool: "채집 도구",
    Cooking: "요리 도구",
    Crossbow: "석궁",
    Cylinder: "실린더",
    CylinderTurret: "가드 실린더",
    DNDreamcatcher: "드림캐처",
    Dualgun: "듀얼건",
    FireWand: "파이어 원드",
    Fishing: "낚싯대",
    Fynnbell: "핀 벨",
    Gauntlet: "중갑 건틀렛",
    Glove: "장갑",
    HandcraftKit: "핸디크래프트 도구",
    Handle: "핸들",
    Headgear: "모자",
    HealingWand: "힐링 원드",
    HeavyArmor: "중갑옷",
    Helm: "중갑 투구",
    HidePalm: "은신 도구",
    IceWand: "아이스 원드",
    Instrument: "악기",
    InstrumentLure: "현혹의 연주 악기",
    Knuckle: "너클",
    LRod: "L로드",
    Lance: "랜스",
    Lightarmor: "경갑옷",
    LightningWand: "라이트닝 원드",
    Lumber: "목공용 대패",
    MagicAssistanceBook: "마도서",
    MagicalKnuckle: "마력 너클",
    MeleeWand: "근접 원드",
    OHAxe: "한손 도끼",
    OHBlunt: "한손 둔기",
    OHSword: "한손 검",
    Orb: "오브",
    Rapier: "레이피어",
    RoughTouch: "셰프의 거친 손길",
    Scythe: "대형 낫",
    Shield: "방패",
    Shoes: "신발",
    Shuriken: "수리검",
    Sieve: "야금용 체",
    SilkProductionTool: "실크 생산 도구",
    Staff: "스태프",
    SunRodColt: "썬로드 콜트",
    THAxe: "양손 도끼",
    THBlunt: "양손 둔기",
    THSword: "양손 검",
    TailorKit: "재봉 도구",
    Trainingbarton: "조련 막대",
    TriboltWand: "트리볼트 원드",
};
export function raceLabel(races: number) {
    return ["인간", "엘프", "자이언트"]
        .filter((_, i) => races & (1 << i))
        .join(" · ");
}
export function createReforgePool(
    equipment: ReforgeEquipment,
    tool: ReforgeTool,
    abilities: ReforgeAbility[],
    levels: ReforgeLevel[]
): ReforgeOption[] {
    if (
        equipment.unsupported ||
        tool.unsupported ||
        !Object.hasOwn(EQUIPMENT_TYPES, equipment.type)
    )
        throw new Error("지원하지 않는 장비 또는 도구입니다.");
    const family =
        equipment.type === "Accessary"
            ? 2
            : ["OHSword", "OHBlunt", "Rapier", "RoughTouch"].includes(
                    equipment.type
                )
              ? 1
              : 0;
    const pool = abilities
        .filter(
            a =>
                a.types.includes(equipment.type) &&
                a.tools.includes(tool.id) &&
                a.races & equipment.races
        )
        .flatMap(a => {
            const base = a.max[family];
            if (!base) return [];
            const row = levels.find(l => l.level === base);
            if (!row) throw new Error(`누락된 레벨 표: ${base}`);
            const min = Math.max(
                row.min,
                Math.round((row.max * tool.minFactor) / 100),
                1
            );
            const max = Math.floor((row.max * tool.maxFactor) / 100);
            if (max < 1) return [];
            const breakRate = a.limitBreak ? tool.breakRate : 0;
            if (
                min > max ||
                (breakRate > 0 &&
                    (row.breakMin <= max || row.breakMax < row.breakMin))
            )
                throw new Error(`잘못된 레벨 범위: ${a.id}`);
            return [
                {
                    id: a.id,
                    name: a.name,
                    unit: a.unit,
                    initial: a.initial,
                    perLevel: a.perLevel,
                    standard: a.standard,
                    min,
                    max,
                    breakMin: breakRate ? row.breakMin : 0,
                    breakMax: breakRate ? row.breakMax : 0,
                    breakRate,
                },
            ];
        });
    if (
        pool.length < tool.lines ||
        new Set(pool.map(a => a.id)).size !== pool.length
    )
        throw new Error("옵션 풀이 비어 있거나 중복되었습니다.");
    return pool;
}
export function effectText(option: ReforgeOption, level: number) {
    if (!option.standard) return option.unit;
    const value =
        (option.initial + option.perLevel * (level - 1)) * option.standard;
    return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(value)} ${option.unit}`;
}
export function conditionalChance(option: ReforgeOption, level: number) {
    const tail = (min: number, max: number) =>
        Math.max(0, max - Math.max(min, level) + 1) / (max - min + 1);
    return (
        (1 - option.breakRate) * tail(option.min, option.max) +
        (option.breakRate
            ? option.breakRate * tail(option.breakMin, option.breakMax)
            : 0)
    );
}
export function targetError(pool: ReforgeOption[], targets: ReforgeTarget[]) {
    if (!targets.length || targets.length > 3)
        return "목표는 1~3개를 선택하세요.";
    if (new Set(targets.map(t => t.id)).size !== targets.length)
        return "같은 옵션을 중복 목표로 지정할 수 없습니다.";
    if (
        targets.some(
            t =>
                !Number.isSafeInteger(t.level) ||
                t.level < 1 ||
                !pool.some(a => a.id === t.id)
        )
    )
        return "지원하는 옵션과 1 이상의 정수 레벨을 선택하세요.";
    return null;
}
export function targetProbability(
    pool: ReforgeOption[],
    lines: number,
    targets: ReforgeTarget[],
    mode: TargetMode
) {
    if (targetError(pool, targets) || lines < 1 || lines > pool.length)
        return 0;
    const q = targets.map(t =>
        conditionalChance(
            pool.find(a => a.id === t.id)!,
            t.level
        )
    );
    const intersection = (indices: number[]) => {
        if (indices.length > lines) return 0;
        return indices.reduce(
            (p, index, j) => p * ((lines - j) / (pool.length - j)) * q[index],
            1
        );
    };
    if (mode === "and") return intersection(q.map((_, i) => i));
    let probability = 0;
    for (let mask = 1; mask < 1 << targets.length; mask++) {
        const indices = q.map((_, i) => i).filter(i => mask & (1 << i));
        probability += (indices.length % 2 ? 1 : -1) * intersection(indices);
    }
    return Math.min(1, Math.max(0, probability));
}
export function successWithin(p: number, attempts: number) {
    if (attempts <= 0 || p <= 0) return 0;
    return p >= 1 ? 1 : -Math.expm1(attempts * Math.log1p(-p));
}
export function successThreshold(p: number, threshold: number) {
    if (p <= 0) return Infinity;
    if (p >= 1) return 1;
    return Math.ceil(Math.log1p(-threshold) / Math.log1p(-p));
}
export function parseGold(value: string): bigint | null {
    if (!/^(0|[1-9]\d{0,29})$/.test(value)) return null;
    return BigInt(value);
}
export interface ReforgeRoll {
    options: Array<{ id: number; level: number; limitBreak: boolean }>;
    hit: boolean;
    number: number;
}
export interface ReforgeSession {
    attempts: number;
    hits: number;
    spent: bigint;
    unknownCosts: number;
    history: ReforgeRoll[];
}
export const emptySession = (): ReforgeSession => ({
    attempts: 0,
    hits: 0,
    spent: BigInt(0),
    unknownCosts: 0,
    history: [],
});
export function sampleRoll(
    pool: ReforgeOption[],
    lines: number,
    targets: ReforgeTarget[],
    mode: TargetMode,
    random = Math.random
) {
    const draw = () => {
        const r = random();
        if (!Number.isFinite(r) || r < 0 || r >= 1)
            throw new Error("난수는 [0, 1) 범위여야 합니다.");
        return r;
    };
    if (!Number.isInteger(lines) || lines < 1 || lines > pool.length)
        throw new Error("잘못된 옵션 개수입니다.");
    const remaining = [...pool];
    const options = Array.from({ length: lines }, () => {
        const [a] = remaining.splice(Math.floor(draw() * remaining.length), 1);
        const r = draw();
        // Ordinary interval first; zero-mass break intervals are never sampled.
        const limitBreak = a.breakRate > 0 && r >= 1 - a.breakRate;
        const min = limitBreak ? a.breakMin : a.min;
        const max = limitBreak ? a.breakMax : a.max;
        const fraction = limitBreak
            ? (r - (1 - a.breakRate)) / a.breakRate
            : r / (1 - a.breakRate);
        return {
            id: a.id,
            level: Math.min(max, min + Math.floor(fraction * (max - min + 1))),
            limitBreak,
        };
    });
    const satisfied = targets.map(t =>
        options.some(a => a.id === t.id && a.level >= t.level)
    );
    return {
        options,
        hit:
            satisfied.length > 0 &&
            (mode === "and"
                ? satisfied.every(Boolean)
                : satisfied.some(Boolean)),
    };
}
export interface ReforgeRun {
    maxAttempts: number;
    price: bigint | null;
    budget: bigint | null;
    stopOnHit: boolean;
}
export function runReforgeChunk(
    session: ReforgeSession,
    model: ReforgeModel,
    targets: ReforgeTarget[],
    mode: TargetMode,
    run: ReforgeRun,
    completed: number,
    spent: bigint,
    cancelled: () => boolean = () => false,
    random = Math.random
) {
    if (
        !Number.isSafeInteger(run.maxAttempts) ||
        run.maxAttempts < 1 ||
        run.maxAttempts > 1_000_000 ||
        (run.price !== null && run.price < BigInt(0)) ||
        (run.budget !== null &&
            (run.budget < BigInt(0) || run.price === null)) ||
        targetError(model.pool, targets) ||
        (run.stopOnHit &&
            targetProbability(model.pool, model.tool.lines, targets, mode) ===
                0)
    )
        throw new Error("목표, 최대 횟수와 가격/예산을 확인하세요.");
    const next = { ...session, history: [...session.history] };
    let reason = "";
    for (let i = 0; i < 100; i++) {
        if (cancelled()) {
            reason = "취소됨";
            break;
        }
        if (completed >= run.maxAttempts) {
            reason = "최대 횟수 도달";
            break;
        }
        if (run.budget !== null && spent + run.price! > run.budget) {
            reason = "예산 한도 도달";
            break;
        }
        const roll = sampleRoll(
            model.pool,
            model.tool.lines,
            targets,
            mode,
            random
        );
        next.attempts++;
        completed++;
        if (run.price === null) next.unknownCosts++;
        else {
            next.spent += run.price;
            spent += run.price;
        }
        if (roll.hit) next.hits++;
        next.history.push({ ...roll, number: next.attempts });
        if (run.stopOnHit && roll.hit) {
            reason = "목표 달성";
            break;
        }
    }
    if (!reason && completed >= run.maxAttempts) reason = "최대 횟수 도달";
    if (!reason && run.budget !== null && spent + run.price! > run.budget)
        reason = "예산 한도 도달";
    next.history = next.history.slice(-100);
    return { session: next, completed, spent, reason };
}
