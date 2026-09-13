import { MAX_GOLD } from "@/lib/auction-calculator";
import { muriasReference } from "@/lib/murias-relics";
import {
    openingAmounts,
    parseSimulationGold,
    type RelicOpening,
    restoreRelic,
    summarizeOpenings,
} from "@/lib/murias-simulator";

const settings = {
    idea: { value: 10_000_000, source: "manual" as const, at: "2026-09-13" },
    snapshot: null,
};
const opening = (value = 20_000_000): RelicOpening => ({
    ...restoreRelic(settings, 1, () => 0),
    valuation: { value, source: "market" as const, at: "2026-09-13" },
});

test("every effect and level is independently selectable without any price coverage", () => {
    const effects = muriasReference.effects;
    effects.forEach((effect, index) => {
        for (let level = 1; level <= 10; level++) {
            const rng = jest
                .fn()
                .mockReturnValueOnce(index / effects.length)
                .mockReturnValueOnce((level - 1) / 10);
            const result = restoreRelic(settings, 1, rng);
            expect(result).toMatchObject({
                effectId: effect.id,
                level,
                valuation: { value: null },
                description: effect.template.replace(
                    "{0}",
                    String(effect.values[level - 1])
                ),
            });
            expect(rng).toHaveBeenCalledTimes(2);
        }
    });
    expect(restoreRelic(settings, 1, () => 0.999999)).toMatchObject({
        effectId: effects.at(-1)!.id,
        level: 10,
    });
    expect(() => restoreRelic(settings, 1, () => 1)).toThrow();
});

test("worked example: one and ten openings, and unknown output still charges all costs", () => {
    expect(openingAmounts(opening())).toEqual({
        fee: 1_000_000,
        cost: 10_000_000,
        net: 19_000_000,
        profit: 9_000_000,
    });
    const rows = Array.from({ length: 10 }, () => opening());
    expect(summarizeOpenings(rows)).toEqual({
        count: 10,
        valued: 10,
        idea: 100_000_000,
        gross: 200_000_000,
        fees: 10_000_000,
        net: 190_000_000,
        profit: 90_000_000,
    });
    rows[0] = restoreRelic(settings, 1, () => 0);
    expect(summarizeOpenings(rows)).toMatchObject({
        valued: 9,
        idea: 100_000_000,
        gross: 180_000_000,
        net: 171_000_000,
        profit: null,
    });
});

test("individual fee rounding, zero, loss and break-even", () => {
    const row = opening(19);
    expect(summarizeOpenings([row, row]).fees).toBe(0);
    expect(openingAmounts(opening(0))).toMatchObject({
        fee: 0,
        net: 0,
        profit: -10_000_000,
    });
    expect(
        openingAmounts({
            ...opening(0),
            idea: { ...settings.idea, value: 0 },
        }).profit
    ).toBe(0);
    expect(
        openingAmounts({
            ...opening(100),
            idea: { ...settings.idea, value: 95 },
        }).profit
    ).toBe(0);
});

test("opening snapshots stay immutable and unpriced outcomes stay unknown", () => {
    const draft = { ...settings, idea: { ...settings.idea } };
    const original = restoreRelic(draft, 4, () => 0);
    draft.idea.value = 0;
    expect(original.idea.value).toBe(10_000_000);
    expect(original.valuation.value).toBeNull();
    expect(original).not.toHaveProperty("restorationFee");
    expect(original).not.toHaveProperty("hasMembership");
});

test("Gold validation and cumulative overflow reject rather than lose precision", () => {
    for (const value of [
        "",
        " ",
        "-1",
        "1.5",
        "Infinity",
        "1e3",
        String(MAX_GOLD + 1),
    ])
        expect(parseSimulationGold(value)).toBeNull();
    expect(parseSimulationGold("0")).toBe(0);
    expect(parseSimulationGold(String(MAX_GOLD))).toBe(MAX_GOLD);
    expect(() =>
        restoreRelic(
            { ...settings, idea: { ...settings.idea, value: null } },
            1
        )
    ).toThrow();
    const max = {
        ...opening(MAX_GOLD),
        idea: { ...settings.idea, value: MAX_GOLD },
    };
    expect(openingAmounts(max).fee).toBe(
        Math.floor((MAX_GOLD * 5 * 100) / 10000)
    );
    expect(() =>
        summarizeOpenings(Array.from({ length: 501 }, () => max))
    ).toThrow("누적 금액 한도");
});
