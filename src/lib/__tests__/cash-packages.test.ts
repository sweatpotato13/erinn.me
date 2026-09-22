import catalogData from "@/data/cash-packages.json";
import {
    calculateCashPackage,
    type CashPackageCatalog,
    cashPackageMarketItems,
    choosePricedOption,
    parseCashPerTenMillion,
} from "@/lib/cash-packages";

const catalog = catalogData as CashPackageCatalog;

test("matches the verified package contents without unopened boxes", () => {
    expect(
        catalog.products.map(({ id, cashPrice }) => [id, cashPrice])
    ).toEqual([
        ["sodamhan", 32_900],
        ["dalgoun", 89_900],
        ["onnuri", 119_000],
    ]);
    expect(
        catalog.products.map(product =>
            product.entries.reduce((sum, entry) => sum + entry.quantity, 0)
        )
    ).toEqual([18, 102, 241]);
    expect(JSON.stringify(catalog).match(/환생의 비약 상자/g)?.length).toBe(2);
    expect(
        cashPackageMarketItems(catalog).filter(
            item => item.name === "환생의 비약"
        )
    ).toHaveLength(1);
});

test("rejects choices without market options", () => {
    const invalid = JSON.parse(JSON.stringify(catalog)) as CashPackageCatalog;
    const choice = invalid.products
        .flatMap(product => product.entries)
        .find(entry => entry.kind === "choice");
    if (!choice || choice.kind !== "choice") throw new Error("Missing fixture");
    choice.options.splice(0);

    expect(() => cashPackageMarketItems(invalid)).toThrow(
        "Choice has no market options"
    );
});

test("calculates converted cost, per-sale fees and profit", () => {
    expect(
        calculateCashPackage({
            cashPrice: 32_900,
            purchaseQuantity: 1,
            cashPerTenMillion: 8_000,
            hasMembership: false,
            couponStock: 0,
            sales: [
                {
                    itemId: "item",
                    quantity: 1,
                    unitGold: 38_000_000,
                    saleCount: 1,
                    couponCount: 0,
                    priced: true,
                },
            ],
        })
    ).toEqual({
        cashCost: 32_900,
        goldCost: 41_125_000,
        grossGold: 38_000_000,
        feeGold: 1_900_000,
        netGold: 36_100_000,
        profitGold: -5_025_000,
        profitPercent: expect.closeTo(-12.2188, 3),
        unpricedCount: 0,
    });
});

test("handles membership, split-sale truncation and coupons", () => {
    const result = calculateCashPackage({
        cashPrice: 1,
        purchaseQuantity: 2,
        cashPerTenMillion: null,
        hasMembership: true,
        couponStock: 2,
        sales: [
            {
                itemId: "item",
                quantity: 3,
                unitGold: 11,
                saleCount: 2,
                couponCount: 1,
                priced: true,
            },
            {
                itemId: "coupon",
                quantity: 1,
                unitGold: 0,
                saleCount: 1,
                couponCount: 0,
                priced: true,
                isCoupon: true,
            },
        ],
    });
    expect(result).toMatchObject({
        cashCost: 2,
        goldCost: null,
        grossGold: 33,
        feeGold: 0,
        profitGold: null,
        profitPercent: null,
    });
    expect(() =>
        calculateCashPackage({
            cashPrice: 1,
            purchaseQuantity: 1,
            cashPerTenMillion: null,
            hasMembership: false,
            couponStock: 1,
            sales: [
                {
                    itemId: "coupon",
                    quantity: 1,
                    unitGold: 1,
                    saleCount: 1,
                    couponCount: 1,
                    priced: true,
                    isCoupon: true,
                },
            ],
        })
    ).toThrow("Invalid sale allocation");
});

test("counts unresolved included items while manual zero resolves one", () => {
    expect(
        calculateCashPackage({
            cashPrice: 1,
            purchaseQuantity: 1,
            cashPerTenMillion: null,
            hasMembership: false,
            couponStock: 0,
            sales: [
                {
                    itemId: "unknown",
                    quantity: 1,
                    unitGold: 0,
                    saleCount: 1,
                    couponCount: 0,
                    priced: false,
                },
                {
                    itemId: "manual-zero",
                    quantity: 1,
                    unitGold: 0,
                    saleCount: 1,
                    couponCount: 0,
                    priced: true,
                },
                {
                    itemId: "excluded",
                    quantity: 0,
                    unitGold: 0,
                    saleCount: 0,
                    couponCount: 0,
                    priced: false,
                },
            ],
        }).unpricedCount
    ).toBe(1);
});

test("parses cash per ten million gold and rejects invalid values", () => {
    expect(parseCashPerTenMillion("")).toBeNull();
    expect(parseCashPerTenMillion("10000")).toBe(10_000);
    expect(parseCashPerTenMillion("0")).toBeNull();
    expect(parseCashPerTenMillion("1.5")).toBeNull();
    expect(parseCashPerTenMillion("Infinity")).toBeNull();
});

test("chooses the highest known option and never favors unknown price", () => {
    const options = [
        { itemId: "blue", name: "푸른", tradeUnit: "stack" as const },
        { itemId: "red", name: "붉은", tradeUnit: "stack" as const },
    ];
    expect(
        choosePricedOption(options, {
            blue: {
                status: "available",
                marketUnitGold: 10,
                manualUnitGold: null,
                fetchedAt: null,
                isComplete: true,
            },
            red: {
                status: "empty",
                marketUnitGold: null,
                manualUnitGold: null,
                fetchedAt: null,
                isComplete: true,
            },
        })
    ).toBe("blue");
});

test("rejects unsafe and impossible allocations", () => {
    expect(() =>
        calculateCashPackage({
            cashPrice: 1,
            purchaseQuantity: 1,
            cashPerTenMillion: 1,
            hasMembership: false,
            couponStock: 0,
            sales: [
                {
                    itemId: "item",
                    quantity: 2,
                    unitGold: Number.MAX_SAFE_INTEGER,
                    saleCount: 1,
                    couponCount: 0,
                    priced: true,
                },
            ],
        })
    ).toThrow("Unsafe gross gold");
});
