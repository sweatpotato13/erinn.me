"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import s from "@/components/tools/preparation.module.css";
import { formatGold, MAX_GOLD } from "@/lib/auction-calculator";
import {
    muriasReference as reference,
    type RelicSnapshot,
} from "@/lib/murias-relics";
import {
    openingAmounts,
    parseSimulationGold,
    type RelicOpening,
    restoreRelic,
    type SimulationPrice,
    summarizeOpenings,
    validSimulationGold,
    valueMissingOpening,
} from "@/lib/murias-simulator";

import ui from "./restoration.module.css";

const gold = (value: number) => `${formatGold(value)} Gold`;
const time = (value: string | null) =>
    value
        ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
        : "조회 기록 없음";
const source = (price: SimulationPrice) =>
    `${price.source === "manual" ? "수동 입력" : price.source === "market" ? "조회 매물" : "시세 없음"} · ${time(price.at)}`;
const signed = (value: number) =>
    `${value >= 0 ? "+" : ""}${gold(value)} (${value > 0 ? "이득" : value < 0 ? "손해" : "본전"})`;

function GoldInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="flex min-w-0 flex-col gap-1">
            {label}
            <input
                className={s.input}
                type="text"
                inputMode="numeric"
                value={value}
                onChange={event => onChange(event.target.value)}
                aria-invalid={
                    value !== "" && parseSimulationGold(value) === null
                }
            />
        </label>
    );
}

export default function Simulator() {
    const [snapshot, setSnapshot] = useState<RelicSnapshot | null>(null);
    const [busy, setBusy] = useState(true);
    const [marketError, setMarketError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const active = useRef<AbortController | null>(null);
    const restorationWindow = useRef<HTMLDetailsElement>(null);
    // Manual drafts are independent of the market response, including blank/invalid edits.
    const [ideaDraft, setIdeaDraft] = useState<string | null>(null);
    const [feeDraft, setFeeDraft] = useState("3000000");
    const [membership, setMembership] = useState(false);
    const [overrides, setOverrides] = useState<Record<string, SimulationPrice>>(
        {}
    );
    const [effectId, setEffectId] = useState(reference.effects[0].id);
    const [level, setLevel] = useState(1);
    const [priceDraft, setPriceDraft] = useState("");
    const [openings, setOpenings] = useState<RelicOpening[]>([]);
    const load = useCallback(async (refresh = false) => {
        active.current?.abort();
        const controller = new AbortController();
        active.current = controller;
        setBusy(true);
        setMarketError(null);
        try {
            const response = await fetch("/api/murias-relics", {
                method: refresh ? "POST" : "GET",
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error(
                    "가격 조회 실패 · 이전 가격을 유지합니다. 수동 가격으로 복원할 수 있습니다."
                );
            const next: RelicSnapshot = await response.json();
            if (controller.signal.aborted) return;
            if (next.referenceVersion !== reference.version)
                throw new Error(
                    "참조 데이터가 변경되었습니다. 페이지를 새로고침해 주세요."
                );
            setSnapshot(previous => ({
                ...next,
                ...(next.relicError &&
                previous?.fetchedAt &&
                (!next.fetchedAt || previous.fetchedAt > next.fetchedAt)
                    ? {
                          cells: previous.cells,
                          fetchedAt: previous.fetchedAt,
                          isComplete: previous.isComplete,
                      }
                    : {}),
                ...(next.ideaError && previous
                    ? {
                          ideaPrice: previous.ideaPrice,
                          ideaFetchedAt: previous.ideaFetchedAt,
                          ideaIsComplete: previous.ideaIsComplete,
                      }
                    : {}),
            }));
        } catch (caught) {
            if (!controller.signal.aborted)
                setMarketError(
                    caught instanceof Error ? caught.message : "가격 조회 실패"
                );
        } finally {
            if (!controller.signal.aborted) setBusy(false);
        }
    }, []);
    useEffect(() => {
        void load();
        return () => active.current?.abort();
    }, [load]);
    const ideaValue =
        ideaDraft === null
            ? validSimulationGold(snapshot?.ideaPrice)
                ? snapshot.ideaPrice
                : null
            : parseSimulationGold(ideaDraft);
    const restorationFee = parseSimulationGold(feeDraft);
    const total = summarizeOpenings(openings);
    const key = `${effectId}:${level}`;
    const cellPrice = snapshot?.cells.find(
        cell => cell.effectId === effectId && cell.level === level
    )?.minUnitPrice;
    const selectedPrice =
        overrides[key]?.value ??
        (validSimulationGold(cellPrice) ? cellPrice : null);
    const latest = openings.at(-1);
    const commitRows = (next: RelicOpening[]) => {
        summarizeOpenings(next); // Validate all totals before replacing a valid ledger.
        setOpenings(next);
    };
    const restore = () => {
        setError(null);
        try {
            if (ideaValue === null || restorationFee === null)
                throw new Error("이데아 가격과 복원비를 입력해 주세요.");
            const row = restoreRelic(
                {
                    idea: {
                        value: ideaValue,
                        source: ideaDraft === null ? "market" : "manual",
                        at:
                            ideaDraft === null
                                ? (snapshot?.ideaFetchedAt ?? null)
                                : new Date().toISOString(),
                    },
                    restorationFee,
                    hasMembership: membership,
                    snapshot,
                    overrides,
                },
                openings.length + 1
            );
            commitRows([...openings, row]);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "복원 실패");
        }
    };
    const completeValue = (sequence: number, value: number) => {
        setError(null);
        try {
            commitRows(
                openings.map(row =>
                    row.sequence === sequence
                        ? valueMissingOpening(
                              row,
                              value,
                              new Date().toISOString()
                          )
                        : row
                )
            );
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "평가 실패");
        }
    };
    return (
        <div className="space-y-4">
            <div className={s.notice}>
                <p className="font-bold">
                    공식 확률 아님 · 모든 유물 옵션과 1~10레벨을 각각 균등
                    확률로 가정
                </p>
                <p>
                    옵션 {reference.effects.length}종 · 옵션별{" "}
                    {(100 / reference.effects.length).toFixed(4)}% · 레벨별 10%
                    · 조합별 {(10 / reference.effects.length).toFixed(4)}%
                </p>
                <p>
                    실제 게임 확률이 아닌 가정입니다. 시세는 등록 가격 기준 예상
                    판매액이며, 실제 거래·수익을 보장하지 않습니다.
                </p>
            </div>
            <details ref={restorationWindow} open className={ui.window}>
                <summary className={ui.titlebar}>
                    <span className={ui.emblem} aria-hidden="true">
                        ✓
                    </span>
                    무리아스의 유물 복원
                    <span className={ui.windowControls} aria-hidden="true">
                        <span>−</span>
                        <span>×</span>
                    </span>
                </summary>
                <div className={ui.body}>
                    <p className={ui.instruction}>
                        무리아스의 유물(이데아)를 복원합니다.
                    </p>
                    <div className={ui.itemSlot}>
                        <Image
                            src="/images/murias/relic.png"
                            alt="무리아스의 유물"
                            width={48}
                            height={48}
                            unoptimized
                        />
                    </div>
                    <div
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className={ui.result}
                    >
                        <h2 className="sr-only">최근 복원 결과</h2>
                        <p className={ui.effect}>
                            {latest
                                ? latest.description
                                : "복원할 무리아스의 유물(이데아)"}
                        </p>
                        {latest && (
                            <>
                                <p className={ui.sequence}>
                                    #{latest.sequence} · {latest.level}레벨
                                </p>
                                <p className={ui.valuation}>
                                    {latest.valuation.value === null
                                        ? "시세 없음 · 손익 미확정"
                                        : `예상 판매가 ${gold(latest.valuation.value)} · 예상 손익 ${signed(openingAmounts(latest).profit!)}`}
                                </p>
                            </>
                        )}
                    </div>
                    <label
                        className={ui.bank}
                        title="게임 내 기능입니다. 시뮬레이터는 게임 골드를 사용하지 않습니다."
                    >
                        <input type="checkbox" disabled />
                        은행 직거래
                    </label>
                    <div className={ui.buttons}>
                        <button
                            className={ui.button}
                            disabled={
                                ideaValue === null || restorationFee === null
                            }
                            onClick={restore}
                        >
                            복원
                        </button>
                        <button
                            className={ui.button}
                            onClick={() => {
                                if (restorationWindow.current) {
                                    restorationWindow.current.open = false;
                                    restorationWindow.current
                                        .querySelector("summary")
                                        ?.focus();
                                }
                            }}
                        >
                            취소
                        </button>
                    </div>
                </div>
            </details>
            <section
                aria-label="가격과 복원 설정"
                className={`${s.panel} p-4 space-y-3`}
            >
                <h2 className="text-lg font-bold">가격·수수료 가정</h2>
                <p>
                    유물 조회: {time(snapshot?.fetchedAt ?? null)} ·{" "}
                    {snapshot?.isComplete
                        ? "전체 매물 조회"
                        : "일부 또는 미조회"}{" "}
                    · 가격 있음{" "}
                    {snapshot?.cells.filter(cell =>
                        validSimulationGold(cell.minUnitPrice)
                    ).length ?? 0}
                    /{reference.effects.length * 10}
                </p>
                <p>
                    이데아 조회: {time(snapshot?.ideaFetchedAt ?? null)} ·{" "}
                    {snapshot?.ideaIsComplete
                        ? "전체 매물 조회"
                        : "일부 또는 미조회"}
                </p>
                {busy && <p role="status">가격을 조회하는 중입니다…</p>}
                {[marketError, snapshot?.relicError, snapshot?.ideaError]
                    .filter(Boolean)
                    .map((message, i) => (
                        <p role="alert" key={i}>
                            {message}
                        </p>
                    ))}
                <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => void load(true)}
                >
                    가격 새로고침
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <GoldInput
                            label="이데아 단가 (Gold)"
                            value={
                                ideaDraft ??
                                (ideaValue === null ? "" : String(ideaValue))
                            }
                            onChange={setIdeaDraft}
                        />
                        <p>
                            {ideaDraft === null
                                ? "조회 매물 기준"
                                : "수동 입력"}
                        </p>
                        <button
                            className="btn btn-xs"
                            onClick={() => setIdeaDraft(null)}
                        >
                            이데아 시세 사용
                        </button>
                    </div>
                    <GoldInput
                        label="복원비 (Gold · 수정 가능한 가정)"
                        value={feeDraft}
                        onChange={setFeeDraft}
                    />
                </div>
                <p>
                    복원비 기본 3,000,000 Gold는 한국 서버에서 확인되지 않은
                    가정입니다. 0~{gold(MAX_GOLD)} 정수만 입력할 수 있습니다.
                    직접 입력한 0은 무료로 계산합니다.
                </p>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={membership}
                        onChange={event => setMembership(event.target.checked)}
                    />
                    경매장 멤버십 (4%, 일반 5%)
                </label>
                <p>
                    각 유물을 한 개씩 별도 판매한다고 가정하며, 쿠폰 없이 건별
                    수수료를 내림 계산합니다. 가격·비용 변경과 새로고침은 이후
                    복원에만 반영됩니다.
                </p>
                {ideaValue === null && (
                    <p>
                        이데아 가격이 없거나 유효하지 않습니다. 유효한 단가를
                        직접 입력해야 복원할 수 있습니다.
                    </p>
                )}
                {restorationFee === null && (
                    <p>유효한 복원비를 입력해 주세요.</p>
                )}
                <details>
                    <summary className="cursor-pointer">
                        옵션·레벨별 예상 판매가 직접 설정
                    </summary>
                    <div className="grid gap-3 mt-3 sm:grid-cols-2">
                        <label className="min-w-0">
                            유물 옵션
                            <select
                                className={s.input}
                                value={effectId}
                                onChange={event => {
                                    setEffectId(Number(event.target.value));
                                    setPriceDraft("");
                                }}
                            >
                                {reference.effects.map(effect => (
                                    <option key={effect.id} value={effect.id}>
                                        {effect.arcana} ·{" "}
                                        {effect.template.replace("{0}", "수치")}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            유물 레벨
                            <select
                                className={s.input}
                                value={level}
                                onChange={event => {
                                    setLevel(Number(event.target.value));
                                    setPriceDraft("");
                                }}
                            >
                                {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i} value={i + 1}>
                                        {i + 1}레벨
                                    </option>
                                ))}
                            </select>
                        </label>
                        <GoldInput
                            label="예상 판매가 (Gold)"
                            value={priceDraft}
                            onChange={setPriceDraft}
                        />
                    </div>
                    <p>
                        선택한 조합:{" "}
                        {selectedPrice === null
                            ? "시세 없음"
                            : gold(selectedPrice)}{" "}
                        · {overrides[key] ? "수동 입력" : "조회 매물 기준"}. 이
                        선택은 추첨 확률에 영향을 주지 않습니다.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <button
                            className="btn btn-sm"
                            disabled={parseSimulationGold(priceDraft) === null}
                            onClick={() =>
                                setOverrides(previous => ({
                                    ...previous,
                                    [key]: {
                                        value: parseSimulationGold(priceDraft),
                                        source: "manual",
                                        at: new Date().toISOString(),
                                    },
                                }))
                            }
                        >
                            선택한 조합 가격 적용
                        </button>
                        <button
                            className="btn btn-sm"
                            onClick={() =>
                                setOverrides(previous => {
                                    const next = { ...previous };
                                    delete next[key];
                                    return next;
                                })
                            }
                        >
                            선택한 조합 시세 사용
                        </button>
                    </div>
                </details>
            </section>
            <div className="flex flex-wrap gap-2">
                <button
                    className="btn"
                    onClick={() => {
                        setOpenings([]);
                        setError(null);
                    }}
                >
                    세션 초기화
                </button>
            </div>
            <p>
                복원 한 번에 이데아 1개와 복원비가 소비됩니다. 기록은 이
                페이지에 머무는 동안 유지되며 초기화하면 삭제됩니다. 현재 가격
                설정은 유지합니다.
            </p>
            {error && <p role="alert">{error}</p>}
            <section
                aria-label="누적 손익"
                className={`${s.panel} p-4 space-y-2`}
            >
                <h2 className="text-lg font-bold">
                    누적 손익 · {total.count}회 복원
                </h2>
                <p>
                    평가 완료 {total.valued}/{total.count}
                    {total.profit === null && " · 전체 손익 미확정"}
                </p>
                <dl className="grid gap-3 sm:grid-cols-2 [&_dd]:font-semibold [&_dd]:break-words">
                    <div>
                        <dt>이데아 지출</dt>
                        <dd>{gold(total.idea)}</dd>
                    </div>
                    <div>
                        <dt>복원비 합계</dt>
                        <dd>{gold(total.restoration)}</dd>
                    </div>
                    <div>
                        <dt>총 지출</dt>
                        <dd>{gold(total.cost)}</dd>
                    </div>
                    <div>
                        <dt>평가된 판매 수수료 합계</dt>
                        <dd>{gold(total.fees)}</dd>
                    </div>
                    <div>
                        <dt>평가된 예상 판매액 합계 (수수료 전)</dt>
                        <dd>{gold(total.gross)}</dd>
                    </div>
                    <div>
                        <dt>평가된 예상 수령액 합계 (수수료 후)</dt>
                        <dd>{gold(total.net)}</dd>
                    </div>
                    <div>
                        <dt>이데아 대비 차액</dt>
                        <dd>
                            {total.ideaDifference === null
                                ? "전체 차액 미확정"
                                : signed(total.ideaDifference)}
                        </dd>
                    </div>
                    <div>
                        <dt>복원비·판매 수수료 반영 예상 손익</dt>
                        <dd>
                            {total.profit === null
                                ? "전체 손익 미확정"
                                : signed(total.profit)}
                        </dd>
                    </div>
                </dl>
                {total.profit === null && (
                    <p>
                        판매액·수령액·판매 수수료는 평가된 결과만의 소계입니다.
                        총 지출은 미평가 결과의 비용도 포함합니다.
                    </p>
                )}
            </section>
            <section aria-label="복원 기록" className="space-y-3">
                <h2 className="text-lg font-bold">복원 기록</h2>
                {!openings.length && <p>아직 복원 기록이 없습니다.</p>}
                {[...openings].reverse().map(row => (
                    <OpeningRow
                        key={row.sequence}
                        row={row}
                        onValue={value => completeValue(row.sequence, value)}
                    />
                ))}
            </section>
        </div>
    );
}

function OpeningRow({
    row,
    onValue,
}: {
    row: RelicOpening;
    onValue: (value: number) => void;
}) {
    const [draft, setDraft] = useState("");
    const amounts = openingAmounts(row);
    return (
        <article
            aria-label={`${row.sequence}회 복원`}
            className={`${s.panel} p-4 space-y-2`}
        >
            <h3 className="font-bold">
                #{row.sequence} · {row.description} · {row.level}레벨
            </h3>
            <p>
                이데아 {gold(row.idea.value)} + 복원비{" "}
                {gold(row.restorationFee)}
            </p>
            {row.valuation.value === null ? (
                <>
                    <p>시세 없음 · 손익 미확정</p>
                    <GoldInput
                        label={`${row.sequence}회 결과 평가액 (Gold)`}
                        value={draft}
                        onChange={setDraft}
                    />
                    <button
                        className="btn btn-sm"
                        disabled={parseSimulationGold(draft) === null}
                        onClick={() => onValue(parseSimulationGold(draft)!)}
                    >
                        이 결과 평가 적용
                    </button>
                </>
            ) : (
                <>
                    <p>
                        예상 판매가 {gold(row.valuation.value)} · 판매 수수료{" "}
                        {gold(amounts.fee!)} · 예상 수령액 {gold(amounts.net!)}
                    </p>
                    <p>
                        이데아 대비 차액{" "}
                        {signed(row.valuation.value - row.idea.value)}
                    </p>
                    <p>예상 손익 {signed(amounts.profit!)}</p>
                </>
            )}
            <p>이데아: {source(row.idea)}</p>
            <p>유물 평가: {source(row.valuation)}</p>
            <details>
                <summary className="cursor-pointer">
                    복원 당시 가격·수수료 근거
                </summary>
                <p>
                    판매 수수료: {row.hasMembership ? "멤버십 4%" : "일반 5%"} ·
                    개별 판매 · 쿠폰 없음
                </p>
                <p>참조 버전: {row.referenceVersion}</p>
            </details>
        </article>
    );
}
