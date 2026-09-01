"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
    type Dispatch,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import {
    AUCTION_COUPONS,
    type AuctionCalculatorOption,
    type AuctionCalculatorResult,
    type AuctionCouponDiscount,
    type AuctionCouponPrices,
    type AvailableAuctionOption,
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
type HistoryMode = "push" | "replace";

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

interface ParsedFields {
    salePrice: number | null;
    memberCount: number | null;
    additionalCost: number | null;
    errors: FormErrors;
}

interface ParsedCoupons {
    prices: AuctionCouponPrices;
    incompleteCoupons: AuctionCouponDiscount[];
    errors: Partial<Record<AuctionCouponDiscount, string>>;
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

function restoreSnapshot(snapshot: AuctionCalculatorSnapshot) {
    const incomplete = new Set(snapshot.incompleteCoupons);
    const coupons = couponStates("unavailable");
    for (const { discount } of AUCTION_COUPONS) {
        const price = snapshot.couponPrices[discount];
        coupons[discount] = {
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
        coupons,
    };
}

function parseIntegerField(value: string, min: number, max: number) {
    if (!INTEGER_PATTERN.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
        ? parsed
        : null;
}

function parseFields(form: FormState): ParsedFields {
    const errors: FormErrors = {};
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
    return { salePrice, memberCount, additionalCost, errors };
}

function parseCoupons(coupons: CouponStates): ParsedCoupons {
    const prices = createEmptyCouponPrices();
    const incompleteCoupons: AuctionCouponDiscount[] = [];
    const errors: ParsedCoupons["errors"] = {};
    for (const { discount } of AUCTION_COUPONS) {
        const coupon = coupons[discount];
        const price = coupon.price
            ? parseIntegerField(coupon.price, 0, MAX_GOLD)
            : null;
        if (coupon.price && price === null) {
            errors[discount] = "0 이상의 정수 가격을 입력해주세요.";
        }
        if (price !== null) prices[discount] = price;
        if (coupon.source === "incomplete" && price !== null) {
            incompleteCoupons.push(discount);
        }
    }
    return { prices, incompleteCoupons, errors };
}

function parseForm(
    form: FormState,
    coupons: CouponStates,
    snapshotAt: number | null
): ParsedForm {
    const fields = parseFields(form);
    const parsedCoupons = parseCoupons(coupons);
    if (
        snapshotAt === null ||
        fields.salePrice === null ||
        fields.memberCount === null ||
        fields.additionalCost === null ||
        Object.keys(parsedCoupons.errors).length > 0
    ) {
        return {
            snapshot: null,
            errors: fields.errors,
            couponErrors: parsedCoupons.errors,
        };
    }
    return {
        errors: fields.errors,
        couponErrors: parsedCoupons.errors,
        snapshot: {
            salePrice: fields.salePrice,
            memberCount: fields.memberCount,
            hasMembership: form.hasMembership,
            additionalCost: fields.additionalCost,
            couponPrices: parsedCoupons.prices,
            incompleteCoupons: parsedCoupons.incompleteCoupons,
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

interface CouponPriceData {
    coupons: CouponStates;
    snapshotAt: number | null;
    refreshing: boolean;
    feedback: string;
}

type CouponPriceAction =
    | { type: "start" }
    | { type: "success"; coupons: CouponStates; snapshotAt: number }
    | {
          type: "restore";
          coupons: CouponStates;
          snapshotAt: number;
          feedback: string;
      }
    | { type: "reset"; feedback: string }
    | { type: "feedback"; feedback: string }
    | {
          type: "manual";
          discount: AuctionCouponDiscount;
          price: string;
          snapshotAt: number;
      };

function applyManualCoupon(
    state: CouponPriceData,
    action: Extract<CouponPriceAction, { type: "manual" }>
): CouponPriceData {
    const base =
        state.snapshotAt === null ? couponStates("failed") : state.coupons;
    return {
        coupons: {
            ...base,
            [action.discount]: { price: action.price, source: "manual" },
        },
        snapshotAt: state.snapshotAt ?? action.snapshotAt,
        refreshing: false,
        feedback: "직접 입력한 쿠폰 가격을 적용했습니다.",
    };
}

function couponPriceReducer(
    state: CouponPriceData,
    action: CouponPriceAction
): CouponPriceData {
    switch (action.type) {
        case "start":
            return {
                ...state,
                refreshing: true,
                feedback: "쿠폰 시세를 조회하고 있습니다.",
            };
        case "success":
            return {
                coupons: action.coupons,
                snapshotAt: action.snapshotAt,
                refreshing: false,
                feedback: "쿠폰 시세를 갱신했습니다.",
            };
        case "restore":
            return {
                coupons: action.coupons,
                snapshotAt: action.snapshotAt,
                refreshing: false,
                feedback: action.feedback,
            };
        case "reset":
            return {
                coupons: couponStates("loading"),
                snapshotAt: null,
                refreshing: false,
                feedback: action.feedback,
            };
        case "feedback":
            return { ...state, feedback: action.feedback };
        case "manual":
            return applyManualCoupon(state, action);
    }
}

async function fetchCouponPrice(
    coupon: (typeof AUCTION_COUPONS)[number],
    signal: AbortSignal
): Promise<readonly [AuctionCouponDiscount, CouponState]> {
    try {
        const result = await fetchItemPriceSummary(coupon.name, signal);
        if (
            !Number.isSafeInteger(result.minPrice) ||
            result.minPrice < 0 ||
            result.minPrice > MAX_GOLD
        ) {
            throw new Error("Invalid Gold price");
        }
        if (result.minPrice === 0) {
            return [
                coupon.discount,
                {
                    price: "",
                    source: result.isComplete ? "unavailable" : "incomplete",
                },
            ];
        }
        return [
            coupon.discount,
            {
                price: String(result.minPrice),
                source: result.isComplete ? "market" : "incomplete",
            },
        ];
    } catch {
        return [coupon.discount, { price: "", source: "failed" }];
    }
}

async function loadCouponPrices(signal: AbortSignal): Promise<CouponStates> {
    const entries = await Promise.all(
        AUCTION_COUPONS.map(coupon => fetchCouponPrice(coupon, signal))
    );
    return Object.fromEntries(entries) as unknown as CouponStates;
}

async function refreshCouponPrices(
    abortRef: { current: AbortController | null },
    requestIdRef: { current: number },
    historyModeRef: { current: HistoryMode },
    dispatch: Dispatch<CouponPriceAction>,
    historyMode: HistoryMode
): Promise<void> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    dispatch({ type: "start" });
    const coupons = await loadCouponPrices(controller.signal);
    if (controller.signal.aborted || requestId !== requestIdRef.current) return;
    historyModeRef.current = historyMode;
    dispatch({
        type: "success",
        coupons,
        snapshotAt: Math.floor(Date.now() / 1_000),
    });
}

function cancelCouponPriceRequest(
    abortRef: { current: AbortController | null },
    requestIdRef: { current: number }
) {
    abortRef.current?.abort();
    requestIdRef.current++;
}

interface CouponPriceActions {
    restorePrices: (snapshot: AuctionCalculatorSnapshot) => void;
    resetPrices: (feedback: string) => void;
    setManualCoupon: (discount: AuctionCouponDiscount, price: string) => void;
    setFeedback: (feedback: string) => void;
}

interface CouponPriceController extends CouponPriceData, CouponPriceActions {
    historyModeRef: { current: HistoryMode };
    refreshPrices: (historyMode: HistoryMode) => Promise<void>;
}

function useCouponPriceRequest(
    dispatch: Dispatch<CouponPriceAction>,
    historyModeRef: { current: HistoryMode }
) {
    const abortRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);
    const refreshPrices = useCallback(
        (mode: HistoryMode) =>
            refreshCouponPrices(
                abortRef,
                requestIdRef,
                historyModeRef,
                dispatch,
                mode
            ),
        [dispatch, historyModeRef]
    );
    const cancel = useCallback(
        () => cancelCouponPriceRequest(abortRef, requestIdRef),
        []
    );
    useEffect(() => () => abortRef.current?.abort(), []);
    return { refreshPrices, cancel };
}

function useCouponPriceActions(
    dispatch: Dispatch<CouponPriceAction>,
    cancel: () => void,
    refreshPrices: (mode: HistoryMode) => Promise<void>
): CouponPriceActions {
    const restorePrices = useCallback(
        (snapshot: AuctionCalculatorSnapshot) => {
            cancel();
            dispatch({
                type: "restore",
                coupons: restoreSnapshot(snapshot).coupons,
                snapshotAt: snapshot.snapshotAt,
                feedback: "공유된 계산 상태를 복원했습니다.",
            });
        },
        [cancel, dispatch]
    );
    const resetPrices = useCallback(
        (feedback: string) => {
            cancel();
            dispatch({ type: "reset", feedback });
            void refreshPrices("replace");
        },
        [cancel, dispatch, refreshPrices]
    );
    const setManualCoupon = useCallback(
        (discount: AuctionCouponDiscount, price: string) => {
            cancel();
            dispatch({
                type: "manual",
                discount,
                price,
                snapshotAt: Math.floor(Date.now() / 1_000),
            });
        },
        [cancel, dispatch]
    );
    const setFeedback = useCallback(
        (feedback: string) => dispatch({ type: "feedback", feedback }),
        [dispatch]
    );
    return { restorePrices, resetPrices, setManualCoupon, setFeedback };
}

function useInitialCouponRefresh(
    snapshotAt: number | null,
    refreshPrices: (mode: HistoryMode) => Promise<void>
) {
    useEffect(() => {
        if (snapshotAt !== null) return;
        const timeout = window.setTimeout(
            () => void refreshPrices("replace"),
            0
        );
        return () => window.clearTimeout(timeout);
    }, [refreshPrices, snapshotAt]);
}

function useCouponPrices(initial: CouponPriceData): CouponPriceController {
    const [state, dispatch] = useReducer(couponPriceReducer, initial);
    const historyModeRef = useRef<HistoryMode>("replace");
    const { refreshPrices, cancel } = useCouponPriceRequest(
        dispatch,
        historyModeRef
    );
    const actions = useCouponPriceActions(dispatch, cancel, refreshPrices);
    useInitialCouponRefresh(initial.snapshotAt, refreshPrices);
    return { ...state, historyModeRef, refreshPrices, ...actions };
}

interface SnapshotUrlOptions {
    initialQuery: string;
    searchParamsKey: string;
    snapshot: AuctionCalculatorSnapshot | null;
    refreshing: boolean;
    historyModeRef: { current: HistoryMode };
    onRestore: (snapshot: AuctionCalculatorSnapshot) => void;
    onReset: (feedback: string) => void;
}

function useRestoreCalculatorQuery(
    options: SnapshotUrlOptions,
    representedQuery: string,
    skipWriteRef: { current: boolean },
    restoredQueryRef: { current: string }
) {
    const { searchParamsKey, onRestore, onReset } = options;
    useEffect(() => {
        if (searchParamsKey === restoredQueryRef.current) return;
        if (searchParamsKey === representedQuery) {
            restoredQueryRef.current = searchParamsKey;
            return;
        }
        restoredQueryRef.current = searchParamsKey;
        skipWriteRef.current = true;
        const parsed = parseAuctionCalculatorParams(
            new URLSearchParams(searchParamsKey)
        );
        if (parsed.status === "valid") {
            onRestore(parsed.snapshot);
            return;
        }
        onReset(
            parsed.status === "invalid"
                ? "유효하지 않은 링크를 안전한 기본 상태로 복원했습니다."
                : "새 계산을 시작합니다."
        );
    }, [
        onReset,
        onRestore,
        representedQuery,
        restoredQueryRef,
        searchParamsKey,
        skipWriteRef,
    ]);
}

function useWriteCalculatorQuery(
    options: SnapshotUrlOptions,
    representedQuery: string,
    skipWriteRef: { current: boolean },
    restoredQueryRef: { current: string }
) {
    const { snapshot, refreshing, searchParamsKey, historyModeRef } = options;
    const lastWrittenQueryRef = useRef<string | null>(null);
    useEffect(() => {
        if (skipWriteRef.current) {
            skipWriteRef.current = false;
            return;
        }
        if (!snapshot || refreshing) return;
        if (
            representedQuery === searchParamsKey ||
            representedQuery === lastWrittenQueryRef.current
        ) {
            return;
        }
        lastWrittenQueryRef.current = representedQuery;
        restoredQueryRef.current = representedQuery;
        const url = `${AUCTION_CALCULATOR_PATH}?${representedQuery}`;
        window.history[`${historyModeRef.current}State`](null, "", url);
        historyModeRef.current = "replace";
    }, [
        historyModeRef,
        refreshing,
        representedQuery,
        restoredQueryRef,
        searchParamsKey,
        skipWriteRef,
        snapshot,
    ]);
}

function useCalculatorSnapshotUrl(options: SnapshotUrlOptions) {
    const representedQuery = useMemo(
        () =>
            options.snapshot
                ? serializeAuctionCalculatorSnapshot(
                      options.snapshot
                  ).toString()
                : "",
        [options.snapshot]
    );
    const skipWriteRef = useRef(false);
    const restoredQueryRef = useRef(options.initialQuery);
    useRestoreCalculatorQuery(
        options,
        representedQuery,
        skipWriteRef,
        restoredQueryRef
    );
    useWriteCalculatorQuery(
        options,
        representedQuery,
        skipWriteRef,
        restoredQueryRef
    );
}

interface ComparisonCardsProps {
    result: AuctionCalculatorResult;
    coupons: CouponStates;
}

interface OptionCardProps {
    option: AuctionCalculatorOption;
    couponDefinition: (typeof AUCTION_COUPONS)[number] | null;
    coupon: CouponState | null;
    isRecommended: boolean;
}

interface OptionCardHeaderProps {
    label: string;
    couponDefinition: (typeof AUCTION_COUPONS)[number] | null;
    coupon: CouponState | null;
    isRecommended: boolean;
}

interface ComparisonMetricProps {
    label: string;
    value: string;
    primary?: boolean;
}

function CouponImage({ coupon }: { coupon: (typeof AUCTION_COUPONS)[number] }) {
    return (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-base-200 p-1">
            <Image
                src={getItemImageUrl(coupon.name)}
                alt={coupon.name}
                width={56}
                height={28}
                sizes="56px"
                className="object-contain"
                loading={coupon.discount === 10 ? "eager" : "lazy"}
                unoptimized
            />
        </div>
    );
}

function OptionCardHeader({
    label,
    couponDefinition,
    coupon,
    isRecommended,
}: OptionCardHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                {couponDefinition && <CouponImage coupon={couponDefinition} />}
                <div className="min-w-0">
                    <h3 className="text-lg font-bold">{label}</h3>
                    <p className="mt-1 text-xs text-base-content/70">
                        {coupon ? couponStatusText(coupon) : "항상 사용 가능"}
                    </p>
                </div>
            </div>
            {isRecommended && (
                <span className="badge badge-primary font-bold">BEST</span>
            )}
        </div>
    );
}

function ComparisonMetric({
    label,
    value,
    primary = false,
}: ComparisonMetricProps) {
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

function OptionSummaryMetrics({ option }: { option: AvailableAuctionOption }) {
    return (
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
    );
}

function OptionCostMetrics({ option }: { option: AvailableAuctionOption }) {
    const metrics = [
        ["기본 수수료율", `${option.baseFeePercent}%`],
        ["할인율", `${option.discountPercent}%`],
        ["경매 수수료", `${formatGold(option.auctionFee)} Gold`],
        ["쿠폰가", `${formatGold(option.couponCost)} Gold`],
        ["추가 비용", `${formatGold(option.additionalCost)} Gold`],
        ["나머지", `${formatGold(option.remainder)} Gold`],
    ];
    return (
        <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t pt-4">
            {metrics.map(([label, value]) => (
                <ComparisonMetric key={label} label={label} value={value} />
            ))}
        </dl>
    );
}

function OptionCard({
    option,
    couponDefinition,
    coupon,
    isRecommended,
}: OptionCardProps) {
    return (
        <article
            aria-label={`${option.label}${isRecommended ? " · BEST" : ""}`}
            className={`h-full rounded-xl p-5 ${
                isRecommended
                    ? "border-2 border-primary bg-primary/5 shadow-sm"
                    : "border"
            }`}
        >
            <OptionCardHeader
                label={option.label}
                couponDefinition={couponDefinition}
                coupon={coupon}
                isRecommended={isRecommended}
            />
            {option.available ? (
                <>
                    <OptionSummaryMetrics option={option} />
                    <OptionCostMetrics option={option} />
                </>
            ) : (
                <p className="mt-5 rounded-lg bg-base-200 p-4 text-sm">
                    쿠폰 가격을 직접 입력하면 결과를 비교할 수 있습니다.
                </p>
            )}
        </article>
    );
}

function ComparisonCards({ result, coupons }: ComparisonCardsProps) {
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
                    const definition =
                        option.discountPercent === 0
                            ? null
                            : (AUCTION_COUPONS.find(
                                  item =>
                                      item.discount === option.discountPercent
                              ) ?? null);
                    const coupon = definition
                        ? coupons[definition.discount]
                        : null;
                    return (
                        <OptionCard
                            key={option.key}
                            option={option}
                            couponDefinition={definition}
                            coupon={coupon}
                            isRecommended={
                                option.available &&
                                option.key === result.recommended.key
                            }
                        />
                    );
                })}
            </div>
        </section>
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

type SetField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
) => void;

interface CalculatorFieldsProps {
    form: FormState;
    errors: FormErrors;
    salePriceSummary?: string;
    setField: SetField;
}

function MembershipToggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex min-h-8 cursor-pointer items-center gap-2 pb-1 text-sm">
            <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={checked}
                onChange={event => onChange(event.target.checked)}
            />
            <span>멤버십 수수료 4%</span>
        </label>
    );
}

function CalculatorFields({
    form,
    errors,
    salePriceSummary,
    setField,
}: CalculatorFieldsProps) {
    return (
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
                error={errors.salePrice}
                onChange={value => setField("salePrice", value)}
            />
            <NumberField
                id="member-count"
                label="분배 인원"
                value={form.memberCount}
                min={1}
                max={MAX_MEMBER_COUNT}
                error={errors.memberCount}
                onChange={value => setField("memberCount", value)}
            />
            <NumberField
                id="additional-cost"
                label="추가 공통 비용 (Gold)"
                value={form.additionalCost}
                min={0}
                max={MAX_GOLD}
                error={errors.additionalCost}
                onChange={value => setField("additionalCost", value)}
            />
            <MembershipToggle
                checked={form.hasMembership}
                onChange={value => setField("hasMembership", value)}
            />
        </form>
    );
}

interface CouponInputsProps {
    coupons: CouponStates;
    errors: ParsedForm["couponErrors"];
    setManualCoupon: CouponPriceActions["setManualCoupon"];
}

function CouponInputs({ coupons, errors, setManualCoupon }: CouponInputsProps) {
    return (
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
                        aria-invalid={!!errors[discount]}
                        aria-describedby={`coupon-${discount}-status`}
                        onChange={event =>
                            setManualCoupon(discount, event.target.value)
                        }
                    />
                    <p
                        id={`coupon-${discount}-status`}
                        className="mt-1 text-xs text-base-content/70"
                    >
                        {couponStatusText(coupons[discount])}
                        {errors[discount] && (
                            <span className="text-error">
                                {` · ${errors[discount]}`}
                            </span>
                        )}
                    </p>
                </div>
            ))}
        </div>
    );
}

function CouponSnapshotStatus({ prices }: { prices: CouponPriceController }) {
    if (prices.snapshotAt === null && !prices.feedback) return null;
    return (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-base-content/70">
            {prices.snapshotAt !== null && (
                <p>
                    가격 기준 시각:{" "}
                    {SNAPSHOT_FORMATTER.format(prices.snapshotAt * 1_000)}
                </p>
            )}
            {prices.feedback && (
                <p
                    role={
                        prices.feedback.includes("유효하지")
                            ? "alert"
                            : "status"
                    }
                    aria-live="polite"
                >
                    {prices.feedback}
                </p>
            )}
        </div>
    );
}

function CouponPriceControls({
    prices,
    errors,
}: {
    prices: CouponPriceController;
    errors: ParsedForm["couponErrors"];
}) {
    return (
        <section aria-labelledby="coupon-prices" className="mt-3 border-t pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="coupon-prices" className="font-bold">
                    할인 쿠폰 가격
                </h2>
                <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    aria-busy={prices.refreshing}
                    onClick={() => void prices.refreshPrices("push")}
                >
                    {prices.refreshing
                        ? "조회 중 · 다시 시작"
                        : "현재 시세로 다시 계산"}
                </button>
            </div>
            <CouponInputs
                coupons={prices.coupons}
                errors={errors}
                setManualCoupon={prices.setManualCoupon}
            />
            <CouponSnapshotStatus prices={prices} />
        </section>
    );
}

interface CalculatorControlsProps extends CalculatorFieldsProps {
    couponErrors: ParsedForm["couponErrors"];
    prices: CouponPriceController;
}

function CalculatorControls({
    form,
    errors,
    couponErrors,
    salePriceSummary,
    prices,
    setField,
}: CalculatorControlsProps) {
    return (
        <div
            className="mt-5 rounded-lg border p-3 md:p-4"
            data-testid="calculator-controls"
        >
            <CalculatorFields
                form={form}
                errors={errors}
                salePriceSummary={salePriceSummary}
                setField={setField}
            />
            <CouponPriceControls prices={prices} errors={couponErrors} />
        </div>
    );
}

function CalculatorHeader({
    shareDisabled,
    onShare,
}: {
    shareDisabled: boolean;
    onShare: () => void;
}) {
    return (
        <>
            <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold">파티 분배 계산기</h1>
                <button
                    type="button"
                    className="btn btn-primary btn-sm shrink-0"
                    disabled={shareDisabled}
                    onClick={onShare}
                >
                    계산 링크 공유
                </button>
            </div>
            <p className="mt-2 text-base-content/70">
                경매 수수료, 쿠폰 구매가와 공통 비용을 뺀 뒤 파티 분배액을
                비교합니다.
            </p>
        </>
    );
}

function CalculatorResult({
    result,
    coupons,
}: {
    result: AuctionCalculatorResult | null;
    coupons: CouponStates;
}) {
    if (!result) {
        return (
            <p className="mt-6 rounded-lg border p-4" role="status">
                판매가를 포함한 필수 값을 입력하면 계산 결과가 표시됩니다.
            </p>
        );
    }
    return (
        <div className="mt-5">
            <ComparisonCards result={result} coupons={coupons} />
        </div>
    );
}

interface InitialCalculatorState {
    form: FormState;
    prices: CouponPriceData;
}

function createInitialCalculatorState(query: string): InitialCalculatorState {
    const parsed = parseAuctionCalculatorParams(new URLSearchParams(query));
    const restored =
        parsed.status === "valid"
            ? restoreSnapshot(parsed.snapshot)
            : { form: emptyForm(), coupons: couponStates("loading") };
    return {
        form: restored.form,
        prices: {
            coupons: restored.coupons,
            snapshotAt:
                parsed.status === "valid" ? parsed.snapshot.snapshotAt : null,
            refreshing: false,
            feedback:
                parsed.status === "invalid"
                    ? "유효하지 않은 공유 링크를 안전한 기본 상태로 열었습니다."
                    : "",
        },
    };
}

function useCalculatorFormUrl(
    initialQuery: string,
    searchParamsKey: string,
    snapshot: AuctionCalculatorSnapshot | null,
    refreshing: boolean,
    prices: CouponPriceController,
    setForm: Dispatch<React.SetStateAction<FormState>>
): SetField {
    const restoreUrl = useCallback(
        (value: AuctionCalculatorSnapshot) => {
            setForm(restoreSnapshot(value).form);
            prices.restorePrices(value);
        },
        [prices.restorePrices, setForm]
    );
    const resetUrl = useCallback(
        (feedback: string) => {
            setForm(emptyForm());
            prices.resetPrices(feedback);
        },
        [prices.resetPrices, setForm]
    );
    useCalculatorSnapshotUrl({
        initialQuery,
        searchParamsKey,
        snapshot,
        refreshing,
        historyModeRef: prices.historyModeRef,
        onRestore: restoreUrl,
        onReset: resetUrl,
    });
    return useCallback(
        <K extends keyof FormState>(key: K, value: FormState[K]) =>
            setForm(current => ({ ...current, [key]: value })),
        [setForm]
    );
}

interface CalculatorViewState {
    form: FormState;
    parsedForm: ParsedForm;
    result: AuctionCalculatorResult | null;
    prices: CouponPriceController;
    setField: SetField;
    salePriceSummary?: string;
}

function useAuctionCalculator(initialQuery: string): CalculatorViewState {
    const searchParamsKey = useSearchParams().toString();
    const initial = useMemo(
        () => createInitialCalculatorState(initialQuery),
        [initialQuery]
    );
    const [form, setForm] = useState<FormState>(initial.form);
    const prices = useCouponPrices(initial.prices);
    const parsedForm = useMemo(
        () => parseForm(form, prices.coupons, prices.snapshotAt),
        [form, prices.coupons, prices.snapshotAt]
    );
    const result = useMemo(
        () =>
            parsedForm.snapshot
                ? calculateAuctionDistribution(parsedForm.snapshot)
                : null,
        [parsedForm.snapshot]
    );
    const setField = useCalculatorFormUrl(
        initialQuery,
        searchParamsKey,
        parsedForm.snapshot,
        prices.refreshing,
        prices,
        setForm
    );
    const salePrice = parseIntegerField(form.salePrice, 1, MAX_GOLD);
    const salePriceSummary =
        salePrice === null
            ? undefined
            : `${formatGold(salePrice)} | ${formatKoreanAmount(salePrice)}`;
    return { form, parsedForm, result, prices, setField, salePriceSummary };
}

async function shareSnapshot(
    snapshot: AuctionCalculatorSnapshot,
    setFeedback: (feedback: string) => void
) {
    try {
        const query = serializeAuctionCalculatorSnapshot(snapshot);
        const url = new URL(
            `${AUCTION_CALCULATOR_PATH}?${query}`,
            window.location.origin
        );
        setFeedback(await shareCalculatorUrl(url.href));
    } catch {
        setFeedback("계산 링크를 공유하거나 복사하지 못했습니다.");
    }
}

function CalculatorView({ state }: { state: CalculatorViewState }) {
    const { form, parsedForm, result, prices, setField, salePriceSummary } =
        state;
    const onShare = () => {
        if (parsedForm.snapshot && !prices.refreshing) {
            void shareSnapshot(parsedForm.snapshot, prices.setFeedback);
        }
    };
    return (
        <article className="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-6">
            <CalculatorHeader
                shareDisabled={!parsedForm.snapshot || prices.refreshing}
                onShare={onShare}
            />
            <CalculatorControls
                form={form}
                errors={parsedForm.errors}
                couponErrors={parsedForm.couponErrors}
                salePriceSummary={salePriceSummary}
                prices={prices}
                setField={setField}
            />
            <CalculatorResult result={result} coupons={prices.coupons} />
            <p className="mt-6 text-sm text-base-content/70">
                Data based on Nexon Open API · 표시 가격은 조회 시점의 일부
                데이터일 수 있으며 실시간 가격이나 수익을 보장하지 않습니다.
            </p>
        </article>
    );
}

export interface AuctionCalculatorProps {
    initialQuery: string;
}

export default function AuctionCalculator({
    initialQuery,
}: AuctionCalculatorProps) {
    return <CalculatorView state={useAuctionCalculator(initialQuery)} />;
}
