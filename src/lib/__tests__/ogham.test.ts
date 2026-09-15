/** @jest-environment node */
import {
    effectPool,
    effectText,
    initialSession,
    nextResetCost,
    oghamReference as data,
    resetOgham,
} from "@/lib/ogham";

test("every effect has the same RNG interval regardless of its level count", () => {
    for (const word of data.words) {
        for (const grade of word.grades) {
            const session = initialSession(word.id, grade);
            const pool = effectPool(word.id, grade);
            expect(
                pool.every(effect => word.special || effect.generalPool)
            ).toBe(true);
            for (const [index, effect] of pool.entries()) {
                for (const boundary of [0, 0.999999]) {
                    const rng = jest
                        .fn()
                        .mockReturnValue(0)
                        .mockReturnValueOnce((index + 0.5) / pool.length)
                        .mockReturnValueOnce(boundary);
                    const result = resetOgham(session, rng);
                    expect(result.slots[0]).toEqual({
                        effectId: effect.id,
                        level: boundary === 0 ? 1 : effect.values.length,
                        locked: false,
                    });
                    expect(rng).toHaveBeenCalledTimes(grade * 2);
                    expect(
                        new Set(result.slots.map(slot => slot.effectId)).size
                    ).toBe(grade);
                }
            }
            expect(resetOgham(session, () => 0).slots[0].effectId).toBe(
                pool[0].id
            );
            expect(resetOgham(session, () => 0.999999).slots[0].effectId).toBe(
                pool.at(-1)!.id
            );
        }
    }
});

test("last-slot locks are excluded before the first draw; costs charge exactly once", () => {
    const initial = initialSession();
    initial.slots[2].locked = true;
    const original = structuredClone(initial);
    // This interval would select the locked third ID if it were not excluded.
    const rng = jest
        .fn()
        .mockReturnValue(0)
        .mockReturnValueOnce(2.5 / data.effects.length);
    expect(resetOgham(initial, rng).slots[0].effectId).toBe(data.effects[3].id);
    let result = resetOgham(initial, () => 0);
    result = resetOgham(result, () => 0);
    expect(initial).toEqual(original);
    expect(result.slots[2]).toEqual(original.slots[2]);
    expect(
        result.slots.filter(
            slot => slot.effectId === original.slots[2].effectId
        )
    ).toHaveLength(1);
    expect(result).toMatchObject({
        resets: 2,
        gold: 20000,
        fragments: 6,
        items: { 5100071: 2 },
    });
    result.slots[0].locked = true;
    const locked = structuredClone(result.slots);
    result = resetOgham(result, () => 0.999999);
    expect(result.slots[0]).toEqual(locked[0]);
    expect(result.slots[2]).toEqual(locked[2]);
    expect(result).toMatchObject({
        resets: 3,
        gold: 40000,
        fragments: 11,
        items: { 5100071: 3, 5100091: 1 },
    });
    result.slots[0].locked = false;
    result.slots[2].locked = false;
    expect(nextResetCost(result)).toMatchObject({
        gold: 5000,
        fragments: 1,
        items: [],
    });
});

test("invalid configurations and failed draws never mutate or spend", () => {
    const initial = initialSession();
    const invalid = [
        { ...initial, wordId: -1 },
        { ...initial, grade: 2 },
        { ...initial, slots: initial.slots.slice(1) },
        { ...initial, slots: initial.slots.map(() => initial.slots[0]) },
        ...[0, -1, 1.5, NaN, 999].map(level => ({
            ...initial,
            slots: initial.slots.map(slot => ({ ...slot, level })),
        })),
        {
            ...initial,
            slots: initial.slots.map(slot => ({ ...slot, locked: true })),
        },
        { ...initial, gold: Number.MAX_SAFE_INTEGER },
    ];
    for (const session of invalid) {
        const before = structuredClone(session);
        expect(() => resetOgham(session, () => 0)).toThrow();
        expect(session).toEqual(before);
    }
    for (const rng of [
        () => -1,
        () => 1,
        () => NaN,
        jest
            .fn()
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(0)
            .mockReturnValue(NaN),
    ]) {
        expect(() => resetOgham(initial, rng)).toThrow();
        expect(initial).toEqual(initialSession());
    }
    for (const badData of [
        { ...data, effects: [] },
        { ...data, costs: [] },
        {
            ...data,
            effects: data.effects.map(effect => ({ ...effect, values: [] })),
        },
    ]) {
        expect(() => resetOgham(initial, () => 0, badData)).toThrow();
        expect(initial).toEqual(initialSession());
    }
    const general = data.words.find(word => !word.special)!;
    const session = initialSession(general.id, 1);
    session.slots[0].effectId = data.effects.find(
        effect => !effect.generalPool
    )!.id;
    expect(() => resetOgham(session)).toThrow();
});

test("source values and multiplier placeholders preserve decimals and units", () => {
    expect(
        effectText(
            data.effects.find(effect => effect.id === 10015)!,
            1
        )
    ).toContain("0.4 %");
    expect(
        effectText(
            data.effects.find(effect => effect.id === 10059)!,
            1
        )
    ).toContain("0.1 %");
    expect(
        effectText(
            data.effects.find(effect => effect.id === 10086)!,
            1
        )
    ).toContain("15 %");
    for (const effect of data.effects) {
        for (let level = 1; level <= effect.values.length; level++)
            expect(effectText(effect, level)).not.toMatch(/\[\*|NaN|undefined/);
    }
    expect(() => effectText(data.effects[0], 0)).toThrow();
});
