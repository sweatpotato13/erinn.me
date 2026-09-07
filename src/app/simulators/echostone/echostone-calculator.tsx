"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    canPolish,
    createEchoPool,
    ECHO_CAP,
    echoAction,
    echoEffect,
    type EchoExpectation,
    echoHit,
    type EchoItem,
    type EchoReference,
    type EchoSession,
    echoStrategies,
    emptyEchoSession,
    existingEchoStrategy,
    levelChance,
    polishOutcomes,
    runEchoChunk,
} from "@/lib/echostone";
import {
    type EchoConfig,
    echoConfigPath,
    ECHOSTONE_PATH,
    parseEchoConfig,
} from "@/lib/echostone-url";
import { parseGold, successThreshold, successWithin } from "@/lib/reforge";

const number = (n: number) =>
    !Number.isFinite(n)
        ? "도달 불가"
        : n > Number.MAX_SAFE_INTEGER
          ? `약 ${n.toExponential(4)}`
          : n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const percent = (p: number) =>
    p > 0 && p < 0.000001
        ? `${(p * 100).toExponential(4)}%`
        : `${(p * 100).toLocaleString("ko-KR", { maximumFractionDigits: 6 })}%`;
const priceError = (s: string) => s !== "" && parseGold(s) === null;
const labelClass = "flex min-w-0 flex-col gap-2 text-sm font-medium";
const boxClass =
    "space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5";
const errorText = (e: unknown) =>
    e instanceof Error ? e.message : "계산을 완료하지 못했습니다.";
type PriceId = keyof EchoConfig["prices"];

export default function EchostoneCalculator({ data }: { data: EchoReference }) {
    const params = useSearchParams();
    const parsed = parseEchoConfig(
        new URLSearchParams(params.toString()),
        data
    );
    return (
        <>
            {parsed.error && (
                <p role="alert" className="mb-4 text-red-700">
                    {parsed.error}{" "}
                    <Link className="link" href={ECHOSTONE_PATH}>
                        기본 설정
                    </Link>
                </p>
            )}
            {parsed.changedVersion && (
                <p role="status" className="mb-4 text-amber-800">
                    공유한 데이터 버전과 다릅니다. 현재 버전 {data.version}{" "}
                    기준으로 다시 계산합니다. 현재 옵션은 다시 입력하세요.
                </p>
            )}
            <Calculator
                key={params.toString()}
                data={data}
                initial={parsed.config}
                invalid={!!parsed.error}
            />
        </>
    );
}
function Calculator({
    data,
    initial,
    invalid,
}: {
    data: EchoReference;
    initial: EchoConfig;
    invalid: boolean;
}) {
    const [config, setConfig] = useState(initial);
    const [session, setSession] = useState(() =>
        emptyEchoSession(initial.current)
    );
    const [ready, setReady] = useState(false);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState("");
    const [failure, setFailure] = useState("");
    const [filter, setFilter] = useState("");
    const [cap, setCap] = useState(String(initial.cap));
    const [attempts, setAttempts] = useState("1000");
    const [share, setShare] = useState("");
    const cancelled = useRef(false);
    useEffect(() => {
        setReady(true);
        return () => {
            cancelled.current = true;
        };
    }, []);
    const update = (patch: Partial<EchoConfig>) => {
        setConfig(c => ({ ...c, ...patch }));
        setShare("");
    };
    const color = data.colors.find(c => c.id === config.color)!;
    const normal = createEchoPool(data, config.color, config.grade, 53940);
    const models = data.agents.map(agent => {
        try {
            return {
                agent,
                pool: createEchoPool(
                    data,
                    config.color,
                    config.grade,
                    agent.id
                ),
                error: null,
            };
        } catch (e) {
            return { agent, pool: null, error: errorText(e) };
        }
    });
    const selected = models.find(m => m.agent.id === config.agent)!;
    const pool = selected.pool;
    // Official same-probability rule: normal agent 53940, regardless of the prior agent.
    const polish = normal;
    const fee = parseGold(config.fee);
    const costsFor = (id: number) => {
        const price = parseGold(config.prices[id as PriceId]);
        return {
            awakening: price === null || fee === null ? null : price + fee,
            stone: parseGold(config.prices[5040961]),
        };
    };
    const costs = costsFor(config.agent);
    const budget = parseGold(config.budget);
    const invalidCosts =
        Object.values(config.prices).some(priceError) ||
        priceError(config.fee) ||
        priceError(config.budget);
    const invalidCap = !/^[1-9]\d{0,6}$/.test(cap) || Number(cap) > ECHO_CAP;
    const blocked = !ready || invalid || running || invalidCosts;
    const result = pool
        ? echoStrategies(pool, config.target, costs, polish)
        : null;
    const current = session.current;
    const currentOption = normal.options.find(o => o.id === current?.id);
    const currentEligible = canPolish(normal, current);
    const outcomes =
        current && currentEligible
            ? polishOutcomes(normal, current, polish)
            : null;
    const restart = config.policy === "awakening" ? result?.A : result?.B;
    const existing = existingEchoStrategy(
        normal,
        config.target,
        current,
        costs,
        polish,
        restart ?? null
    );
    const probability = result?.combined ?? 0;
    const budgetError =
        budget !== null && session.unknownCosts > 0
            ? "가격 미입력으로 진행한 기록이 있어 남은 예산을 알 수 없습니다. 기록을 초기화한 뒤 실행하세요."
            : "";
    const reset = () => {
        setSession(emptyEchoSession());
        setMessage("");
        setFailure("");
        setShare("");
    };
    const changeStone = (patch: Partial<EchoConfig>) => {
        update({ ...patch, current: null });
        reset();
    };

    async function run(action: "awakening" | "polishing" | "auto") {
        const actionPool = action === "polishing" ? normal : pool;
        if (!actionPool) return;
        setFailure("");
        setMessage("");
        setShare("");
        try {
            if (budgetError) throw new Error(budgetError);
            if (action !== "auto") {
                const price =
                    action === "awakening" ? costs.awakening : costs.stone;
                if (budget !== null && price === null)
                    throw new Error(
                        "예산을 적용하려면 필요한 가격을 입력하세요."
                    );
                if (budget !== null && session.spent + price! > budget) {
                    setMessage("예산 한도 도달");
                    return;
                }
                setSession(
                    echoAction(session, actionPool, action, costs, polish)
                );
                return;
            }
            cancelled.current = false;
            setRunning(true);
            let next: EchoSession = session,
                completed = 0,
                spent = session.spent;
            while (true) {
                const batch = runEchoChunk(
                    next,
                    actionPool,
                    config.target,
                    polish,
                    { policy: config.policy, cap: Number(cap), budget, costs },
                    completed,
                    spent,
                    () => cancelled.current
                );
                next = batch.session;
                completed = batch.completed;
                spent = batch.spent;
                setSession(next);
                if (batch.reason) {
                    setMessage(batch.reason);
                    break;
                }
                await new Promise<void>(resolve => setTimeout(resolve, 0));
            }
        } catch (e) {
            setFailure(errorText(e));
        } finally {
            setRunning(false);
        }
    }
    async function copySettings() {
        try {
            const path = echoConfigPath(
                {
                    ...config,
                    version: data.version,
                    cap: Number(cap),
                    current: session.current,
                },
                data
            );
            const url = new URL(path, window.location.origin).toString();
            setShare(url);
            await navigator.clipboard.writeText(url);
            setMessage("설정 링크를 복사했습니다.");
        } catch {
            setMessage("복사할 수 없으면 아래 설정 링크를 직접 복사하세요.");
        }
    }
    return (
        <div className="space-y-5">
            <fieldset disabled={!ready || running} className={boxClass}>
                <legend className="px-2 font-semibold">목표 설정</legend>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className={labelClass}>
                        색상
                        <select
                            className="select w-full"
                            value={config.color}
                            onChange={e => {
                                const id = Number(e.target.value);
                                changeStone({
                                    color: id,
                                    target: {
                                        name: data.colors.find(
                                            c => c.id === id
                                        )!.options[0].name,
                                        level: 1,
                                    },
                                });
                            }}
                        >
                            {data.colors.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={labelClass}>
                        등급
                        <select
                            className="select w-full"
                            value={config.grade}
                            onChange={e =>
                                changeStone({ grade: Number(e.target.value) })
                            }
                        >
                            {Array.from({ length: 30 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}등급
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={labelClass}>
                        각성제
                        <select
                            className="select w-full"
                            value={config.agent}
                            onChange={e =>
                                update({
                                    agent: Number(
                                        e.target.value
                                    ) as EchoConfig["agent"],
                                })
                            }
                        >
                            {data.agents.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                    {!a.searchable ? " (거래 불가)" : ""}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={labelClass}>
                        최소 목표 레벨
                        <select
                            className="select w-full"
                            value={config.target.level}
                            onChange={e =>
                                update({
                                    target: {
                                        ...config.target,
                                        level: Number(e.target.value),
                                    },
                                })
                            }
                        >
                            {Array.from({ length: 20 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1} 이상
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <label className={labelClass}>
                    목표 옵션
                    <select
                        className="select w-full"
                        value={config.target.name}
                        onChange={e =>
                            update({
                                target: {
                                    ...config.target,
                                    name: e.target.value,
                                },
                            })
                        }
                    >
                        {[...new Set(color.options.map(o => o.name))].map(
                            name => (
                                <option key={name}>{name}</option>
                            )
                        )}
                    </select>
                </label>
                <p className="text-sm text-slate-600">
                    색상·등급을 바꾸면 현재 옵션과 사용 기록이 초기화됩니다.
                    같은 이름의 옵션은 확률을 합산합니다.
                </p>
            </fieldset>
            {selected.error && (
                <p role="alert" className="text-red-700">
                    {selected.error}
                </p>
            )}
            {invalidCosts && (
                <p role="alert" className="text-red-700">
                    가격과 예산은 0 이상의 정수(최대 30자리)로 입력하세요.
                    빈칸은 가격 미입력입니다.
                </p>
            )}
            <section className={boxClass} aria-labelledby="echo-comparison">
                <h2 id="echo-comparison" className="text-lg font-semibold">
                    각성제별 확률과 기대 비용
                </h2>
                <p className="text-sm text-slate-600">
                    옵션 확률 = 해당 능력이 나올 확률 · 조건부 확률 = 해당
                    능력에서 목표 레벨 이상일 확률 · 목표 확률 = 두 확률의 곱.
                    비용은 입력 가격 기준 이론 기대값입니다.
                </p>
                <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                        <caption className="sr-only">
                            각성제별 목표 확률과 각성만 반복하는 전략 A
                        </caption>
                        <thead>
                            <tr>
                                <th>각성제</th>
                                <th>옵션 확률</th>
                                <th>조건부 레벨 확률</th>
                                <th>목표 확률</th>
                                <th>평균 각성 횟수</th>
                                <th>기대 Gold</th>
                                <th>기대 AP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {models.map(m => {
                                const r = m.pool
                                    ? echoStrategies(
                                          m.pool,
                                          config.target,
                                          costsFor(m.agent.id),
                                          null
                                      )
                                    : null;
                                return (
                                    <tr
                                        key={m.agent.id}
                                        className={
                                            m.agent.id === config.agent
                                                ? "bg-blue-50"
                                                : ""
                                        }
                                    >
                                        <th className="min-w-36 whitespace-normal">
                                            {m.agent.name}
                                            {!m.agent.searchable &&
                                                " (거래 불가)"}
                                        </th>
                                        {r ? (
                                            <>
                                                <td>{percent(r.option)}</td>
                                                <td>
                                                    {percent(r.conditional)}
                                                </td>
                                                <td>{percent(r.combined)}</td>
                                                <td>
                                                    {number(r.A.awakenings)}
                                                </td>
                                                <td>
                                                    {r.A.gold === null
                                                        ? "가격 미입력"
                                                        : `약 ${number(r.A.gold)}`}
                                                </td>
                                                <td>{number(r.A.ap)}</td>
                                            </>
                                        ) : (
                                            <td colSpan={6}>{m.error}</td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {result && (
                    <div className="space-y-2 text-sm">
                        <p data-testid="echo-probability">
                            선택 각성제의 목표 확률: {percent(probability)}
                        </p>
                        {probability === 0 && (
                            <p role="alert" className="text-amber-800">
                                이 설정에서는 달성 불가능한 목표입니다. 옵션과
                                등급·목표 레벨을 확인하세요.
                            </p>
                        )}
                        <p>
                            각성만 반복할 때 50% 도달:{" "}
                            {number(successThreshold(probability, 0.5))}회 · 90%
                            도달: {number(successThreshold(probability, 0.9))}회
                        </p>
                        <label className={labelClass}>
                            확률을 확인할 각성 횟수
                            <input
                                className="input w-full sm:max-w-xs"
                                inputMode="numeric"
                                maxLength={7}
                                value={attempts}
                                onChange={e => setAttempts(e.target.value)}
                            />
                        </label>
                        {/^(0|[1-9]\d{0,6})$/.test(attempts) &&
                        Number(attempts) <= ECHO_CAP ? (
                            <p>
                                {number(Number(attempts))}회 이내 성공 확률:{" "}
                                {percent(
                                    successWithin(probability, Number(attempts))
                                )}
                            </p>
                        ) : (
                            <p role="alert">0~1,000,000회 정수로 입력하세요.</p>
                        )}
                        <p>
                            독립적으로 같은 조건을 반복한 결과입니다. 평균·확률
                            횟수는 성공 보장이 아닙니다.
                        </p>
                    </div>
                )}
            </section>
            <fieldset disabled={!ready || running} className={boxClass}>
                <legend className="px-2 font-semibold">재료 가격과 예산</legend>
                <p className="text-sm text-slate-600">
                    가격 빈칸은 미입력, 0은 무료로 가정합니다. 거래 불가 재료는
                    직접 기회비용을 입력하세요. 시세는 버튼으로 조회한 뒤 직접
                    적용합니다.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    {[...data.agents, data.stone].map(item => (
                        <PriceField
                            key={item.id}
                            item={item}
                            value={config.prices[item.id as PriceId]}
                            onChange={value =>
                                update({
                                    prices: {
                                        ...config.prices,
                                        [item.id]: value,
                                    },
                                })
                            }
                        />
                    ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                        각성 1회 Gold 이용 수수료 (직접 입력)
                        <input
                            className="input w-full"
                            inputMode="numeric"
                            maxLength={30}
                            value={config.fee}
                            onChange={e => update({ fee: e.target.value })}
                        />
                    </label>
                    <label className={labelClass}>
                        기록 전체 예산 (Gold, 빈칸은 제한 없음)
                        <input
                            className="input w-full"
                            inputMode="numeric"
                            maxLength={30}
                            value={config.budget}
                            onChange={e => update({ budget: e.target.value })}
                        />
                    </label>
                </div>
                <p className="text-sm text-slate-600">
                    AP는 Gold와 별개입니다. 직접 오르골 이용 기준 각성 1회당 25
                    AP, 연마 0 AP입니다. 적용한 가격은 이후 시도에만 반영됩니다.
                </p>
            </fieldset>
            <section className={boxClass} aria-labelledby="echo-current">
                <h2 id="echo-current" className="text-lg font-semibold">
                    현재 옵션과 1회 연마
                </h2>
                <fieldset
                    disabled={!ready || running}
                    className="grid gap-4 sm:grid-cols-3"
                >
                    <label className={labelClass}>
                        현재 옵션
                        <select
                            className="select w-full"
                            value={current?.id ?? ""}
                            onChange={e => {
                                const id = Number(e.target.value);
                                setSession(
                                    emptyEchoSession(
                                        id
                                            ? {
                                                  id,
                                                  level: 1,
                                                  polishingUsed: false,
                                              }
                                            : null
                                    )
                                );
                                setShare("");
                            }}
                        >
                            <option value="">없음</option>
                            {normal.options.map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.name} (항목 {o.id})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={labelClass}>
                        현재 레벨
                        <select
                            className="select w-full"
                            disabled={!current}
                            value={current?.level ?? 1}
                            onChange={e => {
                                setSession(
                                    emptyEchoSession({
                                        ...current!,
                                        level: Number(e.target.value),
                                    })
                                );
                                setShare("");
                            }}
                        >
                            {Array.from(
                                { length: currentOption?.max ?? 1 },
                                (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {i + 1}
                                    </option>
                                )
                            )}
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            className="checkbox"
                            type="checkbox"
                            disabled={!current}
                            checked={current?.polishingUsed ?? false}
                            onChange={e => {
                                setSession(
                                    emptyEchoSession({
                                        ...current!,
                                        polishingUsed: e.target.checked,
                                    })
                                );
                                setShare("");
                            }}
                        />
                        이미 연마 사용
                    </label>
                </fieldset>
                <p className="text-sm text-slate-600">
                    게임에서 보유한 옵션을 직접 입력할 수 있습니다. 직접
                    수정하면 이전 시뮬레이션 비용 기록이 초기화됩니다.
                </p>
                <p data-testid="echo-current">
                    {current && currentOption
                        ? `${currentOption.name} ${current.level}/${currentOption.max} 레벨 · ${echoEffect(currentOption, current.level)} · ${current.polishingUsed ? "연마 사용 완료" : currentEligible ? "연마 조건 충족" : "최대 레벨: 연마 불가"}`
                        : "현재 각성 옵션이 없습니다."}
                </p>
                <p className="text-sm text-slate-600">
                    연마는 일반 에코스톤 각성제의 등급별 레벨 확률을 사용합니다.
                    이전 각성제의 고급·최고급 보정은 적용되지 않습니다.
                </p>
                {outcomes && current && (
                    <div className="space-y-2">
                        <p data-testid="echo-polish-probability">
                            개선 확률:{" "}
                            {percent(
                                outcomes.reduce(
                                    (s, o) =>
                                        s +
                                        (o.level > current.level
                                            ? o.probability
                                            : 0),
                                    0
                                )
                            )}{" "}
                            · 유지 확률:{" "}
                            {percent(
                                outcomes.find(o => o.level === current.level)
                                    ?.probability ?? 0
                            )}{" "}
                            · 목표 성공:{" "}
                            {percent(
                                outcomes.reduce(
                                    (s, o) =>
                                        s +
                                        (echoHit(normal, config.target, {
                                            ...current,
                                            level: o.level,
                                        })
                                            ? o.probability
                                            : 0),
                                    0
                                )
                            )}
                        </p>
                        <ul>
                            {outcomes.map(o => (
                                <li key={o.level}>
                                    {o.level} 레벨: {percent(o.probability)}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="grid gap-3 md:grid-cols-3">
                    <Expectation
                        title="A · 각성만 반복"
                        value={result?.A ?? null}
                    />
                    <Expectation
                        title="B · 목표 옵션 미달 시 1회 연마"
                        value={result?.B ?? null}
                    />
                    <Expectation
                        title="C · 현재 옵션에서 시작"
                        value={existing}
                    />
                </div>
                <p className="text-sm text-slate-600">
                    B는 목표 옵션이 나왔지만 목표 레벨보다 낮을 때만 1회
                    연마합니다. C는 현재 목표 옵션을 연마한 뒤 실패하면 아래에서
                    선택한 정책으로 다시 각성합니다. 이미 달성했다면 추가 비용은
                    0입니다. 연마를 사용했거나 최대 레벨이면 바로 재시작 비용을
                    표시합니다.
                </p>
            </section>
            <section className={boxClass} aria-labelledby="echo-simulation">
                <h2 id="echo-simulation" className="text-lg font-semibold">
                    각성 시뮬레이션
                </h2>
                <fieldset
                    disabled={!ready || running}
                    className="grid gap-4 sm:grid-cols-2"
                >
                    <label className={labelClass}>
                        반복·재시작 정책
                        <select
                            className="select w-full"
                            value={config.policy}
                            onChange={e =>
                                update({
                                    policy: e.target
                                        .value as EchoConfig["policy"],
                                })
                            }
                        >
                            <option value="awakening">A · 각성만 반복</option>
                            <option value="polishing">
                                B · 목표 옵션 미달 시 1회 연마
                            </option>
                        </select>
                    </label>
                    <label className={labelClass}>
                        자동 실행 최대 행동 횟수
                        <input
                            className="input w-full"
                            inputMode="numeric"
                            maxLength={7}
                            value={cap}
                            onChange={e => {
                                setCap(e.target.value);
                                setShare("");
                            }}
                        />
                    </label>
                </fieldset>
                <p className="text-sm text-slate-600">
                    각성·연마를 각각 1행동으로 셉니다. 자동 실행은 첫 목표
                    달성·취소·최대 1,000,000행동·예산 부족에서 멈춥니다. 최근
                    100행동만 저장합니다.
                </p>
                {invalidCap && (
                    <p role="alert">
                        최대 횟수는 1~1,000,000 정수로 입력하세요.
                    </p>
                )}
                {budgetError && <p role="alert">{budgetError}</p>}
                <div className="flex flex-wrap gap-2">
                    <button
                        className="btn btn-primary"
                        disabled={blocked || !pool || !!budgetError}
                        onClick={() => void run("awakening")}
                    >
                        각성 1회
                    </button>
                    <button
                        className="btn"
                        disabled={blocked || !currentEligible || !!budgetError}
                        onClick={() => void run("polishing")}
                    >
                        연마 1회
                    </button>
                    <button
                        className="btn"
                        disabled={
                            blocked || !pool || invalidCap || !!budgetError
                        }
                        onClick={() => void run("auto")}
                    >
                        목표까지 자동 실행
                    </button>
                    <button
                        className="btn"
                        disabled={!running}
                        onClick={() => {
                            cancelled.current = true;
                        }}
                    >
                        중지
                    </button>
                    <button
                        className="btn btn-ghost"
                        disabled={!ready || running}
                        onClick={reset}
                    >
                        기록 초기화
                    </button>
                </div>
                {failure && (
                    <p role="alert" className="text-red-700">
                        {failure}
                    </p>
                )}
                <p role="status">{running ? "자동 실행 중…" : message}</p>
                <p data-testid="echo-totals">
                    각성 {number(session.awakenings)}회 · 연마{" "}
                    {number(session.stones)}회 ·{" "}
                    {number(session.awakenings * 25)} AP ·{" "}
                    {session.spent.toLocaleString("ko-KR")} Gold
                    {session.unknownCosts > 0 &&
                        ` + 가격 미입력 ${session.unknownCosts}행동`}
                </p>
                <ul className="text-sm text-slate-600">
                    {data.agents.map(a => (
                        <li key={a.id}>
                            {a.name}
                            {!a.searchable ? " (거래 불가)" : ""}:{" "}
                            {number(session.agents[a.id] ?? 0)}개
                        </li>
                    ))}
                </ul>
                <details>
                    <summary className="cursor-pointer font-medium">
                        최근 시뮬레이션 기록
                    </summary>
                    <ol className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
                        {[...session.history].reverse().map(row => (
                            <li key={row.number}>
                                #{row.number}{" "}
                                {row.action === "awakening" ? "각성" : "연마"} ·{" "}
                                {
                                    normal.options.find(
                                        o => o.id === row.state.id
                                    )?.name
                                }{" "}
                                {row.state.level}레벨
                                {row.state.polishingUsed && " (연마 소진)"}
                            </li>
                        ))}
                    </ol>
                </details>
            </section>
            <details className={boxClass}>
                <summary className="cursor-pointer font-semibold">
                    등장 옵션·레벨·효과 보기
                </summary>
                <label className={labelClass}>
                    옵션 이름 필터
                    <input
                        className="input w-full"
                        maxLength={100}
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </label>
                <div className="max-h-96 overflow-auto">
                    <table className="table table-sm">
                        <caption className="sr-only">
                            현재 색상·등급·각성제의 항목별 확률
                        </caption>
                        <thead>
                            <tr>
                                <th>옵션</th>
                                <th>레벨</th>
                                <th>효과 범위</th>
                                <th>옵션 비중</th>
                                <th>조건부 ≥{config.target.level}</th>
                                <th>결합 확률</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(pool?.options ?? [])
                                .filter(o => o.name.includes(filter.trim()))
                                .map(o => {
                                    const low = o.levels[0].level,
                                        high =
                                            o.levels[o.levels.length - 1].level,
                                        q = levelChance(
                                            o.levels,
                                            config.target.level
                                        );
                                    return (
                                        <tr key={o.id}>
                                            <th className="min-w-40 whitespace-normal">
                                                {o.name}
                                            </th>
                                            <td>
                                                {low}~{high}
                                            </td>
                                            <td className="min-w-36 whitespace-normal">
                                                {echoEffect(o, low)} ~{" "}
                                                {echoEffect(o, high)}
                                            </td>
                                            <td>{percent(o.chance)}</td>
                                            <td>{percent(q)}</td>
                                            <td>{percent(o.chance * q)}</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
                {!pool && (
                    <p>이 설정의 레벨 확률 자료가 없어 표시할 수 없습니다.</p>
                )}
            </details>
            <section className={boxClass} aria-label="설정 공유">
                <button
                    className="btn"
                    disabled={blocked || invalidCap}
                    onClick={() => void copySettings()}
                >
                    설정 링크 복사
                </button>
                <p className="text-sm text-slate-600">
                    색상·등급·목표·가격·현재 옵션과 연마 사용 여부를 공유합니다.
                    링크는 무작위 기록을 재현하지 않으며 열 때 자동 실행이나
                    시세 조회를 하지 않습니다.
                </p>
                {share && (
                    <label className={labelClass}>
                        공유 링크
                        <input
                            className="input w-full"
                            readOnly
                            value={share}
                            onFocus={e => e.target.select()}
                        />
                    </label>
                )}
            </section>
        </div>
    );
}
function Expectation({
    title,
    value,
}: {
    title: string;
    value: EchoExpectation | null;
}) {
    return (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
            <h3 className="font-semibold">{title}</h3>
            {value ? (
                <>
                    <p>
                        기대 각성 {number(value.awakenings)}회 · 연마석{" "}
                        {number(value.stones)}개
                    </p>
                    <p>
                        {number(value.ap)} AP ·{" "}
                        {value.gold === null
                            ? "가격 미입력"
                            : `약 ${number(value.gold)} Gold`}
                    </p>
                </>
            ) : (
                <p>각성제 설정의 확률 자료가 없어 계산할 수 없습니다.</p>
            )}
        </div>
    );
}
function PriceField({
    item,
    value,
    onChange,
}: {
    item: EchoItem;
    value: string;
    onChange: (value: string) => void;
}) {
    const market = useQuery({
        queryKey: ["echostone-price", item.id],
        queryFn: ({ signal }) => fetchItemPriceSummary(item.name, signal),
        enabled: false,
        retry: false,
        refetchOnWindowFocus: false,
    });
    const label = `${item.name}${item.description.includes("거래불가") ? " (거래 불가)" : !item.searchable ? " (경매 검색 미지원)" : ""}`;
    const valid =
        market.data &&
        market.data.availableQuantity > 0 &&
        Number.isSafeInteger(market.data.minPrice);
    return (
        <div className="space-y-2 rounded-lg border border-slate-100 p-3">
            <label className={labelClass}>
                {label} 1개 가격 (Gold)
                <input
                    className="input w-full"
                    inputMode="numeric"
                    maxLength={30}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="가격 미입력"
                />
            </label>
            <p className="text-xs text-slate-500">아이템 #{item.id}</p>
            {item.searchable ? (
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-sm"
                        disabled={market.isFetching}
                        onClick={() => void market.refetch()}
                    >
                        {market.isFetching ? "조회 중…" : "시세 조회"}
                    </button>
                    <Link
                        href={getAuctionSearchPath(item.name)}
                        className="link text-sm"
                    >
                        경매장 보기
                    </Link>
                    {valid && (
                        <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                                onChange(String(market.data.minPrice))
                            }
                        >
                            조회 가격 적용
                        </button>
                    )}
                </div>
            ) : (
                <p className="text-sm text-slate-600">
                    경매 검색 미지원 · 직접 가격 입력
                </p>
            )}
            {market.error && (
                <p role="alert" className="text-sm text-red-700">
                    시세를 불러오지 못했습니다. 직접 입력하거나 다시 조회하세요.
                </p>
            )}
            {market.data && (
                <p className="text-sm text-slate-600">
                    {valid
                        ? `조회 최저가 ${market.data.minPrice.toLocaleString("ko-KR")} Gold`
                        : "매물 없음 또는 가격 확인 불가"}{" "}
                    ·{" "}
                    {market.data.isComplete ? "전체 조회" : "일부 매물만 조회"}{" "}
                    · 수집 시각{" "}
                    {market.data.fetchedAt
                        ? new Date(market.data.fetchedAt).toLocaleString(
                              "ko-KR"
                          )
                        : "확인 불가"}
                </p>
            )}
        </div>
    );
}
