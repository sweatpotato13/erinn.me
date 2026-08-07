import { useState } from "react";

import type { AuctionItem, SortDirection } from "@/app/auction/types";
import { categories } from "@/constant/categories";

async function requestItems(itemName: string, category: string) {
    if (category !== categories[0]) {
        const params = new URLSearchParams({ auction_item_category: category });
        if (itemName !== "") params.set("item_name", itemName);
        return fetch(`/api/auction?${params}`);
    }
    if (itemName !== "") {
        const params = new URLSearchParams({ keyword: itemName });
        return fetch(`/api/auction/keyword-search?${params}`);
    }
    return fetch("/api/auction?");
}

export function useAuctionSearch() {
    const [items, setItems] = useState<AuctionItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const search = async (itemName: string, category: string) => {
        setLoading(true);
        setItems([]);
        setSortDirection(null);
        try {
            const response = await requestItems(itemName, category);
            if (!response.ok) throw new Error("네트워크 오류가 발생했습니다.");
            const data = (await response.json()) as { items: AuctionItem[] };
            data.items.sort(
                (a, b) => a.auction_price_per_unit - b.auction_price_per_unit
            );
            setItems(data.items);
            setErrorMessage(null);
        } catch (error) {
            console.error("API 호출 중 오류가 발생했습니다:", error);
            setErrorMessage(
                "아이템을 불러오는 중 오류가 발생했습니다. 아이템명 입력 시 아이템의 이름을 정확히 입력해주세요."
            );
        } finally {
            setLoading(false);
        }
    };
    const sortByPrice = () => {
        const direction = sortDirection === "asc" ? "desc" : "asc";
        setSortDirection(direction);
        setItems(current =>
            [...current].sort((a, b) =>
                direction === "asc"
                    ? a.auction_price_per_unit - b.auction_price_per_unit
                    : b.auction_price_per_unit - a.auction_price_per_unit
            )
        );
    };
    return { items, errorMessage, loading, sortDirection, search, sortByPrice };
}
