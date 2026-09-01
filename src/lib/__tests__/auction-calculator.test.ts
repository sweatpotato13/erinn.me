import {
    type AuctionCalculatorInput,
    calculateAuctionDistribution,
    createEmptyCouponPrices,
    MAX_GOLD,
} from "@/lib/auction-calculator";
import {
    type AuctionCalculatorSnapshot,
    parseAuctionCalculatorParams,
    searchParamsRecordToURLSearchParams,
    serializeAuctionCalculatorSnapshot,
} from "@/lib/auction-calculator-url";

function input(
    overrides: Partial<AuctionCalculatorInput> = {}
): AuctionCalculatorInput {
    return {
        salePrice: 100_000_000,
        memberCount: 4,
        hasMembership: false,
        additionalCost: 0,
        couponPrices: createEmptyCouponPrices(),
        ...overrides,
    };
}

describe("auction calculator", () => {
    it("calculates the documented no-coupon and membership examples", () => {
        expect(calculateAuctionDistribution(input()).recommended).toMatchObject(
            {
                label: "쿠폰 없음",
                auctionFee: 5_000_000,
                distributable: 95_000_000,
                perMember: 23_750_000,
            }
        );
        expect(
            calculateAuctionDistribution(input({ hasMembership: true }))
                .recommended
        ).toMatchObject({
            auctionFee: 4_000_000,
            distributable: 96_000_000,
            perMember: 24_000_000,
        });
    });

    it("applies coupon discounts to the fee and includes coupon cost", () => {
        const couponPrices = createEmptyCouponPrices();
        couponPrices[10] = 240_000;
        expect(
            calculateAuctionDistribution(
                input({ hasMembership: true, couponPrices })
            ).recommended
        ).toMatchObject({
            label: "10% 할인 쿠폰",
            auctionFee: 3_600_000,
            couponCost: 240_000,
            distributable: 96_160_000,
            perMember: 24_040_000,
        });
    });

    it("compares every option, keeps zero-price overrides, and breaks ties stably", () => {
        const couponPrices = {
            10: 10_000_000,
            20: 10_000_000,
            30: 10_000_000,
            50: 10_000_000,
            100: 0,
        } as const;
        const result = calculateAuctionDistribution(input({ couponPrices }));
        expect(result.options).toHaveLength(6);
        expect(result.recommended.label).toBe("100% 할인 쿠폰");

        const tiedPrices = createEmptyCouponPrices();
        tiedPrices[10] = 500_000;
        expect(
            calculateAuctionDistribution(input({ couponPrices: tiedPrices }))
                .recommended.label
        ).toBe("쿠폰 없음");
    });

    it("includes shared costs and preserves floored negative results and remainder", () => {
        const result = calculateAuctionDistribution(
            input({
                salePrice: 1,
                memberCount: 4,
                additionalCost: 2,
            })
        ).recommended;
        expect(result).toMatchObject({
            auctionFee: 0,
            totalCost: 2,
            distributable: -1,
            perMember: -1,
            remainder: 3,
        });
    });

    it("rejects unsafe and out-of-range inputs", () => {
        expect(() =>
            calculateAuctionDistribution(input({ salePrice: MAX_GOLD + 1 }))
        ).toThrow("sale price");
        expect(() =>
            calculateAuctionDistribution(input({ memberCount: 1.5 }))
        ).toThrow("member count");
    });
});

describe("auction calculator URL", () => {
    const snapshot: AuctionCalculatorSnapshot = {
        ...input({
            hasMembership: true,
            additionalCost: 300,
            couponPrices: { 10: 0, 20: 200, 30: null, 50: 500, 100: 1_000 },
        }),
        incompleteCoupons: [20],
        snapshotAt: 1_788_226_000,
    };

    it("round-trips all fields in canonical order", () => {
        const serialized = serializeAuctionCalculatorSnapshot(snapshot);
        expect(serialized.toString()).toBe(
            "v=1&p=100000000&n=4&m=1&a=300&c10=0&c20=200&c50=500&c100=1000&x=20&t=1788226000"
        );
        expect(parseAuctionCalculatorParams(serialized)).toEqual({
            status: "valid",
            snapshot,
            normalized: serialized,
        });
    });

    it("distinguishes a zero override from an unavailable coupon", () => {
        const parsed = parseAuctionCalculatorParams(
            new URLSearchParams("v=1&p=100&c10=0&t=1")
        );
        expect(parsed.status).toBe("valid");
        if (parsed.status !== "valid") return;
        expect(parsed.snapshot.couponPrices[10]).toBe(0);
        expect(parsed.snapshot.couponPrices[20]).toBeNull();
    });

    it.each([
        "v=1&p=1&p=2&t=1",
        "v=1&p=-1&t=1",
        "v=1&p=1.5&t=1",
        "v=1&p=1e2&t=1",
        "v=1&p=01&t=1",
        `v=1&p=${MAX_GOLD + 1}&t=1`,
        "v=2&p=1&t=1",
        "v=1&p=1&m=0&t=1",
        "v=1&p=1&c10=0&x=10&t=1",
        "v=1&p=1&c10=1&x=20&t=1",
        "v=1&p=1&c10=1&c20=2&x=20,10&t=1",
        "v=1&p=1&t=253402300800",
    ])("rejects invalid query: %s", query => {
        expect(
            parseAuctionCalculatorParams(new URLSearchParams(query))
        ).toEqual({ status: "invalid", normalized: new URLSearchParams() });
    });

    it("preserves duplicate values from Next search params records", () => {
        expect(
            searchParamsRecordToURLSearchParams({
                p: ["1", "2"],
                v: "1",
            }).getAll("p")
        ).toEqual(["1", "2"]);
    });
});
