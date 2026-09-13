import { MAX_GOLD } from "@/lib/auction-calculator";
import { muriasReference } from "@/lib/murias-relics";
import {
    openingAmounts,
    parseSimulationGold,
    restoreRelic,
    summarizeOpenings,
    valueMissingOpening,
} from "@/lib/murias-simulator";

const settings = {
    idea: { value: 10_000_000, source: "manual" as const, at: "2026-09-13" },
    restorationFee: 3_000_000,
    hasMembership: false,
    snapshot: null,
    overrides: {},
};
const opening = (value = 20_000_000) =>
    valueMissingOpening(
        restoreRelic(settings, 1, () => 0),
        value,
        "2026-09-13"
    );

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
        cost: 13_000_000,
        net: 19_000_000,
        profit: 6_000_000,
    });
    const rows = Array.from({ length: 10 }, () => opening());
    expect(summarizeOpenings(rows)).toEqual({
        count: 10,
        valued: 10,
        idea: 100_000_000,
        restoration: 30_000_000,
        cost: 130_000_000,
        gross: 200_000_000,
        fees: 10_000_000,
        net: 190_000_000,
        ideaDifference: 100_000_000,
        profit: 60_000_000,
    });
    rows[0] = restoreRelic(settings, 1, () => 0);
    expect(summarizeOpenings(rows)).toMatchObject({
        valued: 9,
        cost: 130_000_000,
        gross: 180_000_000,
        net: 171_000_000,
        profit: null,
        ideaDifference: null,
    });
});

test("individual fee rounding, membership, zero, loss and break-even", () => {
    const row = opening(19);
    expect(summarizeOpenings([row, row]).fees).toBe(0);
    expect(openingAmounts({ ...opening(101), hasMembership: true }).fee).toBe(
        4
    );
    expect(openingAmounts(opening(0))).toMatchObject({
        fee: 0,
        net: 0,
        profit: -13_000_000,
    });
    expect(
        openingAmounts({
            ...opening(0),
            idea: { ...settings.idea, value: 0 },
            restorationFee: 0,
        }).profit
    ).toBe(0);
    expect(
        openingAmounts({
            ...opening(100),
            idea: { ...settings.idea, value: 95 },
            restorationFee: 0,
        }).profit
    ).toBe(0);
});

test("manual completion preserves outcome, original fee and all original snapshots", () => {
    const original = restoreRelic(
        { ...settings, hasMembership: true },
        4,
        () => 0
    );
    const valued = valueMissingOpening(original, 100, "later");
    expect(original.valuation.value).toBeNull();
    expect(valued).toEqual({
        ...original,
        valuation: { value: 100, source: "manual", at: "later" },
    });
    expect(openingAmounts(valued).fee).toBe(4);
    expect(() => valueMissingOpening(valued, 200, "later")).toThrow();
    const override = { value: 100, source: "manual" as const, at: "now" };
    const key = `${muriasReference.effects[0].id}:1`;
    const rolled = restoreRelic(
        { ...settings, overrides: { [key]: override } },
        1,
        () => 0
    );
    override.value = 900;
    expect(rolled.valuation.value).toBe(100);
    expect(
        restoreRelic(
            {
                ...settings,
                overrides: { [`${muriasReference.effects[0].id}:2`]: override },
            },
            1,
            () => 0
        ).valuation.value
    ).toBeNull();
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
    expect(() =>
        valueMissingOpening(restoreRelic(settings, 1), MAX_GOLD + 1, "now")
    ).toThrow();
    const max = {
        ...opening(MAX_GOLD),
        idea: { ...settings.idea, value: MAX_GOLD },
        restorationFee: MAX_GOLD,
    };
    expect(openingAmounts(max).fee).toBe(
        Math.floor((MAX_GOLD * 5 * 100) / 10000)
    );
    expect(() =>
        summarizeOpenings(Array.from({ length: 251 }, () => max))
    ).toThrow("누적 금액 한도");
});
