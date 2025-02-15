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

async function fetchAllAuctionPages(params: {
    item_name?: string;
    auction_item_category?: string;
}): Promise<AuctionItem[]> {
    let allItems: AuctionItem[] = [];
    let nextCursor = "";
    let prevCursor = ""; // 이전 cursor 저장
    let retryCount = 0;
    const MAX_RETRIES = 2;

    try {
        do {
            try {
                const queryParams = new URLSearchParams();
                if (params.item_name) {
                    queryParams.append("item_name", params.item_name);
                }
                if (params.auction_item_category) {
                    queryParams.append(
                        "auction_item_category",
                        params.auction_item_category
                    );
                }
                if (nextCursor) {
                    queryParams.append("cursor", nextCursor);
                }

                const response = await fetch(
                    `/api/auction?${queryParams.toString()}`
                );
                if (!response.ok) {
                    throw new Error("경매장 API 호출 중 오류가 발생했습니다.");
                }

                const data: AuctionResponse = await response.json();

                // 새로운 아이템이 없거나 이전과 같은 cursor가 반환되면 중단
                if (
                    data.auction_item.length === 0 ||
                    data.next_cursor === prevCursor
                ) {
                    break;
                }

                allItems = [...allItems, ...data.auction_item];
                prevCursor = nextCursor; // 현재 cursor를 이전 cursor로 저장
                nextCursor = data.next_cursor;
                retryCount = 0;
            } catch (error) {
                retryCount++;
                if (retryCount >= MAX_RETRIES || allItems.length === 0) {
                    throw error;
                }
                console.warn(
                    `데이터 조회 중 오류 발생 (${retryCount}번째 시도): `,
                    error
                );
                break;
            }
        } while (nextCursor);

        return allItems;
    } catch (error) {
        if (allItems.length > 0) {
            console.warn("일부 데이터만 조회되었습니다:", error);
            return allItems;
        }
        throw error;
    }
}

export async function getItemPrice(
    itemName: string
): Promise<ItemPriceResponse> {
    try {
        const allItems = await fetchAllAuctionPages({ item_name: itemName });

        if (allItems.length === 0) {
            return {
                unitPrice: 0,
                averagePrice: 0,
            };
        }

        const prices = allItems.map(item => item.auction_price_per_unit);
        const unitPrice = Math.min(...prices);
        const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

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

export async function searchAuctionItems(params: {
    item_name?: string;
    auction_item_category?: string;
}): Promise<AuctionItem[]> {
    return fetchAllAuctionPages(params);
}
