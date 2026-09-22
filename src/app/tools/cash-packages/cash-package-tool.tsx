"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/tools/barter/barter-ui";
import {
    calculateCashPackage,
    type CashPackageCatalog,
    type CashPackageEntry,
    type CashPackageItem,
    cashPackageMarketItems,
    type CashPackageMarketOption,
    type CashPackageProduct,
    type CashPackageSale,
    choosePricedOption,
    type PackageResult,
    parseCashPerTenMillion,
} from "@/lib/cash-packages";

type Quote = {
    status: "loading" | "available" | "empty" | "error";
    marketUnitGold: number | null;
    fetchedAt: string | null;
    isComplete: boolean;
    availableQuantity: number;
    cause: string | null;
};
type QuoteBook = Record<string, Quote>;
type ChoiceAllocations = Record<string, Record<string, number>>;

type ViewRow = {
    item: CashPackageMarketOption &
        Partial<Pick<CashPackageItem, "secondary" | "sourceName" | "coupon">>;
    key: string;
    capacity: number;
    quantity: number;
    unitGold: number;
    priceText: string;
    manual: boolean;
    invalid: boolean;
    unresolved: boolean;
    quote: Quote;
};

type ProductView = {
    result: PackageResult | null;
    rows: ViewRow[];
};

const NUMBER = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
    signDisplay: "always",
});
const INPUT_CLASS =
    "input input-bordered h-11 min-h-11 w-full min-w-0 rounded-lg bg-base-100 px-2.5 text-right tabular-nums";
const ICON_BUTTON_CLASS =
    "btn btn-outline h-11 min-h-11 w-11 min-w-11 rounded-lg bg-base-100 p-0";
const MUTED_CLASS = "text-base-content/60";
const loadingQuote: Quote = {
    status: "loading",
    marketUnitGold: null,
    fetchedAt: null,
    isComplete: true,
    availableQuantity: 0,
    cause: null,
};

function key(productId: string, itemId: string) {
    return `${productId}:${itemId}`;
}

function choiceKey(productId: string, choiceId: string) {
    return `${productId}:${choiceId}`;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function parseGold(value: string): number | null {
    if (!/^\d{1,16}$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
}

function gold(value: number | null, signed = false) {
    if (value === null) return "—";
    const rounded = Math.round(value);
    return `${signed && rounded >= 0 ? "+" : ""}${NUMBER.format(rounded)} G`;
}

function statusCause(quote: Quote) {
    if (quote.status === "error")
        return quote.cause ?? "시세 조회에 실패했습니다.";
    if (quote.status === "empty")
        return quote.cause ?? "현재 등록된 매물이 없습니다.";
    if (!quote.isComplete) return "일부 매물만 확인한 최저가입니다.";
    return null;
}

async function fetchQuote(
    itemId: string,
    signal?: AbortSignal
): Promise<Quote> {
    try {
        const response = await fetch(
            `/api/auction/cash-package-prices?${new URLSearchParams({ item_id: itemId })}`,
            { signal }
        );
        if (!response.ok)
            throw new Error(`시세 조회 실패 (${response.status})`);
        const value: unknown = await response.json();
        if (!value || typeof value !== "object")
            throw new Error("잘못된 시세 응답");
        const data = value as Record<string, unknown>;
        if (
            (data.status !== "available" && data.status !== "empty") ||
            (data.marketUnitGold !== null &&
                (!Number.isSafeInteger(data.marketUnitGold) ||
                    (data.marketUnitGold as number) < 0)) ||
            typeof data.isComplete !== "boolean" ||
            !Number.isSafeInteger(data.availableQuantity) ||
            (data.availableQuantity as number) < 0
        ) {
            throw new Error("잘못된 시세 응답");
        }
        return {
            status: data.status,
            marketUnitGold: data.marketUnitGold as number | null,
            fetchedAt:
                typeof data.fetchedAt === "string" ? data.fetchedAt : null,
            isComplete: data.isComplete,
            availableQuantity: data.availableQuantity as number,
            cause: typeof data.cause === "string" ? data.cause : null,
        };
    } catch (error) {
        if (signal?.aborted) throw error;
        return {
            ...loadingQuote,
            status: "error",
            cause:
                error instanceof Error
                    ? error.message
                    : "시세 조회에 실패했습니다.",
        };
    }
}

async function fetchQuoteWithRetry(itemId: string, signal?: AbortSignal) {
    let quote = loadingQuote;
    for (let attempt = 0; attempt < 5; attempt++) {
        signal?.throwIfAborted();
        quote = await fetchQuote(itemId, signal);
        if (quote.status !== "error") return quote;
        if (attempt < 4)
            await new Promise(resolve =>
                setTimeout(resolve, 150 * (attempt + 1))
            );
    }
    return quote;
}

async function fetchQuotes(itemIds: string[], signal: AbortSignal) {
    const quotes: QuoteBook = {};
    for (const itemId of itemIds)
        quotes[itemId] = await fetchQuoteWithRetry(itemId, signal);
    return quotes;
}

function Quantity({
    label,
    value,
    min,
    max,
    setValue,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    setValue: (value: number) => void;
}) {
    return (
        <span className="join inline-grid grid-cols-[44px_58px_44px] overflow-hidden rounded-lg border border-base-300 bg-base-100">
            <button
                type="button"
                className="btn btn-ghost join-item h-11 min-h-11 w-11 min-w-11 rounded-none p-0"
                aria-label={`${label} 줄이기`}
                disabled={value <= min}
                onClick={() => setValue(value - 1)}
            >
                <Minus size={15} aria-hidden="true" />
            </button>
            <input
                className="input join-item h-11 min-h-11 w-[58px] min-w-0 rounded-none border-y-0 border-x border-base-300 px-1 text-center tabular-nums"
                aria-label={label}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                step={1}
                value={value}
                onChange={event => {
                    const next = Number(event.target.value);
                    if (Number.isSafeInteger(next))
                        setValue(clamp(next, min, max));
                }}
            />
            <button
                type="button"
                className="btn btn-ghost join-item h-11 min-h-11 w-11 min-w-11 rounded-none p-0"
                aria-label={`${label} 늘리기`}
                disabled={value >= max}
                onClick={() => setValue(value + 1)}
            >
                <Plus size={15} aria-hidden="true" />
            </button>
        </span>
    );
}

function ResultValue({
    value,
    loading,
    signed = false,
}: {
    value: number | null;
    loading: boolean;
    signed?: boolean;
}) {
    return loading ? (
        <span
            className="skeleton inline-block h-[0.9em] w-[72%] rounded-[5px] motion-reduce:animate-none"
            aria-label="조회 중"
        />
    ) : value === null ? (
        <span className="[font-family:Arial,sans-serif]">—</span>
    ) : (
        <>{gold(value, signed)}</>
    );
}

function PackageCard({
    product,
    view,
    selected,
    loading,
    select,
    retrying,
    retryUnresolved,
}: {
    product: CashPackageProduct;
    view: ProductView;
    selected: boolean;
    loading: boolean;
    select: () => void;
    retrying: boolean;
    retryUnresolved: () => void;
}) {
    const result = view.result;
    const profit = result?.profitGold ?? null;
    const profitColor =
        profit === null ? "" : profit >= 0 ? "text-success" : "text-error";
    return (
        <article
            className={`card relative min-w-0 overflow-hidden rounded-xl border bg-base-100 ${
                selected
                    ? "border-primary bg-[color-mix(in_oklab,var(--color-primary)_5%,var(--color-base-100))] shadow-[inset_0_0_0_1px_var(--color-primary)]"
                    : "border-base-300"
            }`}
        >
            <button
                type="button"
                className="grid min-h-[238px] w-full gap-[13px] p-4 text-left focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-primary max-[700px]:min-h-0 max-[700px]:grid-cols-[minmax(135px,1fr)_minmax(130px,1fr)] max-[700px]:gap-x-3 max-[700px]:gap-y-2 max-[700px]:px-3.5 max-[700px]:py-3"
                aria-pressed={selected}
                onClick={select}
            >
                <span className="flex items-center gap-3">
                    <Image
                        className="h-16 w-16 object-contain max-[700px]:h-11 max-[700px]:w-11"
                        src={product.imageUrl}
                        width={72}
                        height={72}
                        alt=""
                        priority={product.id === "sodamhan"}
                    />
                    <span>
                        <strong className="block text-[17px] max-[700px]:text-[15px]">
                            {product.name}
                        </strong>
                        <small className={`block text-xs ${MUTED_CLASS}`}>
                            {NUMBER.format(product.cashPrice)} 캐시
                        </small>
                    </span>
                </span>
                <span className="self-auto text-right tabular-nums max-[700px]:self-center">
                    <small className={`block text-xs ${MUTED_CLASS}`}>
                        예상 손익
                    </small>
                    <strong
                        className={`block min-h-[31px] text-[23px] leading-[1.35] max-[700px]:text-lg ${profitColor}`}
                    >
                        <ResultValue value={profit} loading={loading} signed />
                    </strong>
                    <span
                        className={`block min-h-[23px] text-[13px] ${profitColor}`}
                    >
                        {loading ||
                        result?.profitPercent === null ||
                        !result ? (
                            loading ? (
                                "조회 중"
                            ) : (
                                <span className="[font-family:Arial,sans-serif]">
                                    —
                                </span>
                            )
                        ) : (
                            `${PERCENT.format(result.profitPercent)}%`
                        )}
                    </span>
                </span>
                <span className="grid grid-cols-2 gap-3 border-t border-base-300 pt-[11px] text-right tabular-nums max-[700px]:col-span-full max-[700px]:pt-2">
                    <span>
                        <small className={`block text-xs ${MUTED_CLASS}`}>
                            환산 비용
                        </small>
                        <b className="block min-h-[23px] [overflow-wrap:anywhere]">
                            <ResultValue
                                value={result?.goldCost ?? null}
                                loading={loading}
                            />
                        </b>
                    </span>
                    <span>
                        <small className={`block text-xs ${MUTED_CLASS}`}>
                            예상 수령
                        </small>
                        <b className="block min-h-[23px] [overflow-wrap:anywhere]">
                            <ResultValue
                                value={result?.netGold ?? null}
                                loading={loading}
                            />
                        </b>
                    </span>
                </span>
            </button>
            {!loading && (result?.unpricedCount ?? 0) > 0 && (
                <button
                    type="button"
                    className="btn btn-warning absolute top-2.5 right-2.5 h-11 min-h-11 gap-1 rounded-md px-[9px] text-[11px] font-bold max-[700px]:top-1/2 max-[700px]:right-[7px] max-[700px]:-translate-y-1/2"
                    aria-label={`${product.name} 미확인 ${result!.unpricedCount}개 다시 조회`}
                    disabled={retrying}
                    onClick={retryUnresolved}
                >
                    <RefreshCw size={14} aria-hidden="true" />
                    {retrying ? "조회 중" : `미확인 ${result!.unpricedCount}`}
                </button>
            )}
        </article>
    );
}

function ItemRow({
    row,
    setQuantity,
    setPrice,
    restorePrice,
    retry,
}: {
    row: ViewRow;
    setQuantity: (value: number) => void;
    setPrice: (value: string) => void;
    restorePrice: () => void;
    retry: () => void;
}) {
    const [open, setOpen] = useState(false);
    const issue = !row.manual ? statusCause(row.quote) : null;
    return (
        <div
            className="grid scroll-mt-[84px] grid-cols-[minmax(250px,1.4fr)_minmax(100px,0.45fr)_minmax(190px,0.8fr)_minmax(130px,0.55fr)] items-end gap-3.5 border-b border-base-300 px-[18px] py-3.5 last:border-b-0 max-[900px]:grid-cols-[minmax(180px,1.2fr)_minmax(82px,0.45fr)_minmax(145px,0.8fr)_minmax(105px,0.55fr)] max-[700px]:grid-cols-2 max-[700px]:gap-2.5 max-[700px]:p-3.5 max-[390px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
            onKeyDown={event => {
                if (event.key === "Escape") setOpen(false);
            }}
        >
            <div className="flex min-h-11 min-w-0 items-center gap-2.5 max-[700px]:col-span-full">
                <MaterialIcon id={0} name={row.item.name} />
                <span className="min-w-0">
                    <strong className="block text-[13px] [overflow-wrap:anywhere]">
                        {row.item.name}
                    </strong>
                    {(row.item.sourceName || row.item.secondary) && (
                        <small
                            className={`block text-[11px] [overflow-wrap:anywhere] ${MUTED_CLASS}`}
                        >
                            {row.item.secondary ??
                                `${row.item.sourceName} 개봉 결과`}
                        </small>
                    )}
                </span>
            </div>
            <label className="grid min-w-0 gap-1">
                <span className={`text-[11px] ${MUTED_CLASS}`}>판매 수량</span>
                <input
                    className={INPUT_CLASS}
                    aria-label={`${row.item.name} 판매 수량`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={row.capacity}
                    step={1}
                    value={row.quantity}
                    onChange={event => {
                        const value = Number(event.target.value);
                        if (Number.isSafeInteger(value))
                            setQuantity(clamp(value, 0, row.capacity));
                    }}
                />
            </label>
            <div className="flex items-end gap-1.5 max-[700px]:min-w-0">
                <label className="grid min-w-0 flex-1 gap-1">
                    <span className={`text-[11px] ${MUTED_CLASS}`}>
                        개당 가격
                    </span>
                    <input
                        className={`${INPUT_CLASS} ${row.invalid ? "input-error" : ""}`}
                        aria-label={`${row.item.name} 단가`}
                        inputMode="numeric"
                        value={
                            row.quote.status === "loading" && !row.manual
                                ? ""
                                : row.priceText
                        }
                        placeholder={
                            row.quote.status === "loading" ? "조회 중" : "0"
                        }
                        aria-invalid={row.invalid}
                        onChange={event => setPrice(event.target.value)}
                    />
                </label>
                {row.manual && (
                    <button
                        type="button"
                        className={ICON_BUTTON_CLASS}
                        aria-label={`${row.item.name} 자동 가격 복원`}
                        onClick={restorePrice}
                    >
                        <RotateCcw size={16} aria-hidden="true" />
                    </button>
                )}
                {issue && (
                    <button
                        type="button"
                        className="btn btn-warning h-11 min-h-11 w-11 min-w-11 rounded-lg p-0"
                        aria-label={`${row.item.name} 시세 상태 확인`}
                        aria-expanded={open}
                        onClick={() => setOpen(value => !value)}
                    >
                        <AlertTriangle size={17} aria-hidden="true" />
                    </button>
                )}
            </div>
            <div className="grid min-w-0 gap-1 text-right tabular-nums max-[700px]:col-span-full max-[700px]:grid-cols-[auto_1fr] max-[700px]:items-center">
                <span className={`text-[11px] ${MUTED_CLASS}`}>소계</span>
                <strong className="flex min-h-11 items-center justify-end [overflow-wrap:anywhere] max-[700px]:min-h-7">
                    {gold(row.quantity * row.unitGold)}
                </strong>
            </div>
            {row.invalid && (
                <p className="col-start-3 text-[11px] text-error max-[900px]:[grid-column:3/5] max-[700px]:[grid-column:1/-1]">
                    0 이상의 정수로 입력해 주세요.
                </p>
            )}
            {open && issue && (
                <div
                    className="alert col-span-full flex items-center justify-between gap-3 rounded-lg bg-base-200 px-3 py-[9px] text-xs"
                    role="status"
                >
                    <span>{issue}</span>
                    <button
                        type="button"
                        className="btn btn-ghost h-11 min-h-11 px-3 font-bold text-primary"
                        onClick={retry}
                    >
                        다시 조회
                    </button>
                </div>
            )}
        </div>
    );
}

function entryRows(entry: CashPackageEntry) {
    return entry.kind === "item" ? [entry] : entry.options;
}

export default function CashPackageTool({
    catalog,
}: {
    catalog: CashPackageCatalog;
}) {
    const marketItems = useMemo(
        () => cashPackageMarketItems(catalog),
        [catalog]
    );
    const itemIds = useMemo(
        () => marketItems.map(item => item.itemId),
        [marketItems]
    );
    const queryKey = useMemo(
        () => ["cash-package-prices", ...itemIds],
        [itemIds]
    );
    const queryClient = useQueryClient();
    const quotesQuery = useQuery({
        queryKey,
        queryFn: ({ signal }) => fetchQuotes(itemIds, signal),
        placeholderData: previous => previous,
    });
    const quotes = quotesQuery.data ?? {};
    const initialLoading = quotesQuery.isPending;
    const [selectedId, setSelectedId] = useState(catalog.products[0].id);
    const [rate, setRate] = useState("");
    const [membership, setMembership] = useState(false);
    const [purchases, setPurchases] = useState<Record<string, number>>({});
    const [saleQuantities, setSaleQuantities] = useState<
        Record<string, number>
    >({});
    const [manualPrices, setManualPrices] = useState<Record<string, string>>(
        {}
    );
    const [choices, setChoices] = useState<ChoiceAllocations>({});
    const [retryingProductIds, setRetryingProductIds] = useState<Set<string>>(
        () => new Set()
    );
    const cashPerTenMillion = parseCashPerTenMillion(rate);
    const rateInvalid = rate.trim() !== "" && cashPerTenMillion === null;

    useEffect(() => {
        if (!quotesQuery.data) return;
        setChoices(previous => {
            const next = { ...previous };
            let changed = false;
            for (const product of catalog.products) {
                const purchase = purchases[product.id] ?? 1;
                for (const entry of product.entries) {
                    if (entry.kind !== "choice") continue;
                    const groupKey = choiceKey(product.id, entry.id);
                    if (next[groupKey]) continue;
                    const priceStates = Object.fromEntries(
                        entry.options.map(option => [
                            option.itemId,
                            {
                                ...quotes[option.itemId],
                                manualUnitGold: null,
                            },
                        ])
                    );
                    const selected = choosePricedOption(
                        entry.options,
                        priceStates
                    );
                    next[groupKey] = Object.fromEntries(
                        entry.options.map(option => [
                            option.itemId,
                            option.itemId === selected
                                ? entry.quantity * purchase
                                : 0,
                        ])
                    );
                    changed = true;
                }
            }
            return changed ? next : previous;
        });
    }, [catalog.products, purchases, quotes, quotesQuery.data]);

    const views = useMemo(() => {
        return Object.fromEntries(
            catalog.products.map(product => {
                const purchase = purchases[product.id] ?? 1;
                const rows: ViewRow[] = [];
                for (const entry of product.entries) {
                    for (const item of entryRows(entry)) {
                        const rowKey = key(product.id, item.itemId);
                        const capacity = entry.quantity * purchase;
                        const selectedChoice =
                            entry.kind === "choice"
                                ? choices[choiceKey(product.id, entry.id)]
                                : undefined;
                        const defaultChoice =
                            entry.kind === "choice" && !selectedChoice
                                ? choosePricedOption(
                                      entry.options,
                                      Object.fromEntries(
                                          entry.options.map(option => [
                                              option.itemId,
                                              {
                                                  ...quotes[option.itemId],
                                                  manualUnitGold: null,
                                              },
                                          ])
                                      )
                                  )
                                : null;
                        const desired =
                            entry.kind === "choice"
                                ? (selectedChoice?.[item.itemId] ??
                                  (defaultChoice === item.itemId
                                      ? capacity
                                      : 0))
                                : (saleQuantities[rowKey] ?? capacity);
                        const manual = Object.hasOwn(manualPrices, rowKey);
                        const priceText = manual
                            ? manualPrices[rowKey]
                            : (quotes[
                                  item.itemId
                              ]?.marketUnitGold?.toString() ?? "0");
                        const parsed = parseGold(priceText);
                        const quote = quotes[item.itemId] ?? loadingQuote;
                        rows.push({
                            item: {
                                ...item,
                                ...(entry.kind === "item"
                                    ? {
                                          sourceName: entry.sourceName,
                                          secondary: entry.secondary,
                                          coupon: entry.coupon,
                                      }
                                    : {}),
                            },
                            key: rowKey,
                            capacity,
                            quantity: clamp(desired, 0, capacity),
                            unitGold: parsed ?? 0,
                            priceText,
                            manual,
                            invalid: manual && parsed === null,
                            unresolved:
                                desired > 0 &&
                                !manual &&
                                quote.status !== "available",
                            quote,
                        });
                    }
                }

                const couponStock =
                    rows.find(row => row.item.coupon)?.capacity ?? 0;
                const sales: CashPackageSale[] = rows.map(row => ({
                    itemId: row.item.itemId,
                    quantity: row.quantity,
                    unitGold: row.unitGold,
                    saleCount: row.quantity ? 1 : 0,
                    couponCount: 0,
                    priced:
                        !row.invalid &&
                        (row.manual || row.quote.status === "available"),
                    isCoupon: row.item.coupon,
                }));
                let result: PackageResult | null = null;
                if (!rows.some(row => row.invalid)) {
                    try {
                        result = calculateCashPackage({
                            cashPrice: product.cashPrice,
                            purchaseQuantity: purchase,
                            cashPerTenMillion,
                            hasMembership: membership,
                            couponStock,
                            sales,
                        });
                    } catch {
                        result = null;
                    }
                }
                return [product.id, { result, rows }];
            })
        );
    }, [
        catalog.products,
        choices,
        cashPerTenMillion,
        manualPrices,
        membership,
        purchases,
        quotes,
        saleQuantities,
    ]);

    const selected = catalog.products.find(
        product => product.id === selectedId
    )!;
    const selectedView = views[selected.id];

    function setPurchase(product: CashPackageProduct, nextPurchase: number) {
        const current = purchases[product.id] ?? 1;
        setPurchases(values => ({ ...values, [product.id]: nextPurchase }));
        setSaleQuantities(values => {
            const next = { ...values };
            for (const entry of product.entries) {
                if (entry.kind !== "item") continue;
                const rowKey = key(product.id, entry.itemId);
                if (Object.hasOwn(next, rowKey))
                    next[rowKey] = Math.min(
                        next[rowKey],
                        entry.quantity * nextPurchase
                    );
            }
            return next;
        });
        setChoices(values => {
            const next = { ...values };
            for (const entry of product.entries) {
                if (entry.kind !== "choice") continue;
                const groupKey = choiceKey(product.id, entry.id);
                const oldCapacity = entry.quantity * current;
                const capacity = entry.quantity * nextPurchase;
                const initialOption = choosePricedOption(
                    entry.options,
                    Object.fromEntries(
                        entry.options.map(option => [
                            option.itemId,
                            {
                                ...quotes[option.itemId],
                                manualUnitGold: null,
                            },
                        ])
                    )
                );
                const allocation = next[groupKey]
                    ? { ...next[groupKey] }
                    : Object.fromEntries(
                          entry.options.map(option => [
                              option.itemId,
                              option.itemId === initialOption ? oldCapacity : 0,
                          ])
                      );
                let allocated = entry.options.reduce(
                    (sum, option) => sum + (allocation[option.itemId] ?? 0),
                    0
                );
                if (capacity > oldCapacity) {
                    const target =
                        entry.options.find(
                            option => allocation[option.itemId] > 0
                        )?.itemId ?? entry.options[0].itemId;
                    allocation[target] =
                        (allocation[target] ?? 0) + (capacity - oldCapacity);
                } else if (allocated > capacity) {
                    for (const option of [...entry.options].reverse()) {
                        const remove = Math.min(
                            allocation[option.itemId] ?? 0,
                            allocated - capacity
                        );
                        allocation[option.itemId] =
                            (allocation[option.itemId] ?? 0) - remove;
                        allocated -= remove;
                    }
                }
                next[groupKey] = allocation;
            }
            return next;
        });
    }

    function setRowQuantity(row: ViewRow, value: number) {
        const choice = selected.entries.find(
            entry =>
                entry.kind === "choice" &&
                entry.options.some(option => option.itemId === row.item.itemId)
        );
        if (choice?.kind === "choice") {
            const groupKey = choiceKey(selected.id, choice.id);
            setChoices(values => {
                const allocation = { ...(values[groupKey] ?? {}) };
                const others = choice.options.reduce(
                    (sum, option) =>
                        sum +
                        (option.itemId === row.item.itemId
                            ? 0
                            : (allocation[option.itemId] ?? 0)),
                    0
                );
                allocation[row.item.itemId] = Math.min(
                    value,
                    row.capacity - others
                );
                return { ...values, [groupKey]: allocation };
            });
        } else {
            setSaleQuantities(values => ({ ...values, [row.key]: value }));
        }
    }

    async function retryItems(itemIds: string[]) {
        queryClient.setQueryData<QuoteBook>(queryKey, previous => ({
            ...(previous ?? {}),
            ...Object.fromEntries(
                itemIds.map(itemId => [
                    itemId,
                    {
                        ...(previous?.[itemId] ?? loadingQuote),
                        status: "loading",
                    },
                ])
            ),
        }));
        for (const itemId of itemIds) {
            const quote = await fetchQuoteWithRetry(itemId);
            queryClient.setQueryData<QuoteBook>(queryKey, previous => ({
                ...(previous ?? {}),
                [itemId]: quote,
            }));
        }
    }

    async function retryUnresolved(product: CashPackageProduct) {
        setSelectedId(product.id);
        const itemIds = [
            ...new Set(
                views[product.id].rows
                    .filter(row => row.unresolved)
                    .map(row => row.item.itemId)
            ),
        ];
        if (!itemIds.length) return;
        setRetryingProductIds(values => new Set(values).add(product.id));
        try {
            await retryItems(itemIds);
        } finally {
            setRetryingProductIds(values => {
                const next = new Set(values);
                next.delete(product.id);
                return next;
            });
        }
    }

    return (
        <div className="mx-auto max-w-[1280px] px-6 pt-6 pb-16 text-sm leading-[1.6] text-base-content [&_*]:box-border [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45">
            <header className="mb-[22px] grid gap-[18px]">
                <div className="flex items-center justify-between gap-3 max-[390px]:items-start">
                    <h1 className="text-3xl leading-[1.2] font-bold max-[700px]:text-2xl">
                        캐시 패키지 비교
                    </h1>
                    <button
                        type="button"
                        className="btn btn-outline h-11 min-h-11 gap-1.5 rounded-lg px-3.5 font-semibold max-[390px]:px-2.5"
                        aria-label="시세 새로고침"
                        aria-busy={quotesQuery.isFetching}
                        disabled={quotesQuery.isFetching}
                        onClick={() => void quotesQuery.refetch()}
                    >
                        <RefreshCw size={17} aria-hidden="true" />
                        {quotesQuery.isFetching ? "조회 중" : "새로고침"}
                    </button>
                </div>
                <div className="card flex flex-row items-center justify-start gap-3 rounded-xl border border-base-300 bg-base-100 px-[18px] py-4 max-[700px]:flex-col max-[700px]:items-stretch">
                    <label className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1.5 font-bold max-[700px]:grid-cols-1">
                        <span>환산 기준</span>
                        <span className="flex min-w-0 items-center gap-2 font-normal max-[390px]:grid max-[390px]:grid-cols-[auto_1fr_auto]">
                            <b className="whitespace-nowrap">1,000만 G =</b>
                            <input
                                className={`${INPUT_CLASS} max-w-[140px] max-[700px]:max-w-none ${rateInvalid ? "input-error" : ""}`}
                                aria-label="1,000만 골드당 캐시"
                                inputMode="numeric"
                                placeholder="입력"
                                value={rate}
                                aria-invalid={rateInvalid}
                                onChange={event => setRate(event.target.value)}
                            />
                            <b className="whitespace-nowrap">캐시</b>
                        </span>
                        {rateInvalid && (
                            <small className="col-start-2 text-xs text-error max-[700px]:col-start-1">
                                0보다 큰 정수를 입력해 주세요.
                            </small>
                        )}
                    </label>
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-l border-base-300 pl-[18px] max-[700px]:border-t max-[700px]:border-l-0 max-[700px]:pt-2 max-[700px]:pl-0">
                        <input
                            className="checkbox checkbox-sm"
                            type="checkbox"
                            checked={membership}
                            onChange={event =>
                                setMembership(event.target.checked)
                            }
                        />
                        멤버십 수수료 4%
                    </label>
                </div>
            </header>

            <section
                className="mb-[22px] grid grid-cols-3 gap-3.5 max-[700px]:grid-cols-1 max-[700px]:gap-2"
                aria-label="패키지 비교"
            >
                {catalog.products.map(product => (
                    <PackageCard
                        key={product.id}
                        product={product}
                        view={views[product.id]}
                        selected={product.id === selectedId}
                        loading={initialLoading}
                        select={() => setSelectedId(product.id)}
                        retrying={retryingProductIds.has(product.id)}
                        retryUnresolved={() => void retryUnresolved(product)}
                    />
                ))}
            </section>

            <section
                className="card mb-[22px] min-w-0 overflow-hidden rounded-xl border border-base-300 bg-base-100"
                aria-labelledby="contents-title"
            >
                <div className="flex min-h-[76px] items-center justify-between gap-3 border-b border-base-300 px-5 py-[15px] max-[700px]:items-start max-[390px]:flex-col">
                    <div>
                        <h2 id="contents-title" className="text-lg font-bold">
                            {selected.name} 구성품
                        </h2>
                        <span className={`text-xs ${MUTED_CLASS}`}>
                            {NUMBER.format(selected.cashPrice)} 캐시
                        </span>
                    </div>
                    <label className="flex items-center justify-end gap-3 text-xs font-bold max-[700px]:flex-col max-[700px]:items-end max-[390px]:w-full max-[390px]:flex-row max-[390px]:items-center">
                        구매 수량
                        <Quantity
                            label={`${selected.name} 구매 수량`}
                            value={purchases[selected.id] ?? 1}
                            min={1}
                            max={100}
                            setValue={value => setPurchase(selected, value)}
                        />
                    </label>
                </div>
                <div className="grid">
                    {selected.entries.map(entry => {
                        const rows = entryRows(entry).map(item =>
                            selectedView.rows.find(
                                row => row.item.itemId === item.itemId
                            )
                        ) as ViewRow[];
                        const content = rows.map(row => (
                            <ItemRow
                                key={row.key}
                                row={row}
                                setQuantity={value =>
                                    setRowQuantity(row, value)
                                }
                                setPrice={value =>
                                    setManualPrices(prices => ({
                                        ...prices,
                                        [row.key]: value,
                                    }))
                                }
                                restorePrice={() =>
                                    setManualPrices(prices => {
                                        const next = { ...prices };
                                        delete next[row.key];
                                        return next;
                                    })
                                }
                                retry={() => void retryItems([row.item.itemId])}
                            />
                        ));
                        return entry.kind === "choice" ? (
                            <div
                                className="border-b border-base-300 bg-base-200/45"
                                key={entry.id}
                            >
                                <h3 className="px-[18px] pt-[11px] text-xs font-bold">
                                    {entry.name}
                                </h3>
                                <div>{content}</div>
                            </div>
                        ) : (
                            content
                        );
                    })}
                </div>
            </section>

            <section
                className="card min-w-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 p-5 max-[700px]:px-3.5 max-[700px]:py-4"
                aria-labelledby="settlement-title"
            >
                <div className="flex items-center justify-between gap-3 max-[390px]:flex-col max-[390px]:items-start">
                    <h2 id="settlement-title" className="text-lg font-bold">
                        정산
                    </h2>
                    <strong className="text-2xl tabular-nums max-[700px]:text-[19px]">
                        <ResultValue
                            value={selectedView.result?.netGold ?? null}
                            loading={initialLoading}
                        />
                    </strong>
                </div>
                <dl className="my-4 grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
                    <div className="rounded-[9px] bg-base-200 p-3.5 text-right">
                        <dt className={`text-[11px] ${MUTED_CLASS}`}>
                            총 판매액
                        </dt>
                        <dd className="min-h-[29px] text-lg font-bold tabular-nums">
                            <ResultValue
                                value={selectedView.result?.grossGold ?? null}
                                loading={initialLoading}
                            />
                        </dd>
                    </div>
                    <div className="rounded-[9px] bg-base-200 p-3.5 text-right">
                        <dt className={`text-[11px] ${MUTED_CLASS}`}>수수료</dt>
                        <dd className="min-h-[29px] text-lg font-bold tabular-nums">
                            <ResultValue
                                value={selectedView.result?.feeGold ?? null}
                                loading={initialLoading}
                            />
                        </dd>
                    </div>
                    <div className="rounded-[9px] bg-base-200 p-3.5 text-right">
                        <dt className={`text-[11px] ${MUTED_CLASS}`}>
                            예상 수령
                        </dt>
                        <dd className="min-h-[29px] text-lg font-bold tabular-nums">
                            <ResultValue
                                value={selectedView.result?.netGold ?? null}
                                loading={initialLoading}
                            />
                        </dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
