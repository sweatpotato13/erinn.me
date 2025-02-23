export interface ItemPriceResponse {
    unitPrice: number;
    averagePrice: number;
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
