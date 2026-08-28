import type {
    AuctionSale,
    AuctionSummary,
    RecentSalesSummary,
} from "@/app/auction/types";

type AuctionListing = {
    auction_price_per_unit: number;
    item_count: number;
};

export function prepareAuctionResults<T extends AuctionListing>(items: T[]) {
    const validItems = items
        .filter(
            item =>
                Number.isFinite(item.auction_price_per_unit) &&
                item.auction_price_per_unit > 0 &&
                Number.isFinite(item.item_count) &&
                item.item_count > 0
        )
        .sort((a, b) => a.auction_price_per_unit - b.auction_price_per_unit);

    if (validItems.length === 0) {
        return { items: validItems, summary: null as AuctionSummary | null };
    }

    const middle = Math.floor(validItems.length / 2);
    const medianUnitPrice =
        validItems.length % 2 === 1
            ? validItems[middle].auction_price_per_unit
            : (validItems[middle - 1].auction_price_per_unit +
                  validItems[middle].auction_price_per_unit) /
              2;

    return {
        items: validItems,
        summary: {
            lowestUnitPrice: validItems[0].auction_price_per_unit,
            medianUnitPrice,
            listingCount: validItems.length,
            totalQuantity: validItems.reduce(
                (sum, item) => sum + item.item_count,
                0
            ),
        } satisfies AuctionSummary,
    };
}

export function prepareRecentSales(sales: AuctionSale[]) {
    const validSales = sales
        .filter(
            sale =>
                Number.isFinite(sale.auction_price_per_unit) &&
                sale.auction_price_per_unit > 0 &&
                Number.isFinite(sale.item_count) &&
                sale.item_count > 0 &&
                Number.isFinite(Date.parse(sale.date_auction_buy)) &&
                sale.auction_buy_id.trim().length > 0
        )
        .sort(
            (a, b) =>
                Date.parse(b.date_auction_buy) -
                    Date.parse(a.date_auction_buy) ||
                a.auction_buy_id.localeCompare(b.auction_buy_id)
        );
    const prices = validSales
        .map(sale => sale.auction_price_per_unit)
        .sort((a, b) => a - b);
    const middle = Math.floor(prices.length / 2);
    const medianUnitPrice =
        prices.length < 3
            ? null
            : prices.length % 2 === 1
              ? prices[middle]
              : (prices[middle - 1] + prices[middle]) / 2;

    return {
        sales: validSales,
        summary: {
            transactionCount: validSales.length,
            totalQuantity: validSales.reduce(
                (sum, sale) => sum + sale.item_count,
                0
            ),
            medianUnitPrice,
        } satisfies RecentSalesSummary,
    };
}
