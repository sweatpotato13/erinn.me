export interface ItemPriceResponse {
    unitPrice: number;
    averagePrice: number;
}

export interface ItemPriceWithQuantityResponse {
    totalPrice: number;
    unitPrice: number;
    averagePrice: number;
    availableQuantity: number;
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
    auction_item: AuctionItem[];
    next_cursor: string;
}

export async function getItemPrice(
    itemName: string
): Promise<ItemPriceResponse> {
    try {
        let url = "/api/auction?";
        if (itemName !== "") {
            url += `&item_name=${encodeURIComponent(itemName).replace(/\+/g, "%2B")}`;
        }
        const response = await fetch(url);
        const data = await response.json();

        if (data.items === undefined) {
            return {
                unitPrice: 0,
                averagePrice: 0,
            };
        }

        const prices = data.items.map(
            (item: any) => item.auction_price_per_unit
        );
        const unitPrice = Math.min(...prices);
        const averagePrice =
            prices.reduce((a: any, b: any) => a + b, 0) / prices.length;

        return {
            unitPrice: unitPrice || 0,
            averagePrice: averagePrice || 0,
        };
    } catch (error) {
        console.error("아이템 가격 조회 중 오류:", error);
        return {
            unitPrice: 0,
            averagePrice: 0,
        };
    }
}

export async function getItemPriceWithQuantity(
    itemName: string,
    desiredQuantity: number
): Promise<ItemPriceWithQuantityResponse> {
    try {
        let url = "/api/auction?";
        if (itemName !== "") {
            url += `&item_name=${encodeURIComponent(itemName).replace(/\+/g, "%2B")}`;
        }
        const response = await fetch(url);
        const data = await response.json();

        if (data.items === undefined || data.items.length === 0) {
            return {
                totalPrice: 0,
                unitPrice: 0,
                averagePrice: 0,
                availableQuantity: 0,
            };
        }

        // 가격순으로 정렬
        const sortedItems = data.items.sort(
            (a: any, b: any) =>
                a.auction_price_per_unit - b.auction_price_per_unit
        );

        let remainingQuantity = desiredQuantity;
        let totalPrice = 0;
        let availableQuantity = 0;

        // 가장 저렴한 것부터 구매
        for (const item of sortedItems) {
            const quantityToBuy = Math.min(remainingQuantity, item.item_count);
            totalPrice += quantityToBuy * item.auction_price_per_unit;
            availableQuantity += quantityToBuy;
            remainingQuantity -= quantityToBuy;

            if (remainingQuantity <= 0) break;
        }

        const unitPrice = sortedItems[0].auction_price_per_unit;
        const averagePrice =
            sortedItems.reduce(
                (sum: number, item: any) => sum + item.auction_price_per_unit,
                0
            ) / sortedItems.length;

        return {
            totalPrice,
            unitPrice,
            averagePrice,
            availableQuantity,
        };
    } catch (error) {
        console.error("아이템 가격 조회 중 오류:", error);
        return {
            totalPrice: 0,
            unitPrice: 0,
            averagePrice: 0,
            availableQuantity: 0,
        };
    }
}
