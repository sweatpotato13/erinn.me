import { useEffect, useRef, useState } from "react";

import type { AuctionItem, SortDirection } from "@/app/auction/types";
import { categories } from "@/constant/categories";

/**
 * Requests auction items filtered by category and, when provided, item name.
 *
 * @param itemName - The item name or keyword used to filter results.
 * @param category - The auction category used to select the search endpoint.
 * @returns The response from the auction API.
 */
const EMPTY_SEARCH_ERROR = "아이템명 또는 카테고리를 선택해주세요.";
const REQUEST_ERROR =
    "아이템을 불러오는 중 오류가 발생했습니다. 아이템명 입력 시 아이템의 이름을 정확히 입력해주세요.";

async function requestItems(
    itemName: string,
    category: string,
    signal: AbortSignal
) {
    if (category !== categories[0]) {
        const params = new URLSearchParams({ auction_item_category: category });
        if (itemName !== "") params.set("item_name", itemName);
        return fetch(`/api/auction?${params}`, { signal });
    }
    if (itemName !== "") {
        const params = new URLSearchParams({ keyword: itemName });
        return fetch(`/api/auction/keyword-search?${params}`, { signal });
    }
    throw new Error(EMPTY_SEARCH_ERROR);
}

type SearchActions = {
    isActive: () => boolean;
    commit: (items: AuctionItem[]) => void;
    fail: (message: string) => void;
    finish: () => void;
};

async function executeSearch(
    itemName: string,
    category: string,
    controller: AbortController,
    actions: SearchActions
) {
    try {
        const response = await requestItems(
            itemName,
            category,
            controller.signal
        );
        if (!response.ok) throw new Error("네트워크 오류가 발생했습니다.");
        const data = (await response.json()) as { items: AuctionItem[] };
        if (!actions.isActive()) return;
        data.items.sort(
            (a, b) => a.auction_price_per_unit - b.auction_price_per_unit
        );
        actions.commit(data.items);
    } catch (error) {
        if (controller.signal.aborted || !actions.isActive()) return;
        const isValidationError =
            error instanceof Error && error.message === EMPTY_SEARCH_ERROR;
        if (!isValidationError) {
            console.error("API 호출 중 오류가 발생했습니다:", error);
        }
        actions.fail(isValidationError ? EMPTY_SEARCH_ERROR : REQUEST_ERROR);
    } finally {
        if (actions.isActive()) actions.finish();
    }
}

/**
 * Manages auction item searches, loading and error state, and unit-price sorting.
 *
 * @returns The current auction items, error message, loading state, sort direction, and operations for searching and sorting items.
 */
export function useAuctionSearch() {
    const [items, setItems] = useState<AuctionItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const sequenceRef = useRef(0);
    const activeControllerRef = useRef<AbortController | null>(null);

    useEffect(
        () => () => {
            sequenceRef.current += 1;
            activeControllerRef.current?.abort();
        },
        []
    );

    const search = async (itemName: string, category: string) => {
        const sequence = ++sequenceRef.current;
        activeControllerRef.current?.abort();
        const controller = new AbortController();
        activeControllerRef.current = controller;
        setLoading(true);
        setItems([]);
        setSortDirection(null);
        return executeSearch(itemName, category, controller, {
            isActive: () => sequence === sequenceRef.current,
            commit: nextItems => {
                setItems(nextItems);
                setErrorMessage(null);
            },
            fail: setErrorMessage,
            finish: () => {
                activeControllerRef.current = null;
                setLoading(false);
            },
        });
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
