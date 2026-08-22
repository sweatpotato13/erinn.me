import { useState } from "react";

import type { AuctionItem } from "@/app/auction/types";

export const MAX_COMPARISON_ITEMS = 4;

export interface ComparisonSelection {
    items: AuctionItem[];
    notice: string | null;
}

const EMPTY_SELECTION: ComparisonSelection = { items: [], notice: null };

export function useComparisonSelection() {
    const [comparison, setComparison] =
        useState<ComparisonSelection>(EMPTY_SELECTION);
    const toggleComparison = (item: AuctionItem) =>
        setComparison(current => {
            if (current.items.includes(item)) {
                return {
                    items: current.items.filter(selected => selected !== item),
                    notice: null,
                };
            }
            if (current.items.length >= MAX_COMPARISON_ITEMS) {
                return {
                    ...current,
                    notice: `최대 ${MAX_COMPARISON_ITEMS}개까지 비교할 수 있습니다.`,
                };
            }
            return { items: [...current.items, item], notice: null };
        });
    const removeComparison = (item: AuctionItem) =>
        setComparison(current => ({
            items: current.items.filter(selected => selected !== item),
            notice: null,
        }));
    const clearComparison = () => setComparison(EMPTY_SELECTION);

    return {
        comparison,
        toggleComparison,
        removeComparison,
        clearComparison,
    };
}
