import { render, screen } from "@testing-library/react";

import AuctionItemPage, {
    CurrentMarketPanel,
    generateMetadata,
    RecentSalesPanel,
} from "@/app/auction/items/[itemId]/page";
import AuctionItemsPage from "@/app/auction/items/page";
import {
    getCachedCurrentItemMarket,
    getCachedRecentItemSales,
} from "@/lib/api/auction-market";
import { getAuctionCatalogItems } from "@/lib/auction-item-catalog";

jest.mock("@/lib/api/auction-market", () => ({
    getCachedCurrentItemMarket: jest.fn(),
    getCachedRecentItemSales: jest.fn(),
}));

jest.mock("next/navigation", () => ({
    notFound: jest.fn(() => {
        throw new Error("NEXT_NOT_FOUND");
    }),
}));

const item = getAuctionCatalogItems()[0];
const fetchedAt = "2026-08-28T10:00:00.000Z";
const sale = (id: string, price: number) => ({
    item_name: item.name,
    item_display_name: item.name,
    item_count: 2,
    auction_price_per_unit: price,
    date_auction_buy: `2026-08-28T0${id}:00:00.000Z`,
    auction_buy_id: id,
    item_option: [],
});

describe("auction item pages", () => {
    beforeEach(() => jest.clearAllMocks());

    it("renders a crawlable link for every catalog item", () => {
        render(<AuctionItemsPage />);
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(500);
        expect(links[0]).toHaveAttribute("href", `/auction/items/${item.id}`);
    });

    it("builds stable metadata without fetching live market data", async () => {
        await expect(
            generateMetadata({ params: Promise.resolve({ itemId: item.id }) })
        ).resolves.toMatchObject({
            title: `${item.name} 경매장 시세`,
            alternates: { canonical: `/auction/items/${item.id}` },
            openGraph: { url: `/auction/items/${item.id}` },
        });
        expect(getCachedCurrentItemMarket).not.toHaveBeenCalled();
        expect(getCachedRecentItemSales).not.toHaveBeenCalled();
    });

    it("rejects non-catalog IDs before any live fetch", async () => {
        await expect(
            AuctionItemPage({
                params: Promise.resolve({ itemId: "UNKNOWN_SAFE_ID" }),
            })
        ).rejects.toThrow("NEXT_NOT_FOUND");
        expect(getCachedCurrentItemMarket).not.toHaveBeenCalled();
        expect(getCachedRecentItemSales).not.toHaveBeenCalled();
    });

    it("labels an incomplete current snapshot as partial", async () => {
        jest.mocked(getCachedCurrentItemMarket).mockResolvedValue({
            minPrice: 100,
            averagePrice: 150,
            availableQuantity: 4,
            listingCount: 2,
            isComplete: false,
            fetchedAt,
        });
        render(await CurrentMarketPanel({ item }));
        expect(screen.getByText("불러온 수량")).toBeInTheDocument();
        expect(screen.getByText(/전체 cursor가 남아/)).toBeInTheDocument();
    });

    it("keeps recent sales visible when current listings fail", async () => {
        jest.mocked(getCachedCurrentItemMarket).mockRejectedValue(
            new Error("offline")
        );
        jest.mocked(getCachedRecentItemSales).mockResolvedValue({
            sales: [sale("1", 100), sale("2", 200), sale("3", 300)],
            hasMore: false,
            fetchedAt,
        });
        const [current, recent] = await Promise.all([
            CurrentMarketPanel({ item }),
            RecentSalesPanel({ item }),
        ]);
        render(
            <>
                {current}
                {recent}
            </>
        );
        expect(
            screen.getByText("현재 매물을 불러오지 못했습니다.")
        ).toBeInTheDocument();
        expect(screen.getAllByText("200 Gold")).not.toHaveLength(0);
    });

    it("renders independent empty and failure states", async () => {
        jest.mocked(getCachedCurrentItemMarket).mockResolvedValue({
            minPrice: 0,
            averagePrice: 0,
            availableQuantity: 0,
            listingCount: 0,
            isComplete: true,
            fetchedAt,
        });
        jest.mocked(getCachedRecentItemSales).mockRejectedValue(
            new Error("offline")
        );
        const [current, recent] = await Promise.all([
            CurrentMarketPanel({ item }),
            RecentSalesPanel({ item }),
        ]);
        render(
            <>
                {current}
                {recent}
            </>
        );
        expect(
            screen.getByText("현재 등록된 매물이 없습니다.")
        ).toBeInTheDocument();
        expect(
            screen.getByText("최근 완료 거래를 불러오지 못했습니다.")
        ).toBeInTheDocument();
    });
});
