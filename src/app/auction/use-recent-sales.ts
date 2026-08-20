import { useEffect, useRef, useState } from "react";

import type { AuctionSale, RecentSalesSummary } from "@/app/auction/types";

const REQUEST_ERROR = "최근 완료 거래를 불러오는 중 오류가 발생했습니다.";

interface AuctionHistoryResponse {
    sales: AuctionSale[];
    hasMore: boolean;
}

interface PreparedRecentSales {
    sales: AuctionSale[];
    summary: RecentSalesSummary;
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

/**
 * Manages completed-sale requests independently from current auction listings.
 *
 * @returns Recent sales, their summary and request state, plus a search action.
 */
export function useRecentSales() {
    const [sales, setSales] = useState<AuctionSale[]>([]);
    const [summary, setSummary] = useState<RecentSalesSummary | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
    const [queriedItemName, setQueriedItemName] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const sequenceRef = useRef(0);
    const activeControllerRef = useRef<AbortController | null>(null);

    useEffect(
        () => () => {
            sequenceRef.current += 1;
            activeControllerRef.current?.abort();
        },
        []
    );

    const search = async (itemName: string) => {
        const sequence = ++sequenceRef.current;
        activeControllerRef.current?.abort();
        activeControllerRef.current = null;
        setSales([]);
        setSummary(null);
        setHasMore(false);
        setRefreshedAt(null);
        setErrorMessage(null);

        const normalizedItemName = itemName.trim();
        if (!normalizedItemName) {
            setQueriedItemName(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        activeControllerRef.current = controller;
        setQueriedItemName(normalizedItemName);
        setLoading(true);

        try {
            const params = new URLSearchParams({
                item_name: normalizedItemName,
            });
            const response = await fetch(`/api/auction/history?${params}`, {
                signal: controller.signal,
            });
            if (!response.ok) throw new Error("Recent sales request failed");
            const data = (await response.json()) as AuctionHistoryResponse;
            if (sequence !== sequenceRef.current) return;
            const prepared = prepareRecentSales(data.sales);
            setSales(prepared.sales);
            setSummary(prepared.summary);
            setHasMore(data.hasMore);
            setRefreshedAt(new Date().toISOString());
        } catch (error) {
            if (controller.signal.aborted || sequence !== sequenceRef.current) {
                return;
            }
            console.error(
                "최근 완료 거래 API 호출 중 오류가 발생했습니다:",
                error
            );
            setErrorMessage(REQUEST_ERROR);
        } finally {
            if (sequence === sequenceRef.current) {
                activeControllerRef.current = null;
                setLoading(false);
            }
        }
    };

    return {
        sales,
        summary,
        hasMore,
        refreshedAt,
        queriedItemName,
        errorMessage,
        loading,
        search,
    };
}
