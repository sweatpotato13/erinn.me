"use client";

import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
    effectPool,
    effectText,
    gradeNames,
    initialSession,
    nextResetCost,
    oghamReference as data,
    type OghamSession,
    resetOgham,
} from "@/lib/ogham";

const control =
    "min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const number = (value: number) => value.toLocaleString("ko-KR");

function Resources({
    gold,
    fragments,
    items,
}: {
    gold: number;
    fragments: number;
    items: { id: number; count: number }[];
}) {
    return (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
            <li className="flex min-h-8 items-center font-semibold">
                {number(gold)} Gold
            </li>
            {[{ id: data.fragmentId, count: fragments }, ...items].map(item => (
                <li key={item.id} className="flex min-h-8 items-center gap-1.5">
                    <Image
                        src={`/images/ogham/${item.id}.png`}
                        alt=""
                        width={28}
                        height={28}
                    />
                    {data.materials.find(material => material.id === item.id)
                        ?.name ?? `아이템 ${item.id}`}{" "}
                    × {number(item.count)}
                </li>
            ))}
        </ul>
    );
}

function useSimulatorState() {
    const [session, setSession] = useState(initialSession);
    const [editing, setEditing] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    return {
        session,
        setSession,
        editing,
        setEditing,
        dirty,
        setDirty,
        message,
        setMessage,
        error,
        setError,
    };
}
type SimulatorState = ReturnType<typeof useSimulatorState>;

function configure(state: SimulatorState, next: OghamSession) {
    const { setSession, setDirty, setError, setMessage } = state;
    try {
        nextResetCost(next);
        setSession(next);
        setDirty(true);
        setError("");
        setMessage("설정을 변경했습니다. 재설정 횟수와 소모량은 그대로입니다.");
    } catch (error) {
        setError((error as Error).message);
    }
}
function start(
    state: SimulatorState,
    wordId = state.session.wordId,
    grade = state.session.grade
) {
    const { dirty, setSession, setDirty, setEditing, setError, setMessage } =
        state;
    if (
        dirty &&
        !window.confirm(
            "현재 효과 설정과 잠금, 누적 소모량을 지우고 새로 시작할까요?"
        )
    )
        return;
    setSession(initialSession(wordId, grade));
    setDirty(false);
    setEditing(false);
    setError("");
    setMessage(
        "새 시뮬레이션을 시작했습니다. 효과는 목록 순서의 첫 효과들, 레벨은 1입니다."
    );
}
function reset(state: SimulatorState) {
    const { session, setSession, setDirty, setError, setMessage } = state;
    const pool = effectPool(session.wordId, session.grade);
    const locks = session.slots.filter(slot => slot.locked).length;
    try {
        const next = resetOgham(session);
        setSession(next);
        setDirty(true);
        setError("");
        setMessage(
            `${next.resets}회 재설정 완료. 잠금 ${locks}개 보존. ${next.slots
                .filter(slot => !slot.locked)
                .map(slot =>
                    effectText(
                        pool.find(effect => effect.id === slot.effectId)!,
                        slot.level
                    )
                )
                .join(", ")}`
        );
    } catch (error) {
        setError((error as Error).message);
    }
}

function useSimulator() {
    const state = useSimulatorState();
    const { session } = state;
    const word = data.words.find(word => word.id === session.wordId)!;
    const pool = effectPool(session.wordId, session.grade);
    const cost = nextResetCost(session);
    const locks = session.slots.filter(slot => slot.locked).length;

    return {
        ...state,
        word,
        pool,
        cost,
        locks,
        start: (wordId = session.wordId, grade = session.grade) =>
            start(state, wordId, grade),
        reset: () => reset(state),
        updateSlot: (
            index: number,
            changes: Partial<OghamSession["slots"][number]>
        ) =>
            configure(state, {
                ...session,
                slots: session.slots.map((slot, i) =>
                    i === index ? { ...slot, ...changes } : slot
                ),
            }),
    };
}
type Simulator = ReturnType<typeof useSimulator>;
type SimulatorProps = { model: Simulator };
type SlotProps = SimulatorProps & { index: number };

function WordHeader({ model }: SimulatorProps) {
    const { word, session } = model;
    return (
        <div className="flex items-center gap-3">
            <Image
                src={`/images/ogham/${word.id}.png`}
                alt={`${word.name} 오검`}
                loading="eager"
                width={64}
                height={64}
                className="shrink-0 rounded-xl bg-slate-50"
            />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">
                    {word.special ? "특수 오검" : "일반 오검"} · 효과 재설정
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {word.name}{" "}
                    <span className="text-base font-medium text-blue-700">
                        {gradeNames[session.grade]}
                    </span>
                </h2>
            </div>
        </div>
    );
}

function WordSelect({ model }: SimulatorProps) {
    const { session, start } = model;
    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            오검 워드
            <select
                className={control}
                value={session.wordId}
                onChange={event => {
                    const nextWord = data.words.find(
                        word => word.id === Number(event.target.value)
                    )!;
                    start(
                        nextWord.id,
                        nextWord.grades.includes(session.grade)
                            ? session.grade
                            : nextWord.grades[0]
                    );
                }}
            >
                {data.words.map(word => (
                    <option key={word.id} value={word.id}>
                        {word.name} · {word.special ? "특수" : "일반"}
                    </option>
                ))}
            </select>
        </label>
    );
}

function GradeSelect({ model }: SimulatorProps) {
    const { session, word, start } = model;
    return (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
            등급
            <select
                className={control}
                value={session.grade}
                onChange={event =>
                    start(session.wordId, Number(event.target.value))
                }
            >
                {word.grades.map(grade => (
                    <option key={grade} value={grade}>
                        {gradeNames[grade]}
                    </option>
                ))}
            </select>
        </label>
    );
}

function ConfigurationControls({ model }: SimulatorProps) {
    return (
        <>
            <WordHeader model={model} />
            <div className="mt-4 grid grid-cols-2 gap-3">
                <WordSelect model={model} />
                <GradeSelect model={model} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
                워드·등급 변경 시 설정과 누적 소모량을 초기화합니다.
            </p>
        </>
    );
}

function EffectSelect({ model, index }: SlotProps) {
    const { session, pool } = model;
    const slot = session.slots[index];
    return (
        <label className="grid min-w-0 gap-1 text-xs text-slate-600">
            {index + 1}번 효과
            <select
                className={`${control} w-full min-w-0`}
                value={slot.effectId}
                onChange={event => {
                    const effectId = Number(event.target.value);
                    const selected = pool.find(
                        effect => effect.id === effectId
                    )!;
                    model.updateSlot(index, {
                        effectId,
                        level: Math.min(slot.level, selected.values.length),
                    });
                }}
            >
                {pool.map(candidate => (
                    <option
                        key={candidate.id}
                        value={candidate.id}
                        disabled={session.slots.some(
                            (row, i) =>
                                i !== index && row.effectId === candidate.id
                        )}
                    >
                        {effectText(candidate, 1)}
                    </option>
                ))}
            </select>
        </label>
    );
}

function LevelSelect({ model, index }: SlotProps) {
    const { session, pool } = model;
    const slot = session.slots[index];
    const effect = pool.find(effect => effect.id === slot.effectId)!;
    return (
        <label className="flex items-center gap-3 text-xs text-slate-600">
            {index + 1}번 레벨
            <select
                className={control}
                value={slot.level}
                onChange={event =>
                    model.updateSlot(index, {
                        level: Number(event.target.value),
                    })
                }
            >
                {effect.values.map((_, i) => (
                    <option key={i} value={i + 1}>
                        {i + 1}
                    </option>
                ))}
            </select>
        </label>
    );
}

function EffectSlotEditor({ model, index }: SlotProps) {
    const slot = model.session.slots[index];
    return (
        <fieldset
            disabled={slot.locked}
            className="mt-3 grid gap-2 border-t border-slate-200 pt-3"
        >
            <legend className="sr-only">{index + 1}번 효과 설정</legend>
            <EffectSelect model={model} index={index} />
            <LevelSelect model={model} index={index} />
            {slot.locked && (
                <p className="text-xs text-slate-600">
                    잠금을 해제하면 직접 설정할 수 있습니다.
                </p>
            )}
        </fieldset>
    );
}

function SlotLock({ model, index }: SlotProps) {
    const { session, locks } = model;
    const slot = session.slots[index];
    const cannotLock = !slot.locked && locks >= session.grade - 1;
    return (
        <button
            type="button"
            className={`${control} flex shrink-0 items-center gap-1.5`}
            aria-label={`${index + 1}번 효과 잠금`}
            aria-pressed={slot.locked}
            disabled={cannotLock}
            aria-describedby="ogham-lock-rule"
            onClick={() => model.updateSlot(index, { locked: !slot.locked })}
        >
            {slot.locked ? (
                <LockKeyhole size={16} aria-hidden="true" />
            ) : (
                <LockKeyholeOpen size={16} aria-hidden="true" />
            )}
            {slot.locked ? "잠김" : "잠금"}
        </button>
    );
}

function EffectSlot({ model, index }: SlotProps) {
    const { session, pool } = model;
    const slot = session.slots[index];
    const effect = pool.find(effect => effect.id === slot.effectId)!;
    const { editing } = model;
    const isMaxLevel = slot.level === effect.values.length;
    return (
        <div
            className={`rounded-xl border p-3 sm:p-4 ${slot.locked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div
                    className={`min-w-0 flex-1 ${isMaxLevel ? "font-bold text-yellow-700" : "text-slate-900"}`}
                >
                    <p className="text-sm leading-6 break-words">
                        {effectText(effect, slot.level)}
                    </p>
                    <p
                        className={`mt-1 text-xs ${isMaxLevel ? "" : "text-slate-600"}`}
                    >
                        ({slot.level}/{effect.values.length} 레벨)
                    </p>
                </div>
                <SlotLock model={model} index={index} />
            </div>
            {editing && <EffectSlotEditor model={model} index={index} />}
        </div>
    );
}

function Effects({ model }: SimulatorProps) {
    const { session, editing, setEditing } = model;
    return (
        <>
            <div className="mt-5 mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-800">각인 효과</h3>
                <button
                    type="button"
                    className={control}
                    aria-expanded={editing}
                    onClick={() => setEditing(!editing)}
                >
                    {editing ? "설정 닫기" : "현재 효과 직접 설정"}
                </button>
            </div>
            <div className="space-y-3">
                {session.slots.map((_, index) => (
                    <EffectSlot key={index} model={model} index={index} />
                ))}
            </div>
            <p id="ogham-lock-rule" className="mt-3 text-xs text-slate-600">
                최소 한 효과는 잠금 해제 상태여야 합니다.{" "}
                {gradeNames[session.grade]}는 최대 {session.grade - 1}개 잠글 수
                있습니다.
            </p>
            {editing && (
                <p className="mt-2 text-xs text-slate-600">
                    직접 설정은 무료이며 누적 소모량에 포함되지 않습니다. 효과
                    변경 시 새 최대 레벨을 초과하면 해당 최대 레벨로 맞춥니다.
                </p>
            )}
        </>
    );
}

function CostPanel({ model }: SimulatorProps) {
    const { cost, locks } = model;
    return (
        <section
            aria-label="다음 재설정 비용"
            className="mt-5 border-t border-slate-200 pt-4"
        >
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
                다음 재설정 비용 · 잠금 {locks}개
            </h3>
            <Resources
                gold={cost.gold}
                fragments={cost.fragments}
                items={cost.items}
            />
        </section>
    );
}

function ResetControls({ model }: SimulatorProps) {
    const { reset, error, message } = model;
    return (
        <>
            <button
                type="button"
                onClick={reset}
                className="mt-5 min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
                재설정
            </button>
            {error && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {message}
            </p>
        </>
    );
}

function CumulativeResources({ model }: SimulatorProps) {
    const { session, start } = model;
    return (
        <section
            aria-label="누적 소모량"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6"
        >
            <h3 className="mb-3 font-semibold text-slate-900">
                누적 소모량 · 재설정 {number(session.resets)}회
            </h3>
            <Resources
                gold={session.gold}
                fragments={session.fragments}
                items={data.materials
                    .filter(material => material.id !== data.fragmentId)
                    .map(material => ({
                        id: material.id,
                        count: session.items[material.id] ?? 0,
                    }))}
            />
            <button
                type="button"
                className={`${control} mt-4`}
                onClick={() => start()}
            >
                시뮬레이션 초기화
            </button>
            <p className="mt-2 text-xs text-slate-500">
                초기화하면 현재 워드·등급의 첫 효과들(레벨 1)로 돌아갑니다. 실제
                게임 아이템은 변경되지 않습니다.
            </p>
        </section>
    );
}

export default function OghamSimulator() {
    const model = useSimulator();
    return (
        <section aria-label="오검 효과 재설정" className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <ConfigurationControls model={model} />
                <Effects model={model} />
                <CostPanel model={model} />
                <ResetControls model={model} />
            </div>
            <CumulativeResources model={model} />
        </section>
    );
}
