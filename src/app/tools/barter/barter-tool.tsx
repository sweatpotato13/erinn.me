"use client";

import {
    ArrowDown,
    ArrowRight,
    CalendarDays,
    CheckCheck,
    ClipboardCopy,
    Download,
    MapPin,
    PackageCheck,
    ShoppingBasket,
    Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { formatGold } from "@/lib/auction-calculator";
import {
    type BarterReference,
    type BarterRow,
    barterWeek,
    calculateBarter,
    goodIssue,
    parseBarterInteger,
    seoulDateInput,
} from "@/lib/barter";
import {
    activeBarterRows,
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
import s from "./barter-tool.module.css";
import { GoodCard, MaterialRow } from "./barter-ui";

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
    const [post, setPost] = useState(201);
    const [exported, setExported] = useState("");
    const [recording, setRecording] = useState(false);
    const [undo, setUndo] = useState<{
        week: number;
        rows: BarterRow[];
    } | null>(null);

    useEffect(() => {
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
    function prepare(postId?: number | "without-skaha") {
        update(p => {
            let next = p;
            for (const row of activeBarterRows(p, data, Date.now())) {
                if (postId === "without-skaha" && row.good.postId === 9) {
                    next = updateBarterRow(next, { ...row, q: "0" });
                    continue;
                }
                if (typeof postId === "number" && row.good.postId !== postId)
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

    const chosen = rows.filter(r => (parseBarterInteger(r.q) ?? 0) > 0);
    const seasonal = rows.filter(r => r.good.period);
    const prepared = result.materials.filter(r =>
        plan.checked.includes(r.material.id)
    ).length;
    const shortage = result.materials.filter(
        r => r.missing !== null && r.missing > 0
    ).length;
    const card = (row: BarterRow) => (
        <GoodCard
            key={row.good.key}
            row={row}
            materials={catalog.materials}
            now={now}
            disabled={oldWeek}
            changed={changed.includes(row.good.key)}
            onChange={patch => editRow(row, patch)}
        />
    );

    return (
        <div>
            {!ready && (
                <p role="status" className={s.notice}>
                    저장된 계획을 확인하고 있습니다.
                </p>
            )}
            {state.notice && (
                <p role="status" className={s.notice}>
                    {state.notice}
                </p>
            )}
            {ready && oldWeek && (
                <section className={s.warning} aria-label="주간 전환">
                    <p>
                        이전 주 계획입니다. 이번 주로 전환하면 이미 교환한
                        횟수만 0으로 바뀝니다. 준비할 횟수·보유 재료·가격은
                        유지됩니다.
                    </p>
                    <button
                        type="button"
                        className={`btn btn-sm ${s.button}`}
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
                    <section className={s.warning} aria-label="계획 가져오기">
                        <p>
                            {state.temporary
                                ? "공유 링크는 임시 계획입니다. 가져오기 전에는 저장된 내 계획을 바꾸지 않습니다."
                                : "저장된 데이터 또는 저장소 상태를 확인해 주세요. 현재 입력을 자동으로 덮어쓰지 않습니다."}
                        </p>
                        <div className={s.actions}>
                            <button
                                type="button"
                                className={`btn btn-sm ${s.button}`}
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
                                    className={`btn btn-sm ${s.button}`}
                                    onClick={() => {
                                        market.cancel();
                                        setUndo(null);
                                        state.openSaved();
                                    }}
                                >
                                    저장된 계획 열기
                                </button>
                            )}
                        </div>
                    </section>
                )}
            {state.backup && (
                <details className={s.warning}>
                    <summary>읽지 못한 원래 저장 내용</summary>
                    <textarea
                        className={s.input}
                        readOnly
                        value={state.backup}
                        aria-label="원래 저장 내용"
                        rows={5}
                    />
                </details>
            )}
            <fieldset disabled={!ready}>
                <div className={s.toolbar}>
                    <p className={s.week}>
                        <CalendarDays size={16} aria-hidden="true" />
                        <span>
                            {ready
                                ? `${date(plan.weekKey).slice(0, 10)} 시작 주`
                                : "이번 주 준비"}{" "}
                            · 매주 목요일 07:00 초기화
                        </span>
                    </p>
                    <div className={s.actions}>
                        <button
                            type="button"
                            className={`btn btn-primary btn-sm ${s.primary}`}
                            disabled={oldWeek}
                            onClick={() => prepare()}
                        >
                            <CheckCheck size={16} aria-hidden="true" />
                            이번 주 전체 담기
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${s.button}`}
                            disabled={oldWeek}
                            onClick={() => prepare("without-skaha")}
                        >
                            스카하 제외 담기
                        </button>
                        <button
                            type="button"
                            className={`btn btn-ghost btn-sm ${s.quiet}`}
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
                            선택 비우기
                        </button>
                    </div>
                </div>
                <div className={s.layout}>
                    <div className={s.catalog}>
                        <section
                            className={`${s.panel} ${s.season}`}
                            aria-labelledby="season-heading"
                        >
                            <div className={s.panelHead}>
                                <div>
                                    <h2 id="season-heading">
                                        <Sparkles
                                            size={18}
                                            aria-hidden="true"
                                        />
                                        이달의 6티어
                                    </h2>
                                    <p className={s.muted}>
                                        교역품을 체크하면 주간 한도만큼
                                        담깁니다.
                                    </p>
                                </div>
                                <span className={s.badge}>
                                    {data.season
                                        ? `${date(data.season.period.startAt).slice(5, 10)} — ${date(data.season.period.endAt).slice(5, 10)}`
                                        : "자료 갱신 대기"}
                                </span>
                            </div>
                            {!seasonal.length && (
                                <p className={s.warning}>
                                    수집된 시즌 자료가 없습니다. 자료가 갱신되면
                                    이곳에서 확인할 수 있습니다.
                                </p>
                            )}
                            <div className={s.seasonGrid}>
                                {seasonal.map(card)}
                            </div>
                        </section>
                        <section
                            className={s.panel}
                            aria-labelledby="fixed-heading"
                        >
                            <div className={s.panelHead}>
                                <div>
                                    <h2 id="fixed-heading">
                                        <MapPin size={18} aria-hidden="true" />
                                        교역소별 물품
                                    </h2>
                                    <p className={s.muted}>
                                        이리아 1~5티어 · 스카하 고정 교역품
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={`btn btn-ghost btn-sm ${s.quiet}`}
                                    disabled={oldWeek}
                                    onClick={() => prepare(post)}
                                >
                                    이 교역소 전체 담기{" "}
                                    <ArrowRight size={14} aria-hidden="true" />
                                </button>
                            </div>
                            <nav className={s.tabs} aria-label="교역소 선택">
                                {postIds.map(id => (
                                    <button
                                        key={id}
                                        type="button"
                                        aria-pressed={post === id}
                                        onClick={() => setPost(id)}
                                    >
                                        {
                                            allRows.find(
                                                r => r.good.postId === id
                                            )?.good.postName
                                        }
                                    </button>
                                ))}
                            </nav>
                            <div className={s.fixedList}>
                                {rows
                                    .filter(
                                        r =>
                                            r.good.postId === post &&
                                            !r.good.period
                                    )
                                    .map(card)}
                            </div>
                            <details className={s.detail}>
                                <summary>
                                    이미 교환했다면 · 교환 횟수 조정
                                </summary>
                                <p className={s.muted}>
                                    주간 한도는 정해져 있습니다. 이번 주에 이미
                                    교환한 물품만 횟수를 입력하세요. 처음
                                    준비한다면 모두 0으로 두면 됩니다.
                                </p>
                                {rows
                                    .filter(r => r.good.postId === post)
                                    .map(row => (
                                        <label
                                            key={row.good.key}
                                            className={s.usageRow}
                                        >
                                            <span>
                                                {row.good.name}{" "}
                                                <span className={s.muted}>
                                                    / 주 {row.good.limit}회
                                                </span>
                                            </span>
                                            <input
                                                className={s.input}
                                                aria-label={`${row.good.name} 이미 교환한 횟수`}
                                                inputMode="numeric"
                                                maxLength={64}
                                                value={row.used}
                                                disabled={oldWeek}
                                                onChange={e =>
                                                    editRow(row, {
                                                        used: e.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                    ))}
                            </details>
                        </section>
                        <div className={s.panel}>
                            <details
                                className={s.detail}
                                open={
                                    changed.length > 0 ||
                                    !!barterSelectionIssues(plan, data).length
                                }
                            >
                                <summary>시즌·저장 자료 관리</summary>
                                <p className={s.muted}>
                                    시즌이 바뀌었거나 직접 입력한 자료가 있을
                                    때만 확인하세요. 같은 교역소의 시즌 출처는
                                    하나만 사용합니다.
                                </p>
                                {postIds.map(id => {
                                    const variants = allRows.filter(
                                        r =>
                                            r.good.postId === id &&
                                            r.good.period
                                    );
                                    if (!variants.length) return null;
                                    return (
                                        <label key={id} className={s.usageRow}>
                                            {
                                                allRows.find(
                                                    r => r.good.postId === id
                                                )?.good.postName
                                            }{" "}
                                            시즌 출처
                                            <select
                                                className={s.input}
                                                style={{ width: "65%" }}
                                                value={
                                                    plan.seasonChoices[id] ??
                                                    rows.find(
                                                        r =>
                                                            r.good.postId ===
                                                                id &&
                                                            r.good.period
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
                                                            [id]: e.target
                                                                .value,
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
                                                        {r.good.source ===
                                                        "manual"
                                                            ? "직접 입력"
                                                            : "수집 자료"}{" "}
                                                        · {r.good.name} ·{" "}
                                                        {date(
                                                            r.good.period!
                                                                .startAt
                                                        ).slice(0, 10)}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    );
                                })}
                                {allRows
                                    .filter(
                                        r =>
                                            r.good.source === "manual" ||
                                            changed.includes(r.good.key)
                                    )
                                    .map(row => {
                                        const current = data.goods.find(
                                            g => g.key === row.good.key
                                        );
                                        return (
                                            <div
                                                className={s.detail}
                                                key={row.good.key}
                                            >
                                                <strong>{row.good.name}</strong>
                                                <p className={s.muted}>
                                                    {row.good.period &&
                                                        `${date(row.good.period.startAt)} — ${date(row.good.period.endAt)}`}
                                                </p>
                                                <div className={s.actions}>
                                                    {changed.includes(
                                                        row.good.key
                                                    ) &&
                                                        current && (
                                                            <button
                                                                className={
                                                                    s.button
                                                                }
                                                                type="button"
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
                                                    <button
                                                        type="button"
                                                        className={`btn btn-ghost btn-sm ${s.quiet}`}
                                                        onClick={() => {
                                                            market.cancel();
                                                            setUndo(null);
                                                            update(p => ({
                                                                ...p,
                                                                rows: p.rows.filter(
                                                                    r =>
                                                                        r.good
                                                                            .key !==
                                                                        row.good
                                                                            .key
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
                                                                                row
                                                                                    .good
                                                                                    .key
                                                                        )
                                                                    ),
                                                                checked: [],
                                                            }));
                                                        }}
                                                    >
                                                        이 계획에서 제거 —{" "}
                                                        {row.good.name}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </details>
                        </div>
                    </div>
                    <section
                        id="barter-shopping"
                        className={s.sidebar}
                        aria-labelledby="barter-shopping-heading"
                        tabIndex={-1}
                    >
                        <div className={s.summary}>
                            <h2
                                id="barter-shopping-heading"
                                className={s.summaryHeading}
                            >
                                <span
                                    style={{
                                        color: "inherit",
                                        fontWeight: 700,
                                        fontSize: 16,
                                    }}
                                >
                                    <ShoppingBasket
                                        size={18}
                                        className="mr-2 inline"
                                        aria-hidden="true"
                                    />
                                    나의 준비 목록
                                </span>
                                <span>{chosen.length}개 교역품 선택</span>
                            </h2>
                            <progress
                                className={s.progress}
                                value={prepared}
                                max={result.materials.length || 1}
                                aria-label="재료 준비 진행률"
                            />
                            <div className={s.summaryStats}>
                                <div>
                                    <p>더 준비할 재료</p>
                                    <strong>
                                        {shortage}
                                        <span className="ml-1 text-xs font-normal">
                                            종
                                        </span>
                                    </strong>
                                </div>
                                <div>
                                    <p>준비 완료</p>
                                    <strong>
                                        {prepared}
                                        <span className="ml-1 text-xs font-normal">
                                            / {result.materials.length}종
                                        </span>
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div className={s.shopping}>
                            {result.errors.length > 0 && (
                                <div role="alert" className={s.warning}>
                                    <strong>입력을 확인해 주세요</strong>
                                    <p>확인된 재료만 계산한 부분 목록입니다.</p>
                                    <ul>
                                        {result.errors.map((error, i) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                    {catalog.error && (
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${s.button}`}
                                            onClick={catalog.retry}
                                        >
                                            재료 ID 다시 확인
                                        </button>
                                    )}
                                </div>
                            )}
                            {!result.materials.length ? (
                                <div className={s.empty}>
                                    <ShoppingBasket
                                        size={42}
                                        strokeWidth={1.3}
                                        aria-hidden="true"
                                    />
                                    <strong>교환할 물품을 골라보세요</strong>
                                    <p>
                                        물품을 체크하면 필요한 재료가 여기에
                                        모입니다.
                                        <br />
                                        가지고 있는 재료는 한 번만 빼드려요.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {result.materials.map(row => (
                                        <MaterialRow
                                            key={row.material.id}
                                            row={row}
                                            plan={plan}
                                            update={update}
                                            marketError={
                                                market.errors[row.material.name]
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                            <div className={s.cost} aria-label="준비 비용">
                                <div className={s.costLabel}>
                                    <span>추가 구매 예상액</span>
                                    <span className={s.muted}>
                                        {result.purchase.complete
                                            ? "재료 가격 기준"
                                            : `가격 미확인 ${result.purchase.unknown}종`}
                                    </span>
                                </div>
                                <strong className={s.costValue}>
                                    {!chosen.length
                                        ? "—"
                                        : result.purchase.unknown > 0 &&
                                            !result.materials.some(
                                                r =>
                                                    r.missing! > 0 &&
                                                    r.unitPrice !== null
                                            )
                                          ? "가격 확인 필요"
                                          : `${formatGold(result.purchase.known)} Gold`}
                                </strong>
                                {!result.purchase.complete && (
                                    <p className={s.muted}>
                                        알려진 가격의 소계입니다.
                                    </p>
                                )}
                                <p className={s.muted}>
                                    전체 재료 가치:{" "}
                                    {formatGold(result.replacement.known)} Gold
                                    {result.replacement.complete
                                        ? ""
                                        : ` · 미확인 ${result.replacement.unknown}종`}
                                </p>
                                <button
                                    type="button"
                                    className={`btn btn-primary btn-sm ${s.primary}`}
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
                                        className={`btn btn-ghost btn-sm ${s.quiet}`}
                                        onClick={market.cancel}
                                    >
                                        조회 취소
                                    </button>
                                )}
                                <p className={`${s.muted} mt-2`}>
                                    시세는 버튼을 누를 때만 조회합니다. 실제
                                    구매액은 매물 수량·묶음 가격에 따라 달라질
                                    수 있습니다.
                                </p>
                            </div>
                        </div>
                        <div className={s.exports}>
                            <button
                                type="button"
                                className={`btn btn-sm ${s.button}`}
                                onClick={() => void copy(text())}
                            >
                                <ClipboardCopy size={15} aria-hidden="true" />
                                준비 목록 복사
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${s.button}`}
                                disabled={!result.valid}
                                onClick={share}
                            >
                                공유 링크 복사
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${s.button}`}
                                onClick={download}
                                aria-label="텍스트 다운로드"
                            >
                                <Download size={15} aria-hidden="true" />
                            </button>
                        </div>
                        {exported && (
                            <label className={s.muted}>
                                복사·공유할 텍스트
                                <textarea
                                    className={s.input}
                                    readOnly
                                    value={exported}
                                    rows={4}
                                />
                            </label>
                        )}
                        <details className={s.guide}>
                            <summary>교환을 마쳤나요? · 교환 기록</summary>
                            <p>
                                준비 완료 체크는 재고를 바꾸지 않습니다. 실제로
                                교환한 뒤 기록하면 준비할 횟수를 이미 교환한
                                횟수에 더합니다.
                            </p>
                            <button
                                type="button"
                                className={`btn btn-sm ${s.button}`}
                                disabled={
                                    !result.valid ||
                                    oldWeek ||
                                    changed.length > 0 ||
                                    !chosen.length
                                }
                                onClick={() => setRecording(true)}
                            >
                                <PackageCheck size={16} aria-hidden="true" />
                                실제 교환으로 기록
                            </button>
                            {recording && (
                                <div className={s.warning}>
                                    <p>
                                        계획한 횟수만큼 교환했나요? 보유 수량은
                                        그대로 유지됩니다.
                                    </p>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${s.button}`}
                                        disabled={!result.valid || oldWeek}
                                        onClick={() => {
                                            try {
                                                const next =
                                                    recordBarterExchanges(
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
                                        className={`btn btn-ghost btn-sm ${s.quiet}`}
                                        onClick={() => setRecording(false)}
                                    >
                                        취소
                                    </button>
                                </div>
                            )}
                            {undo && (
                                <button
                                    type="button"
                                    className={`btn btn-sm ${s.button}`}
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
                                                          q: before.get(
                                                              r.good.key
                                                          )!.q,
                                                          used: before.get(
                                                              r.good.key
                                                          )!.used,
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
                        </details>
                    </section>
                </div>
            </fieldset>
            <a className={s.mobileJump} href="#barter-shopping">
                <span>
                    <ShoppingBasket
                        size={16}
                        className="mr-2 inline"
                        aria-hidden="true"
                    />
                    준비 목록 · {result.materials.length}종
                </span>
                <span>
                    확인하기{" "}
                    <ArrowDown
                        size={15}
                        className="inline"
                        aria-hidden="true"
                    />
                </span>
            </a>
        </div>
    );
}
