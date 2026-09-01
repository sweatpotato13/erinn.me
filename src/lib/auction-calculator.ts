export const AUCTION_COUPONS = [
    { discount: 10, name: "경매장 수수료 10% 할인 쿠폰" },
    { discount: 20, name: "경매장 수수료 20% 할인 쿠폰" },
    { discount: 30, name: "경매장 수수료 30% 할인 쿠폰" },
    { discount: 50, name: "경매장 수수료 50% 할인 쿠폰" },
    { discount: 100, name: "경매장 수수료 100% 할인 쿠폰" },
] as const;

export type AuctionCouponDiscount =
    (typeof AUCTION_COUPONS)[number]["discount"];

export const MAX_GOLD = Math.floor(Number.MAX_SAFE_INTEGER / 500);
export const MAX_MEMBER_COUNT = MAX_GOLD;
export const MAX_SNAPSHOT_EPOCH_SECONDS = 253_402_300_799;

export type AuctionCouponPrices = Record<AuctionCouponDiscount, number | null>;

export interface AuctionCalculatorInput {
    salePrice: number;
    memberCount: number;
    hasMembership: boolean;
    additionalCost: number;
    couponPrices: AuctionCouponPrices;
}

interface AuctionOptionBase {
    key: "none" | `coupon-${AuctionCouponDiscount}`;
    label: string;
    discountPercent: 0 | AuctionCouponDiscount;
}

export interface UnavailableAuctionOption extends AuctionOptionBase {
    available: false;
}

export interface AvailableAuctionOption extends AuctionOptionBase {
    available: true;
    baseFeePercent: 4 | 5;
    auctionFee: number;
    couponCost: number;
    additionalCost: number;
    totalCost: number;
    distributable: number;
    perMember: number;
    remainder: number;
}

export type AuctionCalculatorOption =
    AvailableAuctionOption | UnavailableAuctionOption;

export interface AuctionCalculatorResult {
    options: AuctionCalculatorOption[];
    recommended: AvailableAuctionOption;
}

const GOLD_FORMATTER = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
});

export function formatGold(value: number): string {
    if (!Number.isSafeInteger(value)) throw new Error("Unsafe Gold value");
    return GOLD_FORMATTER.format(value);
}

export function createEmptyCouponPrices(): AuctionCouponPrices {
    return { 10: null, 20: null, 30: null, 50: null, 100: null };
}

function assertIntegerInRange(
    value: number,
    min: number,
    max: number,
    label: string
): void {
    if (!Number.isSafeInteger(value) || value < min || value > max) {
        throw new Error(`Invalid ${label}`);
    }
}

function assertSafe(value: number, label: string): number {
    if (!Number.isSafeInteger(value)) throw new Error(`Unsafe ${label}`);
    return value;
}

function validateInput(input: AuctionCalculatorInput): void {
    assertIntegerInRange(input.salePrice, 1, MAX_GOLD, "sale price");
    assertIntegerInRange(
        input.memberCount,
        1,
        MAX_MEMBER_COUNT,
        "member count"
    );
    assertIntegerInRange(input.additionalCost, 0, MAX_GOLD, "additional cost");
    for (const { discount } of AUCTION_COUPONS) {
        const price = input.couponPrices[discount];
        if (price !== null) {
            assertIntegerInRange(price, 0, MAX_GOLD, "coupon price");
        }
    }
}

function calculateOption(
    input: AuctionCalculatorInput,
    discountPercent: 0 | AuctionCouponDiscount,
    couponCost: number
): AvailableAuctionOption {
    const baseFeePercent = input.hasMembership ? 4 : 5;
    const feeProduct = assertSafe(
        input.salePrice * baseFeePercent * (100 - discountPercent),
        "auction fee"
    );
    const auctionFee = Math.floor(feeProduct / 10_000);
    const totalCost = assertSafe(
        auctionFee + couponCost + input.additionalCost,
        "total cost"
    );
    const distributable = assertSafe(
        input.salePrice - totalCost,
        "distributable proceeds"
    );
    const perMember = Math.floor(distributable / input.memberCount);
    const remainder = assertSafe(
        distributable -
            assertSafe(perMember * input.memberCount, "distributed total"),
        "remainder"
    );

    return {
        key: discountPercent === 0 ? "none" : `coupon-${discountPercent}`,
        label:
            discountPercent === 0
                ? "쿠폰 없음"
                : `${discountPercent}% 할인 쿠폰`,
        discountPercent,
        available: true,
        baseFeePercent,
        auctionFee,
        couponCost,
        additionalCost: input.additionalCost,
        totalCost,
        distributable,
        perMember,
        remainder,
    };
}

export function calculateAuctionDistribution(
    input: AuctionCalculatorInput
): AuctionCalculatorResult {
    validateInput(input);
    const options: AuctionCalculatorOption[] = [calculateOption(input, 0, 0)];

    for (const { discount } of AUCTION_COUPONS) {
        const couponCost = input.couponPrices[discount];
        options.push(
            couponCost === null
                ? {
                      key: `coupon-${discount}`,
                      label: `${discount}% 할인 쿠폰`,
                      discountPercent: discount,
                      available: false,
                  }
                : calculateOption(input, discount, couponCost)
        );
    }

    const available = options.filter(
        (option): option is AvailableAuctionOption => option.available
    );
    const recommended = available.reduce((best, option) =>
        option.distributable > best.distributable ? option : best
    );

    return { options, recommended };
}
