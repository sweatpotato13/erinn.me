import { useEffect, useRef, useState } from "react";

import type {
    AuctionItem,
    AuctionSummary,
    SortDirection,
} from "@/app/auction/types";
import { categories } from "@/constant/categories";
import { prepareAuctionResults } from "@/lib/auction-market";
import {
    appendAuctionOptionFilterQuery,
    type AuctionOptionFilters,
    AuctionOptionFiltersSchema,
    hasAuctionOptionFilters,
} from "@/lib/auction-options";

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
// ponytail: Bound anomalous cursor chains; fail closed instead of publishing partial results.
const MAX_FILTER_BATCHES = 100;

type AuctionSearchResponse = {
    items: Array<Omit<AuctionItem, "listingId">>;
    hasMore: boolean;
    nextCursor?: string | null;
    searchMode?: "fallback";
    evaluation?: {
        scannedCount: number;
        unevaluableCount: number;
    };
};

export type AuctionOptionEvaluation = {
    scannedCount: number;
    unevaluableCount: number;
    sourceComplete: true;
};

export { prepareAuctionResults } from "@/lib/auction-market";

type PreparedAuctionResults = {
    items: AuctionItem[];
    summary: AuctionSummary | null;
};

async function requestItems(
    itemName: string,
    category: string,
    signal: AbortSignal,
    filters: AuctionOptionFilters,
    cursor?: string,
    searchMode?: "fallback"
) {
    let endpoint: string;
    let params: URLSearchParams;
    if (category !== categories[0]) {
        endpoint = "/api/auction";
        params = new URLSearchParams({ auction_item_category: category });
        if (itemName !== "") params.set("item_name", itemName);
    } else {
        if (itemName === "") throw new Error(EMPTY_SEARCH_ERROR);
        endpoint = "/api/auction/keyword-search";
        params = new URLSearchParams({ keyword: itemName });
    }
    appendAuctionOptionFilterQuery(params, filters);
    if (cursor) params.set("cursor", cursor);
    if (searchMode) params.set("search_mode", searchMode);
    return fetch(`${endpoint}?${params}`, { signal });
}

type SearchActions = {
    isActive: () => boolean;
    commit: (
        results: PreparedAuctionResults & {
            hasMore: boolean;
            refreshedAt: string;
            optionEvaluation: AuctionOptionEvaluation | null;
        }
    ) => void;
    fail: (message: string) => void;
    finish: () => void;
};

async function executeSearch(
    itemName: string,
    category: string,
    filters: AuctionOptionFilters,
    searchId: number,
    controller: AbortController,
    actions: SearchActions
) {
    try {
        const filtered = hasAuctionOptionFilters(filters);
        const rawItems: Array<Omit<AuctionItem, "listingId">> = [];
        const seenCursors = new Set<string>();
        let cursor: string | undefined;
        let searchMode: AuctionSearchResponse["searchMode"];
        let hasMore = false;
        let scannedCount = 0;
        let unevaluableCount = 0;
        let batchCount = 0;

        do {
            if (filtered && batchCount >= MAX_FILTER_BATCHES) {
                throw new Error("경매장 페이지가 안전 한도를 초과했습니다.");
            }
            batchCount++;
            const response = await requestItems(
                itemName,
                category,
                controller.signal,
                filters,
                cursor,
                searchMode
            );
            if (!response.ok) throw new Error("네트워크 오류가 발생했습니다.");
            const value: unknown = await response.json();
            const data = filtered
                ? parseFilteredSearchResponse(value)
                : (value as AuctionSearchResponse);
            if (!actions.isActive()) return;
            rawItems.push(...data.items);
            hasMore = data.hasMore;
            searchMode = data.searchMode;
            if (!filtered) break;
            scannedCount += data.evaluation!.scannedCount;
            unevaluableCount += data.evaluation!.unevaluableCount;
            if (!hasMore) break;
            const nextCursor = data.nextCursor;
            if (!nextCursor || seenCursors.has(nextCursor)) {
                throw new Error("잘못된 경매장 페이지 응답입니다.");
            }
            seenCursors.add(nextCursor);
            cursor = nextCursor;
        } while (hasMore);

        const items = rawItems.map((item, index) => ({
            ...item,
            listingId: `${searchId}-${index}`,
        }));
        if (!actions.isActive()) return;
        actions.commit({
            ...prepareAuctionResults(items),
            hasMore: filtered ? false : hasMore,
            refreshedAt: new Date().toISOString(),
            optionEvaluation: filtered
                ? {
                      scannedCount,
                      unevaluableCount,
                      sourceComplete: true,
                  }
                : null,
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

function isNonNegativeInteger(value: unknown): value is number {
    return Number.isInteger(value) && (value as number) >= 0;
}

function parseFilteredSearchResponse(value: unknown): AuctionSearchResponse {
    if (!value || typeof value !== "object")
        throw new Error("잘못된 경매장 검색 응답입니다.");
    const response = value as Record<string, unknown>;
    const evaluation = response.evaluation as
        Record<string, unknown> | undefined;
    if (
        !Array.isArray(response.items) ||
        typeof response.hasMore !== "boolean" ||
        (response.nextCursor !== null &&
            typeof response.nextCursor !== "string") ||
        (response.searchMode !== undefined &&
            response.searchMode !== "fallback") ||
        !evaluation ||
        !isNonNegativeInteger(evaluation.scannedCount) ||
        !isNonNegativeInteger(evaluation.unevaluableCount)
    ) {
        throw new Error("잘못된 경매장 검색 응답입니다.");
    }
    return response as AuctionSearchResponse;
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
    const [optionEvaluation, setOptionEvaluation] =
        useState<AuctionOptionEvaluation | null>(null);
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
        setOptionEvaluation(null);
        setErrorMessage(null);
        setLoading(false);
        setSortDirection(null);
    };

    const search = async (
        itemName: string,
        category: string,
        filters: AuctionOptionFilters = {}
    ) => {
        const sequence = ++sequenceRef.current;
        activeControllerRef.current?.abort();
        const parsedFilters = AuctionOptionFiltersSchema.safeParse(filters);
        if (!parsedFilters.success) {
            activeControllerRef.current = null;
            setLoading(false);
            setItems([]);
            setSummary(null);
            setHasMore(false);
            setRefreshedAt(null);
            setOptionEvaluation(null);
            setSortDirection(null);
            setErrorMessage(
                parsedFilters.error.issues[0]?.message ??
                    "장비 옵션 필터가 올바르지 않습니다."
            );
            return;
        }
        const controller = new AbortController();
        activeControllerRef.current = controller;
        setLoading(true);
        setItems([]);
        setSummary(null);
        setHasMore(false);
        setRefreshedAt(null);
        setOptionEvaluation(null);
        setSortDirection(null);
        return executeSearch(
            itemName,
            category,
            parsedFilters.data,
            sequence,
            controller,
            {
                isActive: () => sequence === sequenceRef.current,
                commit: results => {
                    setItems(results.items);
                    setSummary(results.summary);
                    setHasMore(results.hasMore);
                    setRefreshedAt(results.refreshedAt);
                    setOptionEvaluation(results.optionEvaluation);
                    setErrorMessage(null);
                },
                fail: setErrorMessage,
                finish: () => {
                    activeControllerRef.current = null;
                    setLoading(false);
                },
            }
        );
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
        optionEvaluation,
        errorMessage,
        loading,
        sortDirection,
        reset,
        search,
        sortByPrice,
    };
}
