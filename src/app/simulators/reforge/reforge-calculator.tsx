"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
    conditionalChance,
    effectText,
    emptySession,
    EQUIPMENT_TYPES,
    parseGold,
    raceLabel,
    type ReforgeEquipment,
    type ReforgeModel,
    type ReforgeTool,
    runReforgeChunk,
    successThreshold,
    successWithin,
    targetError,
    targetProbability,
} from "@/lib/reforge";
import {
    parseReforgeConfig,
    REFORGE_PATH,
    reforgeAuctionPath,
    type ReforgeConfig,
    reforgeConfigPath,
} from "@/lib/reforge-url";

const number = (value: number) =>
    Number.isFinite(value)
        ? value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
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
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const update = (patch: Partial<ReforgeConfig>, replace = false) => {
        const path = reforgeConfigPath({ ...config, ...patch, version });
        if (replace) window.history.replaceState(null, "", path);
        else window.history.pushState(null, "", path);
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
    const model = useQuery({
        queryKey: ["reforge-model", version, config.equipmentId, config.toolId],
        enabled: !error && config.equipmentId !== null,
        queryFn: ({ signal }) =>
            getJson<ReforgeModel>(
                `/api/reforge?e=${config.equipmentId}&t=${config.toolId}`,
                signal
            ),
        staleTime: Infinity,
        retry: false,
    });
    return (
        <div className="space-y-6">
            {error && (
                <div role="alert" className="alert alert-error">
                    {error}{" "}
                    <Link href={REFORGE_PATH} className="link">
                        기본 설정
                    </Link>
                </div>
            )}
            {changedVersion && (
                <p role="status" className="alert">
                    공유 데이터 버전 {config.version}과 현재 버전 {version}이
                    다릅니다. 지원되는 ID만 복원하며 현재 데이터로 다시
                    계산합니다.
                </p>
            )}
            <section
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
                aria-labelledby="equipment-heading"
            >
                <h2 id="equipment-heading" className="mb-4 text-xl font-bold">
                    1. 장비와 도구 선택
                </h2>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        setQuery(search.trim());
                    }}
                    className="flex flex-wrap items-end gap-2"
                >
                    <label className="min-w-0 flex-1">
                        장비 이름 검색
                        <input
                            className="input mt-1 w-full"
                            value={search}
                            maxLength={100}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="예: 켈틱, 스태프, 장갑"
                        />
                    </label>
                    <button className="btn" type="submit">
                        장비 검색
                    </button>
                </form>
                {results.isFetching && <p role="status">장비 검색 중…</p>}
                {results.error && <p role="alert">{results.error.message}</p>}
                {results.data && (
                    <div className="mt-3 max-h-64 overflow-y-auto">
                        <p className="text-sm text-slate-600">
                            최대 30개 표시 · 이름을 더 입력하면 범위를 좁힐 수
                            있습니다.
                        </p>
                        {!results.data.equipment.length && (
                            <p role="status">검색 결과가 없습니다.</p>
                        )}
                        <ul>
                            {results.data.equipment.map(e => (
                                <li key={e.id}>
                                    <button
                                        type="button"
                                        className="w-full rounded p-3 text-left hover:bg-slate-100 disabled:opacity-50"
                                        disabled={Boolean(e.unsupported)}
                                        onClick={() =>
                                            update({
                                                equipmentId: e.id,
                                                targets: [],
                                            })
                                        }
                                    >
                                        <span className="font-semibold break-words">
                                            {e.name}
                                        </span>{" "}
                                        <span className="text-sm text-slate-600">
                                            #{e.id} ·{" "}
                                            {EQUIPMENT_TYPES[e.type] ?? e.type}{" "}
                                            · {raceLabel(e.races)}
                                            {e.unsupported &&
                                                ` · ${e.unsupported}`}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <label className="mt-4 block">
                    세공 도구
                    <select
                        className="select mt-1 w-full"
                        value={config.toolId}
                        onChange={e =>
                            update({
                                toolId: Number(e.target.value),
                                targets: [],
                            })
                        }
                    >
                        {!tools.some(t => t.id === config.toolId) && (
                            <option value={config.toolId}>
                                미지원 도구 #{config.toolId}
                            </option>
                        )}
                        {tools.map(t => (
                            <option
                                key={t.id}
                                value={t.id}
                                disabled={Boolean(t.unsupported)}
                            >
                                {t.name} · {t.lines}개 옵션 ·{" "}
                                {t.legacy ? "레거시 · 획득 불가" : "지원"}
                            </option>
                        ))}
                    </select>
                </label>
                <p className="mt-2 text-sm text-slate-600">
                    장비·도구·목표를 바꾸면 진행 중 실행을 중지하고 세션 기록을
                    초기화합니다. 가격 변경은 이미 사용한 Gold에 영향을 주지
                    않습니다.
                </p>
            </section>
            {config.equipmentId === null && (
                <p>
                    장비를 검색하고 선택하면 등장 옵션과 확률을 확인할 수
                    있습니다.
                </p>
            )}
            {model.isFetching && <p role="status">옵션 불러오는 중…</p>}
            {model.error && <p role="alert">{model.error.message}</p>}
            {!error && config.equipmentId !== null && model.data && (
                <CalculatorSession
                    key={`${model.data.version}/${config.equipmentId}/${config.toolId}/${config.mode}/${JSON.stringify(config.targets.length ? config.targets : [{ id: model.data.pool[0].id, level: model.data.pool[0].min }])}`}
                    model={model.data}
                    config={config}
                    update={update}
                />
            )}
        </div>
    );
}

function CalculatorSession({
    model,
    config,
    update,
}: {
    model: ReforgeModel;
    config: ReforgeConfig;
    update: (patch: Partial<ReforgeConfig>, replace?: boolean) => void;
}) {
    const targets = config.targets.length
        ? config.targets
        : [{ id: model.pool[0].id, level: model.pool[0].min }];
    const [filter, setFilter] = useState("");
    const [priceText, setPriceText] = useState(config.price);
    const [budgetText, setBudgetText] = useState(config.budget);
    const [capText, setCapText] = useState(String(config.cap));
    const [session, setSession] = useState(emptySession);
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState("");
    const [shared, setShared] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelled = useRef(false);
    const price = parseGold(priceText),
        budget = parseGold(budgetText),
        cap = Number(capText);
    const invalidInputs =
        (priceText !== "" && price === null) ||
        (budgetText !== "" && budget === null) ||
        !/^[1-9]\d*$/.test(capText) ||
        !Number.isSafeInteger(cap) ||
        cap > 1_000_000;
    const budgetWithoutPrice = budget !== null && price === null;
    const error = targetError(model.pool, targets);
    const p = targetProbability(
        model.pool,
        model.tool.lines,
        targets,
        config.mode
    );
    const affordable =
        budget === null || price === null
            ? null
            : price === BigInt(0)
              ? cap
              : Number(budget / price);
    const limitedAttempts =
        affordable === null ? cap : Math.min(cap, affordable);
    const auction = !error ? reforgeAuctionPath(model, targets) : null;
    useEffect(() => {
        setPriceText(config.price);
        setBudgetText(config.budget);
        setCapText(String(config.cap));
    }, [config.price, config.budget, config.cap]);
    useEffect(
        () => () => {
            cancelled.current = true;
            if (timer.current !== null) clearTimeout(timer.current);
        },
        []
    );
    const savePrice = () => {
        if (!invalidInputs)
            update({ price: priceText, budget: budgetText, cap }, true);
    };
    const stop = () => {
        cancelled.current = true;
        if (timer.current !== null) clearTimeout(timer.current);
        setRunning(false);
        setStatus("취소됨");
    };
    const start = (attempts: number, stopOnHit: boolean) => {
        if (
            running ||
            error ||
            invalidInputs ||
            budgetWithoutPrice ||
            (stopOnHit && !p)
        )
            return;
        cancelled.current = false;
        setRunning(true);
        setStatus("실행 중…");
        let current = session,
            completed = 0,
            spent = BigInt(0);
        const chunk = () => {
            if (cancelled.current) return;
            try {
                const result = runReforgeChunk(
                    current,
                    model,
                    targets,
                    config.mode,
                    { maxAttempts: attempts, price, budget, stopOnHit },
                    completed,
                    spent,
                    () => cancelled.current
                );
                current = result.session;
                completed = result.completed;
                spent = result.spent;
                setSession(current);
                if (result.reason) {
                    setStatus(result.reason);
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
    const share = async () => {
        if (invalidInputs || error) return;
        const path = reforgeConfigPath({
            ...config,
            targets,
            version: model.version,
            price: priceText,
            budget: budgetText,
            cap,
        });
        const url = new URL(path, window.location.origin).toString();
        window.history.pushState(null, "", path);
        setShared(url);
        try {
            await navigator.clipboard.writeText(url);
            setStatus(
                "설정 링크를 복사했습니다. 무작위 결과는 포함하지 않습니다."
            );
        } catch {
            setStatus("아래 설정 링크를 복사하세요.");
        }
    };
    return (
        <>
            <section
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
                aria-labelledby="target-heading"
            >
                <h2 id="target-heading" className="text-xl font-bold">
                    2. 목표 설정
                </h2>
                <p className="my-3 break-words font-semibold">
                    {model.equipment.name} ·{" "}
                    {EQUIPMENT_TYPES[model.equipment.type]} ·{" "}
                    {raceLabel(model.equipment.races)}
                </p>
                <p className="mb-4 text-sm text-slate-600">
                    착용 가능한 종족 기준 {model.pool.length}종 중 서로 다른{" "}
                    {model.tool.lines}개를 뽑습니다. 플레이어 종족으로 공용
                    장비의 확률을 줄이지 않습니다.
                </p>
                <label className="block">
                    목표 조건
                    <select
                        className="select my-2 w-full"
                        value={config.mode}
                        onChange={e =>
                            update({
                                mode: e.target.value as "and" | "or",
                                targets,
                            })
                        }
                    >
                        <option value="and">모두 만족</option>
                        <option value="or">하나 이상 만족</option>
                    </select>
                </label>
                {targets.map((t, i) => {
                    const a = model.pool.find(a => a.id === t.id);
                    const max = Math.max(a?.breakMax || a?.max || 1, t.level);
                    return (
                        <div
                            className="my-3 flex flex-wrap items-end gap-2"
                            key={i}
                        >
                            <label className="min-w-0 basis-64 grow">
                                목표 옵션 {i + 1}
                                <select
                                    className="select mt-1 w-full"
                                    value={t.id}
                                    onChange={e => {
                                        const next = model.pool.find(
                                            a => a.id === Number(e.target.value)
                                        )!;
                                        update({
                                            targets: targets.map((v, j) =>
                                                j === i
                                                    ? {
                                                          id: next.id,
                                                          level: next.min,
                                                      }
                                                    : v
                                            ),
                                        });
                                    }}
                                >
                                    {!a && (
                                        <option value={t.id}>
                                            미지원 옵션 #{t.id}
                                        </option>
                                    )}
                                    {model.pool.map(a => (
                                        <option
                                            value={a.id}
                                            key={a.id}
                                            disabled={targets.some(
                                                (other, j) =>
                                                    j !== i && other.id === a.id
                                            )}
                                        >
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="basis-36">
                                최소 레벨 {i + 1}
                                <select
                                    className="select mt-1 w-full"
                                    value={t.level}
                                    onChange={e =>
                                        update({
                                            targets: targets.map((v, j) =>
                                                j === i
                                                    ? {
                                                          ...v,
                                                          level: Number(
                                                              e.target.value
                                                          ),
                                                      }
                                                    : v
                                            ),
                                        })
                                    }
                                >
                                    {Array.from(
                                        { length: max + 1 },
                                        (_, n) => n + 1
                                    ).map(level => (
                                        <option key={level} value={level}>
                                            {level}
                                            {a &&
                                            level > a.max &&
                                            level <= a.breakMax
                                                ? " · 한계 돌파"
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {targets.length > 1 && (
                                <button
                                    className="btn"
                                    onClick={() =>
                                        update({
                                            targets: targets.filter(
                                                (_, j) => i !== j
                                            ),
                                        })
                                    }
                                    aria-label={`목표 ${i + 1} 삭제`}
                                >
                                    삭제
                                </button>
                            )}
                            {a && (
                                <p className="w-full text-sm text-slate-600">
                                    선택된 경우 목표 충족{" "}
                                    {percent(conditionalChance(a, t.level))} ·{" "}
                                    {effectText(a, t.level)}
                                </p>
                            )}
                        </div>
                    );
                })}
                <button
                    className="btn btn-outline"
                    disabled={
                        targets.length >= 3 ||
                        model.pool.length <= targets.length
                    }
                    onClick={() => {
                        const a = model.pool.find(
                            a => !targets.some(t => t.id === a.id)
                        )!;
                        update({
                            targets: [...targets, { id: a.id, level: a.min }],
                        });
                    }}
                >
                    목표 추가
                </button>
                {error && (
                    <p role="alert" className="mt-3 text-red-700">
                        {error}
                    </p>
                )}
                {!error && p === 0 && (
                    <p role="alert" className="mt-3 text-red-700">
                        달성 불가능한 목표입니다. 최소 레벨이 최대치를 넘거나
                        모두 만족할 옵션 수가 도구 출력 수보다 많습니다.
                    </p>
                )}
                <details className="mt-5">
                    <summary className="cursor-pointer py-3 font-semibold">
                        등장 옵션과 효과 보기 ({model.pool.length}종)
                    </summary>
                    <label>
                        옵션 이름 검색
                        <input
                            className="input my-2 w-full"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </label>
                    <ul className="max-h-96 overflow-y-auto">
                        {model.pool
                            .filter(a => a.name.includes(filter))
                            .map(a => (
                                <li
                                    key={a.id}
                                    className="border-b border-slate-100 py-3"
                                >
                                    <p className="font-semibold break-words">
                                        {a.name}
                                    </p>
                                    <p className="text-sm">
                                        일반 {a.min}–{a.max}레벨 ·{" "}
                                        {effectText(a, a.min)} ~{" "}
                                        {effectText(a, a.max)}
                                        {a.breakRate > 0 &&
                                            ` · 한계 돌파 ${a.breakMin}–${a.breakMax}레벨 (선택 후 ${percent(a.breakRate)})`}
                                    </p>
                                    <button
                                        className="btn btn-sm mt-2"
                                        onClick={() =>
                                            update({
                                                targets: [
                                                    { id: a.id, level: a.max },
                                                ],
                                            })
                                        }
                                    >
                                        이 옵션을 목표로
                                    </button>
                                </li>
                            ))}
                    </ul>
                </details>
            </section>
            <section
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
                aria-labelledby="probability-heading"
            >
                <h2 id="probability-heading" className="mb-4 text-xl font-bold">
                    3. 이론 확률과 비용
                </h2>
                <fieldset
                    disabled={running}
                    className="grid gap-3 sm:grid-cols-3"
                >
                    <label>
                        1회 가격 (Gold)
                        <input
                            className="input mt-1 w-full"
                            inputMode="numeric"
                            maxLength={30}
                            placeholder="미입력: 알 수 없음"
                            value={priceText}
                            onChange={e => setPriceText(e.target.value)}
                            onBlur={savePrice}
                        />
                    </label>
                    <label>
                        이번 실행 예산 (Gold, 선택)
                        <input
                            className="input mt-1 w-full"
                            inputMode="numeric"
                            maxLength={30}
                            placeholder="미입력: 예산 제한 없음"
                            value={budgetText}
                            onChange={e => setBudgetText(e.target.value)}
                            onBlur={savePrice}
                        />
                    </label>
                    <label>
                        최대 시도 횟수
                        <input
                            className="input mt-1 w-full"
                            inputMode="numeric"
                            maxLength={7}
                            value={capText}
                            onChange={e => setCapText(e.target.value)}
                            onBlur={savePrice}
                        />
                    </label>
                </fieldset>
                {invalidInputs && (
                    <p role="alert" className="mt-2 text-red-700">
                        가격·예산은 0 이상의 정수(최대 30자리), 최대 횟수는
                        1~1,000,000을 입력하세요.
                    </p>
                )}
                {budgetWithoutPrice && (
                    <p role="alert">예산을 적용하려면 1회 가격을 입력하세요.</p>
                )}
                <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <dt>1회 목표 확률</dt>
                        <dd
                            className="text-2xl font-bold"
                            data-testid="target-probability"
                        >
                            {percent(p)}
                        </dd>
                    </div>
                    <div>
                        <dt>기대 시도 횟수</dt>
                        <dd>{p ? number(1 / p) : "도달 불가"}회</dd>
                    </div>
                    <div>
                        <dt>기대 비용 (Gold)</dt>
                        <dd>
                            {price === null
                                ? "알 수 없음"
                                : !p
                                  ? "도달 불가"
                                  : number(Number(price) / p)}
                        </dd>
                    </div>
                    <div>
                        <dt>50% / 90% 성공 횟수</dt>
                        <dd>
                            {number(successThreshold(p, 0.5))} /{" "}
                            {number(successThreshold(p, 0.9))}회
                        </dd>
                    </div>
                    <div>
                        <dt>최대 횟수 내 성공 확률</dt>
                        <dd>
                            {invalidInputs
                                ? "입력 확인"
                                : percent(successWithin(p, cap))}
                        </dd>
                    </div>
                    <div>
                        <dt>예산과 최대 횟수 내 성공 확률</dt>
                        <dd>
                            {budget === null
                                ? "예산 미입력"
                                : budgetWithoutPrice || invalidInputs
                                  ? "입력 확인"
                                  : `${percent(successWithin(p, limitedAttempts))} · ${number(limitedAttempts)}회`}
                        </dd>
                    </div>
                </dl>
                <p className="mt-4 text-sm text-slate-600">
                    기댓값은 보장이 아닙니다. 동일한 조건의 독립 시도를
                    가정합니다. 현금 환산·희망의 정수 환급은 계산하지 않습니다.
                    입력한 가격과 예산은 수동 가정입니다.
                </p>
            </section>
            <section
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
                aria-labelledby="session-heading"
            >
                <h2 id="session-heading" className="mb-4 text-xl font-bold">
                    4. 실제 시뮬레이션 세션
                </h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        className="btn"
                        disabled={
                            running ||
                            Boolean(error) ||
                            invalidInputs ||
                            budgetWithoutPrice
                        }
                        onClick={() => start(1, false)}
                    >
                        1회 돌리기
                    </button>
                    <button
                        className="btn"
                        disabled={
                            running ||
                            Boolean(error) ||
                            invalidInputs ||
                            budgetWithoutPrice
                        }
                        onClick={() => start(Math.min(100, cap), true)}
                    >
                        최대 100회 돌리기
                    </button>
                    <button
                        className="btn btn-primary"
                        disabled={
                            running ||
                            Boolean(error) ||
                            invalidInputs ||
                            budgetWithoutPrice ||
                            !p
                        }
                        onClick={() => start(cap, true)}
                    >
                        목표까지 돌리기
                    </button>
                    <button className="btn" disabled={!running} onClick={stop}>
                        중지
                    </button>
                    <button
                        className="btn btn-ghost"
                        disabled={running}
                        onClick={() => {
                            setSession(emptySession());
                            setStatus("세션을 초기화했습니다.");
                        }}
                    >
                        세션 초기화
                    </button>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                    반복 실행은 첫 목표 달성·예산·최대 횟수에서 즉시 멈춥니다. 0
                    Gold도 횟수 제한을 적용합니다. 예산은 이번 버튼 실행에
                    적용됩니다.
                </p>
                <p role="status" className="my-3 min-h-6">
                    {status}
                </p>
                <dl className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <dt>누적 시도</dt>
                        <dd data-testid="session-attempts">
                            {session.attempts.toLocaleString("ko-KR")}회
                        </dd>
                    </div>
                    <div>
                        <dt>목표 달성</dt>
                        <dd>{session.hits.toLocaleString("ko-KR")}회</dd>
                    </div>
                    <div>
                        <dt>실제 세션 비용</dt>
                        <dd data-testid="session-spend">
                            {session.spent.toLocaleString("ko-KR")} Gold
                            {session.unknownCosts > 0 &&
                                ` + 가격 미입력 ${session.unknownCosts}회 (총비용 알 수 없음)`}
                        </dd>
                    </div>
                </dl>
                {session.history.length > 0 && (
                    <div className="mt-4 rounded-lg bg-slate-50 p-4">
                        <h3 className="font-semibold">
                            최근 결과{" "}
                            {session.history.at(-1)!.hit && "· 목표 달성"}
                        </h3>
                        <RollOptions
                            roll={session.history.at(-1)!}
                            model={model}
                            targets={targets}
                        />
                    </div>
                )}
                <details className="mt-3">
                    <summary className="cursor-pointer py-3">
                        최근 기록 ({session.history.length}/100)
                    </summary>
                    <ol className="max-h-96 overflow-y-auto">
                        {[...session.history].reverse().map(roll => (
                            <li
                                key={roll.number}
                                className="border-t border-slate-100 py-3"
                            >
                                <h3 className="font-semibold">
                                    {roll.number}회 {roll.hit && "· 목표 달성"}
                                </h3>
                                <RollOptions
                                    roll={roll}
                                    model={model}
                                    targets={targets}
                                />
                            </li>
                        ))}
                    </ol>
                </details>
            </section>
            <section
                className="flex flex-wrap items-center gap-3"
                aria-label="설정 공유와 경매장"
            >
                <button
                    className="btn btn-outline"
                    disabled={running || invalidInputs || Boolean(error)}
                    onClick={() => void share()}
                >
                    설정 링크 복사
                </button>
                {auction ? (
                    <Link className="btn btn-outline" href={auction}>
                        이 목표로 경매장 검색
                    </Link>
                ) : (
                    <p className="text-sm text-slate-600">
                        {targets.length > 1
                            ? "경매장은 세공 조건 1개만 지원하므로 다중 목표 링크를 제공하지 않습니다."
                            : "이 옵션은 넥슨 경매장 표기와의 일치가 검증되지 않아 검색 링크를 제공하지 않습니다."}
                    </p>
                )}
                <p className="w-full text-sm text-slate-600">
                    공유 링크는 장비·도구·목표·가격·예산·데이터 버전을 담습니다.
                    무작위 결과와 세션 기록은 공유하지 않습니다.
                </p>
                {shared && (
                    <label className="w-full">
                        공유 설정 URL
                        <input
                            className="input mt-1 w-full"
                            readOnly
                            value={shared}
                            onFocus={e => e.target.select()}
                        />
                    </label>
                )}
            </section>
        </>
    );
}
function RollOptions({
    roll,
    model,
    targets,
}: {
    roll: ReturnType<typeof emptySession>["history"][number];
    model: ReforgeModel;
    targets: ReforgeConfig["targets"];
}) {
    return (
        <ul>
            {roll.options.map(o => {
                const a = model.pool.find(a => a.id === o.id)!;
                const hit = targets.some(
                    t => t.id === o.id && o.level >= t.level
                );
                return (
                    <li className="my-1 break-words" key={o.id}>
                        {hit && "✓ "}
                        {a.name} {o.level}레벨 {o.limitBreak && "[한계 돌파]"} ·{" "}
                        {effectText(a, o.level)}
                    </li>
                );
            })}
        </ul>
    );
}
