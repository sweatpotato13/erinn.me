export interface EchoUpgradeData {
    color: number;
    stats: string[];
    steps: Array<{ grade: number; min: number; max: number; chance: number }>;
}
export interface EchoGrowth {
    grade: number;
    stats: number[];
    attempts: number;
    history: Array<{
        attempt: number;
        grade: number;
        gains: number[];
        success: boolean;
    }>;
}
export function newEchoGrowth(data: EchoUpgradeData): EchoGrowth {
    // Starting assumption for a fresh stone, separate from sourced upgrade increments.
    return {
        grade: 1,
        stats: data.stats.map(() => 1),
        attempts: 0,
        history: [],
    };
}
export function upgradeEcho(
    data: EchoUpgradeData,
    current: EchoGrowth,
    random = Math.random
): EchoGrowth {
    const step = data.steps.find(s => s.grade === current.grade);
    if (
        !step ||
        current.grade < 1 ||
        current.grade >= 30 ||
        !Number.isInteger(current.grade) ||
        current.stats.length !== data.stats.length ||
        current.stats.some(n => !Number.isSafeInteger(n) || n < 0) ||
        !Number.isSafeInteger(current.attempts) ||
        current.attempts < 0 ||
        current.attempts >= Number.MAX_SAFE_INTEGER ||
        !Number.isInteger(step.min) ||
        !Number.isInteger(step.max) ||
        step.min < 0 ||
        step.max < step.min ||
        !Number.isFinite(step.chance) ||
        step.chance <= 0 ||
        step.chance > 1
    )
        throw new Error("승급할 에코스톤 정보를 확인하세요.");
    const draw = () => {
        const n = random();
        if (!Number.isFinite(n) || n < 0 || n >= 1)
            throw new Error("난수는 [0, 1) 범위여야 합니다.");
        return n;
    };
    const success = draw() < step.chance;
    // Requested assumption: each integer gain is equally likely; black stats roll independently.
    const gains = current.stats.map(() =>
        success ? step.min + Math.floor(draw() * (step.max - step.min + 1)) : 0
    );
    const stats = current.stats.map((value, i) => value + gains[i]);
    if (stats.some(n => !Number.isSafeInteger(n)))
        throw new Error("스탯이 계산 가능한 범위를 넘었습니다.");
    const grade = current.grade + Number(success);
    const attempts = current.attempts + 1;
    return {
        grade,
        stats,
        attempts,
        history: [
            ...current.history,
            { attempt: attempts, grade, gains, success },
        ].slice(-100),
    };
}
