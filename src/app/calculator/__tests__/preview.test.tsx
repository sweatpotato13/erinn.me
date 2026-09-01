/** @jest-environment node */

import { act } from "@testing-library/react";

const mockRenderedMarkup: string[] = [];

jest.mock("next/og", () => ({
    ImageResponse: class MockImageResponse extends Response {
        constructor(
            element: React.ReactElement,
            options: { width: number; height: number; headers?: HeadersInit }
        ) {
            const { renderToStaticMarkup } =
                jest.requireActual<typeof import("react-dom/server")>(
                    "react-dom/server"
                );
            act(() => {
                mockRenderedMarkup.push(renderToStaticMarkup(element));
            });
            const bytes = new Uint8Array(24);
            bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
            const view = new DataView(bytes.buffer);
            view.setUint32(16, options.width);
            view.setUint32(20, options.height);
            super(bytes, {
                headers: {
                    "content-type": "image/png",
                    ...Object.fromEntries(new Headers(options.headers)),
                },
            });
        }
    },
}));

jest.mock("node:fs/promises", () => ({
    readFile: jest.fn().mockResolvedValue(Buffer.from("font")),
}));

import {
    createCalculatorPreviewCopy,
    GET,
} from "@/app/calculator/preview/route";
import {
    calculateAuctionDistribution,
    createEmptyCouponPrices,
} from "@/lib/auction-calculator";
import { serializeAuctionCalculatorSnapshot } from "@/lib/auction-calculator-url";

async function expectPng(response: Response) {
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
        "public, max-age=600, s-maxage=600, stale-while-revalidate=60"
    );
    const body = await response.arrayBuffer();
    const bytes = new Uint8Array(body);
    expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(body);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
}

describe("auction calculator preview", () => {
    const snapshot = {
        salePrice: 100_000_000,
        memberCount: 4,
        hasMembership: true,
        additionalCost: 0,
        couponPrices: { ...createEmptyCouponPrices(), 10: 240_000 },
        incompleteCoupons: [],
        snapshotAt: 1_788_226_000,
    };

    beforeEach(() => {
        mockRenderedMarkup.length = 0;
    });

    it("creates copy from the same calculation result", () => {
        const result = calculateAuctionDistribution(snapshot);
        expect(
            createCalculatorPreviewCopy(
                snapshot.memberCount,
                result.recommended,
                snapshot.salePrice
            )
        ).toEqual({
            heading: "파티 분배 결과",
            salePrice: "판매가 100,000,000 Gold",
            recommendation: "추천 10% 할인 쿠폰",
            totalCost: "총비용 3,840,000 Gold",
            distributable: "분배 가능 96,160,000 Gold",
            split: "4명 · 1인당 24,040,000 Gold",
        });
    });

    it("renders calculator content for a valid snapshot without fetch", async () => {
        const fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("unexpected fetch"));
        const query = serializeAuctionCalculatorSnapshot(snapshot);
        await expectPng(
            await GET(
                new Request(`http://localhost/calculator/preview?${query}`)
            )
        );

        expect(mockRenderedMarkup[0]).toContain("파티 분배 결과");
        expect(mockRenderedMarkup[0]).toContain("10% 할인 쿠폰");
        expect(mockRenderedMarkup[0]).toContain("24,040,000 Gold");
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it.each(["?v=1&p=unsafe", ""])(
        "renders generic content for an invalid or empty query: %s",
        async query => {
            await expectPng(
                await GET(
                    new Request(`http://localhost/calculator/preview${query}`)
                )
            );

            expect(mockRenderedMarkup[0]).toContain("파티 분배 계산기");
            expect(mockRenderedMarkup[0]).not.toContain("파티 분배 결과");
            expect(mockRenderedMarkup[0]).not.toContain("추천 선택지");
        }
    );

    it("falls back to a PNG when rendering fails", async () => {
        const spy = jest
            .spyOn(Response.prototype, "arrayBuffer")
            .mockRejectedValueOnce(new Error("renderer failed"));
        const response = await GET(
            new Request("http://localhost/calculator/preview")
        );
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
        await expectPng(response);
    });
});
