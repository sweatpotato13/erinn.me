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
    const total = summarizeOpenings(openings);
    const latest = openings.at(-1);
    const commitRows = (next: RelicOpening[]) => {
        summarizeOpenings(next); // Validate all totals before replacing a valid ledger.
        setOpenings(next);
    };
    const restore = () => {
        setError(null);
        try {
            if (ideaValue === null)
                throw new Error("이데아 가격을 입력해 주세요.");
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
                    snapshot,
                },
                openings.length + 1
            );
            commitRows([...openings, row]);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "복원 실패");
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
            <div className={ui.workspace}>
                <div className={ui.main}>
                    <section aria-label="누적 손익" className={ui.ledger}>
                        <div className={ui.ledgerHead}>
                            <h2>누적 손익 · {total.count}회 복원</h2>
                            <button
                                className="btn btn-sm"
                                onClick={() => {
                                    setOpenings([]);
                                    setError(null);
                                }}
                            >
                                세션 초기화
                            </button>
                        </div>
                        <p
                            className={ui.profit}
                            data-profit={
                                total.profit === null
                                    ? "unknown"
                                    : total.profit >= 0
                                      ? "gain"
                                      : "loss"
                            }
                        >
                            {total.profit === null
                                ? "전체 손익 미확정"
                                : signed(total.profit)}
                        </p>
                        <p>
                            평가 완료 {total.valued}/{total.count}
                            {total.profit === null && " · 전체 손익 미확정"}
                        </p>
                        <dl className={ui.totals}>
                            <div>
                                <dt>이데아 지출</dt>
                                <dd>{gold(total.idea)}</dd>
                            </div>
                            <div>
                                <dt>예상 판매액</dt>
                                <dd>{gold(total.gross)}</dd>
                            </div>
                            <div>
                                <dt>예상 수령액 (수수료 후)</dt>
                                <dd>{gold(total.net)}</dd>
                            </div>
                        </dl>
                        <p className="text-xs mt-3">
                            판매 수수료 5% · 복원 비용은 이데아 단가만
                            반영합니다.
                        </p>
                        {total.profit === null && (
                            <p className="text-xs">
                                판매액·수령액은 평가된 결과의 소계이며, 이데아
                                지출은 모든 복원을 포함합니다.
                            </p>
                        )}
                    </section>
                    <div className={ui.controls}>
                        <details
                            ref={restorationWindow}
                            open
                            className={ui.window}
                        >
                            <summary className={ui.titlebar}>
                                <span className={ui.emblem} aria-hidden="true">
                                    ✓
                                </span>
                                무리아스의 유물 복원
                                <span
                                    className={ui.windowControls}
                                    aria-hidden="true"
                                >
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
                                                #{latest.sequence} ·{" "}
                                                {latest.level}레벨
                                            </p>
                                            <p className={ui.valuation}>
                                                {latest.valuation.value === null
                                                    ? "시세 없음 · 손익 미확정"
                                                    : `예상 판매가 ${gold(latest.valuation.value)} · 예상 손익 ${signed(openingAmounts(latest).profit!)}`}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div className={ui.buttons}>
                                    <button
                                        className={ui.button}
                                        disabled={ideaValue === null}
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
                            className={ui.settings}
                        >
                            <h2 className="font-bold">이데아 비용</h2>
                            <GoldInput
                                label="이데아 단가 (Gold)"
                                value={
                                    ideaDraft ??
                                    (ideaValue === null
                                        ? ""
                                        : String(ideaValue))
                                }
                                onChange={setIdeaDraft}
                            />
                            <p className="text-xs">
                                {ideaDraft === null
                                    ? "조회 매물 기준"
                                    : "수동 입력"}{" "}
                                · 0~{gold(MAX_GOLD)} 정수
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="btn btn-xs"
                                    onClick={() => setIdeaDraft(null)}
                                >
                                    이데아 시세 사용
                                </button>
                                <button
                                    className="btn btn-xs"
                                    disabled={busy}
                                    onClick={() => void load(true)}
                                >
                                    가격 새로고침
                                </button>
                            </div>
                            {busy && (
                                <p role="status">가격을 조회하는 중입니다…</p>
                            )}
                            {[
                                marketError,
                                snapshot?.relicError,
                                snapshot?.ideaError,
                            ]
                                .filter(Boolean)
                                .map((message, i) => (
                                    <p role="alert" key={i}>
                                        {message}
                                    </p>
                                ))}
                            {ideaValue === null && (
                                <p>
                                    유효한 이데아 단가를 입력해야 복원할 수
                                    있습니다.
                                </p>
                            )}
                            <p className="text-xs">
                                변경한 가격은 이후 복원에만 반영됩니다. 기록은
                                페이지를 떠나거나 초기화하면 사라집니다.
                            </p>
                            <details className="text-xs">
                                <summary className="cursor-pointer">
                                    시세 조회 정보
                                </summary>
                                <p>
                                    유물 조회:{" "}
                                    {time(snapshot?.fetchedAt ?? null)} ·{" "}
                                    {snapshot?.isComplete
                                        ? "전체 매물 조회"
                                        : "일부 또는 미조회"}
                                </p>
                                <p>
                                    가격 있음{" "}
                                    {snapshot?.cells.filter(cell =>
                                        validSimulationGold(cell.minUnitPrice)
                                    ).length ?? 0}
                                    /{reference.effects.length * 10}
                                </p>
                                <p>
                                    이데아 조회:{" "}
                                    {time(snapshot?.ideaFetchedAt ?? null)} ·{" "}
                                    {snapshot?.ideaIsComplete
                                        ? "전체 매물 조회"
                                        : "일부 또는 미조회"}
                                </p>
                            </details>
                            {error && <p role="alert">{error}</p>}
                        </section>
                    </div>
                </div>
                <section aria-label="복원 기록" className={ui.history}>
                    <h2 className="font-bold p-4 border-b border-base-300">
                        복원 기록{" "}
                        <span className="font-normal text-xs">
                            {total.count}개 · 최신순
                        </span>
                    </h2>
                    <div className={ui.historyList}>
                        {!openings.length && (
                            <p className="p-4 text-sm">
                                아직 복원 기록이 없습니다.
                            </p>
                        )}
                        {[...openings].reverse().map(row => (
                            <OpeningRow key={row.sequence} row={row} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function OpeningRow({ row }: { row: RelicOpening }) {
    const amounts = openingAmounts(row);
    return (
        <article aria-label={`${row.sequence}회 복원`}>
            <details>
                <summary className={ui.historyRow}>
                    <span className="text-base-content/60">
                        #{row.sequence}
                    </span>
                    <span className={ui.historyEffect} title={row.description}>
                        {row.description}
                    </span>
                    <span className="text-xs">{row.level}레벨</span>
                    <span
                        className={ui.historyProfit}
                        data-profit={
                            amounts.profit === null
                                ? "unknown"
                                : amounts.profit >= 0
                                  ? "gain"
                                  : "loss"
                        }
                    >
                        {amounts.profit === null
                            ? "미확정"
                            : `${amounts.profit >= 0 ? "+" : ""}${formatGold(amounts.profit)}`}
                    </span>
                </summary>
                <div className="p-3 text-xs space-y-1 border-b border-base-300">
                    <p>
                        {row.description} · {row.level}레벨
                    </p>
                    <p>이데아 {gold(row.idea.value)}</p>
                    {row.valuation.value === null ? (
                        <p>시세 없음 · 손익 미확정</p>
                    ) : (
                        <>
                            <p>
                                예상 판매가 {gold(row.valuation.value)} · 판매
                                수수료 {gold(amounts.fee!)} · 예상 수령액{" "}
                                {gold(amounts.net!)}
                            </p>
                            <p>예상 손익 {signed(amounts.profit!)}</p>
                        </>
                    )}
                    <p>이데아: {source(row.idea)}</p>
                    <p>유물 평가: {source(row.valuation)}</p>
                </div>
            </details>
        </article>
    );
}
