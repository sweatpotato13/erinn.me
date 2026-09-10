import raw from "@/data/barter-reference.json";
import {
    BarterGoodSchema,
    type BarterReference,
    barterWeek,
    calculateBarter,
    emptyBarterRow,
} from "@/lib/barter";
import {
    activeBarterRows,
    addManualGood,
    BarterPlanSchema,
    barterPrices,
    barterText,
    buildBarterShare,
    changedBarterRows,
    emptyBarterPlan,
    moveBarterWeek,
    parseBarterShare,
    parseBarterStorage,
    recordBarterExchanges,
    serializeBarterStorage,
    updateBarterRow,
} from "@/lib/barter-state";

const data = raw as BarterReference;
const now = Date.parse("2026-09-10T08:00:00+09:00");
const wood = BarterGoodSchema.parse(
    raw.goods.find(g => g.key === "fixed:201:20101")
);
const plan = () =>
    updateBarterRow(emptyBarterPlan(data, now), {
        ...emptyBarterRow(wood),
        q: "3",
        used: "1",
    });
const manual = () => ({
    ...data.season!.goods[0],
    source: "manual" as const,
    key: "manual:one",
});

test("storage and bounded share preserve definitions, choices, inputs and reproducible totals", () => {
    const original = {
        ...plan(),
        owned: { 50664: "5", 67201: "2", 1: "30" },
        prices: { 50664: "100", 67201: "200" },
        checked: [50664],
    };
    expect(parseBarterStorage(serializeBarterStorage(original)).plan).toEqual(
        original
    );
    const path = buildBarterShare(original);
    const received = parseBarterShare(path.slice(path.indexOf("?"))).plan!;
    expect(received.rows).toEqual(original.rows);
    expect(received.owned).toEqual({ 50664: "5", 67201: "2" });
    const result = calculateBarter(
        received.rows,
        received.owned,
        received.prices,
        data.materials,
        now
    );
    expect(result.purchase.known).toBe(1500);
    expect(barterText(received, result, now)).toMatch(/부족 7/);
    expect(barterText(received, result, now)).toMatch(/fixed/);
});

test("corrupt/unavailable formats, duplicate identity, unknown queries and huge inputs fail without mutation", () => {
    for (const raw of [
        "broken",
        "{}",
        JSON.stringify({ ...plan(), formatVersion: 2 }),
        "a".repeat(262145),
    ])
        expect(parseBarterStorage(raw).error).not.toBe("");
    expect(parseBarterStorage(null)).toEqual({ plan: null, error: "" });
    for (const query of ["?s={}", "?s=1&s=2", "?x=1", "?s=" + "a".repeat(8193)])
        expect(parseBarterShare(query).error).not.toBe("");
    expect(
        BarterPlanSchema.safeParse({
            ...plan(),
            rows: [plan().rows[0], plan().rows[0]],
        }).success
    ).toBe(false);
    expect(
        BarterPlanSchema.safeParse({
            ...plan(),
            owned: { __proto__: "1", invalid: "2" },
        }).success
    ).toBe(false);
    expect(() =>
        buildBarterShare({
            ...plan(),
            rows: Array.from({ length: 30 }, (_, i) => ({
                ...plan().rows[0],
                good: {
                    ...wood,
                    key: `fixed:201:${i}`,
                    name: "가".repeat(100),
                },
            })),
        })
    ).toThrow(/크기/);
    const invalidDraft = updateBarterRow(plan(), {
        ...plan().rows[0],
        q: "invalid",
    });
    expect(
        parseBarterStorage(serializeBarterStorage(invalidDraft)).plan?.rows[0].q
    ).toBe("invalid");
});

test("manual overrides choose one source, preserve previous input, and reject overlapping manual periods", () => {
    const before = plan();
    const added = addManualGood(before, manual());
    expect(
        activeBarterRows(added, data, now)
            .filter(r => r.good.period && r.good.postId === 201)
            .map(r => r.good.key)
    ).toEqual(["manual:one"]);
    expect(before.rows).toHaveLength(1);
    expect(() =>
        addManualGood(added, { ...manual(), key: "manual:two" })
    ).toThrow(/겹칩니다/);
    expect(() => addManualGood(before, { ...manual(), postId: 9 })).toThrow();
    expect(() => addManualGood(before, { ...manual(), groups: [] })).toThrow();
    expect(() => addManualGood(before, { ...manual(), limit: -1 })).toThrow();
    expect(() =>
        addManualGood(before, {
            ...manual(),
            period: { startAt: 20, endAt: 10 },
        })
    ).toThrow();
    const edited = addManualGood(added, { ...manual(), name: "수정" });
    expect(edited.rows.filter(r => r.good.source === "manual")).toHaveLength(1);
});

test("changed source definitions cannot masquerade as the current catalog with a copied revision", () => {
    const forged = updateBarterRow(plan(), {
        ...plan().rows[0],
        good: { ...wood, limit: 100 },
    });
    expect(changedBarterRows(forged, data)).toEqual([wood.key]);
    expect(changedBarterRows(plan(), { ...data, goods: [] })).toEqual([
        wood.key,
    ]);
    expect(changedBarterRows(plan(), data)).toEqual([]);
    expect(() => recordBarterExchanges(forged, data, now)).toThrow(/데이터/);
});

test("week transition only resets usage; actual exchange recording never consumes inventory", () => {
    const before = {
        ...plan(),
        owned: { 50664: "5" },
        prices: { 50664: "100" },
        checked: [50664],
    };
    const recorded = recordBarterExchanges(before, data, now);
    expect(recorded.rows[0]).toMatchObject({ used: "4", q: "0" });
    expect(recorded.owned).toEqual(before.owned);
    expect(before.rows[0]).toMatchObject({ used: "1", q: "3" });
    const nextWeek = now + 7 * 86400000;
    expect(() => recordBarterExchanges(before, data, nextWeek)).toThrow(/주간/);
    const moved = moveBarterWeek(before, nextWeek);
    expect(moved.weekKey).toBe(barterWeek(nextWeek));
    expect(moved.rows[0]).toMatchObject({ q: "3", used: "0" });
    expect(moved.owned).toEqual(before.owned);
    expect(moved.prices).toEqual(before.prices);
    expect(moved.checked).toEqual(before.checked);
});

test("manual empty and zero prices override market observations, and unavailable/ambiguous prices stay unknown", () => {
    const quote = {
        minPrice: 100,
        averagePrice: 110,
        availableQuantity: 5,
        isComplete: false,
        observedAt: new Date(now).toISOString(),
    };
    const m = data.materials.find(m => m.id === 50664)!;
    const observed = { ...plan(), quotes: { [m.name]: quote } };
    expect(barterPrices(observed, data)[m.id]).toBe("100");
    expect(
        barterPrices({ ...observed, prices: { [m.id]: "" } }, data)[m.id]
    ).toBe("");
    expect(
        barterPrices({ ...observed, prices: { [m.id]: "0" } }, data)[m.id]
    ).toBe("0");
    expect(
        barterPrices(
            {
                ...observed,
                quotes: { [m.name]: { ...quote, availableQuantity: 0 } },
            },
            data
        )[m.id]
    ).toBe("");
    expect(
        barterPrices(observed, { materials: [{ ...m, ambiguous: true }] })[m.id]
    ).toBe("");
});
