import {
    calculateCrafting,
    calculateCraftingCosts,
    type CraftingReference,
    emptyCraftingChoice,
    selectCraftingRecipe,
} from "@/lib/crafting";
import {
    buildCraftingHandoff,
    buildCraftingShare,
    CRAFTING_QUERY_LIMIT,
    CRAFTING_STORAGE_LIMIT,
    craftingBytes,
    craftingPlanIssues,
    craftingText,
    emptyCraftingPlan,
    parseCraftingShare,
    parseCraftingStorage,
    serializeCraftingStorage,
} from "@/lib/crafting-state";

const data: CraftingReference = {
    sourceVersion: 1,
    version: "reference-1",
    ruleVersion: "rule-1",
    collectedAt: "2026-09-10T00:00:00Z",
    items: [1, 2].map(id => ({
        id,
        name: `재료${id}`,
        searchable: true,
        ambiguous: false,
    })),
    recipes: [
        {
            fingerprint: "recipe-1",
            itemId: 1,
            type: 1,
            formId: 0,
            level: 0,
            facility: "",
            facilityKey: "",
            skill: "test",
            rank: "연습",
            process: [{ itemIds: [2], count: 1 }],
            finishes: [],
            occurrences: 1,
            issues: [],
        },
    ],
    byOutput: { 1: ["recipe-1"] },
};
function example() {
    const plan = emptyCraftingPlan(data);
    plan.targets = [{ itemId: 1, count: "2" }];
    plan.choices[1] = {
        ...selectCraftingRecipe(data.recipes[0]),
        yield: "1",
        passes: "1",
    };
    return plan;
}

test("storage and bounded shares round trip without serializing recipe definitions", () => {
    const plan = example();
    expect(parseCraftingStorage(serializeCraftingStorage(plan)).plan).toEqual(
        plan
    );
    expect(
        parseCraftingShare(
            new URL(buildCraftingShare(plan), "https://erinn.me").search,
            data
        ).plan
    ).toEqual(plan);
    expect(craftingPlanIssues(plan, data)).toEqual([]);
    expect(buildCraftingShare(plan)).not.toContain("Essentials");
});

test("barter handoff contains net quantities and no original inventory", () => {
    const path = buildCraftingHandoff(
        [
            { itemId: 1, count: 6 },
            { itemId: 2, count: 3 },
        ],
        1
    );
    const plan = parseCraftingShare(
        new URL(path, "https://erinn.me").search,
        data
    ).plan!;
    expect(plan.targets).toEqual([
        { itemId: 1, count: "6" },
        { itemId: 2, count: "3" },
    ]);
    expect(plan.owned).toBeUndefined();
    expect(plan.origin).toBe("barter-net-deficit");
    expect(plan.choices[1].mode).toBe("craft");
    expect(plan.choices[2].mode).toBe("buy");
    expect(() => buildCraftingHandoff([], 1)).toThrow();
    expect(() => buildCraftingHandoff([{ itemId: 1, count: -1 }], 1)).toThrow();
    const unknown = parseCraftingShare(
        new URL(
            buildCraftingHandoff([{ itemId: 999, count: 1 }], 1),
            "https://erinn.me"
        ).search,
        data
    ).plan!;
    expect(craftingPlanIssues(unknown, data).join()).toContain(
        "아이템 확인 필요"
    );
});

test("stale versions, removed fingerprints and forged alternatives require review", () => {
    const plan = example();
    for (const field of ["referenceVersion", "ruleVersion"] as const) {
        expect(
            craftingPlanIssues({ ...plan, [field]: "old" }, data).join()
        ).toContain("변경");
    }
    expect(
        craftingPlanIssues({ ...plan, sourceVersion: 2 }, data).join()
    ).toContain("변경");
    plan.choices[1].recipe = "removed";
    expect(craftingPlanIssues(plan, data).join()).toContain("삭제");
    plan.choices[1].recipe = "recipe-1";
    plan.choices[1].processChoices = [999];
    expect(craftingPlanIssues(plan, data).join()).toContain("대체 재료");
    plan.choices[1].finish = 0;
    expect(craftingPlanIssues(plan, data).join()).toContain("마감");
});

test("corrupt, duplicated, unexpected and oversized payloads are rejected", () => {
    for (const raw of [
        "broken",
        JSON.stringify({ ...example(), formatVersion: 2 }),
        JSON.stringify({ ...example(), extra: "untrusted" }),
    ])
        expect(parseCraftingStorage(raw).error).toBeTruthy();
    for (const query of [
        "?s={}",
        "?s={}&s={}",
        "?s={}&b={}",
        "?x={}",
        "?s=%ZZ",
    ])
        expect(parseCraftingShare(query, data).error).toBeTruthy();
    const raw = serializeCraftingStorage(example());
    const padded =
        raw + " ".repeat(CRAFTING_STORAGE_LIMIT - craftingBytes(raw));
    expect(parseCraftingStorage(padded).error).toBe("");
    expect(parseCraftingStorage(padded + " ").error).toBeTruthy();
    expect(craftingBytes("한글")).toBe(6);
    const query = new URL(
        buildCraftingShare(example()),
        "https://erinn.me"
    ).search.slice(1);
    expect(
        parseCraftingShare(
            query + "+".repeat(CRAFTING_QUERY_LIMIT - query.length),
            data
        ).error
    ).toBe("");
    expect(
        parseCraftingShare(
            query + "+".repeat(CRAFTING_QUERY_LIMIT - query.length + 1),
            data
        ).error
    ).toBeTruthy();
    const big = example();
    big.choices = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [i + 1, emptyCraftingChoice()])
    );
    expect(() => buildCraftingShare(big)).toThrow(/텍스트/);
    big.prices = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [i + 1, "1".repeat(64)])
    );
    big.quotes = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [
            "한".repeat(90) + i,
            {
                minPrice: 1,
                averagePrice: 1,
                availableQuantity: 1,
                isComplete: true,
                observedAt: "2026-09-10T00:00:00Z",
            },
        ])
    );
    expect(craftingBytes(JSON.stringify(big))).toBeGreaterThan(
        CRAFTING_STORAGE_LIMIT
    );
    expect(() => serializeCraftingStorage(big)).toThrow(/256KiB/);
    expect(
        parseCraftingStorage(
            JSON.stringify({
                ...example(),
                targets: Array.from({ length: 101 }, () => ({
                    itemId: 1,
                    count: "1",
                })),
            })
        ).error
    ).toBeTruthy();
});

test("text export retains assumptions, identity, subtotals and complete material rows", () => {
    const plan = example();
    const result = calculateCrafting(plan, data);
    const text = craftingText(plan, result);
    expect(text).toContain("recipe-1");
    expect(text).toContain("산출량 1");
    expect(text).not.toContain(" / 공정 ");
    expect(text).toContain("재료2 (#2)");
    expect(text).toContain("확인된 소계");
    expect(text).toContain("입력한 제작 조건 기준");
});

test("old per-batch fees are discarded without losing the saved plan", () => {
    const plan = example();
    plan.prices[2] = "100";
    const legacy = {
        ...plan,
        owned: { 1: "99", 2: "99" },
        checked: [2],
        fee: "9999",
        choices: { 1: { ...plan.choices[1], batchFee: "9999" } },
        comparisons: { 1: { price: "999", comparable: true, note: "legacy" } },
    };
    const restored = parseCraftingStorage(JSON.stringify(legacy));
    expect(restored.error).toBe("");
    expect(restored.plan).not.toHaveProperty("owned");
    expect(restored.plan).not.toHaveProperty("checked");
    expect(restored.plan!.choices[1]).not.toHaveProperty("batchFee");
    expect(restored.plan).not.toHaveProperty("comparisons");
    expect(restored.plan).not.toHaveProperty("fee");
    expect(
        calculateCraftingCosts(
            restored.plan!,
            calculateCrafting(restored.plan!, data)
        ).total.known
    ).toBe(200);
    expect(serializeCraftingStorage(restored.plan!)).not.toContain("batchFee");
});
