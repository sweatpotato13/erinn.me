"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Fragment,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import prep from "@/components/tools/preparation.module.css";
import {
    emptyRelicCells,
    muriasReference as reference,
    type RelicCell,
    type RelicEffect,
    type RelicListing,
    type RelicSnapshot,
} from "@/lib/murias-relics";

const emptyCells = emptyRelicCells();
const gold = (value: number) => `${value.toLocaleString("ko-KR")} Gold`;
const time = (value: string | null) =>
    value
        ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
        : "조회 기록 없음";
function ListingDetails({ item }: { item: RelicListing }) {
    return (
        <details className="rounded border border-base-300 p-2">
            <summary className="cursor-pointer">
                {item.item_display_name} · 개당{" "}
                {gold(item.auction_price_per_unit)} · {item.item_count}개
            </summary>
            <p>매물 만료: {time(item.date_auction_expire)}</p>
            <pre className="overflow-auto text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(item.item_option, null, 2)}
            </pre>
        </details>
    );
}

export default function RelicTool() {
    const [snapshot, setSnapshot] = useState<RelicSnapshot | null>(null);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const active = useRef<AbortController | null>(null);
    const detail = useRef<HTMLElement>(null);
    const load = useCallback(async (refresh = false) => {
        active.current?.abort();
        const controller = new AbortController();
        active.current = controller;
        setBusy(true);
        setError(null);
        try {
            const response = await fetch("/api/murias-relics", {
                method: refresh ? "POST" : "GET",
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error(
                    "가격을 불러오지 못했습니다. 이전 조회 결과가 있으면 유지합니다."
                );
            const next: RelicSnapshot = await response.json();
            if (controller.signal.aborted) return;
            if (next.referenceVersion !== reference.version)
                throw new Error(
                    "참조 데이터가 갱신되었습니다. 페이지를 새로고침해 주세요."
                );
            setSnapshot(previous => {
                if (!previous) return next;
                return {
                    ...next,
                    ...(next.relicError &&
                    previous.fetchedAt &&
                    (!next.fetchedAt || previous.fetchedAt > next.fetchedAt)
                        ? {
                              cells: previous.cells,
                              fetchedAt: previous.fetchedAt,
                              pages: previous.pages,
                              nextCursor: previous.nextCursor,
                              isComplete: previous.isComplete,
                              receivedCount: previous.receivedCount,
                              unclassifiedCount: previous.unclassifiedCount,
                              excludedCount: previous.excludedCount,
                              rejected: previous.rejected,
                          }
                        : {}),
                    ...(next.ideaError
                        ? {
                              ideaPrice: previous.ideaPrice,
                              ideaFetchedAt: previous.ideaFetchedAt,
                              ideaIsComplete: previous.ideaIsComplete,
                          }
                        : {}),
                };
            });
        } catch (caught) {
            if (!controller.signal.aborted)
                setError(
                    caught instanceof Error
                        ? caught.message
                        : "조회에 실패했습니다."
                );
        } finally {
            if (!controller.signal.aborted) setBusy(false);
        }
    }, []);
    useEffect(() => {
        void load();
        return () => active.current?.abort();
    }, [load]);
    const cells = snapshot?.cells ?? emptyCells;
    const byKey = new Map(
        cells.map(cell => [`${cell.effectId}:${cell.level}`, cell])
    );
    const selectedCell = selected ? byKey.get(selected) : null;
    const selectedEffect = reference.effects.find(
        effect => effect.id === selectedCell?.effectId
    );
    const effects = reference.effects.filter(effect =>
        `${effect.arcana} ${effect.template}`.includes(search.trim())
    );
    const arcanas = [...new Set(effects.map(effect => effect.arcana))];
    const selectCell = (key: string) => {
        setSelected(key);
        requestAnimationFrame(() => detail.current?.focus());
    };
    return (
        <div className="space-y-4">
            <RelicToolbar
                search={search}
                onSearch={setSearch}
                busy={busy}
                onRefresh={() => void load(true)}
            />
            <StatusSummary snapshot={snapshot} busy={busy} error={error} />
            {!effects.length ? (
                <p>검색 결과가 없습니다.</p>
            ) : (
                <div className={prep.catalog}>
                    {arcanas.map(arcana => (
                        <ArcanaMatrix
                            key={arcana}
                            arcana={arcana}
                            effects={effects.filter(
                                effect => effect.arcana === arcana
                            )}
                            byKey={byKey}
                            selected={selected}
                            onSelect={selectCell}
                            fetched={!!snapshot?.fetchedAt}
                        />
                    ))}
                </div>
            )}
            <p className="text-sm">
                표를 좌우로 스크롤할 수 있습니다. — 표시는 불러온 매물에서
                가격을 찾지 못했음을 뜻합니다. 셀을 선택하면 매물 근거를 확인할
                수 있습니다.
            </p>
            {selectedCell && selectedEffect && (
                <SelectedCellDetails
                    cell={selectedCell}
                    effect={selectedEffect}
                    fetchedAt={snapshot?.fetchedAt ?? null}
                    detailRef={detail}
                />
            )}
            <RejectedListings rejected={snapshot?.rejected ?? []} />
        </div>
    );
}

function RelicToolbar({
    search,
    onSearch,
    busy,
    onRefresh,
}: {
    search: string;
    onSearch: (value: string) => void;
    busy: boolean;
    onRefresh: () => void;
}) {
    return (
        <div className={prep.toolbar}>
            <label className="flex flex-col gap-1">
                효과·아르카나 검색
                <input
                    type="search"
                    className={prep.input}
                    value={search}
                    onChange={event => onSearch(event.target.value)}
                />
            </label>
            <button className="btn btn-sm" disabled={busy} onClick={onRefresh}>
                가격 새로고침
            </button>
        </div>
    );
}

function IdeaSummary({ snapshot }: { snapshot: RelicSnapshot | null }) {
    return (
        <>
            <p>
                이데아:{" "}
                {snapshot?.ideaPrice != null
                    ? gold(snapshot.ideaPrice)
                    : "가격 정보 없음"}{" "}
                · 조회: {time(snapshot?.ideaFetchedAt ?? null)}
                {snapshot?.ideaFetchedAt &&
                    !snapshot.ideaIsComplete &&
                    " · 일부 매물 기준"}
            </p>
            {snapshot?.ideaError && (
                <p role="alert">
                    {snapshot.ideaError}{" "}
                    {snapshot.ideaFetchedAt &&
                        "이전 이데아 조회 결과를 표시합니다."}
                </p>
            )}
        </>
    );
}

function StatusSummary({
    snapshot,
    busy,
    error,
}: {
    snapshot: RelicSnapshot | null;
    busy: boolean;
    error: string | null;
}) {
    return (
        <>
            {busy && (
                <p role="status">
                    전체 유물 매물을 조회하는 중입니다. 매물이 많으면 시간이
                    걸릴 수 있습니다…
                </p>
            )}
            {error && <p role="alert">{error}</p>}
            {snapshot?.relicError && (
                <p role="alert">
                    {snapshot.relicError}{" "}
                    {snapshot.fetchedAt && "이전 유물 조회 결과를 표시합니다."}
                </p>
            )}
            <div className={`${prep.notice} space-y-1`}>
                <p className="font-bold">
                    조회된 매물 중 최저가 · 개당 등록 가격
                </p>
                <p>
                    유물 조회: {time(snapshot?.fetchedAt ?? null)} (한국 시간)
                </p>
                {snapshot?.fetchedAt && (
                    <p>
                        {snapshot.isComplete
                            ? "마지막 페이지까지 조회"
                            : "일부 매물만 조회 — 전체 시장 최저가가 아닙니다"}{" "}
                        · {snapshot.pages}페이지 · 수신 {snapshot.receivedCount}
                        건 · 미분류 {snapshot.unclassifiedCount}건 · 비교 제외{" "}
                        {snapshot.excludedCount}건
                    </p>
                )}
                <IdeaSummary snapshot={snapshot} />
            </div>
        </>
    );
}

type MatrixProps = {
    byKey: Map<string, RelicCell>;
    selected: string | null;
    onSelect: (key: string) => void;
    fetched: boolean;
};

function PriceCell({
    effect,
    cell,
    selected,
    fetched,
    onSelect,
}: {
    effect: RelicEffect;
    cell: RelicCell;
    selected: boolean;
    fetched: boolean;
    onSelect: () => void;
}) {
    return (
        <td>
            <button
                className="block w-full min-h-18 p-1 text-left rounded-sm cursor-pointer hover:bg-base-200 aria-pressed:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                aria-label={`${effect.template.split("{0}")[0].trim()} ${cell.level}레벨 상세`}
                aria-pressed={selected}
                onClick={onSelect}
            >
                <span className="block text-sm">
                    {effect.values[cell.level - 1]}
                    {effect.unit}
                </span>
                <span className="block font-semibold">
                    {cell.minUnitPrice == null ? "—" : gold(cell.minUnitPrice)}
                </span>
                <span className="block text-xs">
                    {fetched ? `${cell.listingCount}건` : "미조회"}
                </span>
            </button>
        </td>
    );
}

function EffectRow({
    effect,
    byKey,
    selected,
    onSelect,
    fetched,
}: MatrixProps & { effect: RelicEffect }) {
    return (
        <tr>
            <th scope="row">
                <div className="flex items-center gap-2 min-h-18">
                    <Image
                        src={`/images/murias/${effect.skillId}.png`}
                        alt=""
                        width={42}
                        height={42}
                        unoptimized
                        className="shrink-0 w-9 h-9 object-contain"
                    />
                    <span>
                        {effect.template
                            .replace(`{0}${effect.unit}`, "")
                            .replace(/\s*\(최대.*$/, "")}
                    </span>
                </div>
            </th>
            {effect.values.map((_, index) => {
                const key = `${effect.id}:${index + 1}`;
                return (
                    <PriceCell
                        key={key}
                        effect={effect}
                        cell={byKey.get(key)!}
                        selected={selected === key}
                        fetched={fetched}
                        onSelect={() => onSelect(key)}
                    />
                );
            })}
        </tr>
    );
}

function ArcanaMatrix({
    arcana,
    effects,
    ...cells
}: MatrixProps & { arcana: string; effects: RelicEffect[] }) {
    return (
        <section className={prep.panel}>
            <div className={prep.panelHead}>
                <h2>{arcana}</h2>
                <span className={prep.muted}>효과별 1~10레벨</span>
            </div>
            <div
                className="overflow-auto border-t border-base-300"
                role="region"
                aria-label={`${arcana} 유물 효과별 레벨 가격표`}
                tabIndex={0}
            >
                <table className="w-full border-separate border-spacing-0 [&_th]:p-2 [&_td]:p-2 [&_th]:border-b [&_td]:border-b [&_th]:border-base-300 [&_td]:border-base-300 [&_th]:min-w-32 [&_td]:min-w-32 [&_th]:align-top [&_td]:align-top [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-2 [&_thead_th]:bg-base-200 [&_tr>th:first-child]:sticky [&_tr>th:first-child]:left-0 [&_tr>th:first-child]:z-1 [&_tr>th:first-child]:min-w-44 [&_tr>th:first-child]:max-w-56 [&_tr>th:first-child]:bg-base-100 [&_tr>th:first-child]:text-left [&_thead_tr>th:first-child]:z-3 [&_tbody_tr:last-child>*]:border-b-0 [@media(max-width:640px)]:[&_tr>th:first-child]:min-w-32 [@media(max-width:640px)]:[&_tr>th:first-child]:max-w-32 [@media(max-width:640px)]:[&_tr>th:first-child]:text-[0.8rem]">
                    <caption className="sr-only">
                        아르카나별 효과와 1~10레벨 실제 수치 및 조회된 매물 가격
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col">스킬 / 효과</th>
                            {Array.from({ length: 10 }, (_, i) => (
                                <th key={i} scope="col">
                                    {i + 1}레벨
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {effects.map(effect => (
                            <EffectRow
                                key={effect.id}
                                effect={effect}
                                {...cells}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function SelectedCellDetails({
    cell,
    effect,
    fetchedAt,
    detailRef,
}: {
    cell: RelicCell;
    effect: RelicEffect;
    fetchedAt: string | null;
    detailRef: RefObject<HTMLElement | null>;
}) {
    return (
        <section
            ref={detailRef}
            tabIndex={-1}
            aria-label="선택한 유물 매물"
            className="rounded-lg border border-base-300 p-4 space-y-2"
        >
            <h2 className="font-bold">
                {effect.template.replace(
                    "{0}",
                    String(effect.values[cell.level - 1])
                )}{" "}
                · {cell.level}레벨
            </h2>
            <p>
                조회: {time(fetchedAt)} · 일치하는 매물 {cell.listingCount}건
            </p>
            {!cell.listingCount && (
                <p>
                    불러온 데이터에 이 효과·레벨의 비교 가능한 매물이 없습니다.
                </p>
            )}
            {cell.listings.map((item, index) => (
                <ListingDetails key={index} item={item} />
            ))}
            <Link
                className="link"
                href={`/auction?q=${encodeURIComponent(reference.item.name)}`}
            >
                경매장 전체 유물 검색 (이 셀의 효과·레벨 필터 아님)
            </Link>
        </section>
    );
}

function RejectedListings({
    rejected,
}: {
    rejected: RelicSnapshot["rejected"];
}) {
    if (!rejected.length) return null;
    return (
        <details className="rounded-lg border border-base-300 p-3">
            <summary className="cursor-pointer">
                미분류·비교 제외 매물 확인 ({rejected.length}건)
            </summary>
            {rejected.map((row, index) => (
                <Fragment key={index}>
                    <p className="mt-3">{row.reason}</p>
                    <ListingDetails item={row.item} />
                </Fragment>
            ))}
        </details>
    );
}
