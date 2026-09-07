import polishingEvidence from "@/data/echostone-polishing-evidence.json";

export const ECHO_POLISH_AGENT = polishingEvidence.agentId;

export interface EchoLevel {
    level: number;
    weight: number;
}
export interface EchoItem {
    id: number;
    name: string;
    description: string;
    searchable: boolean;
}
export interface EchoOption {
    id: number;
    name: string;
    abilityId: number;
    max: number;
    weight: number;
    effect: {
        initial: number;
        perLevel: number;
        standard: number;
        unit: string;
    } | null;
}
export interface EchoReference {
    version: string;
    polishingAgent: number;
    colors: Array<{
        id: number;
        name: string;
        total: number;
        options: EchoOption[];
    }>;
    levels: Record<number, EchoLevel[]>;
    grades: Record<number, Record<number, number>>;
    agents: Array<EchoItem & { lower: Record<number, number> }>;
    stone: EchoItem;
}
export interface EchoPool {
    color: number;
    grade: number;
    agent: number;
    options: Array<EchoOption & { chance: number; levels: EchoLevel[] }>;
}
export interface EchoTarget {
    name: string;
    level: number;
}
export interface EchoState {
    id: number;
    level: number;
    polishingUsed: boolean;
}
export type EchoPolicy = "awakening" | "polishing";
export const ECHO_CAP = 1_000_000;

function total(rows: { weight: number }[]) {
    const sum = rows.reduce((s, r) => s + r.weight, 0);
    if (
        !rows.length ||
        rows.some(r => !Number.isFinite(r.weight) || r.weight <= 0) ||
        !Number.isFinite(sum)
    )
        throw new Error("확률 자료가 비어 있거나 잘못되었습니다.");
    return sum;
}
export function echoLevels(
    data: EchoReference,
    max: number,
    grade: number,
    agentId: number
): EchoLevel[] {
    const upper = data.grades[grade]?.[max];
    const lower = data.agents.find(a => a.id === agentId)?.lower[max];
    const rows = data.levels[max];
    if (upper === undefined || lower === undefined || !rows)
        throw new Error("등급·각성제·레벨 확률 자료가 없습니다.");
    const retained = rows.filter(r => r.level > lower && r.level <= upper);
    total(retained);
    return retained;
}
export function createEchoPool(
    data: EchoReference,
    colorId: number,
    grade: number,
    agent: number
): EchoPool {
    const color = data.colors.find(c => c.id === colorId);
    if (!color || !Number.isInteger(grade) || grade < 1 || grade > 30)
        throw new Error("색상과 등급을 확인하세요.");
    if (
        total(color.options) !== color.total ||
        new Set(color.options.map(o => o.id)).size !== color.options.length
    )
        throw new Error("색상 확률 합계 또는 옵션 식별자가 잘못되었습니다.");
    return {
        color: colorId,
        grade,
        agent,
        options: color.options.map(o => {
            let levels: EchoLevel[];
            try {
                levels = echoLevels(data, o.max, grade, agent);
            } catch {
                throw new Error(
                    `${o.name}: 이 등급·각성제 조합의 유효 레벨 확률 자료가 없습니다.`
                );
            }
            return {
                ...o,
                chance: o.weight / color.total,
                levels,
            };
        }),
    };
}
export function echoEffect(option: EchoOption, level: number): string {
    const e = option.effect;
    if (!e) return "효과 수치 자료 없음";
    if (!e.standard) return e.unit;
    return `${((e.initial + e.perLevel * (level - 1)) * e.standard).toLocaleString("ko-KR", { maximumFractionDigits: 4 })} ${e.unit}`;
}
export function levelChance(levels: EchoLevel[], minimum: number): number {
    return (
        levels.reduce(
            (sum, r) => sum + (r.level >= minimum ? r.weight : 0),
            0
        ) / total(levels)
    );
}
export function echoTargetError(
    pool: EchoPool,
    target: EchoTarget
): string | null {
    return !Number.isInteger(target.level) ||
        target.level < 1 ||
        target.level > 20 ||
        !pool.options.some(o => o.name === target.name)
        ? "목표 옵션과 1~20 정수 레벨을 확인하세요."
        : null;
}
export function echoProbability(
    pool: EchoPool,
    target: EchoTarget
): {
    option: number;
    conditional: number;
    combined: number;
} {
    const error = echoTargetError(pool, target);
    if (error) throw new Error(error);
    const options = pool.options.filter(o => o.name === target.name);
    const option = options.reduce((sum, o) => sum + o.chance, 0);
    const combined = options.reduce(
        (sum, o) => sum + o.chance * levelChance(o.levels, target.level),
        0
    );
    return { option, conditional: combined / option, combined };
}
export function echoStateError(
    pool: EchoPool,
    state: EchoState | null
): string | null {
    if (!state) return null;
    const option = pool.options.find(o => o.id === state.id);
    return !option ||
        !Number.isInteger(state.level) ||
        state.level < 1 ||
        state.level > option.max ||
        typeof state.polishingUsed !== "boolean"
        ? "현재 옵션의 색상·등급·레벨을 확인하세요."
        : null;
}
export function echoHit(
    pool: EchoPool,
    target: EchoTarget,
    state: EchoState | null
): boolean {
    return (
        !!state &&
        pool.options.some(o => o.id === state.id && o.name === target.name) &&
        state.level >= target.level
    );
}
export function canPolish(pool: EchoPool, state: EchoState | null): boolean {
    return (
        !!state &&
        !echoStateError(pool, state) &&
        !state.polishingUsed &&
        state.level < pool.options.find(o => o.id === state.id)!.max
    );
}
// The independent polishing pool must come from verified evidence, never the selected awakening agent.
export function polishOutcomes(
    pool: EchoPool,
    state: EchoState,
    polish: EchoPool | null
): Array<{ level: number; probability: number }> {
    if (!canPolish(pool, state))
        throw new Error("이미 연마했거나 최대 레벨이므로 연마할 수 없습니다.");
    if (
        !polish ||
        polish.color !== pool.color ||
        polish.grade !== pool.grade ||
        polish.agent !== ECHO_POLISH_AGENT
    )
        throw new Error("연마 레벨 확률이 검증되지 않았습니다.");
    const option = polish.options.find(o => o.id === state.id);
    if (!option) throw new Error("연마 옵션의 확률 자료가 없습니다.");
    const sum = total(option.levels);
    const outcomes = new Map<number, number>();
    for (const row of option.levels) {
        const level = Math.max(state.level, row.level);
        outcomes.set(level, (outcomes.get(level) ?? 0) + row.weight);
    }
    return [...outcomes].map(([level, weight]) => ({
        level,
        probability: weight / sum,
    }));
}
export interface EchoCosts {
    awakening: bigint | null;
    stone: bigint | null;
}
export interface EchoExpectation {
    awakenings: number;
    stones: number;
    ap: number;
    gold: number | null;
}
function expectation(
    awakenings: number,
    stones: number,
    costs: EchoCosts
): EchoExpectation {
    const gold =
        !Number.isFinite(awakenings) || !Number.isFinite(stones)
            ? Infinity
            : (awakenings > 0 && costs.awakening === null) ||
                (stones > 0 && costs.stone === null)
              ? null
              : awakenings * Number(costs.awakening ?? 0) +
                stones * Number(costs.stone ?? 0);
    return { awakenings, stones, ap: awakenings * 25, gold };
}
export function echoStrategies(
    pool: EchoPool,
    target: EchoTarget,
    costs: EchoCosts,
    polish: EchoPool | null
): ReturnType<typeof echoProbability> & {
    A: EchoExpectation;
    B: EchoExpectation | null;
    cycleSuccess: number | null;
} {
    const probabilities = echoProbability(pool, target);
    const A = expectation(1 / probabilities.combined, 0, costs);
    if (!polish) return { ...probabilities, A, B: null, cycleSuccess: null };
    let success = probabilities.combined,
        stonesPerCycle = 0;
    for (const option of pool.options.filter(o => o.name === target.name)) {
        const sum = total(option.levels);
        for (const row of option.levels) {
            const state = {
                id: option.id,
                level: row.level,
                polishingUsed: false,
            };
            if (row.level >= target.level || !canPolish(pool, state)) continue;
            const chance = (option.chance * row.weight) / sum;
            const r = polishOutcomes(pool, state, polish).reduce(
                (s, o) => s + (o.level >= target.level ? o.probability : 0),
                0
            );
            success += chance * r;
            stonesPerCycle += chance;
        }
    }
    return {
        ...probabilities,
        A,
        B: expectation(
            1 / success,
            success > 0 ? stonesPerCycle / success : Infinity,
            costs
        ),
        cycleSuccess: success,
    };
}
export function existingEchoStrategy(
    pool: EchoPool,
    target: EchoTarget,
    state: EchoState | null,
    costs: EchoCosts,
    polish: EchoPool | null,
    restart: EchoExpectation | null
): EchoExpectation | null {
    if (echoStateError(pool, state))
        throw new Error(echoStateError(pool, state)!);
    if (echoHit(pool, target, state)) return expectation(0, 0, costs);
    if (
        !state ||
        !echoHit(pool, { ...target, level: 1 }, state) ||
        !canPolish(pool, state)
    )
        return restart;
    if (!polish || !restart) return null;
    const r = polishOutcomes(pool, state, polish).reduce(
        (s, o) => s + (o.level >= target.level ? o.probability : 0),
        0
    );
    return expectation(
        r === 1 ? 0 : (1 - r) * restart.awakenings,
        1 + (r === 1 ? 0 : (1 - r) * restart.stones),
        costs
    );
}
function sample<T extends { weight: number }>(rows: T[], random: () => number) {
    const sum = total(rows),
        r = random();
    if (!Number.isFinite(r) || r < 0 || r >= 1)
        throw new Error("난수는 [0, 1) 범위여야 합니다.");
    let cursor = r * sum;
    for (const row of rows) {
        cursor -= row.weight;
        if (cursor < 0) return row;
    }
    return rows[rows.length - 1];
}
export function awakenEcho(pool: EchoPool, random = Math.random): EchoState {
    const option = sample(pool.options, random);
    return {
        id: option.id,
        level: sample(option.levels, random).level,
        polishingUsed: false,
    };
}
export function polishEcho(
    pool: EchoPool,
    state: EchoState,
    polish: EchoPool | null,
    random = Math.random
): EchoState {
    const rows = polishOutcomes(pool, state, polish).map(o => ({
        level: o.level,
        weight: o.probability,
    }));
    return { ...state, level: sample(rows, random).level, polishingUsed: true };
}
export interface EchoSession {
    current: EchoState | null;
    actions: number;
    awakenings: number;
    stones: number;
    agents: Record<number, number>;
    spent: bigint;
    unknownCosts: number;
    history: Array<{
        action: "awakening" | "polishing";
        state: EchoState;
        number: number;
    }>;
}
export const emptyEchoSession = (
    current: EchoState | null = null
): EchoSession => ({
    current,
    actions: 0,
    awakenings: 0,
    stones: 0,
    agents: {},
    spent: BigInt(0),
    unknownCosts: 0,
    history: [],
});
export function echoAction(
    session: EchoSession,
    pool: EchoPool,
    action: EchoPolicy,
    costs: EchoCosts,
    polish: EchoPool | null,
    random = Math.random
): EchoSession & { current: EchoState } {
    if (echoStateError(pool, session.current))
        throw new Error(echoStateError(pool, session.current)!);
    const price = action === "awakening" ? costs.awakening : costs.stone;
    if (price !== null && price < BigInt(0))
        throw new Error("가격은 0 이상이어야 합니다.");
    const current =
        action === "awakening"
            ? awakenEcho(pool, random)
            : polishEcho(pool, session.current!, polish, random);
    return {
        ...session,
        current,
        actions: session.actions + 1,
        awakenings: session.awakenings + Number(action === "awakening"),
        stones: session.stones + Number(action === "polishing"),
        agents:
            action === "awakening"
                ? {
                      ...session.agents,
                      [pool.agent]: (session.agents[pool.agent] ?? 0) + 1,
                  }
                : session.agents,
        spent: session.spent + (price ?? BigInt(0)),
        unknownCosts: session.unknownCosts + Number(price === null),
        history: [
            ...session.history,
            { action, state: current, number: session.actions + 1 },
        ].slice(-100),
    };
}
export interface EchoRun {
    policy: EchoPolicy;
    cap: number;
    budget: bigint | null;
    costs: EchoCosts;
}
export function runEchoChunk(
    session: EchoSession,
    pool: EchoPool,
    target: EchoTarget,
    polish: EchoPool | null,
    run: EchoRun,
    completed = 0,
    spent = BigInt(0),
    cancelled = () => false,
    random = Math.random
): { session: EchoSession; completed: number; spent: bigint; reason: string } {
    if (!Number.isSafeInteger(completed) || completed < 0 || spent < BigInt(0))
        throw new Error("누적 횟수와 비용은 0 이상이어야 합니다.");
    if (
        !Number.isSafeInteger(run.cap) ||
        run.cap < 1 ||
        run.cap > ECHO_CAP ||
        echoTargetError(pool, target) ||
        echoStateError(pool, session.current) ||
        !["awakening", "polishing"].includes(run.policy) ||
        Object.values(run.costs).some(p => p !== null && p < BigInt(0)) ||
        (run.budget !== null &&
            (run.budget < BigInt(0) ||
                run.costs.awakening === null ||
                (run.policy === "polishing" && run.costs.stone === null)))
    )
        throw new Error("목표·최대 횟수·가격·예산을 확인하세요.");
    if (run.policy === "polishing" && !polish)
        throw new Error("연마 레벨 확률이 검증되지 않았습니다.");
    const strategies = echoStrategies(
        pool,
        target,
        run.costs,
        run.policy === "polishing" ? polish : null
    );
    let next = session,
        reason = "";
    if (
        !echoHit(pool, target, next.current) &&
        (run.policy === "awakening"
            ? strategies.combined
            : strategies.cycleSuccess) === 0
    )
        return {
            session: next,
            completed,
            spent,
            reason: "달성 불가능한 목표",
        };
    for (let i = 0; i < 100; i++) {
        if (cancelled()) {
            reason = "취소됨";
            break;
        }
        if (echoHit(pool, target, next.current)) {
            reason = "목표 달성";
            break;
        }
        if (completed >= run.cap) {
            reason = "최대 횟수 도달";
            break;
        }
        const action =
            run.policy === "polishing" &&
            canPolish(pool, next.current) &&
            echoHit(pool, { ...target, level: 1 }, next.current)
                ? "polishing"
                : "awakening";
        const price =
            action === "polishing" ? run.costs.stone : run.costs.awakening;
        if (run.budget !== null && spent + price! > run.budget) {
            reason = "예산 한도 도달";
            break;
        }
        next = echoAction(next, pool, action, run.costs, polish, random);
        completed++;
        spent += price ?? BigInt(0);
    }
    if (!reason && echoHit(pool, target, next.current)) reason = "목표 달성";
    if (!reason && completed >= run.cap) reason = "최대 횟수 도달";
    return { session: next, completed, spent, reason };
}
