export function parseMaterialInteger(value: string): number | null {
    if (!/^\d{1,16}$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
}

export function safeMaterialInteger(value: number): number {
    if (!Number.isSafeInteger(value) || value < 0)
        throw new Error(
            "수량·금액이 안전하게 계산할 수 있는 범위를 넘었습니다."
        );
    return value;
}

export function allocateMaterialStock(required: number, owned: number) {
    safeMaterialInteger(required);
    safeMaterialInteger(owned);
    return {
        usedOwned: Math.min(required, owned),
        missing: Math.max(0, required - owned),
    };
}
import { z } from "zod";

export const MaterialQuoteSchema = z
    .object({
        minPrice: z.number().finite().nonnegative(),
        averagePrice: z.number().finite().nonnegative(),
        availableQuantity: z.number().finite().nonnegative(),
        isComplete: z.boolean(),
        fetchedAt: z.iso.datetime({ offset: true }).optional(),
        observedAt: z.iso.datetime({ offset: true }),
    })
    .strict();
export type MaterialQuote = z.infer<typeof MaterialQuoteSchema>;

export function materialPrice(
    item: { id: number; name: string; searchable: boolean; ambiguous: boolean },
    manual: Record<string, string>,
    quotes: Record<string, MaterialQuote>
): string {
    if (Object.hasOwn(manual, item.id)) return manual[item.id];
    const quote =
        item.searchable && !item.ambiguous ? quotes[item.name] : undefined;
    return quote &&
        quote.availableQuantity > 0 &&
        Number.isSafeInteger(quote.minPrice)
        ? String(quote.minPrice)
        : "";
}
