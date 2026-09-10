import {
    calculateCrafting,
    calculateCraftingCosts,
    type CraftingInput,
    type CraftingRecipe,
    type CraftingReference,
    emptyCraftingChoice,
    selectCraftingRecipe,
} from "@/lib/crafting";

function recipe(
    itemId: number,
    process: { itemIds: number[]; count: number; mixed?: boolean }[],
    patch: Partial<CraftingRecipe> = {}
): CraftingRecipe {
    return {
        itemId,
        fingerprint: `recipe-${itemId}`,
        type: 1,
        formId: 0,
        level: 0,
        facilityKey: "",
        facility: "",
        skill: "test",
        rank: "연습",
        process,
        finishes: [],
        occurrences: 1,
        issues: [],
        ...patch,
    };
}
function reference(recipes: CraftingRecipe[]): CraftingReference {
    const ids = new Set(
        recipes.flatMap(r => [
            r.itemId,
            ...r.process.flatMap(g => g.itemIds),
            ...r.finishes.flatMap(f => f.groups.flatMap(g => g.itemIds)),
        ])
    );
    return {
        version: "test",
        sourceVersion: 1,
        ruleVersion: "test",
        collectedAt: "2026-09-10T00:00:00Z",
        recipes,
        items: [...ids].map(id => ({
            id,
            name: `item${id}`,
            searchable: true,
            ambiguous: false,
        })),
        byOutput: Object.fromEntries(
            recipes.map(r => [r.itemId, [r.fingerprint]])
        ),
    };
}
function input(
    recipes: CraftingRecipe[],
    targets = [{ itemId: 1, count: "1" }]
): CraftingInput {
    return {
        targets,
        choices: Object.fromEntries(
            recipes.map(r => [
                r.itemId,
                { ...selectCraftingRecipe(r), yield: "1", passes: "1" },
            ])
        ),
        prices: {},
        quotes: {},
    };
}

test("target quantity ignores saved finished stock and still rounds batches", () => {
    const recipes = [recipe(1, [{ itemIds: [2], count: 2 }])];
    const plan = input(recipes, [{ itemId: 1, count: "5" }]);
    plan.choices[1].yield = "3";
    const original = JSON.stringify(plan);
    const result = calculateCrafting(plan, reference(recipes));
    expect(result.complete).toBe(true);
    expect(result.nodes[0]).toMatchObject({
        required: 5,
        missing: 5,
        batches: 2,
        produced: 6,
        surplus: 1,
    });
    expect(result.shopping[0]).toMatchObject({ required: 4, missing: 4 });
    expect(JSON.stringify(plan)).toBe(original);
    plan.choices[1].yield = "";
    expect(calculateCrafting(plan, reference(recipes)).nodes[0]).toMatchObject({
        missing: 5,
        complete: false,
    });
});

test("shared intermediates and a final/intermediate item combine before batching in any target order", () => {
    const recipes = [
        recipe(1, [{ itemIds: [3], count: 1 }]),
        recipe(2, [{ itemIds: [3], count: 1 }]),
        recipe(3, [{ itemIds: [4], count: 5 }]),
    ];
    const plan = input(recipes, [
        { itemId: 1, count: "1" },
        { itemId: 2, count: "1" },
    ]);
    plan.choices[3].yield = "2";
    let result = calculateCrafting(plan, reference(recipes));
    expect(result.nodes.find(n => n.item.id === 3)).toMatchObject({
        required: 2,
        batches: 1,
    });
    expect(result.shopping[0].required).toBe(5);
    plan.targets.push({ itemId: 3, count: "1" });
    result = calculateCrafting(plan, reference(recipes));
    expect(result.nodes.find(n => n.item.id === 3)).toMatchObject({
        required: 3,
        batches: 2,
    });
    expect(
        calculateCrafting(
            { ...plan, targets: [...plan.targets].reverse() },
            reference(recipes)
        )
    ).toEqual(result);
    result = calculateCrafting(plan, reference(recipes));
    expect(result.nodes.find(n => n.item.id === 3)).toMatchObject({
        required: 3,
        missing: 3,
        batches: 2,
    });
    plan.targets = plan.targets.filter(target => target.itemId !== 3);
    plan.choices[3] = emptyCraftingChoice();
    result = calculateCrafting(plan, reference(recipes));
    expect(result.shopping.map(n => n.item.id)).toEqual([3]);
    expect(result.nodes.some(n => n.item.id === 4)).toBe(false);
});

test("chosen process and finish alternatives are consumed at their own stage frequency", () => {
    const recipes = [
        recipe(1, [{ itemIds: [2, 3], count: 3 }], {
            type: 65538,
            finishes: Array.from({ length: 4 }, (_, i) => ({
                groups: [{ itemIds: [4 + i], count: 2 }],
                extraData: `color${i}`,
            })),
        }),
    ];
    const plan = input(recipes);
    expect(calculateCrafting(plan, reference(recipes)).complete).toBe(false);
    plan.choices[1].processChoices = [2];
    plan.choices[1].finish = 0;
    plan.choices[1].passes = "4";
    let result = calculateCrafting(plan, reference(recipes));
    expect(result.complete).toBe(true);
    expect(result.shopping.map(n => [n.item.id, n.required])).toEqual([
        [2, 12],
        [4, 2],
    ]);
    plan.targets[0].count = "2";
    result = calculateCrafting(plan, reference(recipes));
    expect(result.shopping.map(n => n.required)).toEqual([24, 4]);
    plan.choices[1].processChoices = [999];
    expect(calculateCrafting(plan, reference(recipes)).issues.join()).toContain(
        "대체 재료"
    );
});

test("selected cycles show the actual path and a buy choice removes the cycle", () => {
    const recipes = [
        recipe(1, [{ itemIds: [2], count: 1 }]),
        recipe(2, [{ itemIds: [1, 3], count: 1 }]),
    ];
    const plan = input(recipes);
    plan.choices[2].processChoices = [1];
    let result = calculateCrafting(plan, reference(recipes));
    expect(result.complete).toBe(false);
    expect(result.issues.join()).toContain("item1 → item2 → item1");
    plan.choices[2].processChoices = [3];
    expect(calculateCrafting(plan, reference(recipes)).complete).toBe(true);
    plan.choices[2] = emptyCraftingChoice();
    result = calculateCrafting(plan, reference(recipes));
    expect(result.complete).toBe(true);
    expect(result.shopping[0].item.id).toBe(2);
});

test("invalid assumptions and arithmetic keep independent known branches without claiming a total", () => {
    const recipes = [
        recipe(1, [{ itemIds: [3], count: 2 }]),
        recipe(2, [{ itemIds: [4], count: 1 }]),
    ];
    const plan = input(recipes, [
        { itemId: 1, count: "1" },
        { itemId: 2, count: "1" },
    ]);
    for (const value of ["", "-1", "1.5", " ", "Infinity"]) {
        plan.choices[1].yield = value;
        const result = calculateCrafting(plan, reference(recipes));
        expect(result.complete).toBe(false);
        expect(result.nodes.find(n => n.item.id === 4)).toMatchObject({
            required: 1,
            complete: true,
        });
        expect(result.nodes.find(n => n.item.id === 3)?.complete).toBe(false);
    }
    plan.choices[1].yield = "1";
    plan.targets[0].count = String(Number.MAX_SAFE_INTEGER);
    expect(calculateCrafting(plan, reference(recipes)).issues.join()).toContain(
        "범위"
    );
    plan.choices[1].yield = String(Number.MAX_SAFE_INTEGER);
    expect(calculateCrafting(plan, reference(recipes)).nodes[0].batches).toBe(
        1
    );
});

test("unknown identity, missing recipe, excessive graph depth and target count stay explicit", () => {
    const recipes = Array.from({ length: 34 }, (_, index) =>
        recipe(index + 1, [{ itemIds: [index + 2], count: 1 }])
    );
    const data = reference(recipes);
    const plan = input(recipes);
    expect(calculateCrafting(plan, data).issues.join()).toContain("32단계");
    expect(
        calculateCrafting(
            { ...plan, targets: [{ itemId: 9999, count: "1" }] },
            data
        ).complete
    ).toBe(false);
    plan.choices[1].recipe = "missing";
    expect(calculateCrafting(plan, data).issues.join()).toContain(
        "제작법을 선택"
    );
    expect(
        calculateCrafting(
            {
                ...plan,
                targets: Array.from({ length: 101 }, () => ({
                    itemId: 1,
                    count: "1",
                })),
            },
            data
        ).complete
    ).toBe(false);
});

test("only verified interchangeable groups accept explicit per-pass mixed allocations", () => {
    const recipes = [recipe(1, [{ itemIds: [2, 3], count: 5, mixed: true }])];
    const plan = input(recipes);
    plan.choices[1].allocations = {
        "p:0": [
            { itemId: 2, count: "2" },
            { itemId: 3, count: "3" },
        ],
    };
    expect(
        calculateCrafting(plan, reference(recipes)).shopping.map(
            n => n.required
        )
    ).toEqual([2, 3]);
    plan.choices[1].allocations["p:0"][1].count = "4";
    expect(calculateCrafting(plan, reference(recipes)).complete).toBe(false);
    recipes[0].process[0].mixed = false;
    expect(calculateCrafting(plan, reference(recipes)).issues.join()).toContain(
        "혼합 사용은 확인되지"
    );
});

test("node and edge bounds reject expansion rather than truncate a valid result", () => {
    const wide = [
        recipe(
            1,
            Array.from({ length: 1000 }, (_, i) => ({
                itemIds: [i + 2],
                count: 1,
            }))
        ),
    ];
    expect(
        calculateCrafting(input(wide), reference(wide)).issues.join()
    ).toContain("1,000종");
    const manyEdges = Array.from({ length: 6 }, (_, i) =>
        recipe(
            i + 1,
            Array.from({ length: 900 }, (_, j) => ({
                itemIds: [j + 10],
                count: 1,
            }))
        )
    );
    expect(
        calculateCrafting(
            input(
                manyEdges,
                manyEdges.map(r => ({ itemId: r.itemId, count: "1" }))
            ),
            reference(manyEdges)
        ).issues.join()
    ).toContain("5,000개");
});

test("full material cost and auction minimum use the same target quantity", () => {
    const recipes = [recipe(1, [{ itemIds: [2], count: 10 }])];
    const plan = input(recipes);
    plan.prices[2] = "100";
    plan.quotes.item1 = {
        minPrice: 1200,
        averagePrice: 1300,
        availableQuantity: 10,
        isComplete: true,
        observedAt: "2026-09-10T00:00:00Z",
    };
    let result = calculateCraftingCosts(
        plan,
        calculateCrafting(plan, reference(recipes))
    );
    expect(result.total.known).toBe(1000);
    expect(result.difference).toBe(200);
    plan.prices[2] = "";
    result = calculateCraftingCosts(
        plan,
        calculateCrafting(plan, reference(recipes))
    );
    expect(result.total.complete).toBe(false);
    expect(result.difference).toBeNull();
    plan.prices[2] = "0";
    result = calculateCraftingCosts(
        plan,
        calculateCrafting(plan, reference(recipes))
    );
    expect(result.total).toMatchObject({ known: 0, complete: true });
    plan.quotes.item1.availableQuantity = 0;
    expect(
        calculateCraftingCosts(
            plan,
            calculateCrafting(plan, reference(recipes))
        ).direct.complete
    ).toBe(false);
});

test("legacy inventory never reduces raw or intermediate demand or cost", () => {
    const recipes = [
        recipe(1, [{ itemIds: [2], count: 1 }]),
        recipe(2, [{ itemIds: [3], count: 10 }]),
    ];
    const plan = input(recipes, [{ itemId: 1, count: "2" }]);
    plan.prices[3] = "100";
    plan.quotes.item1 = {
        minPrice: 1200,
        averagePrice: 1300,
        availableQuantity: 10,
        isComplete: true,
        observedAt: "2026-09-10T00:00:00Z",
    };
    const legacy = { ...plan, owned: { 1: "10", 2: "99", 3: "999" } };
    const result = calculateCrafting(legacy, reference(recipes));
    expect(result).toEqual(calculateCrafting(plan, reference(recipes)));
    expect(result.shopping[0].required).toBe(20);
    const costs = calculateCraftingCosts(legacy, result);
    expect(costs.total).toMatchObject({ known: 2000, complete: true });
    expect(costs.direct.known).toBe(2400);
    expect(costs.difference).toBe(400);
});

test("single recipes auto-select and ordinary skills ignore legacy pass counts and target buying", () => {
    const recipes = [recipe(1, [{ itemIds: [2], count: 3 }])];
    const plan = input(recipes, [{ itemId: 1, count: "2" }]);
    plan.choices[1] = {
        ...emptyCraftingChoice("buy"),
        yield: "1",
        passes: "99",
    };
    const result = calculateCrafting(plan, reference(recipes));
    expect(result.complete).toBe(true);
    expect(result.nodes[0].mode).toBe("craft");
    expect(result.nodes[0].recipe?.fingerprint).toBe("recipe-1");
    expect(result.shopping[0].required).toBe(6);
    for (const type of [65537, 65538]) {
        recipes[0].type = type;
        plan.choices[1].passes = "";
        expect(calculateCrafting(plan, reference(recipes)).complete).toBe(
            false
        );
        plan.choices[1].passes = "4";
        expect(
            calculateCrafting(plan, reference(recipes)).shopping[0].required
        ).toBe(24);
    }
});

test("finished market total stays available before recipe inputs and rejects missing quotes", () => {
    const recipes = [recipe(1, [{ itemIds: [2], count: 10 }])];
    const plan = input(recipes, [{ itemId: 1, count: "2" }]);
    plan.choices[1].yield = "";
    plan.quotes.item1 = {
        minPrice: 100,
        averagePrice: 120,
        availableQuantity: 1,
        isComplete: false,
        observedAt: "2026-09-10T00:00:00Z",
    };
    const data = reference(recipes);
    const costs = () =>
        calculateCraftingCosts(plan, calculateCrafting(plan, data));
    expect(costs().direct).toMatchObject({ known: 200, complete: true });
    expect(costs().difference).toBeNull();
    data.items[0].ambiguous = true;
    expect(costs().direct).toMatchObject({ known: 200, complete: true });
    data.items[0].searchable = false;
    expect(costs().direct).toMatchObject({ known: 0, complete: false });
    data.items[0].searchable = true;
    plan.quotes.item1.minPrice = 0;
    expect(costs().direct).toMatchObject({ known: 0, complete: true });
    delete plan.quotes.item1;
    expect(costs().direct.complete).toBe(false);
    plan.targets = [{ itemId: 999, count: "1" }];
    expect(costs().direct.complete).toBe(false);
});
