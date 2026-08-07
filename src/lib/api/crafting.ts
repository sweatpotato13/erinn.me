import type { CraftingItem, Material } from "@/types";

import { fetchItemPriceSummary, type PriceSummaryResponse } from "./auction";

export type PricedMaterial = Material & {
    unitPrice: number;
    availableQuantity: number;
    totalPrice: number;
    isMarketPrice: boolean;
    priceError?: string;
};

export type PricedCraftingItem = Omit<CraftingItem, "materials"> & {
    materials: PricedMaterial[];
};

export type SummaryResult =
    | { summary: PriceSummaryResponse; error?: never }
    | { summary?: never; error: string };

function toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "가격 조회에 실패했습니다.";
}

export async function fetchPriceSummaries(
    names: Iterable<string>,
    concurrency = 4,
    fetchSummary = fetchItemPriceSummary
): Promise<Map<string, SummaryResult>> {
    const uniqueNames = Array.from(new Set(names));
    const results = new Map<string, SummaryResult>();
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < uniqueNames.length) {
            const name = uniqueNames[nextIndex++];
            try {
                results.set(name, { summary: await fetchSummary(name) });
            } catch (error) {
                results.set(name, { error: toErrorMessage(error) });
            }
        }
    }

    const workerCount = Math.min(Math.max(1, concurrency), uniqueNames.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
}

export function priceMaterial(
    material: Material,
    result?: SummaryResult
): PricedMaterial {
    if (material.price > 0) {
        return {
            ...material,
            unitPrice: material.price,
            availableQuantity: material.quantity,
            totalPrice: material.quantity * material.price,
            isMarketPrice: false,
        };
    }

    if (!result?.summary) {
        return {
            ...material,
            unitPrice: 0,
            availableQuantity: 0,
            totalPrice: 0,
            isMarketPrice: true,
            priceError: result?.error ?? "가격 조회에 실패했습니다.",
        };
    }

    const { minPrice, availableQuantity } = result.summary;
    return {
        ...material,
        unitPrice: minPrice,
        availableQuantity,
        totalPrice: Math.min(material.quantity, availableQuantity) * minPrice,
        isMarketPrice: true,
    };
}

export function applyPriceSummaries(
    items: CraftingItem[] | PricedCraftingItem[],
    results: Map<string, SummaryResult>
): PricedCraftingItem[] {
    return items.map(item => ({
        ...item,
        materials: item.materials.map(material => {
            const source: Material = {
                name: material.name,
                quantity: material.quantity,
                price:
                    "isMarketPrice" in material && material.isMarketPrice
                        ? 0
                        : material.price,
                imageUrl: material.imageUrl,
            };
            return results.has(material.name)
                ? priceMaterial(source, results.get(material.name))
                : "unitPrice" in material
                  ? material
                  : priceMaterial(source);
        }),
    }));
}

export async function loadCraftingPrices(
    items: CraftingItem[],
    concurrency = 4,
    fetchSummary = fetchItemPriceSummary
): Promise<PricedCraftingItem[]> {
    const marketNames = items.flatMap(item =>
        item.materials
            .filter(material => material.price === 0)
            .map(material => material.name)
    );
    const results = await fetchPriceSummaries(
        marketNames,
        concurrency,
        fetchSummary
    );
    return applyPriceSummaries(items, results);
}
