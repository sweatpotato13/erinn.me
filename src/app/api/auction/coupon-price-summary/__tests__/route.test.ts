/** @jest-environment node */

import { GET } from "@/app/api/auction/coupon-price-summary/route";
import { getCachedCouponItemMarkets } from "@/lib/api/auction-market";

jest.mock("@/lib/api/auction-market", () => ({
    getCachedCouponItemMarkets: jest.fn(),
}));

describe("coupon price summary API", () => {
    it("returns the cached coupon batch", async () => {
        const summaries = { 10: null, 20: null, 30: null, 50: null, 100: null };
        jest.mocked(getCachedCouponItemMarkets).mockResolvedValue(summaries);

        const response = await GET(
            new Request(
                "http://localhost:3000/api/auction/coupon-price-summary",
                {
                    headers: { origin: "http://localhost:3000" },
                }
            )
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(summaries);
        expect(getCachedCouponItemMarkets).toHaveBeenCalledTimes(1);
    });
});
