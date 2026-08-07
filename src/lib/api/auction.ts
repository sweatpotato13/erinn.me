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

/**
 * Determines whether a value is a finite number greater than or equal to zero.
 *
 * @returns `true` if the value is a finite number greater than or equal to zero, `false` otherwise.
 */
function isFiniteNonNegative(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Validates and converts an unknown value into a price summary.
 *
 * @param value - The value to validate.
 * @returns The validated price summary.
 * @throws Error if the value does not contain valid price, quantity, and completion data.
 */
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

/**
 * Fetches and validates the price summary for an item.
 *
 * @param itemName - The item name to query; it must contain non-whitespace characters.
 * @returns The validated price summary.
 * @throws Error if the item name is blank, the request fails, or the response is malformed.
 */
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

/**
 * Retrieves pricing and completion information for an item.
 *
 * @param itemName - The name of the item to price
 * @returns The item's minimum unit price, average price, and completion status; zero-valued pricing with completion marked true when the item name is missing or the request fails
 */
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

/**
 * Retrieves item pricing and calculates the total cost for the desired quantity.
 *
 * @param itemName - The item name to price
 * @param desiredQuantity - The quantity to price
 * @returns Pricing, available quantity, and completion status; zero-valued pricing when the item name is blank or the request fails
 */
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
