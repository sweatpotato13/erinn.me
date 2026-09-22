/** @jest-environment node */

import {
    GET,
    matchesCashPackageListing,
} from "@/app/api/auction/cash-package-prices/route";
import { fetchCurrentItemMarket } from "@/lib/api/auction-market";

jest.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
jest.mock("@/lib/api/auction-market", () => ({
    fetchCurrentItemMarket: jest.fn(),
}));

const originalVercelEnv = process.env.VERCEL_ENV;
const request = (itemId: string, origin = true) =>
    new Request(
        `http://localhost:3000/api/auction/cash-package-prices?item_id=${itemId}`,
        origin ? { headers: { origin: "http://localhost:3000" } } : undefined
    );

describe("cash package price API", () => {
    beforeAll(() => {
        process.env.VERCEL_ENV = "production";
    });

    afterAll(() => {
        if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
        else process.env.VERCEL_ENV = originalVercelEnv;
    });

    beforeEach(() => jest.clearAllMocks());

    it("returns an exact current minimum with completeness", async () => {
        jest.mocked(fetchCurrentItemMarket).mockResolvedValue({
            minPrice: 123,
            averagePrice: 150,
            availableQuantity: 4,
            listingCount: 2,
            isComplete: false,
            fetchedAt: "2026-09-22T00:00:00.000Z",
        });
        const response = await GET(request("rebirth-potion"));
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            itemId: "rebirth-potion",
            status: "available",
            marketUnitGold: 123,
            fetchedAt: "2026-09-22T00:00:00.000Z",
            isComplete: false,
            availableQuantity: 4,
            cause: null,
        });
        const [name, , exact, matcher] = jest.mocked(fetchCurrentItemMarket)
            .mock.calls[0];
        expect(name).toBe("환생의 비약");
        expect(exact).toBe(false);
        expect(
            matcher!({
                item_name: name,
                item_display_name: name,
                item_count: 1,
                auction_price_per_unit: 1,
                date_auction_expire: "",
            })
        ).toBe(true);
        expect(
            matcher!({
                item_name: `${name} 상자`,
                item_display_name: `${name} 상자`,
                item_count: 1,
                auction_price_per_unit: 1,
                date_auction_expire: "",
            })
        ).toBe(false);
    });

    it("keeps empty and partial results identifiable", async () => {
        jest.mocked(fetchCurrentItemMarket).mockResolvedValue({
            minPrice: 0,
            averagePrice: 0,
            availableQuantity: 0,
            listingCount: 0,
            isComplete: false,
            fetchedAt: "2026-09-22T00:00:00.000Z",
        });
        const response = await GET(request("memory-gem"));
        await expect(response.json()).resolves.toMatchObject({
            status: "empty",
            marketUnitGold: null,
            isComplete: false,
            cause: "확인한 범위에서 매물을 찾지 못했습니다.",
        });
    });

    it("accepts only catalog item IDs and same-origin requests", async () => {
        expect((await GET(request("not-registered"))).status).toBe(400);
        expect((await GET(request("memory-gem", false))).status).toBe(403);
        expect(fetchCurrentItemMarket).not.toHaveBeenCalled();
    });
});

test("color matching aggregates only the same 30-day product", () => {
    const item = {
        itemId: "color",
        name: "반짝이 이름/채팅 지정 색상 변경 포션(30일)",
        pricing: "colorVariants" as const,
        tradeUnit: "stack" as const,
    };
    const listing = (name: string) => ({
        item_name: name,
        item_display_name: name,
        item_count: 1,
        auction_price_per_unit: 1,
        date_auction_expire: "",
    });
    expect(matchesCashPackageListing(item, listing(item.name))).toBe(true);
    expect(matchesCashPackageListing(item, listing(`${item.name}(빨강)`))).toBe(
        true
    );
    expect(matchesCashPackageListing(item, listing(`${item.name}()`))).toBe(
        false
    );
    expect(
        matchesCashPackageListing(item, listing(`${item.name} 특별판`))
    ).toBe(false);
    expect(
        matchesCashPackageListing(
            item,
            listing("반짝이 이름/채팅 지정 색상 변경 포션(7일)(빨강)")
        )
    ).toBe(false);
});
