"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    canPolish,
    createEchoPool,
    ECHO_CAP,
    echoAction,
    echoEffect,
    type EchoExpectation,
    type EchoItem,
    type EchoReference,
    type EchoSession,
    echoStrategies,
    emptyEchoSession,
    existingEchoStrategy,
    runEchoChunk,
} from "@/lib/echostone";
import {
    type EchoGrowth,
    type EchoUpgradeData,
    newEchoGrowth,
} from "@/lib/echostone-upgrade";
import {
    type EchoConfig,
    ECHOSTONE_PATH,
    parseEchoConfig,
} from "@/lib/echostone-url";
import { parseGold } from "@/lib/reforge";

import styles from "./echostone-styles";
import EchostoneUpgrade from "./echostone-upgrade";

const number = (n: number) =>
    !Number.isFinite(n)
        ? "도달 불가"
        : n > Number.MAX_SAFE_INTEGER
          ? `약 ${n.toExponential(4)}`
          : n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const priceError = (s: string) => s !== "" && parseGold(s) === null;
const labelClass = "flex min-w-0 flex-col gap-2 text-sm font-medium";
const errorText = (e: unknown) =>
    e instanceof Error ? e.message : "계산을 완료하지 못했습니다.";
type CalculatorReference = EchoReference & { upgrades: EchoUpgradeData[] };
type PriceId = keyof EchoConfig["prices"];

const targetMaximum = (data: EchoReference, config: EchoConfig) =>
    Math.max(
        ...data.colors
            .find(c => c.id === config.color)!
            .options.filter(o => o.name === config.target.name)
            .map(o => o.max)
    );
const clampTarget = (data: EchoReference, config: EchoConfig): EchoConfig => ({
    ...config,
    target: {
        ...config.target,
        level: Math.min(config.target.level, targetMaximum(data, config)),
    },
});

export default function EchostoneCalculator({
    data,
}: {
    data: CalculatorReference;
}) {
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
                    데이터가 업데이트되었습니다. 보유한 옵션을 다시 입력하세요.
                </p>
            )}
            <Calculator
                key={params.toString()}
                data={data}
                initial={{
                    ...parsed.config,
                    grade: 30,
                    agent:
                        parsed.config.agent === 5000078
                            ? 53942
                            : parsed.config.agent,
                }}
                invalid={!!parsed.error}
            />
        </>
    );
}
type CalculatorProps = {
    data: CalculatorReference;
    initial: EchoConfig;
    invalid: boolean;
};
type CalculatorView = ReturnType<typeof useCalculator>;

function useCalculatorState({ data, initial }: CalculatorProps) {
    const [config, setConfig] = useState(() => clampTarget(data, initial));
    const workflow = useWorkflow();
    const [session, setSession] = useState(() =>
        emptyEchoSession(initial.current)
    );
    const lifecycle = useEchoLifecycle();
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState("");
    const [failure, setFailure] = useState("");
    const [cap, setCap] = useState(String(initial.cap));
    const update = (patch: Partial<EchoConfig>) =>
        setConfig(c => clampTarget(data, { ...c, ...patch }));
    const reset = () => {
        setSession(emptyEchoSession());
        setMessage("");
        setFailure("");
    };
    const changeStone = (patch: Partial<EchoConfig>) => {
        if (patch.color === config.color) return;
        update({ ...patch, current: null });
        reset();
    };
    return {
        config,
        setConfig,
        ...workflow,
        session,
        setSession,
        ...lifecycle,
        running,
        setRunning,
        message,
        setMessage,
        failure,
        setFailure,
        cap,
        setCap,
        update,
        reset,
        changeStone,
    };
}

function useEchoLifecycle() {
    const [ready, setReady] = useState(false);
    const cancelled = useRef(false);
    useEffect(() => {
        setReady(true);
        return () => {
            cancelled.current = true;
        };
    }, []);
    return { ready, cancelled };
}

function useWorkflow() {
    const [mode, setMode] = useState<"awakening" | "upgrade">("awakening");
    const [growth, setGrowth] = useState<EchoGrowth | null>(null);
    const [growthColor, setGrowthColor] = useState(1);
    return { mode, setMode, growth, setGrowth, growthColor, setGrowthColor };
}

function useEchoPools(data: EchoReference, config: EchoConfig) {
    const agents = useMemo(
        () => data.agents.filter(a => a.id !== 5000078),
        [data]
    );
    const normal = useMemo(
        () =>
            createEchoPool(
                data,
                config.color,
                config.grade,
                data.polishingAgent
            ),
        [data, config.color, config.grade]
    );
    const models = useMemo(
        () =>
            agents.map(agent => {
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
            }),
        [data, agents, config.color, config.grade]
    );
    const selected = models.find(m => m.agent.id === config.agent)!;
    return { agents, normal, selected, pool: selected.pool, polish: normal };
}

function useEchoModels(
    data: EchoReference,
    config: EchoConfig,
    session: EchoSession
) {
    const pools = useEchoPools(data, config);
    const { agents, normal, pool, polish } = pools;
    // Only agent purchases are included in the displayed Gold total.
    const awakeningPrice = config.prices[config.agent];
    const costs = useMemo(
        () => ({ awakening: parseGold(awakeningPrice), stone: BigInt(0) }),
        [awakeningPrice]
    );
    const result = useMemo(
        () =>
            pool ? echoStrategies(pool, config.target, costs, polish) : null,
        [pool, config.target, costs, polish]
    );
    const current = session.current;
    const restart = config.policy === "awakening" ? result?.A : result?.B;
    const existing = useMemo(
        () =>
            existingEchoStrategy(
                normal,
                config.target,
                current,
                costs,
                polish,
                restart ?? null
            ),
        [normal, config.target, current, costs, polish, restart]
    );
    return {
        ...pools,
        costs,
        result,
        existing,
        current,
        color: data.colors.find(c => c.id === config.color)!,
        currentOption: normal.options.find(o => o.id === current?.id),
        currentEligible: canPolish(normal, current),
        invalidCosts: agents.some(a =>
            priceError(config.prices[a.id as PriceId])
        ),
        probability: result?.combined ?? 0,
    };
}

type EchoExecution = ReturnType<typeof useCalculatorState> &
    ReturnType<typeof useEchoModels>;
async function runAutomaticEcho(view: EchoExecution) {
    const {
        pool,
        config,
        polish,
        costs,
        cap,
        cancelled,
        setSession,
        setMessage,
    } = view;
    let next = view.session,
        completed = 0,
        spent = next.spent;
    while (true) {
        const batch = runEchoChunk(
            next,
            pool!,
            config.target,
            polish,
            { policy: config.policy, cap: Number(cap), budget: null, costs },
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
}

async function runEcho(
    view: EchoExecution,
    action: "awakening" | "polishing" | "auto"
) {
    const {
        normal,
        pool,
        session,
        costs,
        polish,
        cancelled,
        setSession,
        setFailure,
        setMessage,
        setRunning,
    } = view;
    const actionPool = action === "polishing" ? normal : pool;
    if (!actionPool) return;
    setFailure("");
    setMessage("");
    try {
        if (action !== "auto") {
            setSession(echoAction(session, actionPool, action, costs, polish));
            return;
        }
        cancelled.current = false;
        setRunning(true);
        await runAutomaticEcho(view);
    } catch (e) {
        setFailure(errorText(e));
    } finally {
        setRunning(false);
    }
}

function useCalculator(props: CalculatorProps) {
    const state = useCalculatorState(props);
    const model = useEchoModels(props.data, state.config, state.session);
    const execution = { ...state, ...model };
    return {
        ...props,
        ...execution,
        upgradeData: props.data.upgrades.find(
            d => d.color === state.growthColor
        )!,
        invalidCap:
            !/^[1-9]\d{0,6}$/.test(state.cap) || Number(state.cap) > ECHO_CAP,
        blocked:
            !state.ready ||
            props.invalid ||
            state.running ||
            model.invalidCosts,
        run: (action: "awakening" | "polishing" | "auto") =>
            runEcho(execution, action),
    };
}

function Calculator(props: CalculatorProps) {
    const view = useCalculator(props);
    const {
        mode,
        growth,
        data,
        upgradeData,
        growthColor,
        setGrowthColor,
        setGrowth,
        setRunning,
    } = view;
    return (
        <div className={styles.calculator}>
            <ModeSwitch {...view} />
            {mode === "upgrade" && growth ? (
                <EchostoneUpgrade
                    colors={data.colors}
                    data={upgradeData}
                    value={growth}
                    onChange={setGrowth}
                    onColor={id => {
                        if (id === growthColor) return;
                        setGrowthColor(id);
                        setGrowth(
                            newEchoGrowth(
                                data.upgrades.find(d => d.color === id)!
                            )
                        );
                    }}
                    onBusy={setRunning}
                />
            ) : (
                <>
                    <div className={styles.workspace}>
                        <AwakeningWindow {...view} />
                        <AwakeningTarget {...view} />
                    </div>
                    <CostSettings {...view} />
                </>
            )}
        </div>
    );
}
function ModeSwitch(view: CalculatorView) {
    const {
        invalid,
        mode,
        setMode,
        growth,
        setGrowth,
        ready,
        running,
        upgradeData,
    } = view;
    return (
        <div
            className={styles.modeSwitch}
            role="group"
            aria-label="에코스톤 작업"
        >
            <button
                aria-pressed={mode === "upgrade"}
                disabled={!ready || running || invalid}
                onClick={() => {
                    if (!growth) {
                        setGrowth(newEchoGrowth(upgradeData));
                    }
                    setMode("upgrade");
                }}
            >
                승급
            </button>
            <button
                aria-pressed={mode === "awakening"}
                disabled={!ready || running || invalid}
                onClick={() => setMode("awakening")}
            >
                각성·연마
            </button>
        </div>
    );
}

function AwakeningColors(view: CalculatorView) {
    const { data, config, ready, running, changeStone } = view;
    return (
        <fieldset disabled={!ready || running} className={styles.stoneSettings}>
            <legend className="sr-only">에코스톤 선택</legend>
            <div className={styles.colors} role="group" aria-label="색상">
                {data.colors.map(c => (
                    <button
                        type="button"
                        key={c.id}
                        aria-label={c.name}
                        aria-pressed={config.color === c.id}
                        onClick={() =>
                            changeStone({
                                color: c.id,
                                target: {
                                    name: c.options[0].name,
                                    level: 1,
                                },
                            })
                        }
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

function AwakeningMaterials(view: CalculatorView) {
    const { config, color, selected } = view;
    return (
        <div className={styles.materials}>
            <div>
                <div className={styles.slot}>
                    <Image
                        src={`/images/echostone/${53933 + color.id}.png`}
                        alt={color.name}
                        width={56}
                        height={56}
                        unoptimized
                    />
                </div>
                <p>{color.name}</p>
            </div>
            <span className={styles.plus} aria-hidden="true">
                +
            </span>
            <div>
                <div className={`${styles.slot} ${styles.agentSlot}`}>
                    <Image
                        src={`/images/echostone/${config.agent}.png`}
                        alt={selected.agent.name}
                        width={32}
                        height={64}
                        unoptimized
                    />
                </div>
                <p>각성제</p>
            </div>
        </div>
    );
}

function AgentSelect(view: CalculatorView) {
    const { config, ready, running, update, agents } = view;
    return (
        <label className={styles.agentSelect}>
            <span className="sr-only">각성제</span>
            <select
                className="select w-full"
                disabled={!ready || running}
                value={config.agent}
                onChange={e =>
                    update({
                        agent: Number(e.target.value) as EchoConfig["agent"],
                    })
                }
            >
                {agents.map(a => (
                    <option key={a.id} value={a.id}>
                        {a.name}
                        {!a.searchable ? " (거래 불가)" : ""}
                    </option>
                ))}
            </select>
        </label>
    );
}

function AwakeningAbility(view: CalculatorView) {
    const { config, color, current, currentOption } = view;
    return (
        <div className={styles.result}>
            <h3>현재 각성 능력</h3>
            <div
                className={styles.ability}
                data-testid="echo-current"
                aria-live="polite"
                aria-atomic="true"
            >
                <p>
                    {color.name} <strong>{config.grade}등급</strong>
                </p>
                {current && currentOption ? (
                    <>
                        <p className={styles.abilityName}>
                            {currentOption.name}{" "}
                            <span>
                                ({current.level}/{currentOption.max} 레벨)
                            </span>
                        </p>
                        <p className={styles.effect}>
                            {echoEffect(currentOption, current.level)}
                        </p>
                    </>
                ) : (
                    <p className={styles.empty}>
                        각성하면 새로운 능력이 부여됩니다.
                    </p>
                )}
            </div>
        </div>
    );
}

function AwakeningNotice(view: CalculatorView) {
    const { current, currentEligible } = view;
    return (
        <div className={styles.gameNotice}>
            <p>
                필요 AP <strong>25</strong>
            </p>
            <p>
                {current?.polishingUsed
                    ? "레벨 재부여 사용 완료"
                    : currentEligible
                      ? "레벨 재부여 가능"
                      : current
                        ? "최대 레벨: 연마 불가"
                        : "각성 후 레벨을 한 번 재부여할 수 있습니다."}
            </p>
        </div>
    );
}

function AwakeningActions(view: CalculatorView) {
    const { pool, blocked, currentEligible, run } = view;
    return (
        <div className={styles.actions}>
            <button
                className={styles.gameButton}
                disabled={blocked || !currentEligible}
                onClick={() => void run("polishing")}
            >
                <Image
                    src="/images/echostone/5040961.png"
                    alt=""
                    width={24}
                    height={24}
                    unoptimized
                />
                레벨 재부여
            </button>
            <button
                className={styles.gameButton}
                disabled={blocked || !pool}
                onClick={() => void run("awakening")}
            >
                각성
            </button>
        </div>
    );
}

function CurrentOptionSelect(view: CalculatorView) {
    const { setSession, setMessage, normal, current } = view;
    return (
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
                setMessage("");
            }}
        >
            <option value="">없음</option>
            {normal.options.map(o => (
                <option key={o.id} value={o.id}>
                    {o.name}
                    {normal.options.some(
                        other => other.id !== o.id && other.name === o.name
                    )
                        ? ` (최대 ${o.max} 레벨 · ${o.id})`
                        : ""}
                </option>
            ))}
        </select>
    );
}

function CurrentLevelFields(view: CalculatorView) {
    return (
        <div className="flex flex-wrap items-center gap-4">
            <CurrentLevel {...view} />
            <PolishingUsed {...view} />
        </div>
    );
}

function CurrentLevel(view: CalculatorView) {
    const { setSession, setMessage, current, currentOption } = view;
    return (
        <label className={labelClass}>
            현재 레벨
            <select
                className="select"
                disabled={!current}
                value={current?.level ?? 1}
                onChange={e => {
                    setSession(
                        emptyEchoSession({
                            ...current!,
                            level: Number(e.target.value),
                        })
                    );
                    setMessage("");
                }}
            >
                {Array.from(
                    {
                        length: currentOption?.max ?? 1,
                    },
                    (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {i + 1}
                        </option>
                    )
                )}
            </select>
        </label>
    );
}

function PolishingUsed(view: CalculatorView) {
    const { setSession, setMessage, current } = view;
    return (
        <label className="flex items-center gap-2 text-sm">
            <input
                className="checkbox checkbox-sm"
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
                    setMessage("");
                }}
            />
            이미 연마 사용
        </label>
    );
}

function ExistingStone(view: CalculatorView) {
    const { ready, running } = view;
    return (
        <details className={styles.existing}>
            <summary>보유한 에코스톤 입력</summary>
            <fieldset disabled={!ready || running} className="mt-3 space-y-3">
                <label className={labelClass}>
                    현재 옵션
                    <CurrentOptionSelect {...view} />
                </label>
                <CurrentLevelFields {...view} />
                <p className="text-xs">
                    직접 수정하면 사용 기록이 초기화됩니다.
                </p>
            </fieldset>
        </details>
    );
}

function AwakeningWindow(view: CalculatorView) {
    const {} = view;
    return (
        <section className={styles.window} aria-labelledby="echo-window-title">
            <h2 id="echo-window-title" className={styles.windowTitle}>
                에코스톤 각성
            </h2>
            <p className={styles.hint}>
                30등급 에코스톤과 각성제를 선택해 주세요.
            </p>
            <AwakeningColors {...view} />
            <AwakeningMaterials {...view} />
            <AgentSelect {...view} />
            <AwakeningAbility {...view} />
            <AwakeningNotice {...view} />
            <AwakeningActions {...view} />
            <p className={styles.hint}>
                레벨 재부여는 연마석 1개를 사용하며, 레벨이 낮아지지 않습니다.
            </p>
            <ExistingStone {...view} />
        </section>
    );
}

function TargetOption(view: CalculatorView) {
    const { config, update, color } = view;
    return (
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
                {[...new Set(color.options.map(o => o.name))].map(name => (
                    <option key={name}>{name}</option>
                ))}
            </select>
        </label>
    );
}

function TargetLevel(view: CalculatorView) {
    const { data, config, update } = view;
    return (
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
                {Array.from(
                    {
                        length: targetMaximum(data, config),
                    },
                    (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {i + 1}레벨
                        </option>
                    )
                )}
            </select>
        </label>
    );
}

function TargetFields(view: CalculatorView) {
    const { config, ready, running, update } = view;
    return (
        <fieldset disabled={!ready || running} className="space-y-4">
            <TargetOption {...view} />
            <TargetLevel {...view} />
            <label className="flex items-start gap-2 text-sm">
                <input
                    className="checkbox checkbox-sm mt-0.5"
                    type="checkbox"
                    checked={config.policy === "polishing"}
                    onChange={e =>
                        update({
                            policy: e.target.checked
                                ? "polishing"
                                : "awakening",
                        })
                    }
                />
                목표 옵션이 나오면 연마도 사용
            </label>
        </fieldset>
    );
}

function UsageCounts(view: CalculatorView) {
    const { session } = view;
    return (
        <dl className={styles.counts}>
            <div>
                <dt>각성제</dt>
                <dd>
                    {number(session.awakenings)}
                    <small>개</small>
                </dd>
            </div>
            <div>
                <dt>연마석</dt>
                <dd>
                    {number(session.stones)}
                    <small>개</small>
                </dd>
            </div>
            <div>
                <dt>AP</dt>
                <dd>{number(session.awakenings * 25)}</dd>
            </div>
        </dl>
    );
}

function UsageSummary(view: CalculatorView) {
    const { session, ready, running, reset } = view;
    return (
        <div className={styles.usage}>
            <div className="flex items-center justify-between gap-2">
                <h3>각성·연마에 사용한 재료</h3>
                <button
                    className="btn btn-ghost btn-xs"
                    disabled={!ready || running}
                    onClick={reset}
                >
                    기록 초기화
                </button>
            </div>
            <UsageCounts {...view} />
            <p data-testid="echo-totals" className={styles.total}>
                각성 {number(session.awakenings)}회 · 연마{" "}
                {number(session.stones)}회 · {number(session.awakenings * 25)}{" "}
                AP · 각성제 {session.spent.toLocaleString("ko-KR")} Gold
                {session.unknownCosts > 0 &&
                    ` + 가격 미입력 ${session.unknownCosts}행동`}
            </p>
        </div>
    );
}

function AwakeningHistory(view: CalculatorView) {
    const { session, normal } = view;
    return (
        <details className={styles.history}>
            <summary>최근 시뮬레이션 기록</summary>
            <ol className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                {[...session.history].reverse().map(row => (
                    <li key={row.number}>
                        #{row.number}{" "}
                        {row.action === "awakening" ? "각성" : "연마"} ·{" "}
                        {normal.options.find(o => o.id === row.state.id)?.name}{" "}
                        {row.state.level}레벨
                    </li>
                ))}
            </ol>
            {session.actions === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                    아직 사용한 재료가 없습니다.
                </p>
            )}
        </details>
    );
}

function AwakeningTarget(view: CalculatorView) {
    return (
        <section
            className={styles.targetPanel}
            aria-labelledby="echo-target-title"
        >
            <h2 id="echo-target-title">원하는 옵션까지 각성하기</h2>
            <p className="text-sm text-slate-500">
                목표를 정하면 달성할 때까지 반복합니다.
            </p>
            <TargetFields {...view} />
            <TargetErrors {...view} />
            <AutomaticControls {...view} />
            <UsageSummary {...view} />
            <AwakeningHistory {...view} />
        </section>
    );
}

function TargetErrors(view: CalculatorView) {
    const { selected, result, probability, invalidCosts, invalidCap } = view;
    return (
        <>
            {selected.error && (
                <p role="alert" className="text-sm text-red-700">
                    {selected.error}
                </p>
            )}
            {result && probability === 0 && (
                <p role="alert" className="text-sm text-amber-800">
                    이 설정에서는 달성 불가능한 목표입니다. 등급과 목표 레벨을
                    확인하세요.
                </p>
            )}
            {invalidCosts && (
                <p role="alert" className="text-sm text-red-700">
                    비용 설정을 확인하세요. 가격과 예산은 0 이상의 정수로 입력할
                    수 있습니다.
                </p>
            )}
            {invalidCap && (
                <p role="alert">최대 횟수는 1~1,000,000 정수로 입력하세요.</p>
            )}
        </>
    );
}

function AutomaticControls(view: CalculatorView) {
    const {
        running,
        message,
        failure,
        cancelled,
        pool,
        invalidCap,
        blocked,
        run,
    } = view;
    return (
        <>
            <button
                className={styles.autoButton}
                disabled={blocked || !pool || invalidCap}
                onClick={() => void run("auto")}
            >
                목표까지 자동 실행
            </button>
            {running && (
                <button
                    className="btn w-full"
                    onClick={() => {
                        cancelled.current = true;
                    }}
                >
                    중지
                </button>
            )}
            <div role="status" className={styles.status}>
                {running ? "자동 실행 중…" : message}
            </div>
            {failure && (
                <p role="alert" className="text-sm text-red-700">
                    {failure}
                </p>
            )}
        </>
    );
}

function CostFields(view: CalculatorView) {
    const { config, setConfig, ready, running, cap, setCap, agents } = view;
    return (
        <fieldset disabled={!ready || running} className="space-y-4">
            <legend className="sr-only">각성제 가격</legend>
            <div className="grid gap-4 sm:grid-cols-2">
                {agents.map(item => (
                    <PriceField
                        key={item.id}
                        item={item}
                        value={config.prices[item.id as PriceId]}
                        onChange={value =>
                            setConfig(c => ({
                                ...c,
                                prices: {
                                    ...c.prices,
                                    [item.id]: value,
                                },
                            }))
                        }
                    />
                ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                <label className={labelClass}>
                    자동 실행 최대 행동 횟수
                    <input
                        className="input w-full"
                        inputMode="numeric"
                        maxLength={7}
                        value={cap}
                        onChange={e => setCap(e.target.value)}
                    />
                </label>
            </div>
        </fieldset>
    );
}

function CostSettings(view: CalculatorView) {
    const { result, existing } = view;
    return (
        <details className={styles.costSettings}>
            <summary>비용 설정과 예상 비용</summary>
            <div className="mt-5 space-y-5">
                <p className="text-sm text-slate-500">
                    경매장 최저가를 자동으로 불러오며 직접 수정할 수 있습니다.
                    비용은 각성제만 집계하고 연마석·승급 비용은 제외합니다.
                </p>
                <CostFields {...view} />
                <div className="grid gap-3 sm:grid-cols-3">
                    <Expectation
                        title="각성만 사용"
                        value={result?.A ?? null}
                    />
                    <Expectation
                        title="각성과 연마 함께 사용"
                        value={result?.B ?? null}
                    />
                    <Expectation title="현재 옵션에서 시작" value={existing} />
                </div>
                <p className="text-xs text-slate-500">
                    입력 가격 기준의 평균 비용이며 성공을 보장하지 않습니다.
                    목표 달성 또는 최대 횟수에서 자동 실행이 멈춥니다.
                </p>
            </div>
        </details>
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
                            : `각성제 약 ${number(value.gold)} Gold`}
                    </p>
                </>
            ) : (
                <p>각성제 설정의 확률 자료가 없어 계산할 수 없습니다.</p>
            )}
        </div>
    );
}
type PriceFieldProps = {
    item: EchoItem;
    value: string;
    onChange: (value: string) => void;
};

function useMarketPrice({ item, value, onChange }: PriceFieldProps) {
    const priceRevision = useRef(value !== "" ? 1 : 0);
    const market = useQuery({
        queryKey: ["echostone-price", item.id],
        queryFn: ({ signal }) => fetchItemPriceSummary(item.name, signal),
        enabled: item.searchable,
        retry: false,
        refetchOnWindowFocus: false,
    });
    const valid =
        market.data &&
        market.data.availableQuantity > 0 &&
        Number.isSafeInteger(market.data.minPrice);
    useEffect(() => {
        if (
            priceRevision.current === 0 &&
            value === "" &&
            valid &&
            !market.isFetching
        ) {
            priceRevision.current++;
            onChange(String(market.data.minPrice));
        }
    }, [market.data, market.isFetching, onChange, valid, value]);
    async function refreshPrice() {
        const revision = ++priceRevision.current;
        const result = await market.refetch();
        if (
            revision === priceRevision.current &&
            result.isSuccess &&
            result.data.availableQuantity > 0 &&
            Number.isSafeInteger(result.data.minPrice)
        ) {
            onChange(String(result.data.minPrice));
        }
    }
    return { market, valid, priceRevision, refreshPrice };
}

type MarketPrice = ReturnType<typeof useMarketPrice>;
function PriceField(props: PriceFieldProps) {
    const { item, value, onChange } = props;
    const price = useMarketPrice(props);
    const { market, priceRevision } = price;
    const label = `${item.name}${item.description.includes("거래불가") ? " (거래 불가)" : !item.searchable ? " (경매 검색 미지원)" : ""}`;
    return (
        <div className="space-y-2 rounded-lg border border-slate-100 p-3">
            <label className={labelClass}>
                {label} 1개 가격 (Gold)
                <input
                    className="input w-full"
                    inputMode="numeric"
                    maxLength={30}
                    value={value}
                    onFocus={() => {
                        priceRevision.current++;
                    }}
                    onChange={e => {
                        priceRevision.current++;
                        onChange(e.target.value);
                    }}
                    placeholder={
                        market.isFetching ? "시세 조회 중…" : "가격 미입력"
                    }
                />
            </label>
            <PriceActions item={item} price={price} />
            <PriceResult {...price} />
        </div>
    );
}

function PriceActions({ item, price }: { item: EchoItem; price: MarketPrice }) {
    const { market, refreshPrice } = price;
    return (
        <>
            {item.searchable ? (
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-sm"
                        disabled={market.isFetching}
                        onClick={() => void refreshPrice()}
                    >
                        {market.isFetching ? "조회 중…" : "시세 조회"}
                    </button>
                    <Link
                        href={getAuctionSearchPath(item.name)}
                        className="link text-sm"
                    >
                        경매장 보기
                    </Link>
                </div>
            ) : (
                <p className="text-sm text-slate-600">
                    경매 검색 미지원 · 직접 가격 입력
                </p>
            )}
        </>
    );
}

function PriceResult({ market, valid }: MarketPrice) {
    return (
        <>
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
        </>
    );
}
