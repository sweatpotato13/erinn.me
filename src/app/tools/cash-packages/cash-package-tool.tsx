"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/tools/barter/barter-ui";
import preparation from "@/components/tools/preparation.module.css";
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
    parseReferenceGold,
} from "@/lib/cash-packages";

import styles from "./cash-package-tool.module.css";

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
    saleCount: number;
    couponCount: number;
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
    couponStock: number;
};

const NUMBER = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
    signDisplay: "always",
});
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

async function fetchQuotes(itemIds: string[], signal: AbortSignal) {
    const quotes: QuoteBook = {};
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(3, itemIds.length) }, async () => {
            while (next < itemIds.length) {
                const itemId = itemIds[next++];
                quotes[itemId] = await fetchQuote(itemId, signal);
            }
        })
    );
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
        <span className={styles.stepper}>
            <button
                type="button"
                aria-label={`${label} 줄이기`}
                disabled={value <= min}
                onClick={() => setValue(value - 1)}
            >
                <Minus size={15} aria-hidden="true" />
            </button>
            <input
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
        <span className={styles.skeleton} aria-label="조회 중" />
    ) : value === null ? (
        <span className={styles.dash}>—</span>
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
    openUnresolved,
}: {
    product: CashPackageProduct;
    view: ProductView;
    selected: boolean;
    loading: boolean;
    select: () => void;
    openUnresolved: () => void;
}) {
    const result = view.result;
    const profit = result?.profitGold ?? null;
    return (
        <article className={styles.card} data-selected={selected}>
            <button
                type="button"
                className={styles.cardButton}
                aria-pressed={selected}
                onClick={select}
            >
                <span className={styles.productHead}>
                    <Image
                        src={product.imageUrl}
                        width={72}
                        height={72}
                        alt=""
                        priority={product.id === "sodamhan"}
                    />
                    <span>
                        <strong>{product.name}</strong>
                        <small>{NUMBER.format(product.cashPrice)} 캐시</small>
                    </span>
                </span>
                <span
                    className={styles.profit}
                    data-sign={
                        profit === null
                            ? "none"
                            : profit >= 0
                              ? "profit"
                              : "loss"
                    }
                >
                    <small>예상 손익</small>
                    <strong>
                        <ResultValue value={profit} loading={loading} signed />
                    </strong>
                    <span>
                        {loading ||
                        result?.profitPercent === null ||
                        !result ? (
                            loading ? (
                                "조회 중"
                            ) : (
                                <span className={styles.dash}>—</span>
                            )
                        ) : (
                            `${PERCENT.format(result.profitPercent)}%`
                        )}
                    </span>
                </span>
                <span className={styles.cardStats}>
                    <span>
                        <small>환산 비용</small>
                        <b>
                            <ResultValue
                                value={result?.goldCost ?? null}
                                loading={loading}
                            />
                        </b>
                    </span>
                    <span>
                        <small>예상 수령</small>
                        <b>
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
                    className={styles.unresolvedBadge}
                    onClick={openUnresolved}
                >
                    미확인 {result!.unpricedCount}
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
            id={`cash-item-${row.key}`}
            className={styles.itemRow}
            data-unresolved={row.unresolved || undefined}
            tabIndex={row.unresolved ? -1 : undefined}
            onKeyDown={event => {
                if (event.key === "Escape") setOpen(false);
            }}
        >
            <div className={styles.itemName}>
                <MaterialIcon id={0} name={row.item.name} />
                <span>
                    <strong>{row.item.name}</strong>
                    {(row.item.sourceName || row.item.secondary) && (
                        <small>
                            {row.item.secondary ??
                                `${row.item.sourceName} 개봉 결과`}
                        </small>
                    )}
                </span>
            </div>
            <label className={styles.field}>
                <span>판매 수량</span>
                <input
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
            <div className={styles.priceField}>
                <label className={styles.field}>
                    <span>개당 가격</span>
                    <input
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
                        className={styles.iconButton}
                        aria-label={`${row.item.name} 자동 가격 복원`}
                        onClick={restorePrice}
                    >
                        <RotateCcw size={16} aria-hidden="true" />
                    </button>
                )}
                {issue && (
                    <button
                        type="button"
                        className={styles.warningButton}
                        aria-label={`${row.item.name} 시세 상태 확인`}
                        aria-expanded={open}
                        onClick={() => setOpen(value => !value)}
                    >
                        <AlertTriangle size={17} aria-hidden="true" />
                    </button>
                )}
            </div>
            <div className={styles.subtotal}>
                <span>소계</span>
                <strong>{gold(row.quantity * row.unitGold)}</strong>
            </div>
            {row.invalid && (
                <p className={styles.rowMessage}>
                    0 이상의 정수로 입력해 주세요.
                </p>
            )}
            {open && issue && (
                <div className={styles.issue} role="status">
                    <span>{issue}</span>
                    <button type="button" onClick={retry}>
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
    const [saleCounts, setSaleCounts] = useState<Record<string, number>>({});
    const [couponCounts, setCouponCounts] = useState<Record<string, number>>(
        {}
    );
    const [manualPrices, setManualPrices] = useState<Record<string, string>>(
        {}
    );
    const [choices, setChoices] = useState<ChoiceAllocations>({});
    const referenceGold = parseReferenceGold(rate);
    const rateInvalid = rate.trim() !== "" && referenceGold === null;

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
                            saleCount: 0,
                            couponCount: 0,
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
                let couponRemaining = couponStock;
                for (const row of rows) {
                    if (row.item.coupon) continue;
                    row.saleCount = row.quantity
                        ? clamp(saleCounts[row.key] ?? 1, 1, row.quantity)
                        : 0;
                    row.couponCount = clamp(
                        couponCounts[row.key] ?? 0,
                        0,
                        Math.min(row.saleCount, couponRemaining)
                    );
                    couponRemaining -= row.couponCount;
                }
                const couponsUsed = couponStock - couponRemaining;
                for (const row of rows) {
                    if (row.item.coupon)
                        row.quantity = Math.min(
                            row.quantity,
                            couponStock - couponsUsed
                        );
                    if (row.item.coupon || row.saleCount === 0)
                        row.saleCount = row.quantity
                            ? clamp(saleCounts[row.key] ?? 1, 1, row.quantity)
                            : 0;
                    row.unresolved =
                        row.quantity > 0 &&
                        !row.manual &&
                        row.quote.status !== "available";
                }
                const sales: CashPackageSale[] = rows.map(row => ({
                    itemId: row.item.itemId,
                    quantity: row.quantity,
                    unitGold: row.unitGold,
                    saleCount: row.saleCount,
                    couponCount: row.couponCount,
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
                            referenceGold,
                            hasMembership: membership,
                            couponStock,
                            sales,
                        });
                    } catch {
                        result = null;
                    }
                }
                return [product.id, { result, rows, couponStock }];
            })
        );
    }, [
        catalog.products,
        choices,
        couponCounts,
        manualPrices,
        membership,
        purchases,
        quotes,
        referenceGold,
        saleCounts,
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

    async function retry(itemId: string) {
        queryClient.setQueryData<QuoteBook>(queryKey, previous => ({
            ...(previous ?? {}),
            [itemId]: {
                ...(previous?.[itemId] ?? loadingQuote),
                status: "loading",
            },
        }));
        const quote = await fetchQuote(itemId);
        queryClient.setQueryData<QuoteBook>(queryKey, previous => ({
            ...(previous ?? {}),
            [itemId]: quote,
        }));
    }

    function focusUnresolved(product: CashPackageProduct) {
        setSelectedId(product.id);
        window.setTimeout(() => {
            document
                .querySelector<HTMLElement>("[data-unresolved='true']")
                ?.focus();
        });
    }

    return (
        <main className={preparation.page}>
            <header className={styles.header}>
                <div className={styles.titleLine}>
                    <h1>캐시 패키지 비교</h1>
                    <button
                        type="button"
                        className={styles.refresh}
                        aria-label="시세 새로고침"
                        aria-busy={quotesQuery.isFetching}
                        disabled={quotesQuery.isFetching}
                        onClick={() => void quotesQuery.refetch()}
                    >
                        <RefreshCw size={17} aria-hidden="true" />
                        {quotesQuery.isFetching ? "조회 중" : "새로고침"}
                    </button>
                </div>
                <div className={styles.controls}>
                    <label className={styles.rateField}>
                        <span>환산 기준</span>
                        <span className={styles.rateInput}>
                            <b>10,000 캐시 =</b>
                            <input
                                aria-label="10,000 캐시 환산 골드"
                                inputMode="decimal"
                                placeholder="입력"
                                value={rate}
                                aria-invalid={rateInvalid}
                                onChange={event => setRate(event.target.value)}
                            />
                            <b>만 G</b>
                        </span>
                        {rateInvalid && (
                            <small>0보다 큰 숫자를 입력해 주세요.</small>
                        )}
                    </label>
                    <label className={styles.membership}>
                        <input
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

            <section className={styles.cards} aria-label="패키지 비교">
                {catalog.products.map(product => (
                    <PackageCard
                        key={product.id}
                        product={product}
                        view={views[product.id]}
                        selected={product.id === selectedId}
                        loading={initialLoading}
                        select={() => setSelectedId(product.id)}
                        openUnresolved={() => focusUnresolved(product)}
                    />
                ))}
            </section>

            <section
                className={`${preparation.panel} ${styles.contents}`}
                aria-labelledby="contents-title"
            >
                <div className={styles.contentsHead}>
                    <div>
                        <h2 id="contents-title">{selected.name} 구성품</h2>
                        <span>{NUMBER.format(selected.cashPrice)} 캐시</span>
                    </div>
                    <label className={styles.purchase}>
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
                <div className={styles.rows}>
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
                                retry={() => void retry(row.item.itemId)}
                            />
                        ));
                        return entry.kind === "choice" ? (
                            <div className={styles.choice} key={entry.id}>
                                <h3>{entry.name}</h3>
                                <div>{content}</div>
                            </div>
                        ) : (
                            content
                        );
                    })}
                </div>
            </section>

            <section
                className={`${preparation.panel} ${styles.settlement}`}
                aria-labelledby="settlement-title"
            >
                <div className={styles.settlementHead}>
                    <h2 id="settlement-title">정산</h2>
                    <strong>
                        <ResultValue
                            value={selectedView.result?.netGold ?? null}
                            loading={initialLoading}
                        />
                    </strong>
                </div>
                <dl className={styles.settlementStats}>
                    <div>
                        <dt>총 판매액</dt>
                        <dd>
                            <ResultValue
                                value={selectedView.result?.grossGold ?? null}
                                loading={initialLoading}
                            />
                        </dd>
                    </div>
                    <div>
                        <dt>수수료</dt>
                        <dd>
                            <ResultValue
                                value={selectedView.result?.feeGold ?? null}
                                loading={initialLoading}
                            />
                        </dd>
                    </div>
                    <div>
                        <dt>예상 수령</dt>
                        <dd>
                            <ResultValue
                                value={selectedView.result?.netGold ?? null}
                                loading={initialLoading}
                            />
                        </dd>
                    </div>
                </dl>
                <details className={styles.details}>
                    <summary>판매 건수와 쿠폰 사용</summary>
                    <div className={styles.saleSettings}>
                        {selectedView.rows
                            .filter(row => row.quantity > 0)
                            .map(row => (
                                <div key={row.key}>
                                    <span>{row.item.name}</span>
                                    <label>
                                        판매 건수
                                        <input
                                            aria-label={`${row.item.name} 판매 건수`}
                                            type="number"
                                            min={1}
                                            max={row.quantity}
                                            value={row.saleCount}
                                            onChange={event => {
                                                const value = Number(
                                                    event.target.value
                                                );
                                                if (Number.isSafeInteger(value))
                                                    setSaleCounts(values => ({
                                                        ...values,
                                                        [row.key]: clamp(
                                                            value,
                                                            1,
                                                            row.quantity
                                                        ),
                                                    }));
                                            }}
                                        />
                                    </label>
                                    {selectedView.couponStock > 0 &&
                                        !row.item.coupon && (
                                            <label>
                                                쿠폰 적용
                                                <input
                                                    aria-label={`${row.item.name} 쿠폰 적용 건수`}
                                                    type="number"
                                                    min={0}
                                                    max={row.saleCount}
                                                    value={row.couponCount}
                                                    onChange={event => {
                                                        const value = Number(
                                                            event.target.value
                                                        );
                                                        if (
                                                            Number.isSafeInteger(
                                                                value
                                                            )
                                                        )
                                                            setCouponCounts(
                                                                values => ({
                                                                    ...values,
                                                                    [row.key]:
                                                                        clamp(
                                                                            value,
                                                                            0,
                                                                            row.saleCount
                                                                        ),
                                                                })
                                                            );
                                                    }}
                                                />
                                            </label>
                                        )}
                                </div>
                            ))}
                    </div>
                </details>
                <details className={styles.details}>
                    <summary>계산 내역</summary>
                    <dl className={styles.calculation}>
                        <div>
                            <dt>환산 비용</dt>
                            <dd>
                                {gold(selectedView.result?.goldCost ?? null)}
                            </dd>
                        </div>
                        <div>
                            <dt>예상 손익</dt>
                            <dd>
                                {gold(
                                    selectedView.result?.profitGold ?? null,
                                    true
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt>수익률</dt>
                            <dd>
                                {selectedView.result?.profitPercent == null
                                    ? "—"
                                    : `${PERCENT.format(selectedView.result.profitPercent)}%`}
                            </dd>
                        </div>
                    </dl>
                </details>
            </section>
        </main>
    );
}
