export interface ItemPriceResponse {
    unitPrice: number;
    averagePrice: number;
    isComplete: boolean;
}

export interface ItemPriceWithQuantityResponse {
    totalPrice: number;
    unitPrice: number;
    averagePrice: number;
    availableQuantity: number;
    isComplete: boolean;
}

export interface AuctionItemOption {
    option_type: string;
    option_sub_type: string;
    option_value: string;
    option_value2: string;
    option_desc: string;
}

export interface AuctionItem {
    item_name: string;
    item_display_name: string;
    item_count: number;
    auction_price_per_unit: number;
    date_auction_expire: string;
    item_option?: AuctionItemOption[];
}

export interface AuctionResponse {
    items: AuctionItem[];
    hasMore: boolean;
    nextCursor: string | null;
}

interface PriceSummaryResponse {
    minPrice: number;
    averagePrice: number;
    availableQuantity: number;
    isComplete: boolean;
}

export async function getItemPrice(
    itemName: string
): Promise<ItemPriceResponse> {
    try {
        if (!itemName) {
            return { unitPrice: 0, averagePrice: 0, isComplete: true };
        }

        const url = `/api/auction/price-summary?item_name=${encodeURIComponent(itemName).replace(/\+/g, "%2B")}`;
        const response = await fetch(url);

        if (!response.ok) {
            return { unitPrice: 0, averagePrice: 0, isComplete: true };
        }

        const data: PriceSummaryResponse = await response.json();

        return {
            unitPrice: data.minPrice || 0,
            averagePrice: data.averagePrice || 0,
            isComplete: data.isComplete ?? true,
        };
    } catch (error) {
        console.error("Error fetching item price:", error);
        return { unitPrice: 0, averagePrice: 0, isComplete: true };
    }
}

export async function getItemPriceWithQuantity(
    itemName: string,
    desiredQuantity: number
): Promise<ItemPriceWithQuantityResponse> {
    try {
        if (!itemName) {
            return {
                totalPrice: 0,
                unitPrice: 0,
                averagePrice: 0,
                availableQuantity: 0,
                isComplete: true,
            };
        }

        const url = `/api/auction/price-summary?item_name=${encodeURIComponent(itemName).replace(/\+/g, "%2B")}`;
        const response = await fetch(url);

        if (!response.ok) {
            return {
                totalPrice: 0,
                unitPrice: 0,
                averagePrice: 0,
                availableQuantity: 0,
                isComplete: true,
            };
        }

        const data: PriceSummaryResponse = await response.json();

        const totalPrice =
            Math.min(desiredQuantity, data.availableQuantity) * data.minPrice;

        return {
            totalPrice,
            unitPrice: data.minPrice || 0,
            averagePrice: data.averagePrice || 0,
            availableQuantity: data.availableQuantity,
            isComplete: data.isComplete ?? true,
        };
    } catch (error) {
        console.error("Error fetching item price:", error);
        return {
            totalPrice: 0,
            unitPrice: 0,
            averagePrice: 0,
            availableQuantity: 0,
            isComplete: true,
        };
    }
}
