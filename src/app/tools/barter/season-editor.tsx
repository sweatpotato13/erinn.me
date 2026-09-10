"use client";

import { useEffect, useState } from "react";

import {
    type BarterGood,
    BarterGoodSchema,
    type BarterMaterial,
    barterMonth,
    type BarterReference,
    IRIA_POSTS,
    parseBarterInteger,
    parseSeoulDate,
    seoulDateInput,
} from "@/lib/barter";

import { fetchBarterMaterials } from "./barter-hooks";

const inputClass =
    "w-full rounded border border-slate-400 bg-white px-3 py-2 text-slate-900";

export default function SeasonEditor({
    initial,
    data,
    materials,
    now,
    onSave,
    onCancel,
    onMaterials,
}: {
    initial: BarterGood | null;
    data: BarterReference;
    materials: BarterMaterial[];
    now: number;
    onSave: (good: BarterGood) => boolean;
    onCancel: () => void;
    onMaterials: (items: BarterMaterial[]) => void;
}) {
    const period = initial?.period ?? barterMonth(now);
    const [post, setPost] = useState(initial?.postId ?? 201);
    const [name, setName] = useState(initial?.name ?? "");
    const [start, setStart] = useState(seoulDateInput(period.startAt));
    const [end, setEnd] = useState(seoulDateInput(period.endAt));
    const [limit, setLimit] = useState(String(initial?.limit ?? ""));
    const [groups, setGroups] = useState(
        initial?.groups.map(g =>
            g.map(o => ({ itemId: o.itemId, count: String(o.count) }))
        ) ?? []
    );
    const [query, setQuery] = useState("");
    const [target, setTarget] = useState<number | null>(null);
    const [found, setFound] = useState<BarterMaterial[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        setFound([]);
        setSearchError("");
        setHasMore(false);
        if (query.trim().length < 2 && !/^\d+$/.test(query)) return;
        const timer = setTimeout(() => {
            const params: Record<string, string> = /^\d+$/.test(query)
                ? { ids: query }
                : { q: query.trim() };
            void fetchBarterMaterials(
                new URLSearchParams(params),
                data.sourceVersion,
                controller.signal
            )
                .then(r => {
                    if (!controller.signal.aborted) {
                        setFound(r.materials);
                        setHasMore(r.hasMore);
                    }
                })
                .catch(() => {
                    if (!controller.signal.aborted)
                        setSearchError(
                            "재료 검색에 실패했습니다. 이름 또는 실제 ID를 확인해 주세요."
                        );
                });
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, data.sourceVersion]);

    function choose(material: BarterMaterial) {
        if (target === null && groups.length >= 20) {
            setError("재료 그룹은 20개까지 추가할 수 있습니다.");
            return;
        }
        if (
            target !== null &&
            (groups[target].length >= 20 ||
                groups[target].some(o => o.itemId === material.id))
        ) {
            setError("이미 선택한 재료이거나 대안 20개를 넘었습니다.");
            return;
        }
        onMaterials([material]);
        setGroups(old =>
            target === null
                ? [...old, [{ itemId: material.id, count: "1" }]]
                : old.map((g, i) =>
                      i === target
                          ? [...g, { itemId: material.id, count: "1" }]
                          : g
                  )
        );
        setQuery("");
        setTarget(null);
        setError("");
    }
    function save() {
        const candidate = {
            key: initial?.key ?? `manual:${crypto.randomUUID()}`,
            source: "manual",
            revision: crypto.randomUUID(),
            postId: post,
            postName: data.goods.find(g => g.postId === post)?.postName,
            name,
            limit: parseBarterInteger(limit),
            reset: "weekly",
            period: {
                startAt: parseSeoulDate(start),
                endAt: parseSeoulDate(end),
            },
            groups: groups.map(g =>
                g.map(o => ({
                    itemId: o.itemId,
                    count: parseBarterInteger(o.count),
                }))
            ),
        };
        const parsed = BarterGoodSchema.safeParse(candidate);
        if (
            !parsed.success ||
            groups.flat().some(o => !materials.some(m => m.id === o.itemId))
        ) {
            setError(
                "교역품 이름, 서울 시각의 유효 기간, 양의 정수 한도·재료 수량과 실제 재료 ID를 확인해 주세요. 입력은 보존했습니다."
            );
            return;
        }
        if (onSave(parsed.data)) setError("");
    }
    return (
        <section
            className="my-4 space-y-4 rounded-xl border border-sky-300 bg-sky-50 p-4"
            aria-labelledby="season-editor-heading"
        >
            <h2 id="season-editor-heading" className="text-lg font-bold">
                시즌 교역품 직접 입력
            </h2>
            <p className="text-sm">
                직접 입력은 이 기기에만 저장됩니다. 같은 교역소의 수집 자료 대신
                사용할 출처를 명시적으로 선택합니다. 대체 재료는 한 그룹으로
                추가하세요.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
                <label>
                    교역소
                    <select
                        className={inputClass}
                        value={post}
                        onChange={e => setPost(Number(e.target.value))}
                    >
                        {IRIA_POSTS.map(id => (
                            <option key={id} value={id}>
                                {
                                    data.goods.find(g => g.postId === id)
                                        ?.postName
                                }
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    교역품 이름
                    <input
                        className={inputClass}
                        maxLength={100}
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </label>
                <label>
                    기간 시작 (서울 시각)
                    <input
                        className={inputClass}
                        type="datetime-local"
                        value={start}
                        onChange={e => setStart(e.target.value)}
                    />
                </label>
                <label>
                    기간 종료 (서울 시각)
                    <input
                        className={inputClass}
                        type="datetime-local"
                        value={end}
                        onChange={e => setEnd(e.target.value)}
                    />
                </label>
                <label>
                    주간 교환 한도
                    <input
                        className={inputClass}
                        inputMode="numeric"
                        maxLength={16}
                        value={limit}
                        onChange={e => setLimit(e.target.value)}
                    />
                </label>
            </div>
            {groups.map((options, i) => (
                <fieldset
                    key={i}
                    className="space-y-2 rounded border border-slate-300 p-3"
                >
                    <legend>
                        재료 그룹 {i + 1} —{" "}
                        {options.length > 1
                            ? "아래 대안 중 하나 선택"
                            : "필수 재료"}
                    </legend>
                    {options.map((option, j) => (
                        <div
                            key={option.itemId}
                            className="flex flex-wrap items-end gap-2"
                        >
                            <label className="min-w-0 flex-1">
                                {materials.find(m => m.id === option.itemId)
                                    ?.name ?? "확인되지 않은 재료"}{" "}
                                (#{option.itemId}) 수량
                                <input
                                    className={inputClass}
                                    inputMode="numeric"
                                    maxLength={16}
                                    value={option.count}
                                    onChange={e =>
                                        setGroups(old =>
                                            old.map((g, gi) =>
                                                gi === i
                                                    ? g.map((o, oi) =>
                                                          oi === j
                                                              ? {
                                                                    ...o,
                                                                    count: e
                                                                        .target
                                                                        .value,
                                                                }
                                                              : o
                                                      )
                                                    : g
                                            )
                                        )
                                    }
                                />
                            </label>
                            <button
                                type="button"
                                className="btn btn-sm"
                                aria-label={`재료 ${option.itemId} 제거`}
                                onClick={() => {
                                    setGroups(old =>
                                        old
                                            .map((g, gi) =>
                                                gi === i
                                                    ? g.filter(
                                                          (_, oi) => oi !== j
                                                      )
                                                    : g
                                            )
                                            .filter(g => g.length)
                                    );
                                    setTarget(null);
                                }}
                            >
                                제거
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setTarget(i)}
                    >
                        그룹 {i + 1}의 대체 재료 검색
                    </button>
                </fieldset>
            ))}
            <label className="block">
                {target === null
                    ? "새 재료 검색 (이름 2자 또는 실제 ID)"
                    : `그룹 ${target + 1} 대체 재료 검색`}
                <input
                    className={inputClass}
                    maxLength={100}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </label>
            {target !== null && (
                <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setTarget(null)}
                >
                    새 필수 재료로 추가하기
                </button>
            )}
            {searchError && <p role="alert">{searchError}</p>}
            <ul className="max-h-64 overflow-auto">
                {found.map(m => (
                    <li key={m.id}>
                        <button
                            type="button"
                            className="my-1 w-full rounded border border-slate-300 bg-white p-2 text-left"
                            onClick={() => choose(m)}
                        >
                            {m.name} (#{m.id})
                            {m.ambiguous ? " · 동명 변형" : ""}
                        </button>
                    </li>
                ))}
            </ul>
            {hasMore && (
                <p>검색 결과가 더 있습니다. 이름을 구체적으로 입력해 주세요.</p>
            )}
            {error && (
                <p role="alert" className="text-red-800">
                    {error}
                </p>
            )}
            <div className="flex gap-2">
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={save}
                >
                    직접 입력 적용
                </button>
                <button type="button" className="btn" onClick={onCancel}>
                    편집 닫기
                </button>
            </div>
        </section>
    );
}
