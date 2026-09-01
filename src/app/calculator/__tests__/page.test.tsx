import { generateMetadata } from "@/app/calculator/page";
import { createEmptyCouponPrices } from "@/lib/auction-calculator";
import { serializeAuctionCalculatorSnapshot } from "@/lib/auction-calculator-url";

describe("auction calculator metadata", () => {
    it("uses the validated frozen calculation for metadata and preview URLs", async () => {
        const couponPrices = createEmptyCouponPrices();
        couponPrices[10] = 240_000;
        const query = serializeAuctionCalculatorSnapshot({
            salePrice: 100_000_000,
            memberCount: 4,
            hasMembership: true,
            additionalCost: 0,
            couponPrices,
            incompleteCoupons: [],
            snapshotAt: 1_788_226_000,
        });
        const metadata = await generateMetadata({
            searchParams: Promise.resolve(Object.fromEntries(query)),
        });

        expect(metadata).toMatchObject({
            title: "파티 분배 결과 · 10% 할인 쿠폰",
            description: expect.stringContaining("96,160,000 Gold"),
            alternates: { canonical: "/calculator" },
            openGraph: {
                url: `/calculator?${query}`,
                images: [
                    expect.objectContaining({
                        url: `/calculator/preview?${query}`,
                        width: 1200,
                        height: 630,
                    }),
                ],
            },
            twitter: { card: "summary_large_image" },
        });
    });

    it.each([
        {},
        { v: "1", p: ["1", "2"], t: "1" },
        { v: "1", p: "unsafe", t: "1" },
    ])(
        "returns generic metadata for missing or invalid input",
        async values => {
            const metadata = await generateMetadata({
                searchParams: Promise.resolve(values),
            });
            expect(metadata.title).toBe("마비노기 파티 분배 계산기");
            expect(metadata.openGraph).toMatchObject({
                url: "/calculator",
                images: [
                    expect.objectContaining({
                        url: "/calculator/preview",
                    }),
                ],
            });
        }
    );
});
