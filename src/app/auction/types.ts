import type { AuctionHistoryItem } from "@/lib/schemas/nexon";

export type Favorite = { itemName: string; category: string };

export type ItemOption = {
    option_type: string;
    option_sub_type?: string | null;
    option_value: string;
    option_value2?: string | null;
    option_desc?: string | null;
};

export type AuctionItem = {
    item_name: string;
    item_display_name: string;
    item_count: number;
    auction_price_per_unit: number;
    date_auction_expire: string;
    item_option?: ItemOption[] | null;
};

export type AuctionSummary = {
    lowestUnitPrice: number;
    medianUnitPrice: number;
    listingCount: number;
    totalQuantity: number;
};

export interface AuctionSale extends AuctionHistoryItem {
    [key: string]: unknown;
}

export interface RecentSalesSummary {
    transactionCount: number;
    totalQuantity: number;
    medianUnitPrice: number | null;
}

export interface RecentSalesState {
    sales: AuctionSale[];
    summary: RecentSalesSummary | null;
    hasMore: boolean;
    refreshedAt: string | null;
    queriedItemName: string | null;
    errorMessage: string | null;
    loading: boolean;
}

export interface RecentSalesModel extends RecentSalesState {
    search: (itemName: string) => Promise<void>;
}

export type SortDirection = "asc" | "desc" | null;
