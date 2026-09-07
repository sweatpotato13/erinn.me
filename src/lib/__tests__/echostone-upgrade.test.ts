import reference from "@/data/echostone-reference.json";
import raw from "@/data/reference/snapshots/EchoStoneList.json";
import { newEchoGrowth, upgradeEcho } from "@/lib/echostone-upgrade";

const red = reference.upgrades[0];
const state = (grade: number) => ({
    ...newEchoGrowth(red),
    grade,
    stats: [40],
});

test("upgrade data preserves all five colors and current-grade bounds and base success rates", () => {
    expect(reference.upgrades).toHaveLength(5);
    for (const color of reference.upgrades) {
        expect(color.steps).toHaveLength(30);
        for (const step of color.steps) {
            const source = raw
                .find(c => c.Id === color.color)!
                .Upgrades.find(s => s.Grade === step.grade)!;
            expect(step).toEqual({
                grade: source.Grade,
                min: source.AbilityMin,
                max: source.AbilityMax,
                chance: source.RateEasy / 100,
            });
            expect(source.IsDownGrade).toBe(false);
        }
    }
    expect(red.steps.find(s => s.grade === 19)).toEqual({
        grade: 19,
        min: 1,
        max: 6,
        chance: 0.6,
    });
    expect(red.steps.find(s => s.grade === 29)).toEqual({
        grade: 29,
        min: 5,
        max: 9,
        chance: 0.3,
    });
});

test("failures retain grade and stats; success boundaries and uniform inclusive gains are correct", () => {
    const before = state(25);
    const failure = upgradeEcho(red, before, () => 0.3);
    expect(failure).toMatchObject({ grade: 25, stats: [40], attempts: 1 });
    expect(failure.history[0]).toMatchObject({ success: false, gains: [0] });
    const values = [0, 0.2, 0.4, 0.6, 0.8].map(n => {
        const draws = [0.299999, n];
        return upgradeEcho(red, before, () => draws.shift()!).stats[0] - 40;
    });
    expect(values).toEqual([4, 5, 6, 7, 8]);
    expect(before).toEqual(state(25));
    const finishDraws = [0, 0.999999];
    const finished = upgradeEcho(red, state(29), () => finishDraws.shift()!);
    expect(finished).toMatchObject({ grade: 30, stats: [49] });
    expect(() => upgradeEcho(red, finished)).toThrow();
    expect(() => upgradeEcho(red, state(19), () => 1)).toThrow();
    expect(() => upgradeEcho(red, { ...state(19), stats: [NaN] })).toThrow();
});

test("black stats roll independently and repeated failures keep only bounded history", () => {
    const black = reference.upgrades[4];
    const draws = [0, 0, 0.5, 0.999999];
    const current = {
        ...newEchoGrowth(black),
        grade: 29,
        stats: [80, 90, 100],
    };
    expect(upgradeEcho(black, current, () => draws.shift()!)).toMatchObject({
        grade: 30,
        stats: [85, 97, 109],
    });
    let failed = state(29);
    for (let i = 0; i < 150; i++) failed = upgradeEcho(red, failed, () => 0.99);
    expect(failed.attempts).toBe(150);
    expect(failed.history).toHaveLength(100);
    expect(failed.history[0].attempt).toBe(51);
});
