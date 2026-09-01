import {
    AUCTION_COUPONS,
    type AuctionCalculatorInput,
    type AuctionCouponDiscount,
    calculateAuctionDistribution,
    createEmptyCouponPrices,
    MAX_GOLD,
    MAX_MEMBER_COUNT,
    MAX_SNAPSHOT_EPOCH_SECONDS,
} from "@/lib/auction-calculator";

export const AUCTION_CALCULATOR_PATH = "/calculator";
export const AUCTION_CALCULATOR_PREVIEW_PATH = "/calculator/preview";
export const MAX_AUCTION_CALCULATOR_QUERY_LENGTH = 2_048;

const INTEGER_PATTERN = /^(0|[1-9][0-9]*)$/;
const COUPON_DISCOUNTS = AUCTION_COUPONS.map(coupon => coupon.discount);
const KNOWN_KEYS = [
    "v",
    "p",
    "n",
    "m",
    "a",
    ...COUPON_DISCOUNTS.map(discount => `c${discount}`),
    "x",
    "t",
];

export interface AuctionCalculatorSnapshot extends AuctionCalculatorInput {
    incompleteCoupons: AuctionCouponDiscount[];
    snapshotAt: number;
}

export type ParsedAuctionCalculatorParams =
    | { status: "empty"; normalized: URLSearchParams }
    | { status: "invalid"; normalized: URLSearchParams }
    | {
          status: "valid";
          snapshot: AuctionCalculatorSnapshot;
          normalized: URLSearchParams;
      };

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function hasDuplicates(params: URLSearchParams): boolean {
    return KNOWN_KEYS.some(key => params.getAll(key).length > 1);
}

function parseInteger(
    value: string | null,
    min: number,
    max: number
): number | null {
    if (value === null || !INTEGER_PATTERN.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
        ? parsed
        : null;
}

function parseIncompleteCoupons(
    value: string | null,
    couponPrices: AuctionCalculatorSnapshot["couponPrices"]
): AuctionCouponDiscount[] | null {
    if (value === null) return [];
    if (!value) return null;
    const values = value.split(",");
    const parsed = values.map(value => Number(value));
    if (
        parsed.some(
            value =>
                !COUPON_DISCOUNTS.includes(value as AuctionCouponDiscount) ||
                couponPrices[value as AuctionCouponDiscount] === null
        ) ||
        parsed.some((value, index) => value <= (parsed[index - 1] ?? 0))
    ) {
        return null;
    }
    return parsed as AuctionCouponDiscount[];
}

function parseCouponState(
    params: URLSearchParams
): Pick<
    AuctionCalculatorSnapshot,
    "couponPrices" | "incompleteCoupons"
> | null {
    const couponPrices = createEmptyCouponPrices();
    for (const { discount } of AUCTION_COUPONS) {
        const key = `c${discount}`;
        if (!params.has(key)) continue;
        const price = parseInteger(params.get(key), 0, MAX_GOLD);
        if (price === null) return null;
        couponPrices[discount] = price;
    }
    const incompleteCoupons = parseIncompleteCoupons(
        params.get("x"),
        couponPrices
    );
    return incompleteCoupons === null
        ? null
        : { couponPrices, incompleteCoupons };
}

function isValidSnapshotTime(value: number): boolean {
    return Number.isFinite(new Date(value * 1_000).getTime());
}

function parseSnapshot(
    params: URLSearchParams
): AuctionCalculatorSnapshot | null {
    const salePrice = parseInteger(params.get("p"), 1, MAX_GOLD);
    const memberCount = params.has("n")
        ? parseInteger(params.get("n"), 1, MAX_MEMBER_COUNT)
        : 1;
    const additionalCost = params.has("a")
        ? parseInteger(params.get("a"), 0, MAX_GOLD)
        : 0;
    const snapshotAt = parseInteger(
        params.get("t"),
        0,
        MAX_SNAPSHOT_EPOCH_SECONDS
    );
    const membership = params.get("m");
    const couponState = parseCouponState(params);
    if (
        salePrice === null ||
        memberCount === null ||
        additionalCost === null ||
        snapshotAt === null ||
        !isValidSnapshotTime(snapshotAt) ||
        (membership !== null && membership !== "1") ||
        couponState === null
    ) {
        return null;
    }
    return {
        salePrice,
        memberCount,
        hasMembership: membership === "1",
        additionalCost,
        ...couponState,
        snapshotAt,
    };
}

export function serializeAuctionCalculatorSnapshot(
    snapshot: AuctionCalculatorSnapshot
): URLSearchParams {
    calculateAuctionDistribution(snapshot);
    if (
        !Number.isSafeInteger(snapshot.snapshotAt) ||
        snapshot.snapshotAt < 0 ||
        snapshot.snapshotAt > MAX_SNAPSHOT_EPOCH_SECONDS ||
        !isValidSnapshotTime(snapshot.snapshotAt)
    ) {
        throw new Error("Invalid calculator snapshot");
    }

    const incompleteCoupons = [...snapshot.incompleteCoupons].sort(
        (a, b) => a - b
    );
    if (
        new Set(incompleteCoupons).size !== incompleteCoupons.length ||
        incompleteCoupons.some(
            discount =>
                !COUPON_DISCOUNTS.includes(discount) ||
                snapshot.couponPrices[discount] === null ||
                snapshot.couponPrices[discount] === 0
        )
    ) {
        throw new Error("Invalid incomplete coupon state");
    }

    const params = new URLSearchParams();
    params.set("v", "1");
    params.set("p", String(snapshot.salePrice));
    if (snapshot.memberCount !== 1)
        params.set("n", String(snapshot.memberCount));
    if (snapshot.hasMembership) params.set("m", "1");
    if (snapshot.additionalCost)
        params.set("a", String(snapshot.additionalCost));
    for (const { discount } of AUCTION_COUPONS) {
        const price = snapshot.couponPrices[discount];
        if (price !== null) params.set(`c${discount}`, String(price));
    }
    if (incompleteCoupons.length) params.set("x", incompleteCoupons.join(","));
    params.set("t", String(snapshot.snapshotAt));
    return params;
}

export function parseAuctionCalculatorParams(
    params: URLSearchParams
): ParsedAuctionCalculatorParams {
    const empty = {
        status: "empty",
        normalized: new URLSearchParams(),
    } as const;
    if (params.toString().length > MAX_AUCTION_CALCULATOR_QUERY_LENGTH) {
        return { status: "invalid", normalized: new URLSearchParams() };
    }
    const hasKnownKey = KNOWN_KEYS.some(key => params.has(key));
    if (!hasKnownKey) return empty;
    if (hasDuplicates(params) || params.get("v") !== "1") {
        return { status: "invalid", normalized: new URLSearchParams() };
    }
    const snapshot = parseSnapshot(params);
    if (snapshot === null) {
        return { status: "invalid", normalized: new URLSearchParams() };
    }

    try {
        return {
            status: "valid",
            snapshot,
            normalized: serializeAuctionCalculatorSnapshot(snapshot),
        };
    } catch {
        return { status: "invalid", normalized: new URLSearchParams() };
    }
}

export function searchParamsRecordToURLSearchParams(
    values: SearchParamsRecord
): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
        if (Array.isArray(value))
            value.forEach(item => params.append(key, item));
        else if (value !== undefined) params.append(key, value);
    }
    return params;
}

export function getAuctionCalculatorPath(params: URLSearchParams): string {
    const query = params.toString();
    return query
        ? `${AUCTION_CALCULATOR_PATH}?${query}`
        : AUCTION_CALCULATOR_PATH;
}

export function getAuctionCalculatorPreviewPath(
    params: URLSearchParams
): string {
    const query = params.toString();
    return query
        ? `${AUCTION_CALCULATOR_PREVIEW_PATH}?${query}`
        : AUCTION_CALCULATOR_PREVIEW_PATH;
}
