import { type RefObject, useEffect, useRef, useState } from "react";

import type { AuctionItem, ItemOption } from "@/app/auction/types";
import { useDialogFocus } from "@/app/auction/use-dialog-focus";

export const MAX_COMPARISON_ITEMS = 4;
const EMPTY_VALUE = "정보 없음";
const BASIC_STATS = new Set([
    "공격",
    "부상률",
    "크리티컬",
    "밸런스",
    "내구력",
    "아이템 보호",
    "남은 전용 해제 가능 횟수",
    "피어싱 레벨",
]);
const UPGRADES = new Set(["일반 개조", "보석 개조", "특별 개조"]);
const numberFormatter = new Intl.NumberFormat("ko-KR");

interface NumericSignature {
    context: string;
    values: number[];
}

interface ComparisonValue {
    text: string;
    numeric?: NumericSignature;
}

export interface ComparisonRow {
    key: string;
    label: string;
    values: Array<ComparisonValue | null>;
    emphasizeDifference: boolean;
}

interface ComparisonEntry {
    key: string;
    label: string;
    value: ComparisonValue;
}

function normalize(value: string | null | undefined): string {
    return (value ?? "").trim().replace(/\s+/g, " ");
}

function joinValues(...values: Array<string | null | undefined>): string {
    return values.map(normalize).filter(Boolean).join(" ") || EMPTY_VALUE;
}

function parseNumber(value: string): { number: number; unit: string } | null {
    const match = normalize(value).match(/^([+-]?\d+(?:\.\d+)?)(%)?$/);
    if (!match) return null;
    return { number: Number(match[1]), unit: match[2] ?? "" };
}

function numericFromParts(
    context: string,
    parts: string[]
): NumericSignature | undefined {
    const parsed = parts.map(parseNumber);
    if (parsed.some(value => value === null)) return undefined;
    const values = parsed.filter(value => value !== null);
    return {
        context: `${context}:${values.map(value => value.unit).join("|")}`,
        values: values.map(value => value.number),
    };
}

function parseEffect(value: string) {
    const match = normalize(value).match(
        /^(.+?)\s+([+-]?\d+(?:\.\d+)?)(%)?\s+(증가|감소)$/
    );
    if (!match) return null;
    return {
        name: normalize(match[1]),
        number: Number(match[2]),
        unit: match[3] ?? "",
        direction: match[4],
    };
}

function basicEntry(option: ItemOption, type: string): ComparisonEntry {
    const first = normalize(option.option_value);
    const second = normalize(option.option_value2);
    const separator = type === "내구력" ? "/" : "~";
    const text = second
        ? `${first}${separator}${second}`
        : first || EMPTY_VALUE;
    const parts = [first, second].filter(Boolean);
    return {
        key: `basic:${type}`,
        label: type,
        value: {
            text,
            numeric: parts.length
                ? numericFromParts(`basic:${type}`, parts)
                : undefined,
        },
    };
}

function enchantEntries(option: ItemOption): ComparisonEntry[] {
    const slot = normalize(option.option_sub_type) || "구분 없음";
    const name = normalize(option.option_value) || EMPTY_VALUE;
    const entries: ComparisonEntry[] = [
        {
            key: `enchant:${slot}:name`,
            label: `${slot} 인챈트`,
            value: { text: name },
        },
    ];
    for (const rawEffect of (option.option_desc ?? "").split(",")) {
        const text = normalize(rawEffect);
        if (!text) continue;
        const effect = parseEffect(text);
        if (!effect) {
            entries.push({
                key: `enchant:${slot}:fallback:${text}`,
                label: `${slot} 인챈트 효과`,
                value: { text },
            });
            continue;
        }
        const context = `enchant:${slot}:${effect.name}:${effect.direction}:${effect.unit}`;
        entries.push({
            key: context,
            label: `${slot} · ${effect.name} ${effect.direction}`,
            value: {
                text,
                numeric: { context, values: [effect.number] },
            },
        });
    }
    return entries;
}

function parseStructuredNumbers(value: string) {
    const values: number[] = [];
    const context = normalize(value).replace(/[+-]?\d+(?:\.\d+)?%?/g, token => {
        const parsed = parseNumber(token);
        if (!parsed) return token;
        values.push(parsed.number);
        return `#${parsed.unit}`;
    });
    return values.length ? { context, values } : null;
}

function reforgeEntry(option: ItemOption): ComparisonEntry {
    const value = normalize(option.option_value);
    const match = value.match(/^(.+?)\((\d+)레벨:(.+)\)$/);
    if (!match) {
        return {
            key: `reforge:fallback:${value}`,
            label: "세공 옵션",
            value: { text: value || EMPTY_VALUE },
        };
    }
    const name = normalize(match[1]);
    const effect = normalize(match[3]);
    const effectNumbers = parseStructuredNumbers(effect);
    const context = `reforge:${name}:${effectNumbers?.context ?? effect}`;
    return {
        key: `reforge:${name}`,
        label: `세공 옵션 · ${name}`,
        value: {
            text: value,
            numeric: {
                context,
                values: [Number(match[2]), ...(effectNumbers?.values ?? [])],
            },
        },
    };
}

function upgradeEntry(option: ItemOption, type: string): ComparisonEntry {
    const subtype = normalize(option.option_sub_type);
    const first = normalize(option.option_value);
    const second = normalize(option.option_value2);
    const parts = [first, second].filter(Boolean);
    return {
        key: `upgrade:${type}:${subtype}`,
        label: subtype ? `${type} (${subtype})` : type,
        value: {
            text: joinValues(subtype, first, second),
            numeric: parts.length
                ? numericFromParts(`upgrade:${type}:${subtype}`, parts)
                : undefined,
        },
    };
}

function setEffectEntry(option: ItemOption): ComparisonEntry {
    const first = normalize(option.option_value);
    const second = normalize(option.option_value2);
    return {
        key: `set:${first}`,
        label: first ? `세트 효과 · ${first}` : "세트 효과",
        value: {
            text: joinValues(first, second),
            numeric: second
                ? numericFromParts(`set:${first}`, [second])
                : undefined,
        },
    };
}

function knownEntry(option: ItemOption, type: string): ComparisonEntry | null {
    const subtype = normalize(option.option_sub_type);
    const first = normalize(option.option_value);
    if (type === "에르그") {
        return {
            key: "erg",
            label: "에르그",
            value: {
                text: joinValues(subtype && `${subtype} 등급 / 레벨`, first),
                numeric: first
                    ? numericFromParts(`erg:${subtype}`, [first])
                    : undefined,
            },
        };
    }
    if (type === "세공 랭크") {
        return {
            key: "reforge-rank",
            label: "세공 랭크",
            value: {
                text: first || EMPTY_VALUE,
                numeric: first
                    ? numericFromParts("reforge-rank", [first])
                    : undefined,
            },
        };
    }
    if (UPGRADES.has(type)) return upgradeEntry(option, type);
    if (type === "세트 효과") return setEffectEntry(option);
    return null;
}

function fallbackEntry(option: ItemOption, type: string): ComparisonEntry {
    const subtype = normalize(option.option_sub_type);
    const text = joinValues(
        option.option_value,
        option.option_value2,
        option.option_desc
    );
    const effect = parseEffect(normalize(option.option_value));
    const meaning = effect
        ? `${effect.name}:${effect.direction}:${effect.unit}`
        : text;
    return {
        key: `other:${type}:${subtype}:${meaning}`,
        label: subtype ? `${type} (${subtype})` : type,
        value: { text },
    };
}

function optionEntries(option: ItemOption): ComparisonEntry[] {
    const type = normalize(option.option_type) || "기타 정보";
    if (BASIC_STATS.has(type)) return [basicEntry(option, type)];
    if (type === "인챈트") return enchantEntries(option);
    if (type === "세공 옵션") return [reforgeEntry(option)];
    const known = knownEntry(option, type);
    return [known ?? fallbackEntry(option, type)];
}

function itemEntries(item: AuctionItem): Map<string, ComparisonEntry> {
    const entries = new Map<string, ComparisonEntry>();
    for (const option of item.item_option ?? []) {
        for (const entry of optionEntries(option)) {
            const existing = entries.get(entry.key);
            if (!existing) {
                entries.set(entry.key, entry);
                continue;
            }
            existing.value = {
                text: `${existing.value.text}\n${entry.value.text}`,
            };
        }
    }
    return entries;
}

function hasNumericDifference(values: Array<ComparisonValue | null>): boolean {
    const present = values.filter(value => value !== null);
    if (present.length < 2 || present.some(value => !value.numeric))
        return false;
    const first = present[0].numeric!;
    if (
        present.some(
            value =>
                value.numeric!.context !== first.context ||
                value.numeric!.values.length !== first.values.length
        )
    )
        return false;
    return first.values.some((number, index) =>
        present.some(value => value.numeric!.values[index] !== number)
    );
}

export function prepareComparisonRows(items: AuctionItem[]): ComparisonRow[] {
    const entriesByItem = items.map(itemEntries);
    const orderedEntries = new Map<string, string>();
    for (const entries of entriesByItem) {
        entries.forEach((entry, key) => {
            if (!orderedEntries.has(key)) orderedEntries.set(key, entry.label);
        });
    }
    return Array.from(orderedEntries, ([key, label]) => {
        const values = entriesByItem.map(
            entries => entries.get(key)?.value ?? null
        );
        return {
            key,
            label,
            values,
            emphasizeDifference: hasNumericDifference(values),
        };
    });
}

interface ListingIdentityProps {
    item: AuctionItem;
    index: number;
}

function ListingIdentity({ item, index }: ListingIdentityProps) {
    return (
        <>
            <strong>매물 {index + 1}</strong>
            <span>{item.item_display_name}</span>
            <span>
                {numberFormatter.format(item.auction_price_per_unit)} Gold
            </span>
            <span className="text-xs text-base-content/70">
                {numberFormatter.format(item.item_count)}개 · 만료{" "}
                {item.date_auction_expire}
            </span>
        </>
    );
}

interface ComparisonDialogProps {
    items: AuctionItem[];
    onClose: () => void;
    triggerRef: RefObject<HTMLButtonElement | null>;
}

interface ComparisonTableProps {
    items: AuctionItem[];
}

function ComparisonTable({ items }: ComparisonTableProps) {
    const rows = prepareComparisonRows(items);
    return (
        <div
            data-testid="auction-comparison-scroll"
            className="min-h-0 flex-1 overflow-auto"
        >
            <table className="table min-w-max">
                <thead className="sticky top-0 z-20 bg-base-100">
                    <tr>
                        <th className="sticky left-0 z-30 min-w-40 bg-base-100">
                            옵션
                        </th>
                        {items.map((item, index) => (
                            <th key={index} className="min-w-56 align-top">
                                <div className="flex flex-col gap-1">
                                    <ListingIdentity
                                        item={item}
                                        index={index}
                                    />
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={items.length + 1}
                                className="text-center"
                            >
                                비교할 장비 옵션이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        rows.map(row => (
                            <ComparisonTableRow key={row.key} row={row} />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

interface ComparisonTableRowProps {
    row: ComparisonRow;
}

function ComparisonTableRow({ row }: ComparisonTableRowProps) {
    return (
        <tr>
            <th scope="row" className="sticky left-0 z-10 bg-base-100">
                {row.label}
            </th>
            {row.values.map((value, index) => (
                <td
                    key={index}
                    className={`whitespace-pre-line ${
                        row.emphasizeDifference && value
                            ? "bg-info/10 font-semibold"
                            : ""
                    }`}
                >
                    {value?.text ?? "—"}
                    {row.emphasizeDifference && value && (
                        <span className="sr-only"> (수치 차이 있음)</span>
                    )}
                </td>
            ))}
        </tr>
    );
}

function AuctionComparisonDialog({
    items,
    onClose,
    triggerRef,
}: ComparisonDialogProps) {
    const dialogRef = useDialogFocus(onClose, triggerRef);
    return (
        <div className="fixed inset-0 z-50 flex bg-black/40 sm:items-center sm:justify-center sm:p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auction-comparison-dialog-title"
                tabIndex={-1}
                className="flex h-full w-full flex-col bg-base-100 outline-none sm:max-h-[90vh] sm:max-w-6xl sm:rounded-lg sm:border sm:shadow-xl"
            >
                <div className="flex items-start justify-between gap-4 border-b p-4">
                    <div>
                        <h2
                            id="auction-comparison-dialog-title"
                            className="text-lg font-bold"
                        >
                            장비 매물 비교
                        </h2>
                        <p className="text-sm text-base-content/70">
                            선택한 매물 {items.length}개
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>
                <ComparisonTable items={items} />
            </div>
        </div>
    );
}

interface AuctionComparisonProps {
    items: AuctionItem[];
    notice: string | null;
    onRemove: (item: AuctionItem) => void;
    onClear: () => void;
}

interface ComparisonPanelHeaderProps {
    itemCount: number;
    onClear: () => void;
}

function ComparisonPanelHeader({
    itemCount,
    onClear,
}: ComparisonPanelHeaderProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
                <h4
                    id="auction-comparison-selection-title"
                    className="font-bold"
                >
                    비교할 매물
                </h4>
                <p className="text-sm text-base-content/70">
                    2~4개를 선택하세요. ({itemCount}/{MAX_COMPARISON_ITEMS})
                </p>
            </div>
            <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClear}
            >
                전체 해제
            </button>
        </div>
    );
}

interface SelectedListingsProps {
    items: AuctionItem[];
    onRemove: (item: AuctionItem) => void;
}

function SelectedListings({ items, onRemove }: SelectedListingsProps) {
    return (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {items.map((item, index) => (
                <li
                    key={index}
                    className="flex items-start justify-between gap-2 rounded-md bg-base-200 p-3"
                >
                    <div className="flex min-w-0 flex-col">
                        <ListingIdentity item={item} index={index} />
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        aria-label={`매물 ${index + 1} ${item.item_display_name} 비교에서 제거`}
                        onClick={() => onRemove(item)}
                    >
                        제거
                    </button>
                </li>
            ))}
        </ul>
    );
}

export function AuctionComparison({
    items,
    notice,
    onRemove,
    onClear,
}: AuctionComparisonProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (items.length < 2) setOpen(false);
    }, [items.length]);
    if (items.length === 0) return null;
    return (
        <section
            aria-labelledby="auction-comparison-selection-title"
            className="rounded-lg border bg-base-100 p-4"
        >
            <ComparisonPanelHeader itemCount={items.length} onClear={onClear} />
            <SelectedListings items={items} onRemove={onRemove} />
            {notice && (
                <p role="alert" className="alert alert-warning mt-3 text-sm">
                    {notice}
                </p>
            )}
            <button
                ref={triggerRef}
                type="button"
                className="btn btn-primary mt-3 w-full sm:w-auto"
                disabled={items.length < 2}
                onClick={() => setOpen(true)}
            >
                선택한 매물 비교
            </button>
            {open && items.length >= 2 && (
                <AuctionComparisonDialog
                    items={items}
                    onClose={() => setOpen(false)}
                    triggerRef={triggerRef}
                />
            )}
        </section>
    );
}
