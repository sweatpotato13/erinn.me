import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import * as z from "zod";

import type {
    AuctionSale,
    RecentSalesModel,
    RecentSalesState,
    RecentSalesSummary,
} from "@/app/auction/types";
import { AuctionHistoryResponseSchema } from "@/lib/schemas/nexon";

const REQUEST_ERROR = "최근 완료 거래를 불러오는 중 오류가 발생했습니다.";
const RecentSalesResponseSchema = z.object({
    sales: AuctionHistoryResponseSchema.shape.auction_history,
    hasMore: z.boolean(),
});
const INITIAL_RECENT_SALES_STATE: RecentSalesState = {
    sales: [],
    summary: null,
    hasMore: false,
    refreshedAt: null,
    queriedItemName: null,
    errorMessage: null,
    loading: false,
};

interface PreparedRecentSales {
    sales: AuctionSale[];
    summary: RecentSalesSummary;
}

interface RecentSalesRequest {
    sequence: number;
    controller: AbortController | null;
}

export function prepareRecentSales(sales: AuctionSale[]): PreparedRecentSales {
    const validSales = sales
        .filter(
            sale =>
                Number.isFinite(sale.auction_price_per_unit) &&
                sale.auction_price_per_unit > 0 &&
                Number.isFinite(sale.item_count) &&
                sale.item_count > 0 &&
                Number.isFinite(Date.parse(sale.date_auction_buy)) &&
                sale.auction_buy_id.trim().length > 0
        )
        .sort(
            (a, b) =>
                Date.parse(b.date_auction_buy) -
                    Date.parse(a.date_auction_buy) ||
                a.auction_buy_id.localeCompare(b.auction_buy_id)
        );
    const prices = validSales
        .map(sale => sale.auction_price_per_unit)
        .sort((a, b) => a - b);
    const middle = Math.floor(prices.length / 2);
    const medianUnitPrice =
        prices.length < 3
            ? null
            : prices.length % 2 === 1
              ? prices[middle]
              : (prices[middle - 1] + prices[middle]) / 2;

    return {
        sales: validSales,
        summary: {
            transactionCount: validSales.length,
            totalQuantity: validSales.reduce(
                (sum, sale) => sum + sale.item_count,
                0
            ),
            medianUnitPrice,
        },
    };
}

async function fetchRecentSales(itemName: string, signal: AbortSignal) {
    const params = new URLSearchParams({ item_name: itemName });
    const response = await fetch(`/api/auction/history?${params}`, { signal });
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
        setState(current => ({
            ...current,
            ...prepareRecentSales(data.sales),
            hasMore: data.hasMore,
            refreshedAt: new Date().toISOString(),
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
