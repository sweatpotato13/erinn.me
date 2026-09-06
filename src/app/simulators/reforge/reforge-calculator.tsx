"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import {
    emptySession,
    EQUIPMENT_TYPES,
    parseGold,
    raceLabel,
    type ReforgeEquipment,
    type ReforgeModel,
    type ReforgeTool,
    runReforgeChunk,
    successWithin,
    targetError,
    targetProbability,
} from "@/lib/reforge";
import {
    parseReforgeConfig,
    REFORGE_PATH,
    type ReforgeConfig,
    reforgeConfigPath,
} from "@/lib/reforge-url";

const number = (value: number) =>
    Number.isFinite(value)
        ? value > Number.MAX_SAFE_INTEGER
            ? `약 ${value.toExponential(4)}`
            : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
        : "도달 불가";
const percent = (p: number) =>
    p > 0 && p < 0.000001
        ? `${(p * 100).toExponential(4)}%`
        : `${(p * 100).toLocaleString("ko-KR", { maximumFractionDigits: 6 })}%`;

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok)
        throw new Error(
            response.status === 404
                ? "삭제되었거나 지원하지 않는 장비/도구입니다. 다시 선택하세요."
                : "데이터를 불러오지 못했습니다. 다시 시도하세요."
        );
    return response.json() as Promise<T>;
}

export default function ReforgeCalculator({
    version,
    tools,
}: {
    version: string;
    tools: ReforgeTool[];
}) {
    const params = useSearchParams();
    const { config, error, changedVersion } = parseReforgeConfig(
        new URLSearchParams(params.toString()),
        version
    );
    const [manualPrices, setManualPrices] = useState<Record<number, string>>(
        config.price === "" ? {} : { [config.toolId]: config.price }
    );
    const [ready, setReady] = useState(false);
    useEffect(() => setReady(true), []);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const update = (patch: Partial<ReforgeConfig>) => {
        window.history.replaceState(
            null,
            "",
            reforgeConfigPath({ ...config, ...patch, version })
        );
    };
    const results = useQuery({
        queryKey: ["reforge-equipment", query],
        enabled: query.length > 0,
        queryFn: ({ signal }) =>
            getJson<{ equipment: ReforgeEquipment[] }>(
                `/api/reforge?q=${encodeURIComponent(query)}`,
                signal
            ),
        staleTime: Infinity,
    });
    const models = useQuery({
        queryKey: ["reforge-models", version, config.equipmentId],
        enabled: !error && config.equipmentId !== null,
        queryFn: ({ signal }) =>
            Promise.all(
                tools
                    .filter(t => !t.unsupported)
                    .map(t =>
                        getJson<ReforgeModel>(
                            `/api/reforge?e=${config.equipmentId}&t=${t.id}`,
                            signal
                        )
                    )
            ),
        staleTime: Infinity,
        retry: false,
    });
    return (
        <div className="space-y-5">
            {error && (
                <p role="alert" className="text-red-700">
                    {error}{" "}
                    <Link href={REFORGE_PATH} className="link">
                        기본 설정
                    </Link>
                </p>
            )}
            {changedVersion && (
                <p role="status" className="text-sm text-slate-600">
                    데이터가 업데이트되어 현재 기준으로 계산합니다.
                </p>
            )}
            <form
                onSubmit={e => {
                    e.preventDefault();
                    setQuery(search.trim());
                }}
                className="flex items-end gap-2"
            >
                <label className="min-w-0 flex-1 text-sm font-medium">
                    장비 이름 검색
                    <input
                        className="input mt-2 w-full"
                        value={search}
                        disabled={!ready}
                        maxLength={100}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="예: 켈틱 드루이드 스태프"
                    />
                </label>
                <button className="btn" type="submit" disabled={!ready}>
                    장비 검색
                </button>
            </form>
            {results.isFetching && <p role="status">장비 검색 중…</p>}
            {results.error && <p role="alert">{results.error.message}</p>}
            {query && results.data && (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                    {!results.data.equipment.length && (
                        <p role="status" className="p-3">
                            검색 결과가 없습니다.
                        </p>
                    )}
                    <ul>
                        {results.data.equipment.map(e => (
                            <li key={e.id}>
                                <button
                                    type="button"
                                    className="w-full p-3 text-left hover:bg-slate-100 disabled:opacity-50"
                                    disabled={Boolean(e.unsupported)}
                                    onClick={() => {
                                        update({
                                            equipmentId: e.id,
                                            targets: [],
                                        });
                                        setSearch(e.name);
                                        setQuery("");
                                    }}
                                >
                                    <span className="font-medium break-words">
                                        {e.name}
                                    </span>{" "}
                                    <span className="ml-2 text-sm text-slate-500">
                                        {EQUIPMENT_TYPES[e.type] ?? e.type} ·{" "}
                                        {raceLabel(e.races)}
                                        {e.unsupported && ` · ${e.unsupported}`}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {models.isFetching && <p role="status">장비 불러오는 중…</p>}
            {models.error && <p role="alert">{models.error.message}</p>}
            {!error &&
                !tools.some(t => t.id === config.toolId && !t.unsupported) && (
                    <p role="alert">
                        지원하지 않는 세공 도구입니다.{" "}
                        <Link href={REFORGE_PATH} className="link">
                            기본 설정
                        </Link>
                    </p>
                )}
            {!error &&
                config.equipmentId !== null &&
                models.data &&
                tools.some(t => t.id === config.toolId && !t.unsupported) && (
                    <CalculatorSession
                        key={`${version}/${config.equipmentId}`}
                        models={models.data}
                        config={config}
                        update={update}
                        manualPrices={manualPrices}
                        setPrice={(id, price) =>
                            setManualPrices(previous => ({
                                ...previous,
                                [id]: price,
                            }))
                        }
                    />
                )}
        </div>
    );
}

function CalculatorSession({
    models,
    config,
    update,
    manualPrices,
    setPrice,
}: {
    models: ReforgeModel[];
    config: ReforgeConfig;
    update: (patch: Partial<ReforgeConfig>) => void;
    manualPrices: Record<number, string>;
    setPrice: (id: number, price: string) => void;
}) {
    const model = models.find(m => m.tool.id === config.toolId) ?? models[0];
    const targets = config.targets;
    const markets = useQueries({
        queries: models.map(({ tool }) => ({
            queryKey: ["reforge-tool-price", tool.name],
            queryFn: ({ signal }: { signal: AbortSignal }) =>
                fetchItemPriceSummary(tool.name, signal),
            staleTime: 60_000,
            retry: false,
            refetchOnWindowFocus: false,
        })),
    });
    const prices: Record<number, string> = Object.fromEntries(
        models.map((m, i) => {
            const summary = markets[i].data;
            const marketPrice =
                summary &&
                summary.availableQuantity > 0 &&
                Number.isSafeInteger(summary.minPrice) &&
                summary.minPrice > 0
                    ? String(summary.minPrice)
                    : "";
            return [m.tool.id, manualPrices[m.tool.id] ?? marketPrice];
        })
    );
    const [capText, setCapText] = useState(String(config.cap));
    const [session, setSession] = useState(emptySession);
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [lastModel, setLastModel] = useState(model);
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelled = useRef(false);
    const cap = Number(capText);
    const invalidCap =
        !/^[1-9]\d*$/.test(capText) ||
        !Number.isSafeInteger(cap) ||
        cap > 1_000_000;
    const price = parseGold(prices[model.tool.id] ?? "");
    const error = targets.length ? targetError(model.pool, targets) : null;
    const p = targetProbability(
        model.pool,
        model.tool.lines,
        targets,
        config.mode
    );
    const last = session.history.at(-1);
    useEffect(() => setCapText(String(config.cap)), [config.cap]);
    useEffect(
        () => () => {
            cancelled.current = true;
            if (timer.current !== null) clearTimeout(timer.current);
        },
        []
    );
    const stop = () => {
        cancelled.current = true;
        if (timer.current !== null) clearTimeout(timer.current);
        setRunning(false);
        setStatus("중지했습니다.");
    };
    const start = (selected: ReforgeModel) => {
        const selectedPrice = parseGold(prices[selected.tool.id] ?? "");
        const selectedError = targets.length
            ? targetError(selected.pool, targets)
            : null;
        if (
            running ||
            invalidCap ||
            selectedError ||
            ((prices[selected.tool.id] ?? "") !== "" && selectedPrice === null)
        )
            return;
        update({
            toolId: selected.tool.id,
            price: manualPrices[selected.tool.id] ?? "",
            cap,
        });
        if (
            targets.length &&
            !targetProbability(
                selected.pool,
                selected.tool.lines,
                targets,
                config.mode
            )
        ) {
            setStatus("이 도구로는 자동 멈춤 조건을 달성할 수 없습니다.");
            return;
        }
        cancelled.current = false;
        setRunning(true);
        setStatus("세공 중…");
        let current = session,
            completed = 0,
            spent = BigInt(0);
        const initialCount = counts[selected.tool.id] ?? 0;
        const chunk = () => {
            if (cancelled.current) return;
            try {
                const result = runReforgeChunk(
                    current,
                    selected,
                    targets,
                    config.mode,
                    {
                        maxAttempts: cap,
                        price: selectedPrice,
                        budget: null,
                        stopOnHit: targets.length > 0,
                    },
                    completed,
                    spent,
                    () => cancelled.current
                );
                current = result.session;
                completed = result.completed;
                spent = result.spent;
                setSession(current);
                setLastModel(selected);
                setCounts(previous => ({
                    ...previous,
                    [selected.tool.id]: initialCount + completed,
                }));
                if (result.reason) {
                    setStatus(
                        result.reason === "목표 달성"
                            ? "자동 멈춤 · 목표 달성"
                            : `${number(completed)}회 완료`
                    );
                    setRunning(false);
                } else timer.current = setTimeout(chunk, 0);
            } catch (e) {
                setStatus(
                    e instanceof Error ? e.message : "실행을 중단했습니다."
                );
                setRunning(false);
            }
        };
        timer.current = setTimeout(chunk, 0);
    };
    const toolCard = (m: ReforgeModel) => {
        const market = markets[models.indexOf(m)];
        const automatic = manualPrices[m.tool.id] === undefined;
        const text = prices[m.tool.id] ?? "";
        const invalidPrice = text !== "" && parseGold(text) === null;
        return (
            <div key={m.tool.id} className="min-w-0">
                <button
                    type="button"
                    aria-label={`${m.tool.name} 사용`}
                    aria-pressed={model.tool.id === m.tool.id}
                    disabled={
                        running || invalidCap || invalidPrice || Boolean(error)
                    }
                    onClick={() => start(m)}
                    className={`flex w-full flex-col items-center rounded-xl border bg-white px-2 py-4 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 ${model.tool.id === m.tool.id ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200"}`}
                >
                    <Image
                        src={`/icons/reforge/${m.tool.itemId}.png`}
                        alt=""
                        width={64}
                        height={80}
                        unoptimized
                        className="mb-3 h-20 w-16 object-contain [image-rendering:pixelated]"
                    />
                    <span className="text-center text-xs leading-5 font-medium break-keep sm:text-sm">
                        {m.tool.name}
                    </span>
                    {m.tool.legacy && (
                        <span className="text-xs text-slate-500">
                            획득 불가
                        </span>
                    )}
                    <span
                        className="mt-1 text-sm text-slate-500"
                        data-testid={`tool-count-${m.tool.id}`}
                    >
                        {number(counts[m.tool.id] ?? 0)}회
                    </span>
                </button>
                <label className="mt-2 block">
                    <span className="sr-only">
                        {m.tool.name} 1회 가격 (Gold)
                    </span>
                    <input
                        className="input w-full px-2 text-xs sm:text-sm"
                        inputMode="numeric"
                        maxLength={30}
                        placeholder={
                            automatic && market.isPending
                                ? "가격 조회 중…"
                                : "1회 가격 · Gold"
                        }
                        disabled={running}
                        value={text}
                        aria-invalid={invalidPrice}
                        aria-busy={market.isFetching}
                        onChange={e => setPrice(m.tool.id, e.target.value)}
                    />
                </label>
                {automatic && !market.isPending && (
                    <p className="mt-1 text-center text-xs text-slate-500">
                        {market.isError
                            ? "가격 조회 실패"
                            : text === ""
                              ? "시세 없음"
                              : market.data?.isComplete
                                ? "경매장 최저가"
                                : "조회된 매물 최저가"}
                    </p>
                )}
                {invalidPrice && (
                    <p role="alert" className="mt-1 text-xs text-red-700">
                        0 이상의 정수를 입력하세요.
                    </p>
                )}
            </div>
        );
    };
    return (
        <div className="space-y-5">
            <section
                aria-label="세공 결과"
                className="min-h-60 rounded-xl bg-[#383a3b] p-5 sm:p-6"
            >
                <h2 className="mb-3 text-sm text-slate-200">
                    {model.equipment.name}
                </h2>
                <p className="mb-2 text-xl font-bold text-[#ed65b0]">1 랭크</p>
                {last ? (
                    <ul className="space-y-2 text-base font-medium text-[#39b6ff]">
                        {last.options.map(o => {
                            const option = lastModel.pool.find(
                                a => a.id === o.id
                            )!;
                            return (
                                <li key={o.id} className="break-words">
                                    {option.name}
                                    <span className="ml-2 whitespace-nowrap">
                                        ({o.level}/{option.max})
                                    </span>
                                    {o.limitBreak && (
                                        <span className="ml-2 text-sm text-[#ffd36d]">
                                            한계 돌파
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="mt-5 text-sm text-slate-300">
                        세공 도구를 눌러 시작하세요.
                    </p>
                )}
            </section>
            <div className="mx-auto max-w-xl">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[4, 1, 6]
                        .map(id => models.find(m => m.tool.id === id))
                        .filter((m): m is ReforgeModel => Boolean(m))
                        .map(toolCard)}
                </div>
                <details className="mt-3 text-sm text-slate-600">
                    <summary className="cursor-pointer py-1">
                        다른 세공 도구
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                        {models
                            .filter(m => ![4, 1, 6].includes(m.tool.id))
                            .map(toolCard)}
                    </div>
                </details>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                    반복 횟수
                    <input
                        className="input w-28"
                        inputMode="numeric"
                        maxLength={7}
                        value={capText}
                        disabled={running}
                        onChange={e => setCapText(e.target.value)}
                        onBlur={() => {
                            if (!invalidCap) update({ cap });
                        }}
                    />
                </label>
                <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={running}
                    onClick={() => {
                        setSession(emptySession());
                        setCounts({});
                        setStatus("횟수를 초기화했습니다.");
                    }}
                >
                    횟수 초기화
                </button>
                {running && (
                    <button type="button" className="btn btn-sm" onClick={stop}>
                        중지
                    </button>
                )}
                <span className="text-slate-500">
                    총{" "}
                    <span data-testid="session-attempts">
                        {number(session.attempts)}회
                    </span>{" "}
                    ·{" "}
                    <span data-testid="session-spend">
                        {session.spent.toLocaleString("ko-KR")} Gold
                        {session.unknownCosts > 0 &&
                            ` + 가격 미입력 ${number(session.unknownCosts)}회`}
                    </span>
                </span>
            </div>
            {invalidCap && (
                <p role="alert" className="text-sm text-red-700">
                    반복 횟수는 1~1,000,000을 입력하세요.
                </p>
            )}
            <p role="status" className="text-sm text-slate-600">
                {status}
            </p>
            <fieldset disabled={running} className="space-y-3">
                <legend className="mb-3 text-sm font-semibold">
                    자동 멈춤 옵션
                </legend>
                {[0, 1, 2].map(i => {
                    const target = targets[i];
                    const option = model.pool.find(a => a.id === target?.id);
                    const max = Math.max(
                        option?.breakMax || option?.max || 1,
                        target?.level ?? 1
                    );
                    return (
                        <div className="flex gap-2" key={i}>
                            <select
                                aria-label={`자동 멈춤 옵션 ${i + 1}`}
                                className="select min-w-0 flex-1"
                                value={target?.id ?? ""}
                                disabled={i > targets.length}
                                onChange={e => {
                                    const next = model.pool.find(
                                        a => a.id === Number(e.target.value)
                                    );
                                    const updated = [...targets];
                                    if (next)
                                        updated[i] = {
                                            id: next.id,
                                            level: next.min,
                                        };
                                    else updated.splice(i, 1);
                                    update({ targets: updated });
                                    setStatus("");
                                }}
                            >
                                <option value="">자동 멈춤 옵션 선택</option>
                                {target && !option && (
                                    <option value={target.id}>
                                        미지원 옵션 #{target.id}
                                    </option>
                                )}
                                {model.pool.map(a => (
                                    <option
                                        key={a.id}
                                        value={a.id}
                                        disabled={targets.some(
                                            (t, j) => j !== i && t.id === a.id
                                        )}
                                    >
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label={`최소 레벨 ${i + 1}`}
                                className="select w-24 shrink-0"
                                disabled={!target}
                                value={target?.level ?? ""}
                                onChange={e =>
                                    update({
                                        targets: targets.map((t, j) =>
                                            j === i
                                                ? {
                                                      ...t,
                                                      level: Number(
                                                          e.target.value
                                                      ),
                                                  }
                                                : t
                                        ),
                                    })
                                }
                            >
                                {!target && <option value="">레벨</option>}
                                {target &&
                                    Array.from(
                                        { length: max },
                                        (_, n) => n + 1
                                    ).map(level => (
                                        <option key={level} value={level}>
                                            {level} 이상
                                        </option>
                                    ))}
                            </select>
                        </div>
                    );
                })}
                {targets.length > 1 && (
                    <select
                        aria-label="자동 멈춤 조건"
                        className="select w-full sm:w-auto"
                        value={config.mode}
                        onChange={e =>
                            update({ mode: e.target.value as "and" | "or" })
                        }
                    >
                        <option value="and">모든 옵션 만족 시 멈춤</option>
                        <option value="or">하나 이상 만족 시 멈춤</option>
                    </select>
                )}
                <p className="text-xs text-slate-500">
                    비워두면 지정한 횟수만큼 세공합니다.
                </p>
            </fieldset>
            {error && (
                <p role="alert" className="text-sm text-red-700">
                    {error}
                </p>
            )}
            {!error && targets.length > 0 && p === 0 && (
                <p role="alert" className="text-sm text-red-700">
                    이 도구로는 달성 불가능한 조건입니다. 옵션이나 레벨을
                    변경하세요.
                </p>
            )}
            {targets.length > 0 && (
                <section
                    aria-labelledby="probability-heading"
                    className="rounded-xl bg-slate-50 p-4 sm:p-5"
                >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2
                            id="probability-heading"
                            className="text-sm font-semibold"
                        >
                            이론 확률과 비용
                        </h2>
                        <select
                            aria-label="확률 기준 도구"
                            className="select select-sm w-auto max-w-full"
                            value={model.tool.id}
                            disabled={running}
                            onChange={e =>
                                update({
                                    toolId: Number(e.target.value),
                                    price:
                                        manualPrices[Number(e.target.value)] ??
                                        "",
                                })
                            }
                        >
                            {models.map(m => (
                                <option key={m.tool.id} value={m.tool.id}>
                                    {m.tool.name} 기준
                                </option>
                            ))}
                        </select>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                        <div>
                            <dt className="text-xs text-slate-500">
                                1회 성공 확률
                            </dt>
                            <dd
                                className="mt-1 font-semibold"
                                data-testid="target-probability"
                            >
                                {percent(p)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">
                                {invalidCap ? "반복 횟수" : `${number(cap)}회`}{" "}
                                내 성공 확률
                            </dt>
                            <dd className="mt-1 font-semibold">
                                {invalidCap
                                    ? "—"
                                    : percent(successWithin(p, cap))}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">
                                기대 횟수
                            </dt>
                            <dd className="mt-1 font-semibold">
                                {p ? `${number(1 / p)}회` : "도달 불가"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">
                                기대 비용
                            </dt>
                            <dd className="mt-1 font-semibold break-words">
                                {price === null
                                    ? "가격을 입력하세요"
                                    : !p
                                      ? "도달 불가"
                                      : `${number(Number(price) / p)} Gold`}
                            </dd>
                        </div>
                    </dl>
                </section>
            )}
        </div>
    );
}
