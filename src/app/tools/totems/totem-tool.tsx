"use client";

import { useMemo, useState } from "react";

import {
    comparisonTotemKeys,
    evaluateTotem,
    filterTotems,
    parseTotemGold,
    positiveTotemGold,
    sortTotemCandidates,
    type Totem,
    TOTEM_STATS,
    totemBudgetState,
    totemContribution,
    type TotemReference,
    totemStatLabel,
    totemValue,
} from "@/lib/totems";
import {
    candidateTotemRoll,
    snapshotTotemListing,
    sourceTotemCandidate,
    type TotemCandidate,
} from "@/lib/totems-state";

import { TotemCatalog } from "./totem-catalog";
import { TotemComparison } from "./totem-comparison";
import { useTotemConfig, useTotemMarket } from "./totem-hooks";
import s from "./totem-tool.module.css";
import {
    TotemAuctionLink,
    TotemBadges,
    TotemEvaluationCell,
    TotemEvidence,
    TotemIcon,
    TotemInputs,
    TotemPrice,
    TotemRangeList,
    totemTime,
} from "./totem-ui";

export default function TotemTool({ data }: { data: TotemReference }) {
    const state = useTotemConfig(data);
    const { config, setConfig } = state;
    const [search, setSearch] = useState("");
    const [type, setType] = useState("all");
    const [target, setTarget] = useState("all");
    const [effect, setEffect] = useState("all");
    const [auctionOnly, setAuctionOnly] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Extract<
        TotemCandidate,
        { kind: "manual" }
    > | null>(null);
    const [sort, setSort] = useState<"price" | "value">("price");
    const [minimum, setMinimum] = useState("");
    const [withinBudget, setWithinBudget] = useState(false);
    const [marketPage, setMarketPage] = useState(0);
    const selected = data.totems.find(r => r.id === selectedId);
    const draftItem = data.totems.find(r => r.id === draft?.id);
    const market = useTotemMarket(selected);
    const items = useMemo(
        () =>
            filterTotems(data.totems, {
                search,
                type,
                target,
                stat: effect,
                auctionOnly,
            }),
        [data.totems, search, type, target, effect, auctionOnly]
    );
    const budget = parseTotemGold(config.budget);
    const budgetInvalid = config.budget !== "" && budget === null;
    const minValue = totemValue(config.targetStat, minimum);
    const minimumInvalid =
        config.targetStat !== "all" && !!minimum.trim() && minValue === null;
    const effectiveSort = config.targetStat === "all" ? "price" : sort;
    const loaded = useMemo(
        () =>
            market.result?.listings.map(listing => {
                const candidate = snapshotTotemListing(listing);
                return {
                    candidate,
                    roll: candidateTotemRoll(candidate, data),
                    price: listing.item.auction_price_per_unit,
                };
            }) ?? [],
        [market.result, data]
    );
    const filtered = useMemo(
        () =>
            loaded.filter(({ price, roll }) => {
                if (withinBudget && totemBudgetState(price, budget) === "over")
                    return false;
                const value = totemContribution(roll, config.targetStat);
                return minValue === null || value === null || value >= minValue;
            }),
        [loaded, withinBudget, budget, config.targetStat, minValue]
    );
    const sorted = useMemo(
        () =>
            sortTotemCandidates(
                filtered,
                row =>
                    effectiveSort === "price"
                        ? positiveTotemGold(row.price)
                        : evaluateTotem(config.targetStat, row.roll).value,
                effectiveSort === "value"
            ),
        [filtered, effectiveSort, config.targetStat]
    );
    const pages = Math.max(1, Math.ceil(sorted.length / 8));
    const currentPage = Math.min(marketPage, pages - 1);
    function select(item: Totem) {
        setSelectedId(item.id);
        setMarketPage(0);
    }
    function startManual(item: Totem) {
        setDraft({
            kind: "manual",
            key: `manual:${crypto.randomUUID()}`,
            id: item.id,
            values: {},
            price: "",
        });
    }
    function addDraft() {
        if (draft && state.add(draft)) setDraft(null);
    }
    const unknownCount = useMemo(
        () =>
            loaded.filter(
                r =>
                    !r.roll.effectSetKnown ||
                    comparisonTotemKeys([r.roll]).some(
                        key =>
                            !["within", "fixed"].includes(
                                evaluateTotem(key, r.roll).rangeStatus
                            )
                    )
            ).length,
        [loaded]
    );
    return (
        <fieldset
            disabled={!state.ready}
            aria-label="토템 비교 설정"
            className={`${s.tool} ${config.candidates.length ? s.hasCandidates : ""}`}
        >
            <div className={s.toolbar}>
                <label>
                    토템 이름·효과 검색
                    <input
                        type="search"
                        placeholder="예: 보너스 대미지, 콜튼"
                        maxLength={100}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </label>
                <label>
                    종류
                    <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="all">전체</option>
                        <option value="normal">일반</option>
                        <option value="extra">엑스트라</option>
                    </select>
                </label>
                <label>
                    적용 대상
                    <select
                        value={target}
                        onChange={e => setTarget(e.target.value)}
                    >
                        <option value="all">전체</option>
                        <option value="character">캐릭터</option>
                        <option value="pet">펫</option>
                    </select>
                </label>
            </div>
            <section aria-label="상세 필터">
                <h2>상세 필터</h2>
                <div className={s.toolbar}>
                    <label>
                        찾을 효과
                        <select
                            value={effect}
                            onChange={e => setEffect(e.target.value)}
                        >
                            <option value="all">전체 효과</option>
                            {Object.entries(TOTEM_STATS).map(([key, stat]) => (
                                <option key={key} value={key}>
                                    {stat.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={s.check}>
                        <input
                            type="checkbox"
                            checked={auctionOnly}
                            onChange={e => setAuctionOnly(e.target.checked)}
                        />
                        경매장 검색 가능만
                    </label>
                    <button
                        onClick={() => {
                            setSearch("");
                            setType("all");
                            setTarget("all");
                            setEffect("all");
                            setAuctionOnly(false);
                        }}
                    >
                        탐색 조건 초기화
                    </button>
                </div>
            </section>
            {selected && <a href="#totem-selected">선택한 토템 보기</a>}
            {state.notice && (
                <p className={s.notice} role="status">
                    {state.notice}
                </p>
            )}
            <div className={s.columns}>
                <TotemCatalog
                    items={items}
                    selectedId={selectedId}
                    onSelect={select}
                    filterKey={`${search}:${type}:${target}:${effect}:${auctionOnly}`}
                />
                <div>
                    <section
                        className={s.panel}
                        id="totem-selected"
                        style={{ scrollMarginTop: 100 }}
                        aria-label="선택한 토템"
                    >
                        {!selected ? (
                            <>
                                <h2>토템을 선택해 주세요</h2>
                                <p>
                                    가능한 옵션 범위를 확인하고, 내 실제 값이나
                                    경매 매물을 비교할 수 있습니다.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className={s.titleRow}>
                                    <TotemIcon item={selected} />
                                    <h2>{selected.name}</h2>
                                </div>
                                <TotemBadges item={selected} />
                                <TotemRangeList item={selected} />
                                <div className={s.actions}>
                                    {selected.searchable ? (
                                        <button
                                            className={s.primary}
                                            disabled={market.loading}
                                            onClick={() => {
                                                setMarketPage(0);
                                                void market.load();
                                            }}
                                        >
                                            {market.loading
                                                ? "매물 조회 중…"
                                                : market.result
                                                  ? "매물 다시 조회"
                                                  : "매물 조회"}
                                        </button>
                                    ) : (
                                        <p>경매장 검색 미지원</p>
                                    )}
                                    <button
                                        onClick={() => startManual(selected)}
                                    >
                                        옵션 직접 입력
                                    </button>
                                </div>
                                <div className={s.actions}>
                                    <button
                                        onClick={() =>
                                            state.add(
                                                sourceTotemCandidate(selected)
                                            )
                                        }
                                    >
                                        범위 비교에 추가
                                    </button>
                                    <button
                                        disabled={
                                            !Object.keys(selected.ranges).length
                                        }
                                        onClick={() =>
                                            state.add(
                                                sourceTotemCandidate(
                                                    selected,
                                                    true
                                                )
                                            )
                                        }
                                    >
                                        최댓값으로 가정하여 추가
                                    </button>
                                    {selected.searchable && (
                                        <TotemAuctionLink
                                            name={selected.name}
                                        />
                                    )}
                                </div>
                                <details>
                                    <summary>아이템 설명·적용 규칙</summary>
                                    <p className={s.description}>
                                        {selected.description}
                                    </p>
                                </details>
                            </>
                        )}
                    </section>
                    {draft && draftItem && (
                        <section
                            className={s.panel}
                            aria-label="후보 직접 입력"
                        >
                            <h2>직접 입력 · {draftItem.name}</h2>
                            <TotemInputs
                                label="후보 옵션"
                                item={draftItem}
                                values={draft.values}
                                onChange={(key, value) =>
                                    setDraft(d =>
                                        d
                                            ? {
                                                  ...d,
                                                  values: {
                                                      ...d.values,
                                                      [key]: value,
                                                  },
                                              }
                                            : null
                                    )
                                }
                            />
                            <label>
                                후보 개당 가격 (골드, 선택)
                                <input
                                    inputMode="numeric"
                                    maxLength={16}
                                    value={draft.price}
                                    onChange={e =>
                                        setDraft(d =>
                                            d
                                                ? {
                                                      ...d,
                                                      price: e.target.value,
                                                  }
                                                : null
                                        )
                                    }
                                    aria-invalid={
                                        !!draft.price &&
                                        parseTotemGold(draft.price) === null
                                    }
                                    aria-describedby="totem-manual-price-help"
                                />
                            </label>
                            <p id="totem-manual-price-help" className={s.muted}>
                                {draft.price &&
                                parseTotemGold(draft.price) === null
                                    ? "가격 확인 필요: 0 이상의 정수 골드를 입력해 주세요."
                                    : "가격을 모르면 비워 두세요. 옵션 비교는 유지됩니다."}
                            </p>
                            <div className={s.actions}>
                                <button onClick={addDraft}>
                                    직접 입력 후보 추가
                                </button>
                                <button onClick={() => setDraft(null)}>
                                    직접 입력 닫기
                                </button>
                            </div>
                        </section>
                    )}
                    <section className={s.panel} aria-label="실제 매물">
                        <h2>실제 매물</h2>
                        {!market.result && !market.loading && !market.error && (
                            <p>
                                아직 매물을 조회하지 않았습니다. 토템
                                선택만으로는 조회하지 않습니다.
                            </p>
                        )}
                        {market.loading && (
                            <p role="status">매물을 불러오는 중입니다.</p>
                        )}
                        {market.error && (
                            <p className={s.warning} role="alert">
                                {market.error}
                                {market.result
                                    ? ` 이전 조회 결과 · ${totemTime(market.result.observedAt)}`
                                    : ""}
                            </p>
                        )}
                        <div className={s.toolbar}>
                            <label>
                                목표 스탯
                                <select
                                    value={config.targetStat}
                                    onChange={e => {
                                        setConfig(c => ({
                                            ...c,
                                            targetStat: e.target.value,
                                        }));
                                        setMinimum("");
                                        setMarketPage(0);
                                    }}
                                >
                                    <option value="all">전체 효과</option>
                                    {Object.entries(TOTEM_STATS).map(
                                        ([key, stat]) => (
                                            <option key={key} value={key}>
                                                {stat.label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>
                            <label>
                                매물 정렬
                                <select
                                    value={effectiveSort}
                                    onChange={e => {
                                        setSort(
                                            e.target.value as "price" | "value"
                                        );
                                        setMarketPage(0);
                                    }}
                                >
                                    <option value="price">
                                        개당 가격 낮은 순
                                    </option>
                                    <option
                                        value="value"
                                        disabled={config.targetStat === "all"}
                                    >
                                        목표 실제값 높은 순
                                    </option>
                                </select>
                            </label>
                            <label>
                                목표 스탯 최소값
                                <input
                                    inputMode="decimal"
                                    maxLength={64}
                                    disabled={config.targetStat === "all"}
                                    value={minimum}
                                    onChange={e => {
                                        setMinimum(e.target.value);
                                        setMarketPage(0);
                                    }}
                                    aria-invalid={minimumInvalid}
                                    aria-describedby="totem-minimum-help"
                                />
                            </label>
                        </div>
                        <p
                            id="totem-minimum-help"
                            className={minimumInvalid ? s.loss : s.muted}
                        >
                            {minimumInvalid
                                ? "최소값 형식을 확인해 주세요. 조건을 적용하지 않았습니다."
                                : "값이 미확인인 매물은 제외하지 않습니다."}
                        </p>
                        <label>
                            개당 예산 (골드, 선택)
                            <input
                                inputMode="numeric"
                                maxLength={16}
                                value={config.budget}
                                onChange={e => {
                                    setConfig(c => ({
                                        ...c,
                                        budget: e.target.value,
                                    }));
                                    setMarketPage(0);
                                }}
                                aria-invalid={budgetInvalid}
                                aria-describedby="totem-budget-help"
                            />
                        </label>
                        <p
                            id="totem-budget-help"
                            className={budgetInvalid ? s.loss : s.muted}
                        >
                            {budgetInvalid
                                ? "예산 확인 필요: 0 이상의 정수 골드를 입력해 주세요."
                                : "개당 가격으로 예산을 판단합니다. 묶음 구매 총액은 별도로 확인하세요."}
                        </p>
                        <details>
                            <summary>불러온 매물 필터</summary>
                            <label className={s.check}>
                                <input
                                    type="checkbox"
                                    checked={withinBudget}
                                    onChange={e => {
                                        setWithinBudget(e.target.checked);
                                        setMarketPage(0);
                                    }}
                                />
                                개당 예산 초과 제외 · 가격 미확인 유지
                            </label>
                            <button
                                onClick={() => {
                                    setMinimum("");
                                    setWithinBudget(false);
                                    setMarketPage(0);
                                }}
                            >
                                매물 필터 해제
                            </button>
                        </details>
                        {market.result && (
                            <>
                                <p className={s.muted}>
                                    {totemTime(market.result.observedAt)} 조회 ·
                                    응답 {market.result.receivedCount}개 중
                                    정확한 이름 {loaded.length}개 · 현재 조건{" "}
                                    {sorted.length}개 · 옵션·범위 확인 필요{" "}
                                    {unknownCount}개
                                </p>
                                {market.result.hasMore && (
                                    <p className={s.warning}>
                                        일부 매물만 불러왔습니다. 정렬·가격
                                        비교는 불러온 매물 기준입니다.
                                    </p>
                                )}
                                {!loaded.length ? (
                                    <p>
                                        조회한 범위에서 매물이 없습니다. 직접
                                        입력으로 계속 비교할 수 있습니다.
                                    </p>
                                ) : !sorted.length ? (
                                    <p>
                                        불러온 매물 중 조건에 맞는 결과가
                                        없습니다.
                                    </p>
                                ) : (
                                    sorted
                                        .slice(
                                            currentPage * 8,
                                            (currentPage + 1) * 8
                                        )
                                        .map(({ candidate, roll }) => {
                                            if (candidate.kind !== "listing")
                                                return null;
                                            const selectedCandidate =
                                                config.candidates.some(
                                                    c => c.key === candidate.key
                                                );
                                            const keys = comparisonTotemKeys([
                                                roll,
                                            ]);
                                            return (
                                                <article
                                                    className={s.entry}
                                                    data-selected={
                                                        selectedCandidate
                                                    }
                                                    key={candidate.key}
                                                    aria-label={`${candidate.item.item_display_name} 매물`}
                                                >
                                                    <h3>
                                                        {
                                                            candidate.item
                                                                .item_display_name
                                                        }
                                                    </h3>
                                                    {candidate.item
                                                        .item_name !==
                                                        candidate.item
                                                            .item_display_name && (
                                                        <p className={s.muted}>
                                                            기준 이름:{" "}
                                                            {
                                                                candidate.item
                                                                    .item_name
                                                            }
                                                        </p>
                                                    )}
                                                    <TotemPrice
                                                        candidate={candidate}
                                                        budget={budget}
                                                    />
                                                    <dl className={s.statList}>
                                                        {keys.map(key => (
                                                            <div key={key}>
                                                                <dt>
                                                                    {totemStatLabel(
                                                                        key
                                                                    )}
                                                                </dt>
                                                                <dd>
                                                                    <TotemEvaluationCell
                                                                        evaluation={evaluateTotem(
                                                                            key,
                                                                            roll
                                                                        )}
                                                                    />
                                                                </dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                    <TotemEvidence
                                                        roll={roll}
                                                    />
                                                    <label className={s.check}>
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectedCandidate
                                                            }
                                                            onChange={() =>
                                                                selectedCandidate
                                                                    ? state.remove(
                                                                          candidate.key
                                                                      )
                                                                    : state.add(
                                                                          candidate
                                                                      )
                                                            }
                                                        />
                                                        {selectedCandidate
                                                            ? "비교에서 제거"
                                                            : "비교에 추가"}
                                                    </label>
                                                </article>
                                            );
                                        })
                                )}
                                {pages > 1 && (
                                    <div className={s.actions}>
                                        <button
                                            disabled={currentPage === 0}
                                            onClick={() =>
                                                setMarketPage(currentPage - 1)
                                            }
                                        >
                                            이전 매물
                                        </button>
                                        <span>
                                            {currentPage + 1} / {pages}
                                        </span>
                                        <button
                                            disabled={currentPage + 1 === pages}
                                            onClick={() =>
                                                setMarketPage(currentPage + 1)
                                            }
                                        >
                                            다음 매물
                                        </button>
                                    </div>
                                )}
                                <TotemAuctionLink name={market.result.name} />
                            </>
                        )}
                    </section>
                </div>
            </div>
            <TotemComparison data={data} state={state} />
            {!!config.candidates.length && (
                <div className={s.footerBar}>
                    <strong>비교 {config.candidates.length} / 4</strong>
                    <a href="#totem-comparison">후보 비교 보기</a>
                </div>
            )}
        </fieldset>
    );
}
