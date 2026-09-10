"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatGold } from "@/lib/auction-calculator";
import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    type BarterGood,
    type BarterReference,
    type BarterRow,
    barterWeek,
    calculateBarter,
    goodIssue,
    parseBarterInteger,
    rowIssue,
    seoulDateInput,
} from "@/lib/barter";
import {
    activeBarterRows,
    addManualGood,
    barterPrices,
    barterRows,
    barterSelectionIssues,
    barterText,
    buildBarterShare,
    changedBarterRows,
    moveBarterWeek,
    recordBarterExchanges,
    updateBarterRow,
} from "@/lib/barter-state";

import {
    useBarterMarket,
    useBarterMaterials,
    useBarterPlan,
} from "./barter-hooks";
import SeasonEditor from "./season-editor";

const inputClass =
    "mt-1 w-full rounded border border-slate-400 bg-white px-3 py-2 text-slate-900 disabled:bg-slate-100";
const date = (time: number) =>
    `${seoulDateInput(time).replace("T", " ")} (서울)`;

export default function BarterTool({ data }: { data: BarterReference }) {
    const state = useBarterPlan(data);
    const { plan, update, ready, now, setNotice } = state;
    const catalog = useBarterMaterials(data, plan);
    const rows = activeBarterRows(plan, data, now);
    const allRows = barterRows(plan, data);
    const changed = changedBarterRows(plan, data);
    const prices = barterPrices(plan, catalog);
    const calculated = calculateBarter(
        rows,
        plan.owned,
        prices,
        catalog.materials,
        now
    );
    const extraErrors = [
        ...barterSelectionIssues(plan, data),
        ...rows
            .filter(
                r =>
                    changed.includes(r.good.key) &&
                    (r.q !== "0" || r.used !== "0")
            )
            .map(
                r =>
                    `${r.good.name}: 원본 정의가 변경되거나 삭제되었습니다. 이전 입력을 확인해 주세요.`
            ),
        ...(catalog.error ? [catalog.error] : []),
        ...(catalog.pending ? ["재료 ID를 확인하고 있습니다."] : []),
    ];
    const result = {
        ...calculated,
        errors: [...calculated.errors, ...extraErrors],
        valid: calculated.valid && !extraErrors.length,
        replacement: {
            ...calculated.replacement,
            complete: calculated.replacement.complete && !extraErrors.length,
        },
        purchase: {
            ...calculated.purchase,
            complete: calculated.purchase.complete && !extraErrors.length,
        },
    };
    const market = useBarterMarket(result, update, state.epoch);
    const oldWeek = plan.weekKey !== barterWeek(now);
    const [editing, setEditing] = useState<BarterGood | null | undefined>(
        undefined
    );
    const [exported, setExported] = useState("");
    const [recording, setRecording] = useState(false);
    const [undo, setUndo] = useState<{
        week: number;
        rows: BarterRow[];
    } | null>(null);

    useEffect(() => {
        setEditing(undefined);
        setExported("");
        setRecording(false);
        setUndo(null);
    }, [state.epoch]);

    function editRow(row: BarterRow, patch: Partial<BarterRow>) {
        setUndo(null);
        update(p =>
            updateBarterRow(p, {
                ...(p.rows.find(r => r.good.key === row.good.key) ?? row),
                ...patch,
            })
        );
    }
    function prepare(postId?: number) {
        update(p => {
            let next = p;
            for (const row of activeBarterRows(p, data, Date.now())) {
                if (postId !== undefined && row.good.postId !== postId)
                    continue;
                const used = parseBarterInteger(row.used);
                if (
                    used === null ||
                    used > row.good.limit ||
                    goodIssue(row.good, Date.now()) ||
                    changed.includes(row.good.key)
                )
                    continue;
                next = updateBarterRow(next, {
                    ...row,
                    q: String(row.good.limit - used),
                });
            }
            return next;
        });
        setUndo(null);
    }
    async function copy(text: string) {
        setExported(text);
        try {
            await navigator.clipboard.writeText(text);
            setNotice("복사했습니다.");
        } catch {
            setNotice(
                "자동 복사를 사용할 수 없습니다. 아래 텍스트를 선택해 복사해 주세요."
            );
        }
    }
    const text = () => barterText(plan, result, now);
    function share() {
        try {
            void copy(
                new URL(buildBarterShare(plan), window.location.origin).href
            );
        } catch (error) {
            setExported(text());
            setNotice(
                error instanceof Error
                    ? error.message
                    : "공유 링크를 만들지 못했습니다."
            );
        }
    }
    function download() {
        const url = URL.createObjectURL(
            new Blob([text()], { type: "text/plain;charset=utf-8" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "barter-preparation.txt";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    const postIds = [...new Set(allRows.map(r => r.good.postId))];
    const canLookup = result.materials.some(
        r => r.missing! > 0 && r.material.searchable && !r.material.ambiguous
    );

    return (
        <div className="space-y-5 text-slate-900">
            {!ready && <p role="status">저장된 계획을 확인하고 있습니다.</p>}
            {state.notice && (
                <p
                    role="status"
                    className="rounded border border-sky-300 bg-sky-50 p-3"
                >
                    {state.notice}
                </p>
            )}
            {ready && oldWeek && (
                <section
                    className="space-y-2 rounded border border-amber-400 bg-amber-50 p-3"
                    aria-label="주간 전환"
                >
                    <p>
                        이전 주 계획입니다. 사용량은 {date(plan.weekKey)} 시작
                        주의 입력입니다. 이번 주로 전환하면 사용량만 초기화하고
                        추가 계획·보유 수량·가격을 유지합니다.
                    </p>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => {
                            market.cancel();
                            setUndo(null);
                            update(p => moveBarterWeek(p, Date.now()));
                        }}
                    >
                        이번 주로 전환
                    </button>
                </section>
            )}
            {ready &&
                (state.temporary ||
                    state.needsSaveReview ||
                    plan.snapshotVersion !== data.version) && (
                    <section
                        className="space-y-2 rounded border border-amber-400 bg-amber-50 p-3"
                        aria-label="계획 가져오기"
                    >
                        <p>
                            {state.temporary
                                ? "공유 링크는 임시 계획입니다. 편집해도 저장된 내 계획을 덮어쓰지 않습니다."
                                : "저장된 데이터 또는 저장소 상태를 확인해 주세요. 현재 입력을 자동으로 덮어쓰지 않습니다."}
                        </p>
                        <button
                            type="button"
                            className="btn mr-2"
                            disabled={!result.valid || changed.length > 0}
                            onClick={state.adopt}
                        >
                            {state.temporary
                                ? "내 계획으로 가져오기"
                                : "확인한 계획을 이 기기에 저장"}
                        </button>
                        {state.temporary && (
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    market.cancel();
                                    setUndo(null);
                                    state.openSaved();
                                }}
                            >
                                저장된 계획 열기
                            </button>
                        )}
                    </section>
                )}
            {state.backup && (
                <details>
                    <summary>읽지 못한 원래 저장 내용</summary>
                    <textarea
                        className={inputClass}
                        readOnly
                        value={state.backup}
                        aria-label="원래 저장 내용"
                        rows={5}
                    />
                </details>
            )}
            <fieldset disabled={!ready} className="space-y-5">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="btn"
                        disabled={oldWeek}
                        onClick={() => prepare()}
                    >
                        지원 교역품 전체 준비
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => {
                            market.cancel();
                            setUndo(null);
                            update(p => ({
                                ...p,
                                rows: p.rows.map(r => ({ ...r, q: "0" })),
                                checked: [],
                            }));
                        }}
                    >
                        계획 비우기
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => setEditing(null)}
                    >
                        시즌 교역품 직접 입력
                    </button>
                </div>
                <p className="text-sm text-slate-700">
                    전체 준비는 지원하는 고정{" "}
                    {data.goods.filter(g => g.source === "fixed").length}개와
                    선택한 유효 시즌 교역품의 남은 한도만 채웁니다. 주간 기준은
                    목요일 07:00, 월간 재료 회전은 첫 목요일 07:00 (서울)입니다.
                </p>
                {editing !== undefined && (
                    <SeasonEditor
                        key={editing?.key ?? "new"}
                        initial={editing}
                        data={data}
                        materials={catalog.materials}
                        now={now}
                        onMaterials={catalog.add}
                        onCancel={() => setEditing(undefined)}
                        onSave={good => {
                            try {
                                const next = addManualGood(plan, good);
                                market.cancel();
                                update(() => next);
                                setEditing(undefined);
                                setUndo(null);
                                return true;
                            } catch (error) {
                                setNotice(
                                    error instanceof Error
                                        ? error.message
                                        : "직접 입력을 확인해 주세요."
                                );
                                return false;
                            }
                        }}
                    />
                )}

                <section
                    aria-labelledby="barter-shopping-heading"
                    className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
                >
                    <h2
                        id="barter-shopping-heading"
                        className="text-xl font-bold"
                    >
                        통합 준비 목록
                    </h2>
                    <p className="mt-2 text-sm">
                        보유 수량은 전체 필요량에서 한 번만 차감합니다. 준비
                        완료 체크는 수량이나 실제 교환 사용량을 바꾸지 않습니다.
                    </p>
                    {result.errors.length > 0 && (
                        <div
                            role="alert"
                            className="my-3 rounded bg-amber-50 p-3"
                        >
                            <p className="font-bold">
                                입력 확인 필요 — 아래는 확인된 부분의
                                소계입니다.
                            </p>
                            <ul className="list-inside list-disc">
                                {result.errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                            {catalog.error && (
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={catalog.retry}
                                >
                                    재료 ID 다시 확인
                                </button>
                            )}
                        </div>
                    )}
                    {!result.materials.length && (
                        <p className="py-6 text-slate-600">
                            아래 교역소에서 추가 교환 횟수를 입력해 주세요.
                        </p>
                    )}
                    <div className="divide-y divide-slate-200">
                        {result.materials.map(row => {
                            const m = row.material;
                            const quote = plan.quotes[m.name];
                            const ownedInvalid =
                                parseBarterInteger(plan.owned[m.id] ?? "0") ===
                                null;
                            const manual = Object.hasOwn(plan.prices, m.id);
                            const priceInvalid =
                                manual &&
                                plan.prices[m.id] !== "" &&
                                parseBarterInteger(plan.prices[m.id]) === null;
                            return (
                                <article
                                    key={m.id}
                                    className="space-y-3 py-4"
                                    aria-label={`${m.name} 재료`}
                                >
                                    <div className="flex flex-wrap justify-between gap-2">
                                        <h3 className="font-bold">
                                            {m.name}{" "}
                                            <span className="text-sm font-normal text-slate-600">
                                                #{m.id}
                                            </span>
                                        </h3>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={plan.checked.includes(
                                                    m.id
                                                )}
                                                onChange={e =>
                                                    update(p => ({
                                                        ...p,
                                                        checked: e.target
                                                            .checked
                                                            ? [
                                                                  ...p.checked,
                                                                  m.id,
                                                              ]
                                                            : p.checked.filter(
                                                                  id =>
                                                                      id !==
                                                                      m.id
                                                              ),
                                                    }))
                                                }
                                            />
                                            {m.name} 준비 완료
                                        </label>
                                    </div>
                                    <p>
                                        필요 <strong>{row.required}</strong> ·
                                        보유분 사용 {row.usedOwned ?? "미확인"}{" "}
                                        · 부족{" "}
                                        <strong className="text-sky-800">
                                            {row.missing ?? "미확인"}
                                        </strong>
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label>
                                            {m.name} 보유 수량
                                            <input
                                                className={inputClass}
                                                inputMode="numeric"
                                                maxLength={64}
                                                value={plan.owned[m.id] ?? "0"}
                                                aria-invalid={ownedInvalid}
                                                aria-describedby={
                                                    ownedInvalid
                                                        ? `owned-${m.id}`
                                                        : undefined
                                                }
                                                onChange={e =>
                                                    update(p => ({
                                                        ...p,
                                                        owned: {
                                                            ...p.owned,
                                                            [m.id]:
                                                                e.target.value,
                                                        },
                                                        checked: [],
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label>
                                            {m.name} 단가 (Gold)
                                            <input
                                                className={inputClass}
                                                inputMode="numeric"
                                                maxLength={64}
                                                placeholder="미입력"
                                                value={prices[m.id] ?? ""}
                                                aria-invalid={priceInvalid}
                                                aria-describedby={
                                                    priceInvalid
                                                        ? `price-${m.id}`
                                                        : undefined
                                                }
                                                onChange={e =>
                                                    update(p => ({
                                                        ...p,
                                                        prices: {
                                                            ...p.prices,
                                                            [m.id]:
                                                                e.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                    {ownedInvalid && (
                                        <p
                                            id={`owned-${m.id}`}
                                            className="text-red-800"
                                        >
                                            보유 수량은 0 이상의 정수로 입력해
                                            주세요.
                                        </p>
                                    )}
                                    {priceInvalid && (
                                        <p
                                            id={`price-${m.id}`}
                                            className="text-red-800"
                                        >
                                            단가는 0 이상의 안전한 정수 또는
                                            빈칸으로 입력해 주세요.
                                        </p>
                                    )}
                                    <p className="text-sm">
                                        가격 기준:{" "}
                                        {manual
                                            ? "직접 입력"
                                            : quote && row.unitPrice !== null
                                              ? "관측한 최저 등록 단가"
                                              : "미입력"}
                                        {manual && (
                                            <button
                                                type="button"
                                                className="btn btn-xs ml-2"
                                                onClick={() =>
                                                    update(p => ({
                                                        ...p,
                                                        prices: Object.fromEntries(
                                                            Object.entries(
                                                                p.prices
                                                            ).filter(
                                                                ([id]) =>
                                                                    id !==
                                                                    String(m.id)
                                                            )
                                                        ),
                                                    }))
                                                }
                                            >
                                                시세 사용
                                            </button>
                                        )}
                                    </p>
                                    {quote && (
                                        <p className="text-sm text-slate-700">
                                            {quote.fetchedAt
                                                ? "서버 조회"
                                                : "수신 시각 (서버 시각 미제공)"}
                                            :{" "}
                                            {date(
                                                Date.parse(
                                                    quote.fetchedAt ??
                                                        quote.observedAt
                                                )
                                            )}{" "}
                                            ·{" "}
                                            {quote.isComplete
                                                ? "전체 조회"
                                                : "부분 조회"}{" "}
                                            · 관측 수량{" "}
                                            {quote.availableQuantity}
                                            {quote.availableQuantity === 0
                                                ? " · 매물 없음"
                                                : row.missing !== null &&
                                                    quote.availableQuantity <
                                                        row.missing
                                                  ? " · 관측 수량 부족"
                                                  : ""}
                                        </p>
                                    )}
                                    {market.errors[m.name] && (
                                        <p
                                            role="status"
                                            className="text-red-800"
                                        >
                                            {market.errors[m.name]}
                                        </p>
                                    )}
                                    {m.searchable && !m.ambiguous ? (
                                        <Link
                                            className="text-sky-800 underline"
                                            href={getAuctionSearchPath(m.name)}
                                        >
                                            경매장 시세 보기 — {m.name}
                                        </Link>
                                    ) : (
                                        <p className="text-sm">
                                            {m.ambiguous
                                                ? "동명 변형이라 자동 시세를 적용하지 않습니다."
                                                : "경매 검색 지원 여부를 확인할 수 없습니다."}{" "}
                                            수동 가격을 입력할 수 있습니다.
                                        </p>
                                    )}
                                    <details>
                                        <summary className="cursor-pointer text-sm">
                                            교역품별 필요량
                                        </summary>
                                        <ul>
                                            {row.contributions.map(c => (
                                                <li key={c.key}>
                                                    {c.name}: {c.count}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                </article>
                            );
                        })}
                    </div>
                    <div
                        className="mt-3 space-y-2 rounded-lg bg-slate-100 p-4"
                        aria-label="준비 비용"
                    >
                        <p>
                            전체 재료 가치:{" "}
                            <strong>
                                {formatGold(result.replacement.known)} Gold
                            </strong>
                            {!result.replacement.complete &&
                                ` (알려진 소계 · 미확인 ${result.replacement.unknown}행)`}
                        </p>
                        <p>
                            추가 구매 예상액:{" "}
                            <strong>
                                {formatGold(result.purchase.known)} Gold
                            </strong>
                            {!result.purchase.complete &&
                                ` (알려진 소계 · 미확인 ${result.purchase.unknown}행)`}
                        </p>
                        <p className="text-sm">
                            현재 최저 단가 × 부족량의 추정입니다. 부분 조회·수량
                            부족·묶음 판매 때문에 실제 구매액과 다를 수
                            있습니다. 미입력 가격은 무료로 계산하지 않습니다.
                        </p>
                        <button
                            type="button"
                            className="btn"
                            disabled={
                                !result.valid ||
                                !canLookup ||
                                market.loading ||
                                oldWeek
                            }
                            onClick={() => void market.load()}
                        >
                            {market.loading
                                ? "시세 조회 중…"
                                : "부족한 재료 시세 조회"}
                        </button>
                        {market.loading && (
                            <button
                                type="button"
                                className="btn ml-2"
                                onClick={market.cancel}
                            >
                                조회 취소
                            </button>
                        )}
                    </div>
                </section>

                <section aria-label="교역소별 추가 교환" className="space-y-3">
                    <h2 className="text-xl font-bold">교역소별 추가 교환</h2>
                    {postIds.map(postId => {
                        const postRows = rows.filter(
                            r => r.good.postId === postId
                        );
                        const variants = allRows.filter(
                            r => r.good.postId === postId && r.good.period
                        );
                        return (
                            <details
                                key={postId}
                                open={postId === 201}
                                className="rounded-xl border border-slate-300 bg-white p-4"
                            >
                                <summary className="cursor-pointer font-bold">
                                    {
                                        allRows.find(
                                            r => r.good.postId === postId
                                        )?.good.postName
                                    }
                                </summary>
                                <button
                                    type="button"
                                    className="btn btn-sm my-3"
                                    disabled={oldWeek}
                                    onClick={() => prepare(postId)}
                                >
                                    이 교역소 남은 한도 준비
                                </button>
                                {!!variants.length && (
                                    <label className="mb-3 block">
                                        시즌 출처 선택
                                        <select
                                            className={inputClass}
                                            value={
                                                plan.seasonChoices[postId] ??
                                                postRows.find(
                                                    r => r.good.period
                                                )?.good.key ??
                                                ""
                                            }
                                            onChange={e => {
                                                market.cancel();
                                                setUndo(null);
                                                update(p => ({
                                                    ...p,
                                                    seasonChoices: {
                                                        ...p.seasonChoices,
                                                        [postId]:
                                                            e.target.value,
                                                    },
                                                    checked: [],
                                                }));
                                            }}
                                        >
                                            {variants.map(r => (
                                                <option
                                                    key={r.good.key}
                                                    value={r.good.key}
                                                >
                                                    {r.good.source === "manual"
                                                        ? "직접 입력"
                                                        : "수집 자료"}{" "}
                                                    · {r.good.name} ·{" "}
                                                    {date(
                                                        r.good.period!.startAt
                                                    )}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                                <div className="divide-y divide-slate-200">
                                    {postRows.map(row => {
                                        const good = row.good;
                                        const issue =
                                            rowIssue(row, now) ??
                                            goodIssue(good, now);
                                        const isChanged = changed.includes(
                                            good.key
                                        );
                                        const current = data.goods.find(
                                            g => g.key === good.key
                                        );
                                        return (
                                            <div
                                                key={good.key}
                                                className="space-y-2 py-3"
                                            >
                                                <h3 className="font-semibold">
                                                    {good.name}{" "}
                                                    <span className="text-sm font-normal">
                                                        [
                                                        {good.source === "fixed"
                                                            ? "고정"
                                                            : good.source ===
                                                                "manual"
                                                              ? "직접 입력"
                                                              : "시즌 수집"}
                                                        ]
                                                    </span>
                                                </h3>
                                                <p className="text-sm">
                                                    주간 한도 {good.limit}회
                                                    {good.period &&
                                                        ` · 유효 기간 ${date(good.period.startAt)}~${date(good.period.endAt)}`}
                                                </p>
                                                {isChanged && (
                                                    <div className="rounded bg-amber-50 p-2">
                                                        <p>
                                                            이전 정의입니다.
                                                            원본이 변경되거나
                                                            삭제되었습니다.
                                                            횟수를 유지한 채
                                                            변경 내용을 확인해
                                                            주세요.
                                                        </p>
                                                        {current && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm"
                                                                onClick={() =>
                                                                    editRow(
                                                                        row,
                                                                        {
                                                                            good: current,
                                                                            choices:
                                                                                current.groups.map(
                                                                                    g =>
                                                                                        g.length ===
                                                                                        1
                                                                                            ? g[0]
                                                                                                  .itemId
                                                                                            : 0
                                                                                ),
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                현재 데이터 적용
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <label>
                                                        {good.name} 추가 교환
                                                        <input
                                                            className={
                                                                inputClass
                                                            }
                                                            inputMode="numeric"
                                                            maxLength={64}
                                                            value={row.q}
                                                            disabled={
                                                                oldWeek ||
                                                                !!goodIssue(
                                                                    good,
                                                                    now
                                                                ) ||
                                                                isChanged
                                                            }
                                                            aria-invalid={
                                                                !!issue
                                                            }
                                                            aria-describedby={
                                                                issue
                                                                    ? `row-${good.key}`
                                                                    : undefined
                                                            }
                                                            onChange={e =>
                                                                editRow(row, {
                                                                    q: e.target
                                                                        .value,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                    <label>
                                                        {good.name} 이번 주 사용
                                                        <input
                                                            className={
                                                                inputClass
                                                            }
                                                            inputMode="numeric"
                                                            maxLength={64}
                                                            value={row.used}
                                                            disabled={oldWeek}
                                                            aria-invalid={
                                                                !!issue
                                                            }
                                                            aria-describedby={
                                                                issue
                                                                    ? `row-${good.key}`
                                                                    : undefined
                                                            }
                                                            onChange={e =>
                                                                editRow(row, {
                                                                    used: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                </div>
                                                {good.groups.map(
                                                    (options, i) =>
                                                        options.length > 1 && (
                                                            <label
                                                                key={i}
                                                                className="block"
                                                            >
                                                                {good.name} 대체
                                                                재료 {i + 1}
                                                                <select
                                                                    className={
                                                                        inputClass
                                                                    }
                                                                    value={
                                                                        row
                                                                            .choices[
                                                                            i
                                                                        ] ?? 0
                                                                    }
                                                                    onChange={e =>
                                                                        editRow(
                                                                            row,
                                                                            {
                                                                                choices:
                                                                                    good.groups.map(
                                                                                        (
                                                                                            _,
                                                                                            index
                                                                                        ) =>
                                                                                            index ===
                                                                                            i
                                                                                                ? Number(
                                                                                                      e
                                                                                                          .target
                                                                                                          .value
                                                                                                  )
                                                                                                : (row
                                                                                                      .choices[
                                                                                                      index
                                                                                                  ] ??
                                                                                                  0)
                                                                                    ),
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    <option
                                                                        value={
                                                                            0
                                                                        }
                                                                    >
                                                                        재료를
                                                                        선택하세요
                                                                    </option>
                                                                    {options.map(
                                                                        o => (
                                                                            <option
                                                                                key={
                                                                                    o.itemId
                                                                                }
                                                                                value={
                                                                                    o.itemId
                                                                                }
                                                                            >
                                                                                {catalog.materials.find(
                                                                                    m =>
                                                                                        m.id ===
                                                                                        o.itemId
                                                                                )
                                                                                    ?.name ??
                                                                                    "재료"}{" "}
                                                                                (#
                                                                                {
                                                                                    o.itemId
                                                                                }

                                                                                )
                                                                                ×
                                                                                {
                                                                                    o.count
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </label>
                                                        )
                                                )}
                                                {issue && (
                                                    <p
                                                        id={`row-${good.key}`}
                                                        className="text-sm text-red-800"
                                                    >
                                                        {issue}
                                                    </p>
                                                )}
                                                {good.source === "manual" && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm mr-2"
                                                        onClick={() =>
                                                            setEditing(good)
                                                        }
                                                    >
                                                        직접 입력 수정 —{" "}
                                                        {good.name}
                                                    </button>
                                                )}
                                                {(good.source === "manual" ||
                                                    isChanged) && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm"
                                                        onClick={() => {
                                                            market.cancel();
                                                            setUndo(null);
                                                            update(p => ({
                                                                ...p,
                                                                rows: p.rows.filter(
                                                                    r =>
                                                                        r.good
                                                                            .key !==
                                                                        good.key
                                                                ),
                                                                seasonChoices:
                                                                    Object.fromEntries(
                                                                        Object.entries(
                                                                            p.seasonChoices
                                                                        ).filter(
                                                                            ([
                                                                                ,
                                                                                key,
                                                                            ]) =>
                                                                                key !==
                                                                                good.key
                                                                        )
                                                                    ),
                                                                checked: [],
                                                            }));
                                                        }}
                                                    >
                                                        이 계획에서 제거 —{" "}
                                                        {good.name}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        );
                    })}
                </section>

                <section
                    className="space-y-3"
                    aria-label="계획 내보내기와 교환 기록"
                >
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => void copy(text())}
                        >
                            준비 목록 복사
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={download}
                        >
                            텍스트 다운로드
                        </button>
                        <button
                            type="button"
                            className="btn"
                            disabled={!result.valid}
                            onClick={share}
                        >
                            공유 링크 복사
                        </button>
                    </div>
                    {exported && (
                        <label className="block">
                            복사·공유할 텍스트
                            <textarea
                                className={inputClass}
                                readOnly
                                value={exported}
                                rows={5}
                            />
                        </label>
                    )}
                    <button
                        type="button"
                        className="btn"
                        disabled={
                            !result.valid ||
                            oldWeek ||
                            changed.length > 0 ||
                            !rows.some(r => Number(r.q) > 0)
                        }
                        onClick={() => setRecording(true)}
                    >
                        실제 교환으로 기록
                    </button>
                    {recording && (
                        <div className="space-y-2 rounded border border-amber-400 p-3">
                            <p>
                                계획한 횟수만큼 실제로 교환했나요? 추가 횟수를
                                사용량에 더하고 추가 계획을 0으로 바꿉니다. 보유
                                수량은 직접 수정해 주세요.
                            </p>
                            <button
                                type="button"
                                className="btn mr-2"
                                disabled={!result.valid || oldWeek}
                                onClick={() => {
                                    try {
                                        const next = recordBarterExchanges(
                                            plan,
                                            data,
                                            Date.now()
                                        );
                                        setUndo({
                                            week: plan.weekKey,
                                            rows: plan.rows,
                                        });
                                        update(() => next);
                                        setRecording(false);
                                    } catch (error) {
                                        setNotice(String(error));
                                    }
                                }}
                            >
                                교환 기록 확인
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setRecording(false)}
                            >
                                취소
                            </button>
                        </div>
                    )}
                    {undo && (
                        <button
                            type="button"
                            className="btn ml-2"
                            disabled={
                                undo.week !== barterWeek(now) ||
                                undo.week !== plan.weekKey
                            }
                            onClick={() => {
                                const before = new Map(
                                    undo.rows.map(r => [r.good.key, r])
                                );
                                update(p => ({
                                    ...p,
                                    rows: p.rows.map(r =>
                                        before.has(r.good.key)
                                            ? {
                                                  ...r,
                                                  q: before.get(r.good.key)!.q,
                                                  used: before.get(r.good.key)!
                                                      .used,
                                              }
                                            : r
                                    ),
                                }));
                                setUndo(null);
                            }}
                        >
                            교환 기록 되돌리기
                        </button>
                    )}
                </section>
            </fieldset>
        </div>
    );
}
