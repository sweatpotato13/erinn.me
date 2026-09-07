import evidence from "@/data/echostone-polishing-evidence.json";
import reference from "@/data/echostone-reference.json";
import {
    awakenEcho,
    canPolish,
    createEchoPool,
    echoAction,
    echoEffect,
    echoLevels,
    type EchoPool,
    echoProbability,
    echoStrategies,
    emptyEchoSession,
    existingEchoStrategy,
    levelChance,
    polishEcho,
    polishOutcomes,
    runEchoChunk,
} from "@/lib/echostone";
import { successThreshold, successWithin } from "@/lib/reforge";

const red = createEchoPool(reference, 1, 30, 53940);
const target = { name: "체력", level: 3 };
const costs = { awakening: BigInt(100), stone: BigInt(50) };
const sequence = (...values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length];
};

test("actual snapshot uses weighted color and exclusive level bounds", () => {
    expect(echoProbability(red, target).combined).toBeCloseTo(
        (500 / 457500) * (20 / 180),
        15
    );
    expect(levelChance(echoLevels(reference, 5, 30, 53942), 5)).toBeCloseTo(
        20 / 200,
        15
    );
    expect(echoLevels(reference, 20, 30, 53942)[0].level).toBe(5);
    expect(echoLevels(reference, 20, 1, 53940).map(r => r.level)).toEqual([1]);
    expect(() => createEchoPool(reference, 1, 1, 53942)).toThrow("유효 레벨");
    expect(reference.colors.map(c => c.total)).toEqual([
        457500, 3052500, 1146400, 1462500, 975100,
    ]);
    expect(reference.colors.map(c => c.options.length)).toEqual([
        96, 137, 105, 120, 122,
    ]);
    expect(reference.agents.map(a => a.id)).toEqual([
        53940, 53941, 53942, 5000078,
    ]);
    expect(reference.agents[3].searchable).toBe(false);
    expect(echoEffect(red.options[0], 3)).toBe("4.5 증가");
    expect(
        echoEffect(
            red.options.find(o => o.abilityId === 0)!,
            1
        )
    ).toBe("효과 수치 자료 없음");
});

test("all supported color/grade/agent combinations normalize without dropping rows", () => {
    for (const color of reference.colors)
        for (let grade = 1; grade <= 30; grade++)
            for (const agent of reference.agents) {
                const hasEmpty = color.options.some(o => {
                    try {
                        echoLevels(reference, o.max, grade, agent.id);
                        return false;
                    } catch {
                        return true;
                    }
                });
                if (hasEmpty) {
                    expect(() =>
                        createEchoPool(reference, color.id, grade, agent.id)
                    ).toThrow();
                    continue;
                }
                const pool = createEchoPool(
                    reference,
                    color.id,
                    grade,
                    agent.id
                );
                expect(pool.options).toHaveLength(color.options.length);
                expect(
                    pool.options.reduce((s, o) => s + o.chance, 0)
                ).toBeCloseTo(1, 12);
                for (const option of pool.options)
                    expect(levelChance(option.levels, 1)).toBe(1);
            }
    expect(() =>
        createEchoPool(
            { ...reference, colors: [{ ...reference.colors[0], total: 1 }] },
            1,
            30,
            53940
        )
    ).toThrow("합계");
    expect(() =>
        echoLevels({ ...reference, levels: {} }, 3, 30, 53940)
    ).toThrow("자료");
});

const synthetic: EchoPool = {
    color: 1,
    grade: 30,
    agent: 53942,
    options: [
        {
            ...red.options[0],
            id: 1,
            name: "target",
            weight: 1,
            chance: 0.1,
            max: 2,
            levels: [
                { level: 1, weight: 8 },
                { level: 2, weight: 2 },
            ],
        },
        {
            ...red.options[0],
            id: 2,
            name: "other",
            weight: 9,
            chance: 0.9,
            max: 2,
            levels: [{ level: 1, weight: 1 }],
        },
    ],
};
const polish: EchoPool = {
    ...synthetic,
    agent: 53940,
    options: synthetic.options.map(o => ({
        ...o,
        levels: [
            { level: 1, weight: 7 },
            { level: 2, weight: 3 },
        ],
    })),
};
const goal = { name: "target", level: 2 };

test("strategies use actual state probabilities; duplicate identities sum", () => {
    const result = echoStrategies(synthetic, goal, costs, polish);
    expect(result.cycleSuccess).toBeCloseTo(0.044, 15);
    expect(result.A.gold).toBeCloseTo(100 / 0.02, 10);
    expect(result.B!.gold).toBeCloseTo(104 / 0.044, 10);
    expect(result.B!.stones).toBeCloseTo(0.08 / 0.044, 12);
    const state = { id: 1, level: 1, polishingUsed: false };
    expect(
        existingEchoStrategy(synthetic, goal, state, costs, polish, result.A)!
            .gold
    ).toBeCloseTo(50 + 0.7 * result.A.gold!, 10);
    expect(
        existingEchoStrategy(
            synthetic,
            goal,
            { ...state, level: 2 },
            costs,
            null,
            null
        )!.gold
    ).toBe(0);
    expect(
        existingEchoStrategy(
            synthetic,
            goal,
            { ...state, polishingUsed: true },
            costs,
            polish,
            result.A
        )
    ).toEqual(result.A);
    const duplicates = {
        ...synthetic,
        options: synthetic.options.map(o => ({ ...o, name: "target" })),
    };
    expect(echoProbability(duplicates, goal).option).toBe(1);
    expect(echoProbability(duplicates, goal).combined).toBeCloseTo(0.02, 15);
    const multiPolish = {
        ...polish,
        options: polish.options.map(o =>
            o.id === 2
                ? {
                      ...o,
                      levels: [
                          { level: 1, weight: 1 },
                          { level: 2, weight: 1 },
                      ],
                  }
                : o
        ),
    };
    expect(
        echoStrategies(duplicates, goal, costs, multiPolish).cycleSuccess
    ).toBeCloseTo(0.494, 15);
});

test("polishing never inherits the agent, consumes one chance, and awakening replaces state", () => {
    const state = { id: 1, level: 2, polishingUsed: false };
    const pool = { ...red, agent: 53942 };
    expect(polishOutcomes(pool, state, red)).toEqual([
        { level: 2, probability: 160 / 180 },
        { level: 3, probability: 20 / 180 },
    ]);
    expect(polishEcho(pool, state, red, () => 0)).toEqual({
        ...state,
        polishingUsed: true,
    });
    expect(() =>
        polishEcho(pool, { ...state, polishingUsed: true }, red)
    ).toThrow("연마");
    expect(canPolish(pool, { ...state, level: 3 })).toBe(false);
    expect(() => polishEcho(pool, state, null)).toThrow("검증");
    expect(echoStrategies(pool, target, costs, null).B).toBeNull();
    expect(evidence.status).toBe("unverified");
    expect(evidence.observations).toEqual([]);
    const session = echoAction(
        emptyEchoSession(state),
        pool,
        "polishing",
        costs,
        red,
        () => 0
    );
    expect(session.awakenings).toBe(0);
    expect(session.stones).toBe(1);
    expect(session.spent).toBe(BigInt(50));
    const next = echoAction(session, pool, "awakening", costs, red, () => 0);
    expect(next.current).toEqual({ id: 1, level: 1, polishingUsed: false });
    expect(next.awakenings * 25).toBe(25);
    expect(next.spent).toBe(BigInt(150));
    expect(awakenEcho(red, sequence(0.99, 0)).id).not.toBe(1);
});

test("chunk runner handles cancellation, first hit, exact budgets, mixed action boundaries and bounded history", () => {
    const run = {
        policy: "polishing" as const,
        cap: 1000,
        budget: BigInt(149),
        costs,
    };
    const first = runEchoChunk(
        emptyEchoSession(),
        synthetic,
        goal,
        polish,
        run,
        0,
        BigInt(0),
        () => false,
        () => 0
    );
    expect(first.reason).toBe("예산 한도 도달");
    expect(first.session.actions).toBe(1);
    expect(first.spent).toBe(BigInt(100));
    const hit = runEchoChunk(
        emptyEchoSession(),
        synthetic,
        goal,
        polish,
        { ...run, budget: BigInt(150) },
        0,
        BigInt(0),
        () => false,
        sequence(0, 0, 0.99)
    );
    expect(hit.reason).toBe("목표 달성");
    expect(hit.session.actions).toBe(2);
    expect(hit.spent).toBe(BigInt(150));
    expect(
        runEchoChunk(hit.session, synthetic, goal, polish, run).completed
    ).toBe(0);
    expect(
        runEchoChunk(
            emptyEchoSession(),
            synthetic,
            goal,
            polish,
            run,
            0,
            BigInt(0),
            () => true
        ).reason
    ).toBe("취소됨");
    const free = {
        ...run,
        policy: "awakening" as const,
        cap: 205,
        budget: BigInt(0),
        costs: { awakening: BigInt(0), stone: null },
    };
    let batch = runEchoChunk(
        emptyEchoSession(),
        synthetic,
        goal,
        null,
        free,
        0,
        BigInt(0),
        () => false,
        () => 0
    );
    while (!batch.reason)
        batch = runEchoChunk(
            batch.session,
            synthetic,
            goal,
            null,
            free,
            batch.completed,
            batch.spent,
            () => false,
            () => 0
        );
    expect(batch.reason).toBe("최대 횟수 도달");
    expect(batch.session.actions).toBe(205);
    expect(batch.session.history).toHaveLength(100);
    expect(() =>
        runEchoChunk(emptyEchoSession(), synthetic, goal, null, {
            ...free,
            costs: { awakening: null, stone: null },
        })
    ).toThrow();
    expect(
        runEchoChunk(
            emptyEchoSession(),
            synthetic,
            { ...goal, level: 3 },
            null,
            free
        ).reason
    ).toBe("달성 불가능한 목표");
    const large = BigInt("9007199254740993");
    const exact = runEchoChunk(
        emptyEchoSession(),
        synthetic,
        goal,
        null,
        {
            ...free,
            cap: 1,
            budget: large,
            costs: { awakening: large, stone: null },
        },
        0,
        BigInt(0),
        () => false,
        () => 0
    );
    expect(exact.spent).toBe(large);
});

test("grade-limited awakening maximum does not replace the option maximum", () => {
    const blue = createEchoPool(reference, 2, 21, 53942);
    const icebolt = blue.options.find(
        o => o.name === "아이스볼트 최대 대미지"
    )!;
    expect(icebolt).toBeDefined();
    expect(Math.max(...icebolt.levels.map(r => r.level))).toBe(11);
    expect(icebolt.max).toBe(20);
    expect(
        canPolish(blue, { id: icebolt.id, level: 11, polishingUsed: false })
    ).toBe(true);
    expect(
        canPolish(blue, { id: icebolt.id, level: 20, polishingUsed: false })
    ).toBe(false);
});

test("unknown prices, zero prices and numerical boundaries stay explicit", () => {
    expect(
        echoStrategies(red, target, { awakening: null, stone: null }, null).A
            .gold
    ).toBeNull();
    expect(
        echoStrategies(red, target, { awakening: BigInt(0), stone: null }, null)
            .A.gold
    ).toBe(0);
    expect(
        echoStrategies(red, { ...target, level: 20 }, costs, null).A.gold
    ).toBe(Infinity);
    expect(successWithin(1e-15, 1_000_000)).toBeCloseTo(1e-9, 16);
    expect(successThreshold(0, 0.9)).toBe(Infinity);
    expect(successThreshold(1, 0.9)).toBe(1);
    expect(successWithin(1, 0)).toBe(0);
    expect(successWithin(1, 1)).toBe(1);
    expect(() => awakenEcho(red, () => 1)).toThrow("난수");
});
