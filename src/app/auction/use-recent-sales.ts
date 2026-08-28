import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import * as z from "zod";

import type { RecentSalesModel, RecentSalesState } from "@/app/auction/types";
import { prepareRecentSales } from "@/lib/auction-market";
import { AuctionHistoryResponseSchema } from "@/lib/schemas/nexon";

const REQUEST_ERROR = "최근 완료 거래를 불러오는 중 오류가 발생했습니다.";
const EXACT_ITEM_NAME_NOTICE =
    "최근 완료 거래는 정확한 아이템명으로만 조회할 수 있습니다. 검색 제안에서 아이템을 선택해 주세요.";
const RecentSalesResponseSchema = z.object({
    sales: AuctionHistoryResponseSchema.shape.auction_history,
    hasMore: z.boolean(),
    fetchedAt: z.iso.datetime(),
});
const INITIAL_RECENT_SALES_STATE: RecentSalesState = {
    sales: [],
    summary: null,
    hasMore: false,
    refreshedAt: null,
    queriedItemName: null,
    noticeMessage: null,
    errorMessage: null,
    loading: false,
};

interface RecentSalesRequest {
    sequence: number;
    controller: AbortController | null;
}

export { prepareRecentSales } from "@/lib/auction-market";

async function fetchRecentSales(itemName: string, signal: AbortSignal) {
    const params = new URLSearchParams({ item_name: itemName });
    const response = await fetch(`/api/auction/history?${params}`, { signal });
    if (response.status === 422) return null;
    if (!response.ok) throw new Error("Recent sales request failed");
    return RecentSalesResponseSchema.parse(await response.json());
}

async function searchRecentSales(
    itemName: string,
    request: RecentSalesRequest,
    setState: Dispatch<SetStateAction<RecentSalesState>>
): Promise<void> {
    const sequence = ++request.sequence;
    request.controller?.abort();
    request.controller = null;
    const normalizedItemName = itemName.trim();
    setState({
        ...INITIAL_RECENT_SALES_STATE,
        queriedItemName: normalizedItemName || null,
        loading: !!normalizedItemName,
    });
    if (!normalizedItemName) return;

    const controller = new AbortController();
    request.controller = controller;
    try {
        const data = await fetchRecentSales(
            normalizedItemName,
            controller.signal
        );
        if (sequence !== request.sequence) return;
        if (!data) {
            setState(current => ({
                ...current,
                noticeMessage: EXACT_ITEM_NAME_NOTICE,
            }));
            return;
        }
        setState(current => ({
            ...current,
            ...prepareRecentSales(data.sales),
            hasMore: data.hasMore,
            refreshedAt: data.fetchedAt,
        }));
    } catch (error) {
        if (controller.signal.aborted || sequence !== request.sequence) return;
        console.error("최근 완료 거래 API 호출 중 오류가 발생했습니다:", error);
        setState(current => ({ ...current, errorMessage: REQUEST_ERROR }));
    } finally {
        if (sequence === request.sequence) {
            request.controller = null;
            setState(current => ({ ...current, loading: false }));
        }
    }
}

/**
 * Manages completed-sale requests independently from current auction listings.
 *
 * @returns Recent sales, their summary and request state, plus a search action.
 */
export function useRecentSales(): RecentSalesModel {
    const [state, setState] = useState(INITIAL_RECENT_SALES_STATE);
    const request = useRef<RecentSalesRequest>({
        sequence: 0,
        controller: null,
    });

    useEffect(
        () => () => {
            request.current.sequence += 1;
            request.current.controller?.abort();
        },
        []
    );

    const search = (itemName: string) =>
        searchRecentSales(itemName, request.current, setState);

    return { ...state, search };
}
