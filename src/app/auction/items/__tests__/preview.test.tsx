/** @jest-environment node */

import { act } from "@testing-library/react";

jest.mock("next/og", () => ({
    ImageResponse: class MockImageResponse extends Response {
        constructor(
            element: React.ReactElement,
            options: {
                width: number;
                height: number;
                headers?: HeadersInit;
            }
        ) {
            const { renderToStaticMarkup } =
                jest.requireActual<typeof import("react-dom/server")>(
                    "react-dom/server"
                );
            act(() => {
                renderToStaticMarkup(element);
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

import {
    createPreviewCopy,
    GET,
    loadPreviewData,
    type PreviewData,
} from "@/app/auction/items/[itemId]/preview/route";
import type { AuctionSale } from "@/app/auction/types";
import {
    getCachedCurrentItemMarket,
    getCachedRecentItemSales,
} from "@/lib/api/auction-market";
import { getAuctionCatalogItems } from "@/lib/auction-item-catalog";
import { prepareRecentSales } from "@/lib/auction-market";

jest.mock("@/lib/api/auction-market", () => ({
    getCachedCurrentItemMarket: jest.fn(),
    getCachedRecentItemSales: jest.fn(),
}));

const items = getAuctionCatalogItems();
const item = items[0];
const longestItem = items.reduce((longest, candidate) =>
    [...candidate.name].length > [...longest.name].length ? candidate : longest
);
const punctuationItem = items.find(candidate => /[()+]/.test(candidate.name))!;
const fetchedAt = "2026-08-28T10:00:00.000Z";

function sale(id: string, price: number, count = 2): AuctionSale {
    return {
        item_name: item.name,
        item_display_name: item.name,
        item_count: count,
        auction_price_per_unit: price,
        date_auction_buy: `2026-08-28T0${id}:00:00.000Z`,
        auction_buy_id: id,
        item_option: [],
    };
}

function current(
    overrides: Partial<
        Extract<PreviewData["current"], { status: "success" }>["value"]
    > = {}
): PreviewData["current"] {
    return {
        status: "success",
        value: {
            minPrice: 1234.5,
            averagePrice: 1500,
            availableQuantity: 7,
            listingCount: 2,
            isComplete: true,
            fetchedAt,
            ...overrides,
        },
    };
}

function recent(
    sales: AuctionSale[] = [sale("1", 100), sale("2", 200), sale("3", 300)],
    overrides: { hasMore?: boolean; fetchedAt?: string } = {}
): PreviewData["recent"] {
    return {
        status: "success",
        value: {
            sales,
            hasMore: false,
            fetchedAt,
            ...overrides,
            prepared: prepareRecentSales(sales),
        },
    };
}

function mockMarketSuccess() {
    const snapshot = current();
    if (snapshot.status !== "success") throw new Error("invalid fixture");
    jest.mocked(getCachedCurrentItemMarket).mockResolvedValue(snapshot.value);
    jest.mocked(getCachedRecentItemSales).mockResolvedValue({
        sales: [sale("1", 100), sale("2", 200), sale("3", 300)],
        hasMore: false,
        fetchedAt,
    });
}

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

describe("auction item preview", () => {
    beforeEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it.each([
        {
            name: "both sources",
            data: { current: current(), recent: recent() },
            expected: [
                "최저 등록 단가 1,234.5 Gold",
                "가용 수량 7개",
                "최근 1시간 3건 · 6개",
                "완료 단가 중앙값 200 Gold",
            ],
        },
        {
            name: "current only and empty recent",
            data: { current: current(), recent: recent([]) },
            expected: ["최저 등록 단가", "최근 1시간 거래 없음"],
        },
        {
            name: "recent only and empty current",
            data: {
                current: current({ listingCount: 0, availableQuantity: 0 }),
                recent: recent(),
            },
            expected: ["현재 매물 없음", "최근 1시간 3건"],
        },
        {
            name: "both empty",
            data: {
                current: current({ listingCount: 0, availableQuantity: 0 }),
                recent: recent([]),
            },
            expected: ["현재 매물 없음", "최근 1시간 거래 없음"],
        },
        {
            name: "partial current",
            data: {
                current: current({ isComplete: false }),
                recent: recent(),
            },
            expected: ["일부 데이터", "확인된 수량 7개"],
        },
        {
            name: "partial recent",
            data: {
                current: current(),
                recent: recent(undefined, { hasMore: true }),
            },
            expected: ["일부 데이터", "최근 1시간 3건"],
        },
    ])("creates copy for $name", ({ data, expected }) => {
        const copy = JSON.stringify(createPreviewCopy(item.name, data));
        for (const text of expected) expect(copy).toContain(text);
        expect(copy).toContain("조회 시각");
    });

    it.each([
        [1, [sale("1", 100)]],
        [2, [sale("1", 100), sale("2", 200)]],
    ])("does not invent a median for %i recent sales", (_count, sales) => {
        const copy = createPreviewCopy(item.name, {
            current: current(),
            recent: recent(sales),
        });
        expect(copy.recent.secondary).toBe("거래 3건 미만");
    });

    it("preserves one successful source when the other rejects", async () => {
        jest.mocked(getCachedCurrentItemMarket).mockRejectedValue(
            new Error("current offline")
        );
        jest.mocked(getCachedRecentItemSales).mockResolvedValue({
            sales: [sale("1", 100), sale("2", 200), sale("3", 300)],
            hasMore: false,
            fetchedAt,
        });

        const copy = createPreviewCopy(
            item.name,
            await loadPreviewData(item.name)
        );
        expect(copy.current.primary).toBe("현재 매물 조회 불가");
        expect(copy.recent.primary).toBe("최근 1시간 3건 · 6개");
        expect(copy.failure).toBeUndefined();
    });

    it("isolates recent-sales preparation errors", async () => {
        mockMarketSuccess();
        jest.mocked(getCachedRecentItemSales).mockResolvedValue({
            sales: [
                {
                    ...sale("1", 100),
                    auction_buy_id: null as unknown as string,
                },
            ],
            hasMore: false,
            fetchedAt,
        });

        const data = await loadPreviewData(item.name);
        const copy = createPreviewCopy(item.name, data);
        expect(data.current.status).toBe("success");
        expect(data.recent.status).toBe("failed");
        expect(copy.failure).toBeUndefined();
        expect(copy.current.primary).toContain("최저 등록 단가");
    });

    it("returns at four seconds while preserving a successful source", async () => {
        jest.useFakeTimers();
        jest.mocked(getCachedCurrentItemMarket).mockReturnValue(
            new Promise<never>(() => undefined)
        );
        jest.mocked(getCachedRecentItemSales).mockResolvedValue({
            sales: [],
            hasMore: false,
            fetchedAt,
        });

        const pending = loadPreviewData(item.name);
        await jest.advanceTimersByTimeAsync(3_999);
        let finished = false;
        void pending.then(() => (finished = true));
        await Promise.resolve();
        expect(finished).toBe(false);
        await jest.advanceTimersByTimeAsync(1);

        const data = await pending;
        expect(data.current.status).toBe("timeout");
        expect(data.recent.status).toBe("success");
    });

    it("uses an item-specific fallback without exposing internal errors", async () => {
        const secret = "NXOPEN_API_KEY=do-not-render";
        jest.mocked(getCachedCurrentItemMarket).mockRejectedValue(
            new Error(secret)
        );
        jest.mocked(getCachedRecentItemSales).mockReturnValue(
            new Promise<never>(() => undefined)
        );
        jest.useFakeTimers();

        const pending = loadPreviewData(item.name);
        await jest.advanceTimersByTimeAsync(4_000);
        const copy = createPreviewCopy(item.name, await pending);

        expect(copy.failure).toBe(
            `${item.name} 시세 정보를 불러오지 못했습니다`
        );
        expect(JSON.stringify(copy)).not.toContain(secret);
    });

    it("renders a complete 1200x630 PNG with public cache headers", async () => {
        mockMarketSuccess();
        await expectPng(
            await GET(
                new Request(
                    `http://localhost/auction/items/${item.id}/preview`
                ),
                {
                    params: Promise.resolve({ itemId: item.id }),
                }
            )
        );
    });

    it.each([longestItem, punctuationItem])(
        "renders catalog name variants: $name",
        async catalogItem => {
            jest.mocked(getCachedCurrentItemMarket).mockRejectedValue(
                new Error("offline")
            );
            jest.mocked(getCachedRecentItemSales).mockRejectedValue(
                new Error("offline")
            );
            await expectPng(
                await GET(
                    new Request(
                        `http://localhost/auction/items/${catalogItem.id}/preview`
                    ),
                    { params: Promise.resolve({ itemId: catalogItem.id }) }
                )
            );
        }
    );

    it("renders an unknown ID generically without market calls", async () => {
        await expectPng(
            await GET(
                new Request(
                    "http://localhost/auction/items/UNKNOWN_SECRET_ID/preview"
                ),
                { params: Promise.resolve({ itemId: "UNKNOWN_SECRET_ID" }) }
            )
        );
        expect(getCachedCurrentItemMarket).not.toHaveBeenCalled();
        expect(getCachedRecentItemSales).not.toHaveBeenCalled();
    });

    it("materializes rendering inside the fallback boundary", async () => {
        const spy = jest
            .spyOn(Response.prototype, "arrayBuffer")
            .mockRejectedValueOnce(new Error("renderer failed"));

        const response = await GET(
            new Request("http://localhost/auction/items/UNKNOWN/preview"),
            { params: Promise.resolve({ itemId: "UNKNOWN" }) }
        );
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
        await expectPng(response);
    });
});
