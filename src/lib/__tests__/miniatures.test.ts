import reference from "@/data/miniature-reference.json";
import {
    basketCost,
    benefitCost,
    effectValue,
    filterMiniatures,
    marketGold,
    type Miniature,
    miniatureDelta,
    miniatureGold,
    miniatureTotals,
} from "@/lib/miniatures";

const item = (
    id: number,
    effects: Record<string, number>,
    extra = false
): Miniature => ({
    id,
    itemId: id + 100,
    name: `후보 ${id}`,
    itemName: `판매 후보 ${id}`,
    description: "효과 설명",
    extra,
    searchable: true,
    effects,
});
const items = [
    item(1, { AttackMax: 5, MagicAttack: 2 }),
    item(2, { AttackMax: 3, MagicAttack: 7 }),
    item(3, { AttackMax: 2 }, true),
    item(4, { AttackMax: 6 }),
    item(5, { AttackMax: 8 }),
];

test("per-stat/group maxima, independent suppliers, removal and union avoid overlap", () => {
    const result = miniatureDelta(items, [1, 2, 3], [4, 5]);
    expect(result.before.total).toMatchObject({ AttackMax: 7, MagicAttack: 7 });
    expect(miniatureDelta(items, [1, 2, 3], [4]).delta.AttackMax).toBe(1);
    expect(result.delta.AttackMax).toBe(3);
    expect(miniatureTotals(items, [1, 3]).total).toMatchObject({
        AttackMax: 7,
        MagicAttack: 2,
    });
    expect(miniatureDelta(items, [1, 1], [1, 1]).delta.AttackMax).toBe(0);
    expect(miniatureTotals(items, []).total.AttackMax).toBe(0);
    expect(
        miniatureDelta([...items, item(6, { AttackMax: 5 })], [1], [6]).delta
            .AttackMax
    ).toBe(0);
});

test("real guide fixtures agree with independent maxima", () => {
    const r = reference.miniatures;
    expect(miniatureTotals(r, [485, 826, 770]).total).toMatchObject({
        CriticalDamage: 7,
        Life: 20,
        BonusDamage: 1,
        Will: 7,
    });
    expect(miniatureTotals(r, [826, 770]).total.CriticalDamage).toBe(5);
    expect(miniatureDelta(r, [826, 770], [485]).delta.CriticalDamage).toBe(2);
    expect(miniatureTotals(r, [592, 739, 789]).total).toMatchObject({
        AttackMax: 10,
        MagicAttack: 6,
    });
    expect(miniatureTotals(r, [592, 789]).total).toMatchObject({
        AttackMax: 10,
        MagicAttack: 5,
    });
    expect(r.find(i => i.id === 564)).toMatchObject({
        itemId: 54536,
        extra: true,
    });
    expect(r.find(i => i.id === 790)?.effects).toEqual({ MusicSkill: 2 });
    expect(r.find(i => i.id === 1207)).toMatchObject({
        searchable: false,
        description: expect.stringContaining("세트"),
    });
});

test("unknown effects remain visible but outside totals; percent points are separate", () => {
    expect(effectValue("CriticalDamage", 2)).toBe("2%");
    expect(effectValue("CriticalDamage", 2, true)).toBe("+2%p");
    expect(effectValue("MusicSkill", 2)).toBe("2");
    expect(effectValue("HealingEffect", 2)).toBe("2");
    expect(effectValue("FutureEffect", 2)).toContain("계산 규칙 미확인");
    expect(
        miniatureTotals([item(1, { FutureEffect: 2, AttackMax: 0.5 })], [1])
            .total
    ).not.toHaveProperty("FutureEffect");
    expect(
        miniatureDelta(
            [item(1, { AttackMax: 0.1 }), item(2, { AttackMax: 0.3 })],
            [1],
            [2]
        ).delta.AttackMax
    ).toBeCloseTo(0.2);
});

test("Korean effect/item search, combined filters, and benefit ordering", () => {
    const options = {
        search: "",
        type: "all",
        stat: "AttackMax",
        minimum: null,
        auctionOnly: false,
    };
    expect(filterMiniatures(items, [1], options).map(i => i.id)).toEqual([
        5, 3, 4, 1, 2,
    ]);
    expect(
        filterMiniatures(items, [], {
            ...options,
            search: "최대대미지",
            type: "extra",
        }).map(i => i.id)
    ).toEqual([3]);
    expect(
        filterMiniatures(items, [], {
            ...options,
            search: "판매후보4",
            minimum: 6,
        }).map(i => i.id)
    ).toEqual([4]);
    expect(
        filterMiniatures([{ ...items[0], searchable: false }], [], {
            ...options,
            auctionOnly: true,
        })
    ).toEqual([]);
    expect(filterMiniatures(items, [], { ...options, minimum: 9 })).toEqual([]);
});

test("price states, cost-per-gain and incomplete/overflow baskets", () => {
    expect(miniatureGold("0")).toBe(0);
    for (const value of [
        "",
        "-1",
        "1.5",
        "NaN",
        "Infinity",
        "01",
        "9007199254740992",
    ])
        expect(miniatureGold(value)).toBeNull();
    expect(marketGold({ minPrice: 0, availableQuantity: 0 })).toBeNull();
    expect(marketGold({ minPrice: 200, availableQuantity: 0 })).toBeNull();
    expect(marketGold({ minPrice: 200, availableQuantity: 1 })).toBe(200);
    expect(benefitCost(200, 2)).toBe(100);
    for (const [p, delta] of [
        [null, 2],
        [0, 2],
        [10, 0],
        [10, Number.MIN_VALUE],
    ] as const)
        expect(benefitCost(p, delta)).toBeNull();
    expect(basketCost([0, 100, null])).toEqual({ subtotal: 100, missing: 1 });
    expect(basketCost([Number.MAX_SAFE_INTEGER, 1]).subtotal).toBeNull();
});
