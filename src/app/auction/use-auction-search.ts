import { useEffect, useRef, useState } from "react";

import type {
    AuctionItem,
    AuctionSummary,
    SortDirection,
} from "@/app/auction/types";
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

type AuctionSearchResponse = {
    items: Array<Omit<AuctionItem, "listingId">>;
    hasMore: boolean;
};

type PreparedAuctionResults = {
    items: AuctionItem[];
    summary: AuctionSummary | null;
};

export function prepareAuctionResults(
    items: AuctionItem[]
): PreparedAuctionResults {
    const validItems = items
        .filter(
            item =>
                Number.isFinite(item.auction_price_per_unit) &&
                item.auction_price_per_unit > 0 &&
                Number.isFinite(item.item_count) &&
                item.item_count > 0
        )
        .sort((a, b) => a.auction_price_per_unit - b.auction_price_per_unit);

    if (validItems.length === 0) return { items: [], summary: null };

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
        },
    };
}

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
    commit: (
        results: PreparedAuctionResults & {
            hasMore: boolean;
            refreshedAt: string;
        }
    ) => void;
    fail: (message: string) => void;
    finish: () => void;
};

async function executeSearch(
    itemName: string,
    category: string,
    searchId: number,
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
        const data = (await response.json()) as AuctionSearchResponse;
        const items = data.items.map((item, index) => ({
            ...item,
            listingId: `${searchId}-${index}`,
        }));
        if (!actions.isActive()) return;
        actions.commit({
            ...prepareAuctionResults(items),
            hasMore: data.hasMore,
            refreshedAt: new Date().toISOString(),
        });
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
    const [summary, setSummary] = useState<AuctionSummary | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
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

    const reset = () => {
        sequenceRef.current += 1;
        activeControllerRef.current?.abort();
        activeControllerRef.current = null;
        setItems([]);
        setSummary(null);
        setHasMore(false);
        setRefreshedAt(null);
        setErrorMessage(null);
        setLoading(false);
        setSortDirection(null);
    };

    const search = async (itemName: string, category: string) => {
        const sequence = ++sequenceRef.current;
        activeControllerRef.current?.abort();
        const controller = new AbortController();
        activeControllerRef.current = controller;
        setLoading(true);
        setItems([]);
        setSummary(null);
        setHasMore(false);
        setRefreshedAt(null);
        setSortDirection(null);
        return executeSearch(itemName, category, sequence, controller, {
            isActive: () => sequence === sequenceRef.current,
            commit: results => {
                setItems(results.items);
                setSummary(results.summary);
                setHasMore(results.hasMore);
                setRefreshedAt(results.refreshedAt);
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
    return {
        items,
        summary,
        hasMore,
        refreshedAt,
        errorMessage,
        loading,
        sortDirection,
        reset,
        search,
        sortByPrice,
    };
}
