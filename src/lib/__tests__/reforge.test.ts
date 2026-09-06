import reference from "@/data/reforge-reference.json";

import {
    conditionalChance,
    createReforgePool,
    effectText,
    emptySession,
    parseGold,
    type ReforgeModel,
    type ReforgeOption,
    runReforgeChunk,
    sampleRoll,
    successThreshold,
    successWithin,
    targetError,
    targetProbability,
} from "../reforge";

const option = (id: number, max = 1): ReforgeOption => ({
    id,
    name: String(id),
    unit: "증가",
    initial: 1.5,
    perLevel: 1.5,
    standard: 1,
    min: 1,
    max,
    breakMin: 0,
    breakMax: 0,
    breakRate: 0,
});
const pool = [option(1, 2), option(2), option(3), option(4)];
const targets = [
    { id: 1, level: 2 },
    { id: 2, level: 1 },
];
const tool = reference.tools[0];
const equipment = { id: 1, name: "공용", type: "OHSword", races: 7 };
const model: ReforgeModel = {
    version: reference.version,
    equipment,
    tool: { ...tool, lines: 2 },
    pool,
};

describe("reforge probabilities and current source rules", () => {
    it("matches an independent exhaustive enumeration without replacement", () => {
        let single = 0,
            and = 0,
            or = 0;
        // 12 ordered ability pairs, and 2 equally likely A-level outcomes.
        for (let first = 1; first <= 4; first++)
            for (let second = 1; second <= 4; second++) {
                if (first === second) continue;
                for (const aLevel of [1, 2]) {
                    const a = [first, second].includes(1) && aLevel === 2;
                    const b = [first, second].includes(2);
                    single += Number(a) / 24;
                    and += Number(a && b) / 24;
                    or += Number(a || b) / 24;
                }
            }
        expect(single).toBeCloseTo(1 / 4);
        expect(and).toBeCloseTo(1 / 12);
        expect(or).toBeCloseTo(2 / 3);
        expect(
            targetProbability(pool, 2, targets.slice(0, 1), "and")
        ).toBeCloseTo(single);
        expect(targetProbability(pool, 2, targets, "and")).toBeCloseTo(and);
        expect(targetProbability(pool, 2, targets, "or")).toBeCloseTo(or);
        expect(targetProbability(pool, 1, targets, "and")).toBe(0);
        expect(targetProbability(pool, 2, [{ id: 1, level: 3 }], "and")).toBe(
            0
        );
        expect(targetError(pool, [targets[0], targets[0]])).toMatch(/중복/);
    });
    it("uses current tool counts, explicit exception classes, keyed level rows and break mass", () => {
        const get = (type: string, id = 1) =>
            createReforgePool(
                { ...equipment, type },
                reference.tools.find(t => t.id === id)!,
                reference.abilities,
                [...reference.levels].reverse()
            ).find(a => a.id === 1)!;
        expect(get("Staff")).toMatchObject({
            min: 7,
            max: 20,
            breakMin: 21,
            breakMax: 25,
            breakRate: 0.001,
        });
        expect(get("Staff", 2)).toMatchObject({
            min: 1,
            max: 20,
            breakRate: 0,
        });
        expect(get("Staff", 4).min).toBe(8);
        expect(get("Staff", 6)).toMatchObject({ min: 9, breakRate: 0.0015 });
        for (const type of ["OHSword", "OHBlunt", "Rapier", "RoughTouch"])
            expect(get(type)).toMatchObject({
                min: 4,
                max: 10,
                breakMin: 11,
                breakMax: 13,
            });
        expect(get("OHAxe").max).toBe(20);
        expect(get("Accessary")).toMatchObject({
            min: 2,
            max: 5,
            breakMin: 6,
            breakMax: 7,
        });
        expect(get("Staff", 5)).toMatchObject({
            min: 1,
            max: 15,
            breakRate: 0,
        });
        expect(reference.tools.map(t => [t.id, t.lines, t.legacy])).toEqual([
            [1, 3, false],
            [2, 3, false],
            [4, 3, false],
            [5, 1, true],
            [6, 3, false],
        ]);
        expect(conditionalChance(get("Staff"), 21)).toBeCloseTo(0.001);
        expect(conditionalChance(get("Staff"), 25)).toBeCloseTo(0.0002);
        expect(conditionalChance(get("Staff"), 26)).toBe(0);
        expect(conditionalChance(get("Staff"), 1)).toBe(1);
    });
    it("intersects equip/ability races and uses internal tool membership", () => {
        const ability = reference.abilities.find(
            a => a.races === 4 && a.types.includes("Headgear")
        )!;
        expect(ability).toBeDefined();
        const get = (races: number, toolId = 1) =>
            createReforgePool(
                { ...equipment, type: "Headgear", races },
                reference.tools.find(t => t.id === toolId)!,
                reference.abilities,
                reference.levels
            );
        expect(get(7).some(a => a.id === ability.id)).toBe(true);
        expect(get(1).some(a => a.id === ability.id)).toBe(false);
        expect(get(7, 6).length).toBeLessThan(get(7).length);
        expect(() =>
            createReforgePool(
                { ...equipment, type: "OHUnknown" },
                tool,
                reference.abilities,
                reference.levels
            )
        ).toThrow(/지원/);
        const binary = reference.abilities.find(a => !a.standard)!;
        const binaryPool = createReforgePool(
            { ...equipment, type: binary.types[0] },
            tool,
            reference.abilities,
            reference.levels
        );
        expect(
            effectText(
                binaryPool.find(a => a.id === binary.id)!,
                1
            )
        ).toBe("가능");
        const nonBreak = binaryPool.find(a => !a.breakRate)!;
        expect(conditionalChance(nonBreak, nonBreak.min)).toBe(1);
        expect(effectText(pool[0], 2)).toBe("3 증가");
    });
    it("handles stable means, thresholds, zero/one/tiny probability and large integer Gold", () => {
        expect(1 / 0.1).toBe(10);
        expect(successThreshold(0.1, 0.5)).toBe(7);
        expect(successThreshold(0.1, 0.9)).toBe(22);
        expect(successThreshold(0, 0.5)).toBe(Infinity);
        expect(successThreshold(1, 0.9)).toBe(1);
        expect(successWithin(1, 0)).toBe(0);
        expect(successWithin(0, 100)).toBe(0);
        expect(successWithin(1, 1)).toBe(1);
        expect(successWithin(1e-20, 1e10)).toBeCloseTo(1e-10, 18);
        expect(successThreshold(1e-20, 0.5)).toBeGreaterThan(1e19);
        expect(parseGold("")).toBeNull();
        expect(parseGold("0")).toBe(BigInt(0));
        expect(parseGold("9007199254740993")).toBe(BigInt("9007199254740993"));
        for (const bad of ["-1", "1.5", "1e6", "1".repeat(31)])
            expect(parseGold(bad)).toBeNull();
    });
    it("samples endpoints, distinct identities and zero-weight ranges deterministically", () => {
        const a = {
            ...option(1, 20),
            min: 7,
            breakRate: 0.001,
            breakMin: 21,
            breakMax: 25,
        };
        for (const [r, level, limitBreak] of [
            [0, 7, false],
            [0.998999, 20, false],
            [0.999, 21, true],
            [0.999999999, 25, true],
        ] as const) {
            const values = [0, r];
            expect(
                sampleRoll([a], 1, [], "and", () => values.shift()!).options[0]
            ).toEqual({ id: 1, level, limitBreak });
        }
        expect(
            sampleRoll(pool, 4, [], "and", () => 0).options.map(a => a.id)
        ).toEqual([1, 2, 3, 4]);
        expect(
            sampleRoll([option(1)], 1, [], "and", () => 0.999999).options[0]
                .limitBreak
        ).toBe(false);
        expect(() => sampleRoll(pool, 1, [], "and", () => 1)).toThrow();
    });
    it("runs the full count without targets and requires targets for auto-stop", () => {
        const run = {
            maxAttempts: 3,
            price: BigInt(5),
            budget: null,
            stopOnHit: false,
        };
        const result = runReforgeChunk(
            emptySession(),
            model,
            [],
            "and",
            run,
            0,
            BigInt(0)
        );
        expect(result.completed).toBe(3);
        expect(result.session.spent).toBe(BigInt(15));
        expect(result.session.hits).toBe(0);
        expect(result.reason).toBe("최대 횟수 도달");
        expect(() =>
            runReforgeChunk(
                emptySession(),
                model,
                [],
                "and",
                { ...run, stopOnHit: true },
                0,
                BigInt(0)
            )
        ).toThrow();
    });
    it("stops on first hit, exact budget, cancellation and cap; preserves incurred prices and bounded history", () => {
        const run = {
            maxAttempts: 1000,
            price: BigInt(3),
            budget: BigInt(6),
            stopOnHit: false,
        };
        const hit = [{ id: 2, level: 1 }];
        const first = runReforgeChunk(
            emptySession(),
            model,
            hit,
            "and",
            { ...run, stopOnHit: true },
            0,
            BigInt(0),
            undefined,
            () => 0
        );
        expect(first.reason).toBe("목표 달성");
        expect(first.completed).toBe(1);
        const budget = runReforgeChunk(
            emptySession(),
            model,
            targets,
            "and",
            run,
            0,
            BigInt(0),
            undefined,
            () => 0
        );
        expect(budget.reason).toBe("예산 한도 도달");
        expect(budget.session.spent).toBe(BigInt(6));
        expect(budget.completed).toBe(2);
        const cancelled = runReforgeChunk(
            budget.session,
            model,
            targets,
            "and",
            run,
            0,
            BigInt(0),
            () => true
        );
        expect(cancelled.reason).toBe("취소됨");
        expect(cancelled.session.attempts).toBe(2);
        const free = {
            ...run,
            maxAttempts: 150,
            price: BigInt(0),
            budget: BigInt(0),
        };
        const chunk = runReforgeChunk(
            budget.session,
            model,
            targets,
            "and",
            free,
            0,
            BigInt(0),
            undefined,
            () => 0
        );
        expect(chunk.completed).toBe(100);
        expect(chunk.reason).toBe("");
        const last = runReforgeChunk(
            chunk.session,
            model,
            targets,
            "and",
            free,
            chunk.completed,
            chunk.spent,
            undefined,
            () => 0
        );
        expect(last.reason).toBe("최대 횟수 도달");
        expect(last.session.history).toHaveLength(100);
        expect(last.session.attempts).toBe(152);
        expect(last.session.spent).toBe(BigInt(6));
        const unknown = runReforgeChunk(
            last.session,
            model,
            targets,
            "and",
            { ...run, price: null, budget: null, maxAttempts: 1 },
            0,
            BigInt(0)
        );
        expect(unknown.session.unknownCosts).toBe(1);
        expect(unknown.session.spent).toBe(BigInt(6));
        expect(() =>
            runReforgeChunk(
                emptySession(),
                model,
                [{ id: 1, level: 99 }],
                "and",
                { ...run, stopOnHit: true },
                0,
                BigInt(0)
            )
        ).toThrow();
    });
});
