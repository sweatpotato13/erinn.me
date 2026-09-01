"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import {
    AUCTION_COUPONS,
    type AuctionCalculatorResult,
    type AuctionCouponDiscount,
    calculateAuctionDistribution,
    createEmptyCouponPrices,
    formatGold,
    MAX_GOLD,
    MAX_MEMBER_COUNT,
} from "@/lib/auction-calculator";
import {
    AUCTION_CALCULATOR_PATH,
    type AuctionCalculatorSnapshot,
    parseAuctionCalculatorParams,
    serializeAuctionCalculatorSnapshot,
} from "@/lib/auction-calculator-url";
import { getItemImageUrl } from "@/lib/utils";

type CouponSource =
    | "loading"
    | "market"
    | "incomplete"
    | "unavailable"
    | "failed"
    | "manual"
    | "snapshot";

interface CouponState {
    price: string;
    source: CouponSource;
}

type CouponStates = Record<AuctionCouponDiscount, CouponState>;

interface FormState {
    salePrice: string;
    memberCount: string;
    hasMembership: boolean;
    additionalCost: string;
}

interface FormErrors {
    salePrice?: string;
    memberCount?: string;
    additionalCost?: string;
}

interface ParsedForm {
    snapshot: AuctionCalculatorSnapshot | null;
    errors: FormErrors;
    couponErrors: Partial<Record<AuctionCouponDiscount, string>>;
}

const INTEGER_PATTERN = /^(0|[1-9][0-9]*)$/;
const SNAPSHOT_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Seoul",
});

function emptyForm(): FormState {
    return {
        salePrice: "",
        memberCount: "1",
        hasMembership: false,
        additionalCost: "0",
    };
}

function couponStates(source: CouponSource): CouponStates {
    return {
        10: { price: "", source },
        20: { price: "", source },
        30: { price: "", source },
        50: { price: "", source },
        100: { price: "", source },
    };
}

function restoreSnapshot(snapshot: AuctionCalculatorSnapshot): {
    form: FormState;
    coupons: CouponStates;
} {
    const incomplete = new Set(snapshot.incompleteCoupons);
    const restored = couponStates("unavailable");
    for (const { discount } of AUCTION_COUPONS) {
        const price = snapshot.couponPrices[discount];
        restored[discount] = {
            price: price === null ? "" : String(price),
            source:
                price === null
                    ? "unavailable"
                    : incomplete.has(discount)
                      ? "incomplete"
                      : "snapshot",
        };
    }
    return {
        form: {
            salePrice: String(snapshot.salePrice),
            memberCount: String(snapshot.memberCount),
            hasMembership: snapshot.hasMembership,
            additionalCost: String(snapshot.additionalCost),
        },
        coupons: restored,
    };
}

function parseIntegerField(
    value: string,
    min: number,
    max: number
): number | null {
    if (!INTEGER_PATTERN.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
        ? parsed
        : null;
}

function parseForm(
    form: FormState,
    coupons: CouponStates,
    snapshotAt: number | null
): ParsedForm {
    const errors: FormErrors = {};
    const couponErrors: Partial<Record<AuctionCouponDiscount, string>> = {};
    const salePrice = parseIntegerField(form.salePrice, 1, MAX_GOLD);
    const memberCount = parseIntegerField(
        form.memberCount,
        1,
        MAX_MEMBER_COUNT
    );
    const additionalCost = parseIntegerField(form.additionalCost, 0, MAX_GOLD);
    if (salePrice === null)
        errors.salePrice = "1 이상의 정수 판매가를 입력해주세요.";
    if (memberCount === null)
        errors.memberCount = "1 이상의 정수 인원을 입력해주세요.";
    if (additionalCost === null)
        errors.additionalCost = "0 이상의 정수 비용을 입력해주세요.";
    if (
        snapshotAt === null ||
        salePrice === null ||
        memberCount === null ||
        additionalCost === null ||
        Object.keys(errors).length > 0
    ) {
        return { snapshot: null, errors, couponErrors };
    }

    const prices = createEmptyCouponPrices();
    const incompleteCoupons: AuctionCouponDiscount[] = [];
    for (const { discount } of AUCTION_COUPONS) {
        const coupon = coupons[discount];
        const price = coupon.price
            ? parseIntegerField(coupon.price, 0, MAX_GOLD)
            : null;
        if (coupon.price && price === null) {
            couponErrors[discount] = "0 이상의 정수 가격을 입력해주세요.";
        }
        if (price !== null) prices[discount] = price;
        if (coupon.source === "incomplete" && price !== null) {
            incompleteCoupons.push(discount);
        }
    }

    if (Object.keys(couponErrors).length > 0) {
        return { snapshot: null, errors, couponErrors };
    }

    return {
        errors,
        couponErrors,
        snapshot: {
            salePrice,
            memberCount,
            hasMembership: form.hasMembership,
            additionalCost,
            couponPrices: prices,
            incompleteCoupons,
            snapshotAt,
        },
    };
}

function formatKoreanAmount(value: number): string {
    const eok = Math.floor(value / 100_000_000);
    const man = Math.floor((value % 100_000_000) / 10_000);
    const remainder = value % 10_000;
    return [
        eok ? `${eok}억` : "",
        man ? `${man}만` : "",
        remainder ? formatGold(remainder) : "",
    ]
        .filter(Boolean)
        .join(" ");
}

function couponStatusText(coupon: CouponState): string {
    if (coupon.source === "loading") return "조회 중";
    if (coupon.source === "failed") return "조회 실패 · 직접 입력 가능";
    if (coupon.source === "unavailable") return "사용 가능한 매물 없음";
    if (coupon.source === "incomplete" && !coupon.price)
        return "일부 데이터 · 확인된 가격 없음";
    if (coupon.source === "incomplete") return "일부 데이터 최저가";
    if (coupon.source === "manual")
        return coupon.price === "0" ? "직접 입력 · 보유 쿠폰" : "직접 입력";
    if (coupon.source === "snapshot") return "공유 스냅샷";
    return "현재 최저가";
}

async function shareCalculatorUrl(url: string): Promise<string> {
    if (typeof navigator.share === "function") {
        try {
            await navigator.share({
                title: "Erinn.me 경매 수수료·파티 분배 계산",
                url,
            });
            return "계산 링크를 공유했습니다.";
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return "공유를 취소했습니다.";
            }
        }
    }
    if (!navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(url);
    return "계산 링크를 복사했습니다.";
}

function ComparisonCards({
    result,
    coupons,
}: {
    result: AuctionCalculatorResult;
    coupons: CouponStates;
}) {
    return (
        <section aria-labelledby="comparison-title">
            <h2 id="comparison-title" className="text-2xl font-bold">
                선택지 비교
            </h2>
            <p className="mt-1 text-sm text-base-content/70">
                쿠폰별 비용과 최종 분배액을 한눈에 비교하세요.
            </p>
            {result.recommended.distributable < 0 && (
                <p role="alert" className="alert alert-warning mt-4 text-sm">
                    입력한 총비용이 판매가를 초과했습니다. 음수 결과를 그대로
                    표시합니다.
                </p>
            )}
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {result.options.map(option => {
                    const couponDefinition =
                        option.discountPercent === 0
                            ? null
                            : AUCTION_COUPONS.find(
                                  coupon =>
                                      coupon.discount === option.discountPercent
                              );
                    const coupon = couponDefinition
                        ? coupons[couponDefinition.discount]
                        : null;
                    const isRecommended =
                        option.available &&
                        option.key === result.recommended.key;
                    return (
                        <article
                            key={option.key}
                            aria-label={`${option.label}${isRecommended ? " · BEST" : ""}`}
                            className={`h-full rounded-xl p-5 ${
                                isRecommended
                                    ? "border-2 border-primary bg-primary/5 shadow-sm"
                                    : "border"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    {couponDefinition && (
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-base-200 p-1">
                                            <Image
                                                src={getItemImageUrl(
                                                    couponDefinition.name
                                                )}
                                                alt={couponDefinition.name}
                                                width={56}
                                                height={28}
                                                sizes="56px"
                                                className="object-contain"
                                                loading={
                                                    couponDefinition.discount ===
                                                    10
                                                        ? "eager"
                                                        : "lazy"
                                                }
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold">
                                            {option.label}
                                        </h3>
                                        <p className="mt-1 text-xs text-base-content/70">
                                            {coupon
                                                ? couponStatusText(coupon)
                                                : "항상 사용 가능"}
                                        </p>
                                    </div>
                                </div>
                                {isRecommended && (
                                    <span className="badge badge-primary font-bold">
                                        BEST
                                    </span>
                                )}
                            </div>
                            {option.available ? (
                                <>
                                    <dl className="mt-5 grid grid-cols-2 gap-4">
                                        <ComparisonMetric
                                            label="1인당 분배액"
                                            value={`${formatGold(option.perMember)} Gold`}
                                            primary
                                        />
                                        <ComparisonMetric
                                            label="분배 가능 금액"
                                            value={`${formatGold(option.distributable)} Gold`}
                                        />
                                        <ComparisonMetric
                                            label="총비용"
                                            value={`${formatGold(option.totalCost)} Gold`}
                                        />
                                    </dl>
                                    <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t pt-4">
                                        <ComparisonMetric
                                            label="기본 수수료율"
                                            value={`${option.baseFeePercent}%`}
                                        />
                                        <ComparisonMetric
                                            label="할인율"
                                            value={`${option.discountPercent}%`}
                                        />
                                        <ComparisonMetric
                                            label="경매 수수료"
                                            value={`${formatGold(option.auctionFee)} Gold`}
                                        />
                                        <ComparisonMetric
                                            label="쿠폰가"
                                            value={`${formatGold(option.couponCost)} Gold`}
                                        />
                                        <ComparisonMetric
                                            label="추가 비용"
                                            value={`${formatGold(option.additionalCost)} Gold`}
                                        />
                                        <ComparisonMetric
                                            label="나머지"
                                            value={`${formatGold(option.remainder)} Gold`}
                                        />
                                    </dl>
                                </>
                            ) : (
                                <p className="mt-5 rounded-lg bg-base-200 p-4 text-sm">
                                    쿠폰 가격을 직접 입력하면 결과를 비교할 수
                                    있습니다.
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function ComparisonMetric({
    label,
    value,
    primary = false,
}: {
    label: string;
    value: string;
    primary?: boolean;
}) {
    return (
        <div className={primary ? "col-span-2" : undefined}>
            <dt className="text-xs text-base-content/60">{label}</dt>
            <dd
                className={`${primary ? "mt-1 text-2xl text-primary" : "mt-0.5 text-base"} font-bold tabular-nums`}
            >
                {value}
            </dd>
        </div>
    );
}

export interface AuctionCalculatorProps {
    initialQuery: string;
}

export default function AuctionCalculator({
    initialQuery,
}: AuctionCalculatorProps) {
    const searchParamsKey = useSearchParams().toString();
    const initialParsed = useMemo(
        () => parseAuctionCalculatorParams(new URLSearchParams(initialQuery)),
        [initialQuery]
    );
    const initialRestored =
        initialParsed.status === "valid"
            ? restoreSnapshot(initialParsed.snapshot)
            : { form: emptyForm(), coupons: couponStates("loading") };
    const [form, setForm] = useState<FormState>(initialRestored.form);
    const [coupons, setCoupons] = useState<CouponStates>(
        initialRestored.coupons
    );
    const [snapshotAt, setSnapshotAt] = useState<number | null>(
        initialParsed.status === "valid"
            ? initialParsed.snapshot.snapshotAt
            : null
    );
    const [refreshing, setRefreshing] = useState(false);
    const [feedback, setFeedback] = useState(
        initialParsed.status === "invalid"
            ? "유효하지 않은 공유 링크를 안전한 기본 상태로 열었습니다."
            : ""
    );
    const abortRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);
    const lastWrittenQueryRef = useRef<string | null>(null);
    const restoredQueryRef = useRef(initialQuery);
    const historyModeRef = useRef<"push" | "replace">("replace");

    const refreshPrices = useCallback(
        async (historyMode: "push" | "replace") => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            const requestId = ++requestIdRef.current;
            setRefreshing(true);
            setFeedback("쿠폰 시세를 조회하고 있습니다.");

            const nextEntries = await Promise.all(
                AUCTION_COUPONS.map(async ({ discount, name }) => {
                    try {
                        const result = await fetchItemPriceSummary(
                            name,
                            controller.signal
                        );
                        if (
                            !Number.isSafeInteger(result.minPrice) ||
                            result.minPrice < 0 ||
                            result.minPrice > MAX_GOLD
                        ) {
                            throw new Error("Invalid Gold price");
                        }
                        const next: CouponState =
                            result.minPrice > 0
                                ? {
                                      price: String(result.minPrice),
                                      source: result.isComplete
                                          ? "market"
                                          : "incomplete",
                                  }
                                : {
                                      price: "",
                                      source: result.isComplete
                                          ? "unavailable"
                                          : "incomplete",
                                  };
                        return [discount, next] as const;
                    } catch {
                        return [
                            discount,
                            {
                                price: "",
                                source: "failed",
                            } satisfies CouponState,
                        ] as const;
                    }
                })
            );
            if (controller.signal.aborted || requestId !== requestIdRef.current)
                return;

            setCoupons(
                Object.fromEntries(nextEntries) as unknown as CouponStates
            );
            setSnapshotAt(Math.floor(Date.now() / 1_000));
            historyModeRef.current = historyMode;
            setRefreshing(false);
            setFeedback("쿠폰 시세를 갱신했습니다.");
        },
        []
    );

    useEffect(() => {
        if (initialParsed.status === "valid") return;
        const timeout = window.setTimeout(
            () => void refreshPrices("replace"),
            0
        );
        return () => window.clearTimeout(timeout);
    }, [initialParsed.status, refreshPrices]);

    useEffect(() => {
        if (searchParamsKey === restoredQueryRef.current) return;
        if (searchParamsKey === lastWrittenQueryRef.current) {
            restoredQueryRef.current = searchParamsKey;
            return;
        }
        const parsed = parseAuctionCalculatorParams(
            new URLSearchParams(searchParamsKey)
        );
        restoredQueryRef.current = searchParamsKey;
        abortRef.current?.abort();
        requestIdRef.current++;
        setRefreshing(false);
        if (parsed.status === "valid") {
            const restored = restoreSnapshot(parsed.snapshot);
            setForm(restored.form);
            setCoupons(restored.coupons);
            setSnapshotAt(parsed.snapshot.snapshotAt);
            setFeedback("공유된 계산 상태를 복원했습니다.");
            return;
        }
        setForm(emptyForm());
        setCoupons(couponStates("loading"));
        setSnapshotAt(null);
        setFeedback(
            parsed.status === "invalid"
                ? "유효하지 않은 링크를 안전한 기본 상태로 복원했습니다."
                : "새 계산을 시작합니다."
        );
        void refreshPrices("replace");
    }, [refreshPrices, searchParamsKey]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const parsedForm = useMemo(
        () => parseForm(form, coupons, snapshotAt),
        [coupons, form, snapshotAt]
    );
    const result = useMemo(() => {
        if (!parsedForm.snapshot) return null;
        return calculateAuctionDistribution(parsedForm.snapshot);
    }, [parsedForm.snapshot]);

    useEffect(() => {
        if (!parsedForm.snapshot || refreshing) return;
        const query = serializeAuctionCalculatorSnapshot(
            parsedForm.snapshot
        ).toString();
        if (query === searchParamsKey || query === lastWrittenQueryRef.current)
            return;
        lastWrittenQueryRef.current = query;
        const url = `${AUCTION_CALCULATOR_PATH}?${query}`;
        if (historyModeRef.current === "push") {
            window.history.pushState(null, "", url);
            historyModeRef.current = "replace";
        } else {
            window.history.replaceState(null, "", url);
        }
    }, [parsedForm.snapshot, refreshing, searchParamsKey]);

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm(current => ({ ...current, [key]: value }));

    const setManualCoupon = (
        discount: AuctionCouponDiscount,
        price: string
    ) => {
        abortRef.current?.abort();
        requestIdRef.current++;
        setRefreshing(false);
        setCoupons(current => {
            const base =
                snapshotAt === null ? couponStates("unavailable") : current;
            return {
                ...base,
                [discount]: { price, source: "manual" },
            };
        });
        if (snapshotAt === null) setSnapshotAt(Math.floor(Date.now() / 1_000));
        setFeedback("직접 입력한 쿠폰 가격을 적용했습니다.");
    };

    const share = async () => {
        if (!parsedForm.snapshot || refreshing) return;
        try {
            const query = serializeAuctionCalculatorSnapshot(
                parsedForm.snapshot
            );
            const url = new URL(
                `${AUCTION_CALCULATOR_PATH}?${query}`,
                window.location.origin
            );
            setFeedback(await shareCalculatorUrl(url.href));
        } catch {
            setFeedback("계산 링크를 공유하거나 복사하지 못했습니다.");
        }
    };
    const salePriceValue = parseIntegerField(form.salePrice, 1, MAX_GOLD);
    const salePriceSummary =
        salePriceValue === null
            ? undefined
            : `${formatGold(salePriceValue)} | ${formatKoreanAmount(salePriceValue)}`;

    return (
        <article className="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold">파티 분배 계산기</h1>
                <button
                    type="button"
                    className="btn btn-primary btn-sm shrink-0"
                    disabled={!parsedForm.snapshot || refreshing}
                    onClick={() => void share()}
                >
                    계산 링크 공유
                </button>
            </div>
            <p className="mt-2 text-base-content/70">
                경매 수수료, 쿠폰 구매가와 공통 비용을 뺀 뒤 파티 분배액을
                비교합니다.
            </p>

            <div
                className="mt-5 rounded-lg border p-3 md:p-4"
                data-testid="calculator-controls"
            >
                <form
                    aria-label="분배 계산 입력"
                    className="grid grid-cols-2 items-end gap-2 [&>div:first-child]:col-span-2 [&>label]:col-span-2 lg:grid-cols-[minmax(260px,2fr)_minmax(120px,1fr)_minmax(180px,1fr)_auto] lg:gap-3 lg:[&>div:first-child]:col-span-1 lg:[&>label]:col-span-1"
                    noValidate
                >
                    <NumberField
                        id="sale-price"
                        label="판매 금액 (Gold)"
                        summary={salePriceSummary}
                        value={form.salePrice}
                        min={1}
                        max={MAX_GOLD}
                        error={parsedForm.errors.salePrice}
                        onChange={value => setField("salePrice", value)}
                    />
                    <NumberField
                        id="member-count"
                        label="분배 인원"
                        value={form.memberCount}
                        min={1}
                        max={MAX_MEMBER_COUNT}
                        error={parsedForm.errors.memberCount}
                        onChange={value => setField("memberCount", value)}
                    />
                    <NumberField
                        id="additional-cost"
                        label="추가 공통 비용 (Gold)"
                        value={form.additionalCost}
                        min={0}
                        max={MAX_GOLD}
                        error={parsedForm.errors.additionalCost}
                        onChange={value => setField("additionalCost", value)}
                    />
                    <label className="flex min-h-8 cursor-pointer items-center gap-2 pb-1 text-sm">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={form.hasMembership}
                            onChange={event =>
                                setField("hasMembership", event.target.checked)
                            }
                        />
                        <span>멤버십 수수료 4%</span>
                    </label>
                </form>

                <section
                    aria-labelledby="coupon-prices"
                    className="mt-3 border-t pt-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="coupon-prices" className="font-bold">
                            할인 쿠폰 가격
                        </h2>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            aria-busy={refreshing}
                            onClick={() => void refreshPrices("push")}
                        >
                            {refreshing
                                ? "조회 중 · 다시 시작"
                                : "현재 시세로 다시 계산"}
                        </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {AUCTION_COUPONS.map(({ discount }) => (
                            <div key={discount}>
                                <label
                                    htmlFor={`coupon-${discount}`}
                                    className="label py-0 text-xs"
                                >
                                    <span>{discount}% 할인 쿠폰 (Gold)</span>
                                </label>
                                <input
                                    id={`coupon-${discount}`}
                                    className="input input-bordered input-sm w-full"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    max={MAX_GOLD}
                                    step={1}
                                    value={coupons[discount].price}
                                    aria-invalid={
                                        !!parsedForm.couponErrors[discount]
                                    }
                                    aria-describedby={`coupon-${discount}-status`}
                                    onChange={event =>
                                        setManualCoupon(
                                            discount,
                                            event.target.value
                                        )
                                    }
                                />
                                <p
                                    id={`coupon-${discount}-status`}
                                    className="mt-1 text-xs text-base-content/70"
                                >
                                    {couponStatusText(coupons[discount])}
                                    {parsedForm.couponErrors[discount] && (
                                        <span className="text-error">
                                            {` · ${parsedForm.couponErrors[discount]}`}
                                        </span>
                                    )}
                                </p>
                            </div>
                        ))}
                    </div>
                    {(snapshotAt !== null || feedback) && (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-base-content/70">
                            {snapshotAt !== null && (
                                <p>
                                    가격 기준 시각:{" "}
                                    {SNAPSHOT_FORMATTER.format(
                                        snapshotAt * 1_000
                                    )}
                                </p>
                            )}
                            {feedback && (
                                <p
                                    role={
                                        feedback.includes("유효하지")
                                            ? "alert"
                                            : "status"
                                    }
                                    aria-live="polite"
                                >
                                    {feedback}
                                </p>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {result ? (
                <div className="mt-5">
                    <ComparisonCards result={result} coupons={coupons} />
                </div>
            ) : (
                <p className="mt-6 rounded-lg border p-4" role="status">
                    판매가를 포함한 필수 값을 입력하면 계산 결과가 표시됩니다.
                </p>
            )}

            <p className="mt-6 text-sm text-base-content/70">
                Data based on Nexon Open API · 표시 가격은 조회 시점의 일부
                데이터일 수 있으며 실시간 가격이나 수익을 보장하지 않습니다.
            </p>
        </article>
    );
}

interface NumberFieldProps {
    id: string;
    label: string;
    value: string;
    min: number;
    max: number;
    summary?: string;
    error?: string;
    onChange: (value: string) => void;
}

function NumberField({
    id,
    label,
    value,
    min,
    max,
    summary,
    error,
    onChange,
}: NumberFieldProps) {
    return (
        <div>
            <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-2">
                <label htmlFor={id} className="label py-0">
                    <span>{label}</span>
                </label>
                {summary && (
                    <output
                        htmlFor={id}
                        className="text-xs font-medium tabular-nums text-primary"
                    >
                        ({summary})
                    </output>
                )}
            </div>
            <input
                id={id}
                className="input input-bordered input-sm w-full"
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                step={1}
                value={value}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={event => onChange(event.target.value)}
            />
            {error && (
                <p id={`${id}-error`} className="mt-1 text-sm text-error">
                    {error}
                </p>
            )}
        </div>
    );
}
