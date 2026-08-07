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

export interface PriceSummaryResponse {
    minPrice: number;
    averagePrice: number;
    availableQuantity: number;
    isComplete: boolean;
}

function isFiniteNonNegative(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parsePriceSummary(value: unknown): PriceSummaryResponse {
    if (!value || typeof value !== "object") {
        throw new Error("Malformed price summary response");
    }

    const candidate = value as Record<string, unknown>;
    if (
        !isFiniteNonNegative(candidate.minPrice) ||
        !isFiniteNonNegative(candidate.averagePrice) ||
        !isFiniteNonNegative(candidate.availableQuantity) ||
        typeof candidate.isComplete !== "boolean"
    ) {
        throw new Error("Malformed price summary response");
    }

    return {
        minPrice: candidate.minPrice,
        averagePrice: candidate.averagePrice,
        availableQuantity: candidate.availableQuantity,
        isComplete: candidate.isComplete,
    };
}

export async function fetchItemPriceSummary(
    itemName: string,
    signal?: AbortSignal
): Promise<PriceSummaryResponse> {
    if (!itemName.trim()) {
        throw new Error("Item name is required");
    }

    const params = new URLSearchParams({ item_name: itemName });
    const response = await fetch(`/api/auction/price-summary?${params}`, {
        signal,
    });

    if (!response.ok) {
        throw new Error(`Price summary request failed: ${response.status}`);
    }

    return parsePriceSummary(await response.json());
}

export async function getItemPrice(
    itemName: string
): Promise<ItemPriceResponse> {
    try {
        if (!itemName) {
            return { unitPrice: 0, averagePrice: 0, isComplete: true };
        }

        const data = await fetchItemPriceSummary(itemName);

        return {
            unitPrice: data.minPrice,
            averagePrice: data.averagePrice,
            isComplete: data.isComplete,
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

        const data = await fetchItemPriceSummary(itemName);

        const totalPrice =
            Math.min(desiredQuantity, data.availableQuantity) * data.minPrice;

        return {
            totalPrice,
            unitPrice: data.minPrice,
            averagePrice: data.averagePrice,
            availableQuantity: data.availableQuantity,
            isComplete: data.isComplete,
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
