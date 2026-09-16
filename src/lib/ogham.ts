import reference from "@/data/ogham-reference.json";

export const oghamReference = reference;
export type OghamReference = typeof reference;
export type OghamEffect = OghamReference["effects"][number];
export interface OghamSlot {
    effectId: number;
    level: number;
    locked: boolean;
}
export interface OghamSession {
    wordId: number;
    grade: number;
    slots: OghamSlot[];
    resets: number;
    gold: number;
    fragments: number;
    items: Record<number, number>;
}
export const gradeNames = ["", "엘리트", "에픽", "마스터"];

/** Resolve and validate the effect pool for a word and grade. */
export function effectPool(wordId: number, grade: number, data = reference) {
    const word = data.words.find(word => word.id === wordId);
    if (!word?.grades.includes(grade))
        throw new Error("지원하지 않는 워드·등급입니다.");
    const pool = data.effects.filter(
        effect => word.special || effect.generalPool
    );
    if (
        pool.length < grade ||
        pool.some(
            effect =>
                !effect.values.length ||
                effect.values.some(value => !Number.isFinite(value))
        )
    )
        throw new Error("사용 가능한 효과가 부족하거나 값이 잘못되었습니다.");
    return pool;
}

/** Validate a session and return the cost for its current grade and locks. */
export function nextResetCost(session: OghamSession, data = reference) {
    const pool = effectPool(session.wordId, session.grade, data);
    if (
        session.slots.length !== session.grade ||
        new Set(session.slots.map(slot => slot.effectId)).size !==
            session.slots.length
    )
        throw new Error("효과 수가 잘못되었거나 중복 효과가 있습니다.");
    for (const slot of session.slots) {
        const effect = pool.find(effect => effect.id === slot.effectId);
        if (
            !effect ||
            !Number.isInteger(slot.level) ||
            slot.level < 1 ||
            slot.level > effect.values.length ||
            typeof slot.locked !== "boolean"
        )
            throw new Error("효과와 레벨을 확인해 주세요.");
    }
    const locks = session.slots.filter(slot => slot.locked).length;
    if (locks >= session.grade)
        throw new Error("최소 한 효과는 잠금 해제해야 합니다.");
    const cost = data.costs.find(
        cost => cost.grade === session.grade && cost.locks === locks
    );
    if (!cost) throw new Error("재설정 비용을 찾을 수 없습니다.");
    return cost;
}

/** Create an unspent session using the first unique effects in its pool. */
export function initialSession(
    wordId = 2,
    grade = 3,
    data = reference
): OghamSession {
    const pool = effectPool(wordId, grade, data);
    return {
        wordId,
        grade,
        slots: pool
            .slice(0, grade)
            .map(effect => ({ effectId: effect.id, level: 1, locked: false })),
        resets: 0,
        gold: 0,
        fragments: 0,
        items: {},
    };
}

/** Substitute the selected level's value into an effect text template. */
export function effectText(effect: OghamEffect, level: number) {
    const value = effect.values[level - 1];
    if (!Number.isInteger(level) || !Number.isFinite(value))
        throw new Error("잘못된 효과 레벨입니다.");
    // Prilus uses the same multiplier placeholders and four-decimal rounding.
    return effect.template.replace(
        /\[\*(-?\d+(?:\.\d+)?)\]/g,
        (_, factor: string) =>
            String(Math.round(value * Number(factor) * 10_000) / 10_000)
    );
}

/** Convert one valid random sample into an index within the requested size. */
function randomIndex(size: number, rng: () => number) {
    const value = rng();
    if (!size || !Number.isFinite(value) || value < 0 || value >= 1)
        throw new Error("추첨에 실패했습니다. 다시 시도해 주세요.");
    return Math.floor(value * size);
}

/** Add non-negative counters without exceeding JavaScript's safe range. */
function safeAdd(current: number, amount: number) {
    if (
        !Number.isSafeInteger(current) ||
        current < 0 ||
        !Number.isSafeInteger(amount) ||
        amount < 0 ||
        !Number.isSafeInteger(current + amount)
    )
        throw new Error(
            "누적 수량의 범위를 초과했습니다. 시뮬레이션을 초기화해 주세요."
        );
    return current + amount;
}

/** Reroll unlocked effects without replacement and charge exactly one reset. */
export function resetOgham(
    session: OghamSession,
    rng = Math.random,
    data = reference
): OghamSession {
    const cost = nextResetCost(session, data);
    const locked = new Set(
        session.slots.filter(slot => slot.locked).map(slot => slot.effectId)
    );
    const pool = effectPool(session.wordId, session.grade, data).filter(
        effect => !locked.has(effect.id)
    );
    const slots = session.slots.map(slot => {
        if (slot.locked) return { ...slot };
        const effect = pool.splice(randomIndex(pool.length, rng), 1)[0];
        return {
            effectId: effect.id,
            level: randomIndex(effect.values.length, rng) + 1,
            locked: false,
        };
    });
    const items = { ...session.items };
    for (const item of cost.items)
        items[item.id] = safeAdd(items[item.id] ?? 0, item.count);
    return {
        ...session,
        slots,
        items,
        resets: safeAdd(session.resets, 1),
        gold: safeAdd(session.gold, cost.gold),
        fragments: safeAdd(session.fragments, cost.fragments),
    };
}
