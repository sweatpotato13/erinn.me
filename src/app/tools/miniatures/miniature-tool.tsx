"use client";

import { useQueries } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { type ReactElement, useEffect, useRef, useState } from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    basketCost,
    benefitCost,
    effectLabel,
    effectValue,
    filterMiniatures,
    marketGold,
    matchesMiniature,
    type Miniature,
    MINIATURE_EFFECTS,
    miniatureDelta,
    miniatureGold,
    miniatureNumber,
    type MiniatureReference,
} from "@/lib/miniatures";
import {
    MINIATURE_STORAGE_KEY,
    parseMiniatureStorage,
} from "@/lib/miniatures-state";

const styles = {
    window: `
        bg-[rgba(49,51,48,0.94)] text-[#f5f5ef] border border-[#858780] shadow-[inset_0_0_0_3px_#292b28]
        p-2 text-sm leading-[1.5] [text-shadow:0_1px_1px_#111] max-lg:pb-[calc(12px+env(safe-area-inset-bottom))]
        [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:[overflow-wrap:anywhere]
        [&_p]:my-1.5 [&_label]:block [&_label]:my-1 [&_select]:block [&_input::placeholder]:text-[#c2c5bb]
        [&_input[type=checkbox]]:size-5 [&_input[type=checkbox]]:accent-[#e6d694] [&_a]:underline [&_a]:inline-flex [&_a]:items-center
        [&_a]:min-h-11 [&_summary]:cursor-pointer [&_summary]:min-h-11 [&_summary]:pt-2.5 [&_dl>div]:flex
        [&_dl>div]:justify-between [&_dl>div]:gap-3 [&_dl>div]:border-b [&_dl>div]:border-[#66695e] [&_dl>div]:py-1
        [&_dd]:text-right [&_dd]:text-[#fff0aa] [&_:is(button,select,input:not([type=checkbox]))]:border [&_:is(button,select,input:not([type=checkbox]))]:border-[#a0a29a] [&_:is(button,select,input:not([type=checkbox]))]:rounded-[2px]
        [&_:is(button,select,input:not([type=checkbox]))]:bg-[#62645e] [&_:is(button,select,input:not([type=checkbox]))]:text-white [&_:is(button,select,input:not([type=checkbox]))]:min-h-11 [&_:is(button,select,input:not([type=checkbox]))]:py-1.5 [&_:is(button,select,input:not([type=checkbox]))]:px-2.5
        [&_:is(button,select,input:not([type=checkbox]))]:max-w-full [&_:is(button,select,input:not([type=checkbox]))]:[text-shadow:0_1px_1px_#111] [&_button]:cursor-pointer [&_button]:shadow-[inset_0_0_0_1px_#3b3e37] [&_button[aria-pressed=true]]:bg-[#898b82]
        [&_button[aria-pressed=true]]:shadow-[inset_0_0_0_2px_#deded4] [&_button:hover]:bg-[#74776e] [&_button:disabled]:opacity-60 [&_button:disabled]:cursor-default [&_input:not([type=checkbox])]:block
        [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:bg-[#292c27] [&_:is(button,input,select,a,summary,[tabindex]):focus-visible]:outline-3 [&_:is(button,input,select,a,summary,[tabindex]):focus-visible]:outline-[#ffed9c] [&_:is(button,input,select,a,summary,[tabindex]):focus-visible]:outline-offset-2
        max-lg:[&_:is(button,input,summary,a,[tabindex])]:scroll-mb-[100px] max-lg:[&_:is(button,input,summary,a,[tabindex])]:scroll-mt-20
    `,
    panel: "bg-[rgba(83,85,79,0.36)] border border-[#777a71] shadow-[inset_0_0_0_2px_#333630] p-3 mt-2 min-w-0",
    columns: "grid gap-2 lg:grid-cols-2",
    left: "min-w-0",
    controls: "flex flex-wrap gap-2 items-center",
    check: "[&&]:inline-flex gap-2 items-center min-h-11",
    row: "flex gap-2.5 items-center flex-wrap [&>div]:flex-1 [&>div]:min-w-[140px]",
    icon: "inline-flex size-12 shrink-0 items-center justify-center bg-[#34362f] border border-[#a4a596] shadow-[inset_0_0_0_2px_#171a15]",
    baseline:
        "[&&]:border-[#b9bca9] [&&]:bg-[rgba(113,118,103,0.45)] [&&_h2]:text-[21px] [&>details]:inline-block [&>details]:align-top [&>details]:mr-4 [&>details[open]]:block [&>details[open]]:w-full",
    entry: "border border-[#777b6d] p-2.5 mt-2 bg-[#3c4037] min-w-0 data-[selected=true]:border-[#efe5b7] data-[selected=true]:shadow-[inset_0_0_0_1px_#efe5b7]",
    description: "whitespace-pre-line",
    value: "text-[#fff0a2]",
    comparison: "grid gap-2 lg:grid-cols-2",
    catalog: "lg:max-h-[780px] lg:overflow-y-auto lg:p-[3px]",
    installedGrid: "grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2",
    toast: "z-100 bottom-[calc(80px+env(safe-area-inset-bottom))] max-w-[min(440px,100vw)] whitespace-normal [&>div]:bg-[#34382f] [&>div]:text-[#fff0a2] [&>div]:border [&>div]:border-[#b9bca9]",
};

function Icon({ item }: { item: Miniature }) {
    const [failedItemId, setFailedItemId] = useState<number | null>(null);
    return (
        <span className={styles.icon}>
            {failedItemId === item.itemId ? (
                <span aria-label="아이콘 없음">◇</span>
            ) : (
                // Inventory images already use the shared proxy; preserve a fixed-size fallback.
                <Image
                    unoptimized
                    src={`/api/item-image?id=${item.itemId}`}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    onError={() => setFailedItemId(item.itemId)}
                />
            )}
        </span>
    );
}
function Effects({ item }: { item: Miniature }) {
    return (
        <details>
            <summary>효과·설명</summary>
            <dl>
                {Object.entries(item.effects).map(([key, value]) => (
                    <div key={key}>
                        <dt>{effectLabel(key)}</dt>
                        <dd>{effectValue(key, value)}</dd>
                    </div>
                ))}
            </dl>
            <p className={styles.description}>{item.description}</p>
            {item.description.includes("세트") && (
                <p>세트 효과는 합계에서 제외합니다.</p>
            )}
        </details>
    );
}
function Auction({ item }: { item: Miniature }) {
    return item.searchable ? (
        <Link prefetch={false} href={getAuctionSearchPath(item.itemName)}>
            경매장 검색
        </Link>
    ) : (
        <span>경매장 검색 미지원</span>
    );
}
const typeName = (item: Miniature) => (item.extra ? "엑스트라" : "일반");
function TypeSelect({
    value,
    onChange,
    label,
}: {
    value: string;
    onChange: (s: string) => void;
    label: string;
}) {
    return (
        <label>
            {label}
            <select value={value} onChange={e => onChange(e.target.value)}>
                <option value="all">전체</option>
                <option value="normal">일반</option>
                <option value="extra">엑스트라</option>
            </select>
        </label>
    );
}

export default function MiniatureTool({
    data,
}: {
    data: MiniatureReference;
}): ReactElement {
    const [ready, setReady] = useState(false);
    const [localIds, setLocalIds] = useState<number[]>([]);
    const [config, setConfig] = useState<{
        candidateIds: number[];
        targetStat: string;
        manualPrices: Record<string, string>;
    }>({
        candidateIds: [],
        targetStat: "all",
        manualPrices: {},
    });
    const [notice, setNotice] = useState("");
    const [storageNotice, setStorageNotice] = useState("");
    const [search, setSearch] = useState("");
    const [type, setType] = useState("all");
    const [minimum, setMinimum] = useState("");
    const [budget, setBudget] = useState("");
    const [auctionOnly, setAuctionOnly] = useState(false);
    const [installType, setInstallType] = useState("all");
    const [pending, setPending] = useState(false);
    const busy = useRef(false);
    const catalogSearch = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!notice && !storageNotice) return;
        const timer = setTimeout(() => {
            setNotice("");
            setStorageNotice("");
        }, 6000);
        return () => clearTimeout(timer);
    }, [notice, storageNotice]);

    useEffect(() => {
        try {
            const saved = parseMiniatureStorage(
                localStorage.getItem(MINIATURE_STORAGE_KEY),
                data
            );
            setLocalIds(saved.installedIds);
            setStorageNotice(saved.notice);
        } catch {
            setStorageNotice(
                "저장소를 사용할 수 없습니다. 현재 화면에서만 설치 목록을 유지합니다."
            );
        }
        setReady(true);
    }, [data]);
    const installed = localIds;
    const selected = config.candidateIds
        .map(id => data.miniatures.find(item => item.id === id)!)
        .filter(Boolean);
    const names = [
        ...new Set(
            selected.filter(item => item.searchable).map(item => item.itemName)
        ),
    ];
    const quotes = useQueries({
        queries: names.map(name => ({
            queryKey: ["miniature-price", data.version, name],
            queryFn: ({ signal }: { signal: AbortSignal }) =>
                fetchItemPriceSummary(name, signal),
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: false,
        })),
    });
    const fetching = pending || quotes.some(q => q.isFetching);
    const quote = (item: Miniature) =>
        item.searchable ? quotes[names.indexOf(item.itemName)] : undefined;
    const price = (item: Miniature) =>
        Object.hasOwn(config.manualPrices, item.itemId)
            ? miniatureGold(config.manualPrices[item.itemId])
            : marketGold(quote(item)?.data);
    const basket = miniatureDelta(
        data.miniatures,
        installed,
        config.candidateIds
    );
    const cost = basketCost(selected.map(price));
    const stat = config.targetStat;
    const minimumNumber =
        minimum.trim() !== "" &&
        Number.isFinite(Number(minimum)) &&
        Number(minimum) >= 0
            ? Number(minimum)
            : null;
    const budgetNumber = miniatureGold(budget);
    const results = filterMiniatures(data.miniatures, {
        search,
        type,
        stat,
        minimum: minimumNumber,
        auctionOnly,
    });
    const visible = results.filter(
        item =>
            budgetNumber === null ||
            price(item) === null ||
            price(item)! <= budgetNumber
    );
    const unknownPrices =
        budgetNumber === null
            ? []
            : visible.filter(item => price(item) === null);
    const pricedResults =
        budgetNumber === null
            ? visible
            : visible.filter(item => price(item) !== null);
    const relevant = Object.keys(MINIATURE_EFFECTS).filter(
        key =>
            (stat !== "all" && key === stat) ||
            basket.before.total[key] ||
            basket.after.total[key]
    );

    function saveInstallations(ids: number[], reset = false) {
        if (ids.length > 1000) {
            setNotice("설치 목록은 최대 1,000개까지 저장할 수 있습니다.");
            return;
        }
        setLocalIds(ids);
        try {
            if (reset) localStorage.removeItem(MINIATURE_STORAGE_KEY);
            else
                localStorage.setItem(
                    MINIATURE_STORAGE_KEY,
                    JSON.stringify({
                        formatVersion: 1,
                        snapshotVersion: data.version,
                        installedIds: ids,
                    })
                );
            setStorageNotice("");
        } catch {
            setStorageNotice(
                "설치 목록을 저장하지 못했습니다. 현재 화면에서는 계속 사용할 수 있습니다."
            );
        }
    }
    function toggle(item: Miniature) {
        saveInstallations(
            installed.includes(item.id)
                ? installed.filter(id => id !== item.id)
                : [...installed, item.id]
        );
    }
    function add(item: Miniature) {
        if (config.candidateIds.includes(item.id)) return;
        if (selected.length >= 4) {
            setNotice("비교 후보는 최대 4개입니다. 기존 후보를 제거해 주세요.");
            return;
        }
        setConfig(c => ({ ...c, candidateIds: [...c.candidateIds, item.id] }));
        setNotice("");
    }
    function remove(id?: number) {
        const ids =
            id === undefined
                ? []
                : config.candidateIds.filter(value => value !== id);
        const itemIds = data.miniatures
            .filter(item => ids.includes(item.id))
            .map(item => String(item.itemId));
        setConfig(c => ({
            ...c,
            candidateIds: ids,
            manualPrices: Object.fromEntries(
                Object.entries(c.manualPrices).filter(([key]) =>
                    itemIds.includes(key)
                )
            ),
        }));
        catalogSearch.current?.focus();
    }
    async function lookup() {
        if (busy.current || fetching || !names.length) return;
        busy.current = true;
        setPending(true);
        try {
            await Promise.allSettled(quotes.map(q => q.refetch()));
        } finally {
            busy.current = false;
            setPending(false);
        }
    }
    const installCheckbox = (item: Miniature) => (
        <label className={styles.check}>
            <input
                type="checkbox"
                checked={installed.includes(item.id)}
                disabled={!ready}
                onChange={() => toggle(item)}
                aria-label={`${item.name} 설치 중`}
            />
            설치 중
        </label>
    );
    const basketSummary = (
        <>
            {(stat === "all" ? relevant : [stat]).map(key => (
                <p className={styles.value} key={key}>
                    {effectLabel(key)}{" "}
                    {effectValue(key, basket.before.total[key])} →{" "}
                    {effectValue(key, basket.after.total[key])} (
                    {effectValue(key, basket.delta[key], true)})
                </p>
            ))}
            <p>
                {!selected.length
                    ? "가격 미조회"
                    : cost.missing === selected.length
                      ? `가격 미조회 · 총액 미완성 (${cost.missing}개 가격 미확인)`
                      : cost.subtotal === null
                        ? "가격 합계가 안전한 계산 범위를 넘습니다."
                        : `알려진 가격 ${miniatureNumber(cost.subtotal)} Gold${cost.missing ? ` · 총액 미완성 (${cost.missing}개 가격 미확인)` : " · 전체 후보 합계"}`}
            </p>
        </>
    );

    return (
        <div className={styles.window}>
            {(notice || storageNotice) && (
                <div className={`toast toast-end ${styles.toast}`}>
                    <div className="alert" role="status" aria-atomic="true">
                        <p>
                            {[storageNotice, notice].filter(Boolean).join(" ")}
                        </p>
                        <button
                            aria-label="안내 닫기"
                            onClick={() => {
                                setNotice("");
                                setStorageNotice("");
                            }}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
            <section
                className={`${styles.panel} ${styles.baseline}`}
                aria-label="설치 기준"
            >
                <div className={styles.controls}>
                    <h2>내 설치 현황 · {installed.length}개</h2>
                    <button onClick={() => catalogSearch.current?.focus()}>
                        미니어처 추가
                    </button>
                    <button
                        disabled={!ready || !installed.length}
                        onClick={() => saveInstallations([], true)}
                    >
                        설치 목록 초기화
                    </button>
                </div>
                <details>
                    <summary>설치 효과 전체 보기</summary>
                    <dl>
                        {Object.keys(MINIATURE_EFFECTS).map(key => (
                            <div key={key}>
                                <dt>{effectLabel(key)}</dt>
                                <dd>
                                    {effectValue(key, basket.before.total[key])}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </details>
                <div aria-label="설치된 미니어처 목록">
                    <p>
                        현재 설치한 미니어처입니다. 이 목록으로 설치 효과를
                        계산합니다.
                    </p>
                    <div
                        className={styles.controls}
                        role="group"
                        aria-label="설치 목록 종류"
                    >
                        {[
                            ["all", "전체"],
                            ["normal", "일반"],
                            ["extra", "엑스트라"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                aria-pressed={installType === value}
                                onClick={() => setInstallType(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className={styles.installedGrid}>
                        {data.miniatures
                            .filter(
                                item =>
                                    installed.includes(item.id) &&
                                    matchesMiniature(item, "", installType)
                            )
                            .map(item => (
                                <div className={styles.entry} key={item.id}>
                                    <Icon item={item} />
                                    <h3>{item.name}</h3>
                                    <p>{typeName(item)}</p>
                                    {Object.entries(item.effects).map(
                                        ([key, value]) => (
                                            <p key={key}>
                                                {effectLabel(key)}{" "}
                                                {effectValue(key, value)}
                                            </p>
                                        )
                                    )}
                                    {installCheckbox(item)}
                                </div>
                            ))}
                    </div>
                </div>
                {installed.length === 0 && (
                    <p>
                        설치된 미니어처가 없습니다. 미니어처 찾기에서 설치 중을
                        체크하세요.
                    </p>
                )}
            </section>
            <div className={styles.columns}>
                <div className={styles.left}>
                    <section
                        className={styles.panel}
                        aria-label="구매 후보 비교"
                    >
                        <h2>구매 후보 비교 · {selected.length} / 4</h2>
                        <p>
                            구매를 검토하는 후보입니다. 설치 현황에는 반영되지
                            않습니다.
                        </p>
                        <div className={styles.comparison}>
                            {selected.map(item => {
                                const change = miniatureDelta(
                                    data.miniatures,
                                    installed,
                                    [item.id]
                                );
                                const q = quote(item);
                                const ratio = benefitCost(
                                    price(item),
                                    change.delta[stat]
                                );
                                return (
                                    <article
                                        className={styles.entry}
                                        key={item.id}
                                        aria-label={`${item.name} 가격 비교`}
                                    >
                                        <div className={styles.row}>
                                            <Icon item={item} />
                                            <h3>{item.name}</h3>
                                        </div>
                                        <p>
                                            {typeName(item)} ·{" "}
                                            {installed.includes(item.id)
                                                ? "설치 중"
                                                : "미설치"}
                                        </p>
                                        <dl>
                                            {Object.keys(item.effects).map(
                                                key => (
                                                    <div key={key}>
                                                        <dt>
                                                            {effectLabel(key)}
                                                        </dt>
                                                        <dd>
                                                            {effectValue(
                                                                key,
                                                                change.before
                                                                    .total[
                                                                    key
                                                                ] ?? 0
                                                            )}{" "}
                                                            →{" "}
                                                            {effectValue(
                                                                key,
                                                                change.after
                                                                    .total[
                                                                    key
                                                                ] ?? 0
                                                            )}{" "}
                                                            (
                                                            {effectValue(
                                                                key,
                                                                change.delta[
                                                                    key
                                                                ] ?? 0,
                                                                true
                                                            )}
                                                            )
                                                        </dd>
                                                    </div>
                                                )
                                            )}
                                        </dl>
                                        <label>
                                            가격 (Gold)
                                            <input
                                                aria-label={`${item.name} 가격 (Gold)`}
                                                inputMode="numeric"
                                                maxLength={16}
                                                aria-invalid={
                                                    Object.hasOwn(
                                                        config.manualPrices,
                                                        item.itemId
                                                    ) &&
                                                    config.manualPrices[
                                                        item.itemId
                                                    ] !== "" &&
                                                    price(item) === null
                                                }
                                                value={
                                                    config.manualPrices[
                                                        item.itemId
                                                    ] ??
                                                    marketGold(q?.data) ??
                                                    ""
                                                }
                                                onChange={e =>
                                                    setConfig(c => ({
                                                        ...c,
                                                        manualPrices: {
                                                            ...c.manualPrices,
                                                            [item.itemId]:
                                                                e.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </label>
                                        {Object.hasOwn(
                                            config.manualPrices,
                                            item.itemId
                                        ) && (
                                            <>
                                                <p>
                                                    {config.manualPrices[
                                                        item.itemId
                                                    ] !== "" &&
                                                    price(item) === null
                                                        ? "가격은 안전한 범위의 0 이상 정수로 입력하세요."
                                                        : "수정한 가격"}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        setConfig(c => ({
                                                            ...c,
                                                            manualPrices:
                                                                Object.fromEntries(
                                                                    Object.entries(
                                                                        c.manualPrices
                                                                    ).filter(
                                                                        ([
                                                                            key,
                                                                        ]) =>
                                                                            key !==
                                                                            String(
                                                                                item.itemId
                                                                            )
                                                                    )
                                                                ),
                                                        }))
                                                    }
                                                >
                                                    조회 가격 사용
                                                </button>
                                            </>
                                        )}
                                        <p>
                                            {price(item) === null
                                                ? "가격 미확인"
                                                : `${miniatureNumber(price(item)!)} Gold`}
                                        </p>
                                        {stat !== "all" && (
                                            <p>
                                                {ratio === null
                                                    ? change.delta[stat] <= 0
                                                        ? "추가 효과 없음 · 효율 계산 제외"
                                                        : price(item) === 0
                                                          ? "0 Gold · 효율 계산 제외"
                                                          : "가격 확인 후 효율 계산"
                                                    : `${effectLabel(stat)} 1${MINIATURE_EFFECTS[stat].unit === "%" ? "%p" : "포인트"}당 ${miniatureNumber(ratio)} Gold`}
                                            </p>
                                        )}
                                        {q?.isFetching && (
                                            <p role="status">가격 조회 중…</p>
                                        )}
                                        {q?.data && (
                                            <p>
                                                최저 개당 가격{" "}
                                                {marketGold(q.data) === null
                                                    ? "매물 가격 없음"
                                                    : `${miniatureNumber(q.data.minPrice)} Gold`}{" "}
                                                · 수량{" "}
                                                {miniatureNumber(
                                                    q.data.availableQuantity
                                                )}{" "}
                                                ·{" "}
                                                {q.data.fetchedAt
                                                    ? `조회 시각 ${new Date(q.data.fetchedAt).toLocaleString("ko-KR")}`
                                                    : "조회 시각 확인 불가"}{" "}
                                                ·{" "}
                                                {q.data.isComplete
                                                    ? "전체 조회"
                                                    : "일부 조회 · 조회된 페이지 기준"}
                                            </p>
                                        )}
                                        {q?.isError && (
                                            <p role="alert">
                                                가격 조회 실패. 가격 조회
                                                버튼으로 다시 시도하세요.
                                                {q.data &&
                                                    " 이전 조회 가격을 표시합니다."}
                                            </p>
                                        )}
                                        <Auction item={item} />
                                        <Effects item={item} />
                                        <button
                                            aria-label={`${item.name} 비교 제거`}
                                            onClick={() => remove(item.id)}
                                        >
                                            비교 제거
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                        <div className={styles.controls}>
                            <button onClick={() => remove()}>전체 해제</button>
                            <button
                                onClick={() => void lookup()}
                                disabled={fetching || !names.length}
                            >
                                {fetching ? "가격 조회 중…" : "가격 조회"}
                            </button>
                        </div>
                    </section>
                    <section
                        className={styles.panel}
                        aria-label="함께 설치하면"
                    >
                        <h2>함께 설치하면</h2>
                        {basketSummary}
                        <p>
                            후보 전체를 함께 설치했을 때의 증가량입니다. 개별
                            증가량을 더하지 않습니다.
                        </p>
                    </section>
                </div>
                <section className={styles.panel} aria-label="미니어처 찾기">
                    <h2>미니어처 찾기</h2>
                    <label>
                        미니어처 검색
                        <input
                            ref={catalogSearch}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="이름·효과 검색"
                        />
                    </label>
                    <div className={styles.controls}>
                        <label>
                            목표 능력치
                            <select
                                value={stat}
                                onChange={e =>
                                    setConfig(c => ({
                                        ...c,
                                        targetStat: e.target.value,
                                    }))
                                }
                            >
                                <option value="all">전체</option>
                                {Object.keys(MINIATURE_EFFECTS).map(key => (
                                    <option key={key} value={key}>
                                        {effectLabel(key)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <TypeSelect
                            label="후보 종류"
                            value={type}
                            onChange={setType}
                        />
                    </div>
                    <p>
                        {stat === "all"
                            ? "모든 능력치의 미니어처를 검색합니다."
                            : "선택한 능력치 효과가 있는 미니어처만 표시합니다."}
                    </p>
                    <label className={styles.check}>
                        <input
                            type="checkbox"
                            checked={auctionOnly}
                            onChange={e => setAuctionOnly(e.target.checked)}
                        />
                        경매장 검색 가능만
                    </label>
                    <details>
                        <summary>상세 필터</summary>
                        <label>
                            후보 자체 능력치 최솟값
                            <input
                                disabled={stat === "all"}
                                type="number"
                                min="0"
                                step="any"
                                value={minimum}
                                onChange={e => setMinimum(e.target.value)}
                            />
                        </label>
                        <label>
                            개당 예산 (Gold)
                            <input
                                inputMode="numeric"
                                value={budget}
                                onChange={e => setBudget(e.target.value)}
                            />
                        </label>
                        {budget !== "" && budgetNumber === null && (
                            <p>
                                예산은 안전한 범위의 0 이상 정수로 입력하세요.
                            </p>
                        )}
                        <p>
                            예산은 확인된 개당 가격에만 적용합니다. 가격 미확인
                            항목은 별도로 표시합니다.
                        </p>
                    </details>
                    <p>
                        {visible.length}개 ·{" "}
                        {stat === "all"
                            ? "최신순 (등록 ID 기준)"
                            : `${effectLabel(stat)} 높은 순`}
                    </p>
                    <div className={styles.catalog}>
                        {visible.length === 0 && <p>검색 결과가 없습니다.</p>}
                        {[
                            {
                                label:
                                    budgetNumber === null
                                        ? "검색 결과"
                                        : "예산 이내",
                                items: pricedResults,
                            },
                            {
                                label: "가격 미확인 · 예산 판정 제외",
                                items: unknownPrices,
                            },
                        ]
                            .filter(group => group.items.length)
                            .map(group => (
                                <section
                                    key={group.label}
                                    aria-label={group.label}
                                >
                                    {budgetNumber !== null && (
                                        <h3>
                                            {group.label} · {group.items.length}
                                            개
                                        </h3>
                                    )}
                                    {group.items.map(item => {
                                        const changes = miniatureDelta(
                                            data.miniatures,
                                            installed,
                                            [item.id]
                                        ).delta;
                                        return (
                                            <article
                                                className={styles.entry}
                                                key={item.id}
                                                aria-label={item.name}
                                                data-selected={config.candidateIds.includes(
                                                    item.id
                                                )}
                                            >
                                                <div className={styles.row}>
                                                    <Icon item={item} />
                                                    <div>
                                                        <h3>{item.name}</h3>
                                                        <span>
                                                            {typeName(item)}
                                                            {config.candidateIds.includes(
                                                                item.id
                                                            )
                                                                ? " · ✓ 비교 중"
                                                                : ""}
                                                        </span>
                                                        {Object.entries(
                                                            item.effects
                                                        ).map(
                                                            ([key, value]) => (
                                                                <p key={key}>
                                                                    {effectLabel(
                                                                        key
                                                                    )}{" "}
                                                                    {effectValue(
                                                                        key,
                                                                        value
                                                                    )}
                                                                    {changes[
                                                                        key
                                                                    ] !==
                                                                        undefined && (
                                                                        <span
                                                                            className={
                                                                                styles.value
                                                                            }
                                                                        >
                                                                            {" "}
                                                                            ·{" "}
                                                                            {changes[
                                                                                key
                                                                            ] >
                                                                            0
                                                                                ? `내 설치 대비 ${effectValue(key, changes[key], true)}`
                                                                                : "내 설치 대비 변화 없음"}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className={styles.controls}
                                                >
                                                    {installCheckbox(item)}
                                                    <button
                                                        disabled={config.candidateIds.includes(
                                                            item.id
                                                        )}
                                                        onClick={() =>
                                                            add(item)
                                                        }
                                                    >
                                                        비교 추가
                                                    </button>
                                                    <Auction item={item} />
                                                </div>
                                                <Effects item={item} />
                                            </article>
                                        );
                                    })}
                                </section>
                            ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
