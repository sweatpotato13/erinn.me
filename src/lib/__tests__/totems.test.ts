import reference from "@/data/totem-reference.json";
import {
    ALL_TOTEM_STATS,
    comparisonTotemKeys,
    evaluateTotem,
    filterTotems,
    formatTotemValue,
    listingTotemRoll,
    manualTotemRoll,
    maximumTotemValues,
    parseTotemGold,
    positiveTotemGold,
    resolveTotemName,
    sortTotemCandidates,
    type Totem,
    TOTEM_STATS,
    totemBudgetState,
    totemBundleTotal,
    totemContribution,
    totemDominated,
    totemEffectKeys,
    totemPricePerGain,
    totemRanges,
    totemRelation,
    totemTicks,
    totemValue,
} from "@/lib/totems";
import type { ItemOption } from "@/types/item-option";

import fixtures from "./fixtures/totem-listings.json";

const items: Totem[] = reference.totems;
const item = (id: number) => items.find(r => r.id === id)!;
const manual = (id: number, values: Record<string, string>) =>
    manualTotemRoll(item(id), values);
const option = (subtype: string, value: string | null): ItemOption => ({
    option_type: "토템 효과",
    option_sub_type: subtype,
    option_value: value,
});
const listing = (id: number, options: ItemOption[]) =>
    listingTotemRoll(items, item(id).name, options);
const fixture = (name: string) =>
    fixtures.find(r => r.item_name.startsWith(name))!;

test("actual 0.4 API value uses source tenths once and exact decimal deltas", () => {
    const row = fixture("물망초가 그려진 그림");
    const actual = listingTotemRoll(items, row.item_name, row.item_option);
    const result = evaluateTotem(
        "bonusdamage",
        actual,
        manual(5160004, { bonusdamage: "0.3" })
    );
    expect(result).toMatchObject({
        value: 0.4,
        baseline: 0.3,
        delta: 0.1,
        gap: 0.6,
        range: { min: 0.1, max: 1 },
        rangeStatus: "within",
    });
    expect(result.position).toBe(1 / 3);
    expect(formatTotemValue("bonusdamage", result.value)).toBe("0.4%");
    expect(formatTotemValue("bonusdamage", result.delta, true)).toBe("+0.1%p");
    expect(totemPricePerGain(1200000, result)).toBe(12000000);
    // 12,000,000 per 1%p is 1,200,000 per 0.1%p, not another source scale.
    expect(totemPricePerGain(1200000, result)! * 0.1).toBe(1200000);
});

test("all 19 sanitized observed API subtypes parse with independently reviewed units", () => {
    const observed = new Set<string>();
    for (const row of fixtures) {
        const roll = listingTotemRoll(items, row.item_name, row.item_option);
        expect(roll.unknownOptions).toEqual([]);
        expect(Object.values(roll.values).every(v => v !== null)).toBe(true);
        for (const o of row.item_option)
            if (o.option_type === "토템 효과") observed.add(o.option_sub_type);
    }
    expect(observed).toEqual(
        new Set(Object.values(TOTEM_STATS).map(s => s.subtype))
    );
    expect(totemValue("speed", "3%")).toBe(3);
    expect(totemValue("critical", "8")).toBe(8);
    expect(formatTotemValue("critical", 8)).toBe("8");
    expect(totemValue("healing", "6.000000")).toBe(6);
    expect(totemValue("alchemy", "35")).toBe(35);
    expect(totemValue("musicduration", "18")).toBe(18);
    expect(item(5160492).ranges).toEqual({});
    expect(item(5160402).ranges).toEqual({});
});

test("five allstat rolls remain independent and every gain and loss survives", () => {
    const row = fixture("콜튼의 손수건");
    const actual = listingTotemRoll(items, row.item_name, row.item_option);
    expect(ALL_TOTEM_STATS.map(k => actual.values[k])).toEqual([
        9, 13, 5, 13, 7,
    ]);
    const base = manual(
        52289,
        Object.fromEntries(ALL_TOTEM_STATS.map(k => [k, "10"]))
    );
    expect(comparisonTotemKeys([actual, base])).toEqual(ALL_TOTEM_STATS);
    expect(
        ALL_TOTEM_STATS.map(k => evaluateTotem(k, actual, base).delta)
    ).toEqual([-1, 3, -5, 3, -3]);
    expect(ALL_TOTEM_STATS.map(k => actual.reference!.ranges[k])).toEqual(
        ALL_TOTEM_STATS.map(() => ({ min: 1, max: 21 }))
    );
    expect(evaluateTotem("strength", actual).delta).toBeNull();
    expect(
        evaluateTotem("strength", actual, manual(52289, {})).delta
    ).toBeNull();
    expect(
        evaluateTotem("strength", actual, manual(52289, { strength: "0" }))
            .delta
    ).toBe(9);
});

test("dual defense, fixed extra and fixed mismatch preserve their evidence", () => {
    const actual = listing(52518, [
        option("방어력", "10"),
        option("마법 방어력", "7"),
    ]);
    expect(actual.values).toEqual({ def: 10, magic_defense: 7 });
    // Synthetic fixed-extra options, based on source 5160373; not a live observation.
    const fixed = listing(5160373, [option("보너스 대미지", "1")]);
    expect(evaluateTotem("bonusdamage", fixed)).toMatchObject({
        value: 1,
        rangeStatus: "fixed",
        gap: 0,
        position: null,
    });
    const outside = evaluateTotem(
        "bonusdamage",
        manual(5160373, { bonusdamage: "1.1" })
    );
    expect(outside).toMatchObject({
        value: 1.1,
        rangeStatus: "outside",
        position: null,
        gap: -0.1,
    });
    expect(maximumTotemValues(item(5160373))).toEqual({ bonusdamage: "1" });
    expect(maximumTotemValues(item(5160402))).toEqual({});
});

test.each([
    null,
    undefined,
    "",
    " ",
    "1abc",
    "0x10",
    "1e3",
    "Infinity",
    "NaN",
    "-1",
    "+1",
    "1,000",
    "1.01",
    "0.1234567",
    "1%%",
    "1초",
    "1%p",
    "1000001",
    "1".repeat(65),
])("invalid bonus option is unknown: %p", value => {
    expect(totemTicks("bonusdamage", value)).toBeNull();
});

test("precision boundaries allow trailing zeros, never round meaningful extra digits", () => {
    expect(totemValue("bonusdamage", " 0.400000% ")).toBe(0.4);
    expect(totemValue("bonusdamage", "0.400001")).toBeNull();
    expect(totemTicks("bonusdamage", "0.4")).toBe(4);
    expect(totemTicks("healing", "0.123456")).toBe(123456);
    expect(totemValue("life", "1.000000")).toBe(1);
    expect(totemValue("life", "1.1")).toBeNull();
    expect(totemValue("critical", "8%")).toBeNull();
    expect(totemValue("future", "1")).toBeNull();
    expect(totemValue("__proto__", "1")).toBeNull();
});

test("null, unknown, duplicate and descriptive options remain raw without numeric invention", () => {
    const options = [
        option("보너스 대미지", "0.4"),
        option("보너스 대미지", "0.5"),
        option("미래 옵션", "9"),
        {
            ...option("힐링 효과", null),
            option_desc: "효과 100 증가",
            option_value2: "100",
        },
    ];
    const roll = listing(5160004, options);
    expect(roll.rawOptions).toEqual(options);
    expect(roll.duplicateKeys).toEqual(["bonusdamage"]);
    expect(roll.values.bonusdamage).toBeNull();
    expect(roll.values.healing).toBeNull();
    expect(roll.unknownOptions).toEqual([options[2]]);
    expect(roll.effectSetKnown).toBe(false);
    expect(listingTotemRoll(items, item(5160004).name, null).values).toEqual(
        {}
    );
    expect(totemContribution(roll, "future")).toBeNull();
});

test("exact duplicate names, missing items, and contradictory types cannot establish ranges", () => {
    expect(resolveTotemName(items, item(52189).name).map(r => r.id)).toEqual([
        52189, 52197,
    ]);
    const ambiguous = listing(52189, [option("체력", "10")]);
    expect(ambiguous.status).toBe("ambiguous");
    expect(evaluateTotem("strength", ambiguous)).toMatchObject({
        value: 10,
        range: null,
        rangeStatus: "ambiguous",
    });
    const variant = listingTotemRoll(items, `${item(5160004).name} 변형`, [
        option("보너스 대미지", "0.4"),
    ]);
    expect(variant.status).toBe("missing");
    expect(variant.values.bonusdamage).toBe(0.4);
    const mismatch = listing(5160004, [option("체력", "9")]);
    expect(mismatch.status).toBe("conflicting");
    expect(
        evaluateTotem("strength", mismatch, manual(52289, { strength: "8" }))
            .delta
    ).toBeNull();
    expect(
        manualTotemRoll(undefined, { bonusdamage: "0.4" }).values.bonusdamage
    ).toBe(0.4);
});

test("explicit compatibility separates normal/extra/pet and retains royal composite losses", () => {
    expect(totemRelation(item(5160004), item(5160373))).toBe("coexist");
    expect(totemRelation(item(5160031), item(52367))).toBe("different-target");
    expect(totemRelation(item(5160031), item(5160030))).toBe("coexist");
    expect(totemRelation(item(52495), item(52370))).toBe("unverified");
    expect(totemRelation(item(5160039), item(5160039))).toBe("unverified");
    expect(totemRelation(item(5160100), item(5160005))).toBe("replaceable");
    const base = manual(5160100, { intelligence: "8", magicattack: "10" });
    const candidate = manual(5160005, { mindamage: "5", maxdamage: "15" });
    const keys = comparisonTotemKeys([candidate, base]);
    expect(keys).toEqual([
        "maxdamage",
        "mindamage",
        "magicattack",
        "intelligence",
    ]);
    expect(keys.map(k => evaluateTotem(k, candidate, base).delta)).toEqual([
        15, 5, -10, -8,
    ]);
    expect(evaluateTotem("intelligence", candidate, base).absent).toBe(true);
    expect(
        evaluateTotem("mindamage", manual(5160005, { maxdamage: "15" }), base)
            .delta
    ).toBeNull();
    const unknown = listing(5160005, [
        option("최대대미지", "15"),
        option("미래 옵션", "3"),
    ]);
    expect(evaluateTotem("intelligence", unknown, base).delta).toBeNull();
    expect(
        evaluateTotem(
            "bonusdamage",
            manual(5160373, { bonusdamage: "1" }),
            manual(5160004, { bonusdamage: "0.4" })
        ).delta
    ).toBeNull();
});

test("range coverage retains missing, inverted, unknown and valid-looking outside values", () => {
    const noRange = manual(5160492, { healing: "6.000000" });
    expect(evaluateTotem("healing", noRange)).toMatchObject({
        value: 6,
        rangeStatus: "missing",
        range: null,
    });
    expect(evaluateTotem("bonusdamage", manual(5160004, {})).rangeStatus).toBe(
        "unknown"
    );
    const outside = evaluateTotem(
        "bonusdamage",
        manual(5160004, { bonusdamage: "2" })
    );
    expect(outside).toMatchObject({
        value: 2,
        gap: -1,
        position: null,
        rangeStatus: "outside",
    });
    expect(() =>
        totemRanges([{ StatName: "speed", Min: 3, Max: 1 }])
    ).toThrow();
    expect(totemRanges([{ StatName: "future", Min: 1, Max: 2 }])).toEqual({});
    const bad = manualTotemRoll(
        { ...item(5160004), ranges: { bonusdamage: { min: 2, max: 1 } } },
        { bonusdamage: "1" }
    );
    expect(evaluateTotem("bonusdamage", bad).position).toBeNull();
});

test("safe gold, exact bundle products, per-unit budget, and positive-only efficiency", () => {
    expect(parseTotemGold("0")).toBe(0);
    expect(parseTotemGold("9007199254740992")).toBeNull();
    for (const p of [
        null,
        undefined,
        0,
        -1,
        1.5,
        Infinity,
        NaN,
        Number.MAX_SAFE_INTEGER + 1,
        "1200000",
    ]) {
        expect(positiveTotemGold(p)).toBeNull();
        expect(totemBundleTotal(p, 2)).toBeNull();
    }
    expect(totemBundleTotal(Number.MAX_SAFE_INTEGER, 2)).toBe(
        "18014398509481982"
    );
    expect(totemBundleTotal(1200000, 2)).toBe("2400000");
    expect(totemBundleTotal(1200000, 0)).toBeNull();
    expect(totemBudgetState(1200000, 1200000)).toBe("within");
    expect(totemBudgetState(1200001, 1200000)).toBe("over");
    expect(totemBudgetState(0, 1200000)).toBe("unknown");
    expect(totemBudgetState(1, 0)).toBe("over");
    expect(totemBudgetState(1, null)).toBe("unset");
    for (const value of ["0.2", "0.3", ""]) {
        const result = evaluateTotem(
            "bonusdamage",
            manual(5160004, { bonusdamage: value }),
            manual(5160004, { bonusdamage: "0.3" })
        );
        expect(totemPricePerGain(1200000, result)).toBeNull();
    }
});

test("sorting is stable/null-last; ties and incomplete comparisons never prove dominance", () => {
    const rows = [
        { id: 1, value: null },
        { id: 2, value: 3 },
        { id: 3, value: 1 },
        { id: 4, value: 3 },
        { id: 5, value: NaN },
    ];
    expect(sortTotemCandidates(rows, r => r.value).map(r => r.id)).toEqual([
        3, 2, 4, 1, 5,
    ]);
    expect(
        sortTotemCandidates(rows, r => r.value, true).map(r => r.id)
    ).toEqual([2, 4, 3, 1, 5]);
    const a = manual(52289, { strength: "9", intelligence: "11" });
    const b = manual(52289, { strength: "10", intelligence: "10" });
    expect(totemDominated(a, 100, b, 100, ["strength"])).toBe(true);
    expect(totemDominated(a, 100, b, 100, ["strength", "intelligence"])).toBe(
        false
    );
    expect(totemDominated(a, 100, b, 100, ["dexterity"])).toBe(false);
    expect(totemDominated(a, 100, a, 100, ["strength"])).toBe(false);
    expect(totemDominated(a, null, b, 100, ["strength"])).toBe(false);
    expect(totemDominated(a, 100, b, 0, ["strength"])).toBe(false);
    expect(totemDominated(a, 100, b, 100, [])).toBe(false);
    expect(totemDominated(a, 200, b, 100, ["future"])).toBe(false);
});

test("catalog sorts every selected effect or exact effect search by maximum, unknowns last", () => {
    for (const [stat, { label }] of Object.entries(TOTEM_STATS)) {
        const rows: Totem[] = [10, null, 30, 30, 0].map((max, id) => ({
            ...items[0],
            id,
            name: label,
            type: stat,
            ranges: { [stat]: max === null ? undefined : { min: 0, max } },
        }));
        const options = {
            search: "",
            type: "all",
            target: "all",
            stat,
            auctionOnly: false,
        };
        expect(filterTotems(rows, options).map(r => r.id)).toEqual([
            2, 3, 0, 4, 1,
        ]);
        expect(
            filterTotems(rows, {
                ...options,
                stat: "all",
                search: label.replace(/\s/g, ""),
            }).map(r => r.id)
        ).toEqual([2, 3, 0, 4, 1]);
        expect(rows.map(r => r.id)).toEqual([0, 1, 2, 3, 4]);
    }
});

test("catalog filters preserve empty ranges and apply Korean text/type/target independently", () => {
    const options = {
        search: "",
        type: "all",
        target: "all",
        stat: "all",
        auctionOnly: false,
    };
    expect(filterTotems(items, options)).toHaveLength(items.length);
    expect(
        filterTotems(items, { ...options, search: "보너스대미지 물망초" }).map(
            r => r.id
        )
    ).toContain(5160004);
    expect(
        filterTotems(items, { ...options, stat: "healing", type: "extra" }).map(
            r => r.id
        )
    ).toContain(5160492);
    expect(
        filterTotems(items, { ...options, target: "pet" }).every(r => r.isPet)
    ).toBe(true);
    expect(
        filterTotems(items, { ...options, auctionOnly: true }).every(
            r => r.searchable
        )
    ).toBe(true);
    expect(totemEffectKeys(item(52518))).toEqual(["def", "magic_defense"]);
});
