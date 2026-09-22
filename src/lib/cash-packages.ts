import { calculateAuctionFee, MAX_GOLD } from "@/lib/auction-calculator";

export type PriceState = {
    status: "loading" | "available" | "empty" | "error";
    marketUnitGold: number | null;
    manualUnitGold: number | null;
    fetchedAt: string | null;
    isComplete: boolean;
};

export type CashPackageMarketOption = {
    itemId: string;
    name: string;
    tone?: "blue" | "red";
    tradeUnit: "stack";
};

export type CashPackageItem = CashPackageMarketOption & {
    kind: "item";
    quantity: number;
    sourceName?: string;
    secondary?: string;
    pricing?: "colorVariants";
    coupon?: boolean;
};

export type CashPackageChoice = {
    kind: "choice";
    id: string;
    name: string;
    quantity: number;
    options: CashPackageMarketOption[];
};

export type CashPackageEntry = CashPackageItem | CashPackageChoice;

export type CashPackageProduct = {
    id: string;
    name: string;
    fullName: string;
    cashPrice: number;
    imageUrl: string;
    sourceUrl: string;
    entries: CashPackageEntry[];
};

export type CashPackageCatalog = {
    version: number;
    verifiedAt: string;
    noticeUrl: string;
    products: CashPackageProduct[];
};

export type CashPackageMarketItem = CashPackageMarketOption & {
    pricing?: "colorVariants";
};

export type CashPackageSale = {
    itemId: string;
    quantity: number;
    unitGold: number;
    saleCount: number;
    couponCount: number;
    priced: boolean;
    isCoupon?: boolean;
};

export type PackageResult = {
    cashCost: number;
    goldCost: number | null;
    grossGold: number;
    feeGold: number;
    netGold: number;
    profitGold: number | null;
    profitPercent: number | null;
    unpricedCount: number;
};

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function integer(value: number, min: number, label: string): void {
    if (!Number.isSafeInteger(value) || value < min) {
        throw new Error(`Invalid ${label}`);
    }
}

function safeAdd(left: number, right: number, label: string): number {
    const result = left + right;
    if (!Number.isSafeInteger(result)) throw new Error(`Unsafe ${label}`);
    return result;
}

function safeMultiply(left: number, right: number, label: string): number {
    const result = left * right;
    if (!Number.isSafeInteger(result)) throw new Error(`Unsafe ${label}`);
    return result;
}

function convertedCost(
    cashPrice: number,
    purchaseQuantity: number,
    referenceGold: number
): number {
    const numerator =
        BigInt(cashPrice) * BigInt(purchaseQuantity) * BigInt(referenceGold);
    const scale = BigInt(10_000);
    const whole = numerator / scale;
    if (whole > MAX_SAFE_BIGINT) throw new Error("Unsafe converted cost");
    return Number(whole) + Number(numerator % scale) / 10_000;
}

function splitFee(sale: CashPackageSale, hasMembership: boolean): number {
    if (sale.quantity === 0) return 0;
    const smallUnits = Math.floor(sale.quantity / sale.saleCount);
    const largeSales = sale.quantity % sale.saleCount;
    const smallSales = sale.saleCount - largeSales;
    const waivedLarge = Math.min(sale.couponCount, largeSales);
    const waivedSmall = sale.couponCount - waivedLarge;
    const largeFee = largeSales
        ? calculateAuctionFee(
              safeMultiply(smallUnits + 1, sale.unitGold, "sale total"),
              hasMembership
          )
        : 0;
    const smallFee = smallSales
        ? calculateAuctionFee(
              safeMultiply(smallUnits, sale.unitGold, "sale total"),
              hasMembership
          )
        : 0;
    return safeAdd(
        safeMultiply(largeFee, largeSales - waivedLarge, "auction fees"),
        safeMultiply(smallFee, smallSales - waivedSmall, "auction fees"),
        "auction fees"
    );
}

export function calculateCashPackage(input: {
    cashPrice: number;
    purchaseQuantity: number;
    referenceGold: number | null;
    hasMembership: boolean;
    couponStock: number;
    sales: CashPackageSale[];
}): PackageResult {
    integer(input.cashPrice, 1, "cash price");
    integer(input.purchaseQuantity, 1, "purchase quantity");
    integer(input.couponStock, 0, "coupon stock");
    if (input.referenceGold !== null)
        integer(input.referenceGold, 1, "reference gold");

    let grossGold = 0;
    let feeGold = 0;
    let couponCount = 0;
    let couponItemsSold = 0;
    let unpricedCount = 0;

    for (const sale of input.sales) {
        integer(sale.quantity, 0, "sale quantity");
        integer(sale.unitGold, 0, "unit gold");
        integer(sale.saleCount, 0, "sale count");
        integer(sale.couponCount, 0, "coupon count");
        if (
            (sale.quantity === 0 &&
                (sale.saleCount !== 0 || sale.couponCount !== 0)) ||
            (sale.quantity > 0 &&
                (sale.saleCount < 1 || sale.saleCount > sale.quantity)) ||
            sale.couponCount > sale.saleCount ||
            (sale.isCoupon && sale.couponCount > 0)
        ) {
            throw new Error("Invalid sale allocation");
        }
        const saleGross = safeMultiply(
            sale.quantity,
            sale.unitGold,
            "gross gold"
        );
        grossGold = safeAdd(grossGold, saleGross, "gross gold");
        feeGold = safeAdd(
            feeGold,
            splitFee(sale, input.hasMembership),
            "auction fees"
        );
        couponCount = safeAdd(couponCount, sale.couponCount, "coupon count");
        if (sale.isCoupon) couponItemsSold += sale.quantity;
        if (sale.quantity > 0 && !sale.priced) unpricedCount++;
    }
    if (couponCount + couponItemsSold > input.couponStock) {
        throw new Error("Coupon allocation exceeds stock");
    }

    const netGold = grossGold - feeGold;
    const cashCost = safeMultiply(
        input.cashPrice,
        input.purchaseQuantity,
        "cash cost"
    );
    const goldCost =
        input.referenceGold === null
            ? null
            : convertedCost(
                  input.cashPrice,
                  input.purchaseQuantity,
                  input.referenceGold
              );
    const profitGold = goldCost === null ? null : netGold - goldCost;
    return {
        cashCost,
        goldCost,
        grossGold,
        feeGold,
        netGold,
        profitGold,
        profitPercent:
            profitGold === null || goldCost === null
                ? null
                : (profitGold / goldCost) * 100,
        unpricedCount,
    };
}

export function parseReferenceGold(value: string): number | null {
    const input = value.trim();
    if (!/^\d+(?:\.\d{1,4})?$/.test(input)) return null;
    const [whole, fraction = ""] = input.split(".");
    const result =
        BigInt(whole) * BigInt(10_000) + BigInt(fraction.padEnd(4, "0") || "0");
    return result > BigInt(0) && result <= MAX_SAFE_BIGINT
        ? Number(result)
        : null;
}

export function cashPackageMarketItems(
    catalog: CashPackageCatalog
): CashPackageMarketItem[] {
    const items = new Map<string, CashPackageMarketItem>();
    for (const product of catalog.products) {
        for (const entry of product.entries) {
            const candidates =
                entry.kind === "choice" ? entry.options : [entry];
            for (const candidate of candidates) {
                const item = {
                    itemId: candidate.itemId,
                    name: candidate.name,
                    tradeUnit: candidate.tradeUnit,
                    ...(candidate.tone ? { tone: candidate.tone } : {}),
                    ...(entry.kind === "item" && entry.pricing
                        ? { pricing: entry.pricing }
                        : {}),
                } satisfies CashPackageMarketItem;
                const previous = items.get(item.itemId);
                if (
                    previous &&
                    (previous.name !== item.name ||
                        previous.pricing !== item.pricing)
                ) {
                    throw new Error(`Conflicting market item: ${item.itemId}`);
                }
                items.set(item.itemId, item);
            }
        }
    }
    return [...items.values()];
}

export function choosePricedOption(
    options: CashPackageMarketOption[],
    prices: Record<string, PriceState>
): string {
    return options.reduce((best, option) => {
        const bestPrice = prices[best.itemId]?.marketUnitGold;
        const optionPrice = prices[option.itemId]?.marketUnitGold;
        if (optionPrice === null || optionPrice === undefined) return best;
        if (bestPrice === null || bestPrice === undefined) return option;
        return optionPrice > bestPrice ? option : best;
    }, options[0]).itemId;
}

export { MAX_GOLD };
