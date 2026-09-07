"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { EchoReference } from "@/lib/echostone";
import {
    type EchoGrowth,
    type EchoUpgradeData,
    newEchoGrowth,
    upgradeEcho,
} from "@/lib/echostone-upgrade";

import styles from "./echostone-styles";

type UpgradeProps = {
    colors: EchoReference["colors"];
    data: EchoUpgradeData;
    value: EchoGrowth;
    onChange: (value: EchoGrowth) => void;
    onColor: (color: number) => void;
    onBusy: (busy: boolean) => void;
};
type UpgradeView = ReturnType<typeof useUpgrade>;

function useUpgrade(props: UpgradeProps) {
    const { colors, data, value } = props;
    const [running, setRunning] = useState(false);
    const [target, setTarget] = useState(30);
    const [message, setMessage] = useState("");
    const cancelled = useRef(false);
    useEffect(
        () => () => {
            cancelled.current = true;
        },
        []
    );
    const view = {
        ...props,
        running,
        setRunning,
        target,
        setTarget,
        message,
        setMessage,
        cancelled,
        color: colors.find(c => c.id === data.color)!,
        step: data.steps.find(s => s.grade === value.grade)!,
        last: value.history.at(-1),
        goal: Math.max(target, value.grade),
    };
    return { ...view, run: (repeat: boolean) => runUpgrade(view, repeat) };
}

type UpgradeExecution = Omit<UpgradeView, "run">;
function upgradeBatch(
    view: UpgradeExecution,
    value: EchoGrowth,
    count: number,
    repeat: boolean
) {
    let next = value;
    for (let i = 0; i < (repeat ? 100 : 1); i++) {
        if (
            view.cancelled.current ||
            next.grade >= (repeat ? view.goal : 30) ||
            count >= 10000
        )
            break;
        next = upgradeEcho(view.data, next);
        count++;
    }
    return { next, count };
}

function upgradeMessage(
    cancelled: boolean,
    repeat: boolean,
    grade: number,
    goal: number,
    count: number
) {
    return cancelled
        ? "연속 승급 중지"
        : repeat && grade >= goal
          ? `${goal}등급 달성`
          : count >= 10000
            ? "10,000회 시도에 도달해 멈췄습니다."
            : "";
}

async function runUpgrade(view: UpgradeExecution, repeat: boolean) {
    const { value, goal, cancelled, onChange, onBusy, setRunning, setMessage } =
        view;
    cancelled.current = false;
    setRunning(true);
    onBusy(true);
    setMessage("");
    let next = value,
        count = 0;
    try {
        while (true) {
            ({ next, count } = upgradeBatch(view, next, count, repeat));
            onChange(next);
            if (
                !repeat ||
                cancelled.current ||
                next.grade >= goal ||
                count >= 10000
            )
                break;
            await new Promise<void>(resolve => setTimeout(resolve, 0));
        }
        setMessage(
            upgradeMessage(cancelled.current, repeat, next.grade, goal, count)
        );
    } catch (error) {
        setMessage(
            error instanceof Error ? error.message : "승급하지 못했습니다."
        );
    } finally {
        setRunning(false);
        onBusy(false);
    }
}

export default function EchostoneUpgrade(props: UpgradeProps) {
    const view = useUpgrade(props);
    return (
        <div className={styles.workspace}>
            <UpgradeWindow {...view} />
            <UpgradeTarget {...view} />
        </div>
    );
}

function UpgradeColors(view: UpgradeView) {
    const { colors, data, onColor, running, setMessage } = view;
    return (
        <fieldset disabled={running} className={styles.stoneSettings}>
            <legend className="sr-only">에코스톤 선택</legend>
            <div className={styles.colors} role="group" aria-label="색상">
                {colors.map(c => (
                    <button
                        key={c.id}
                        type="button"
                        aria-label={c.name}
                        aria-pressed={c.id === data.color}
                        onClick={() => {
                            onColor(c.id);
                            setMessage("");
                        }}
                    >
                        <Image
                            src={`/images/echostone/${53933 + c.id}.png`}
                            alt=""
                            width={36}
                            height={36}
                            unoptimized
                        />
                        <span>{c.name.replace(" 에코스톤", "")}</span>
                    </button>
                ))}
            </div>
        </fieldset>
    );
}
function UpgradeMaterial(view: UpgradeView) {
    const { data, color } = view;
    return (
        <div className={styles.materials}>
            <div className={styles.slot}>
                <Image
                    src={`/images/echostone/${53933 + data.color}.png`}
                    alt={color.name}
                    width={56}
                    height={56}
                    unoptimized
                />
            </div>
        </div>
    );
}
function UpgradeStats(view: UpgradeView) {
    const { data, value, color, step } = view;
    return (
        <div className={styles.result}>
            <h3>승급 효과</h3>
            <div
                className={`${styles.ability} ${styles.upgradeAbility}`}
                data-testid="echo-growth"
                aria-live="polite"
                aria-atomic="true"
            >
                <p>
                    {color.name} <strong>{value.grade}등급</strong>
                </p>
                {data.stats.map((stat, i) => (
                    <p key={stat} className={`${styles.abilityName} echo-stat`}>
                        {stat} {value.stats[i]}
                        {value.grade < 30 && (
                            <span className={`${styles.gain} echo-gain`}>
                                {" "}
                                +{step.min}
                                {step.min !== step.max
                                    ? `~${step.max}`
                                    : ""}{" "}
                                증가
                            </span>
                        )}
                    </p>
                ))}
            </div>
        </div>
    );
}
function UpgradeNotice(view: UpgradeView) {
    const { value, step } = view;
    return (
        <div className={styles.gameNotice}>
            <p>
                {value.grade === 30 ? (
                    "최고 등급에 도달했습니다."
                ) : (
                    <>
                        승급 성공률{" "}
                        <strong>{Math.round(step.chance * 100)}%</strong>
                    </>
                )}
            </p>
        </div>
    );
}
function UpgradeActions(view: UpgradeView) {
    const { value, running, goal, run } = view;
    return (
        <div className={styles.actions}>
            <button
                className={styles.gameButton}
                disabled={running || value.grade >= goal}
                onClick={() => void run(true)}
            >
                연속 승급
            </button>
            <button
                className={styles.gameButton}
                disabled={running || value.grade === 30}
                onClick={() => void run(false)}
            >
                승급
            </button>
        </div>
    );
}
function UpgradeStatus(view: UpgradeView) {
    const { data, running, message, last } = view;
    return (
        <p role="status" className={styles.upgradeStatus}>
            {running
                ? "연속 승급 중…"
                : message ||
                  (last
                      ? last.success
                          ? `승급 성공! ${last.gains.map((gain, i) => `${data.stats[i]} +${gain}`).join(" · ")}`
                          : "승급 실패 · 등급과 스탯을 유지합니다."
                      : "")}
        </p>
    );
}
function UpgradeWindow(view: UpgradeView) {
    const { running, cancelled } = view;
    return (
        <section className={styles.window} aria-labelledby="echo-upgrade-title">
            <h2 id="echo-upgrade-title" className={styles.windowTitle}>
                에코스톤 승급
            </h2>
            <p className={styles.hint}>
                에코스톤의 등급과 고유 능력을 높여 보세요.
            </p>
            <UpgradeColors {...view} />
            <UpgradeMaterial {...view} />
            <UpgradeStats {...view} />
            <UpgradeNotice {...view} />
            <UpgradeActions {...view} />
            {running && (
                <button
                    className="btn mt-2 w-full"
                    onClick={() => {
                        cancelled.current = true;
                    }}
                >
                    승급 중지
                </button>
            )}
            <UpgradeStatus {...view} />
            <p className={styles.hint}>
                1등급·고유 스탯 1에서 시작하며, 증가량은 표시된 범위에서 같은
                확률로 결정합니다.
            </p>
        </section>
    );
}
function UpgradeHistory(view: UpgradeView) {
    const { data, value } = view;
    return (
        <details className={styles.history}>
            <summary>최근 승급 기록</summary>
            <ol className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                {[...value.history].reverse().map(row => (
                    <li key={row.attempt}>
                        #{row.attempt} ·{" "}
                        {row.success
                            ? `${row.grade}등급 성공 · ${row.gains.map((gain, i) => `${data.stats[i]} +${gain}`).join(" · ")}`
                            : "승급 실패"}
                    </li>
                ))}
            </ol>
        </details>
    );
}
function UpgradeTarget(view: UpgradeView) {
    const { data, value, onChange, running, setTarget, setMessage, goal } =
        view;
    return (
        <section
            className={styles.targetPanel}
            aria-labelledby="echo-growth-target"
        >
            <h2 id="echo-growth-target">원하는 등급까지 키우기</h2>
            <label className="flex flex-col gap-2 text-sm">
                승급 목표 등급
                <select
                    className="select w-full"
                    disabled={running}
                    value={goal}
                    onChange={e => setTarget(Number(e.target.value))}
                >
                    {Array.from({ length: 31 - value.grade }, (_, i) => (
                        <option key={value.grade + i} value={value.grade + i}>
                            {value.grade + i}등급
                        </option>
                    ))}
                </select>
            </label>
            <p className="text-sm text-slate-500">
                실패해도 다시 시도하며 목표 등급에서 멈춥니다.
            </p>
            <p className="text-sm" data-testid="echo-upgrade-count">
                승급 시도 {value.attempts.toLocaleString("ko-KR")}회
            </p>
            <button
                className="btn"
                disabled={running}
                onClick={() => {
                    onChange(newEchoGrowth(data));
                    setMessage("");
                }}
            >
                새 에코스톤으로 시작
            </button>
            <UpgradeHistory {...view} />
        </section>
    );
}
