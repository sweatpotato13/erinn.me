"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import {
    type BarterMaterial,
    BarterMaterialSchema,
    barterMonth,
    type BarterReference,
    type BarterResult,
    barterWeek,
} from "@/lib/barter";
import {
    BARTER_STORAGE_KEY,
    type BarterPlan,
    BarterPlanSchema,
    emptyBarterPlan,
    parseBarterShare,
    parseBarterStorage,
    serializeBarterStorage,
} from "@/lib/barter-state";

export function useBarterPlan(data: BarterReference) {
    const [plan, setPlan] = useState(() =>
        emptyBarterPlan(data, Date.parse(data.collectedAt))
    );
    const current = useRef(plan);
    const canSave = useRef(false);
    const [ready, setReady] = useState(false);
    const [temporary, setTemporary] = useState(false);
    const [notice, setNotice] = useState("");
    const [backup, setBackup] = useState("");
    const [epoch, setEpoch] = useState(0);
    const [now, setNow] = useState(Date.parse(data.collectedAt));
    const [needsSaveReview, setNeedsSaveReview] = useState(false);
    const query = useRef("");

    const restore = useCallback(() => {
        const time = Date.now();
        let raw: string | null = null;
        let readError = "";
        try {
            raw = localStorage.getItem(BARTER_STORAGE_KEY);
        } catch {
            readError =
                "저장소를 사용할 수 없습니다. 현재 화면에서 계속 계산할 수 있습니다.";
        }
        const saved = parseBarterStorage(raw);
        const shared = parseBarterShare(window.location.search);
        const next = shared.plan ?? saved.plan ?? emptyBarterPlan(data, time);
        const isTemporary = !!window.location.search;
        query.current = window.location.search;
        canSave.current =
            !isTemporary &&
            !readError &&
            !saved.error &&
            next.snapshotVersion === data.version;
        current.current = next;
        setPlan(next);
        setTemporary(isTemporary);
        setNeedsSaveReview(!canSave.current && !isTemporary);
        setBackup(saved.error ? (raw ?? "") : "");
        setNotice(
            [shared.error, saved.error, readError].filter(Boolean).join(" ")
        );
        setNow(time);
        setEpoch(v => v + 1);
        setReady(true);
    }, [data]);

    useEffect(() => {
        restore();
        const pop = () => {
            if (query.current !== window.location.search) restore();
        };
        window.addEventListener("popstate", pop);
        return () => window.removeEventListener("popstate", pop);
    }, [restore]);

    useEffect(() => {
        if (!ready) return;
        const refresh = () => setNow(Date.now());
        const periods = [...data.goods, ...plan.rows.map(r => r.good)].flatMap(
            g => (g.period ? [g.period.startAt, g.period.endAt] : [])
        );
        const next = Math.min(
            barterWeek(now) + 7 * 86400000,
            barterMonth(now).endAt,
            ...periods.filter(t => t > now)
        );
        const timer = setTimeout(
            refresh,
            Math.min(2147483647, Math.max(1, next - Date.now() + 50))
        );
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [now, ready, data, plan.rows]);

    function persist(next: BarterPlan) {
        try {
            localStorage.setItem(
                BARTER_STORAGE_KEY,
                serializeBarterStorage(next)
            );
            return true;
        } catch {
            setNotice(
                "계획을 저장하지 못했습니다. 현재 입력을 텍스트로 내보내 주세요."
            );
            return false;
        }
    }
    const update = useCallback(
        (change: (p: BarterPlan) => BarterPlan) => {
            if (!ready) return;
            try {
                const next = BarterPlanSchema.parse(change(current.current));
                current.current = next;
                setPlan(next);
                setNow(Date.now());
                if (canSave.current) persist(next);
            } catch {
                setNotice(
                    "입력 형식이나 계획 크기를 확인해 주세요. 이전 계획은 유지했습니다."
                );
            }
        },
        [ready]
    );

    function adopt() {
        const next = { ...current.current, snapshotVersion: data.version };
        if (!persist(next)) return;
        current.current = next;
        setPlan(next);
        canSave.current = true;
        setTemporary(false);
        setNeedsSaveReview(false);
        setBackup("");
        window.history.replaceState(null, "", window.location.pathname);
        query.current = "";
        setNotice("현재 계획을 이 기기에 저장했습니다.");
    }
    function openSaved() {
        window.history.replaceState(null, "", window.location.pathname);
        restore();
    }
    return {
        plan,
        update,
        ready,
        temporary,
        notice,
        setNotice,
        backup,
        epoch,
        now,
        adopt,
        openSaved,
        needsSaveReview,
    };
}

const materialResponse = z
    .object({
        version: z.string().max(100),
        sourceVersion: z.number().int().positive(),
        materials: z.array(BarterMaterialSchema).max(100),
        hasMore: z.boolean(),
    })
    .strict();

class BarterMaterialError extends Error {}

export async function fetchBarterMaterials(
    params: URLSearchParams,
    sourceVersion: number,
    signal?: AbortSignal
) {
    const response = await fetch(`/api/barter/materials?${params}`, { signal });
    if (!response.ok)
        throw new BarterMaterialError("재료 목록을 불러오지 못했습니다.");
    const result = materialResponse.parse(await response.json());
    if (result.sourceVersion !== sourceVersion)
        throw new BarterMaterialError(
            "참조 데이터가 변경되었습니다. 페이지를 새로 열어 주세요."
        );
    return result;
}

export function useBarterMaterials(data: BarterReference, plan: BarterPlan) {
    const [extra, setExtra] = useState<BarterMaterial[]>([]);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const [attempt, retry] = useState(0);
    const ids = [
        ...new Set(
            plan.rows.flatMap(r => r.good.groups.flat().map(m => m.itemId))
        ),
    ]
        .sort((a, b) => a - b)
        .join(",");
    const add = useCallback(
        (items: BarterMaterial[]) =>
            setExtra(old => [
                ...new Map([...old, ...items].map(m => [m.id, m])).values(),
            ]),
        []
    );
    useEffect(() => {
        const controller = new AbortController();
        const known = new Set(data.materials.map(m => m.id));
        const missing = ids
            ? ids
                  .split(",")
                  .map(Number)
                  .filter(id => !known.has(id))
            : [];
        if (!missing.length) {
            setPending(false);
            setError("");
            return;
        }
        setPending(true);
        setError("");
        void (async () => {
            try {
                if (missing.length > 1000)
                    throw new BarterMaterialError(
                        "한 계획의 재료 ID는 1,000개까지 확인할 수 있습니다."
                    );
                const items: BarterMaterial[] = [];
                for (let i = 0; i < missing.length; i += 100) {
                    const result = await fetchBarterMaterials(
                        new URLSearchParams({
                            ids: missing.slice(i, i + 100).join(","),
                        }),
                        data.sourceVersion,
                        controller.signal
                    );
                    items.push(...result.materials);
                }
                if (!controller.signal.aborted) {
                    add(items);
                    const found = new Set(items.map(m => m.id));
                    const unknown = missing.filter(id => !found.has(id));
                    if (unknown.length)
                        setError(
                            `현재 데이터에 없는 재료 ID: ${unknown.join(", ")}. 원래 입력은 보존했습니다.`
                        );
                }
            } catch (cause) {
                if (!controller.signal.aborted)
                    setError(
                        cause instanceof BarterMaterialError
                            ? cause.message
                            : "재료 확인 실패"
                    );
            } finally {
                if (!controller.signal.aborted) setPending(false);
            }
        })();
        return () => controller.abort();
    }, [ids, data, add, attempt]);
    return {
        materials: [
            ...new Map(
                [...data.materials, ...extra].map(m => [m.id, m])
            ).values(),
        ],
        pending,
        error,
        retry: () => retry(v => v + 1),
        add,
    };
}

export function useBarterMarket(
    result: BarterResult,
    update: (change: (p: BarterPlan) => BarterPlan) => void,
    epoch: number
) {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const active = useRef<AbortController | null>(null);
    const generation = useRef(0);
    const busy = useRef(false);
    const cancel = useCallback(() => {
        generation.current++;
        active.current?.abort();
        busy.current = false;
        setLoading(false);
    }, []);
    useEffect(() => {
        cancel();
        setErrors({});
        return cancel;
    }, [epoch, cancel]);
    async function load() {
        if (busy.current || !result.valid) return;
        const names = [
            ...new Set(
                result.materials
                    .filter(
                        r =>
                            r.missing! > 0 &&
                            r.material.searchable &&
                            !r.material.ambiguous
                    )
                    .map(r => r.material.name)
            ),
        ];
        if (!names.length) return;
        busy.current = true;
        setLoading(true);
        setErrors({});
        const request = ++generation.current;
        const controller = new AbortController();
        active.current = controller;
        try {
            for (
                let i = 0;
                i < names.length && !controller.signal.aborted;
                i += 3
            ) {
                await Promise.allSettled(
                    names.slice(i, i + 3).map(async name => {
                        try {
                            const quote = await fetchItemPriceSummary(
                                name,
                                controller.signal
                            );
                            if (
                                request === generation.current &&
                                !controller.signal.aborted
                            )
                                update(p => ({
                                    ...p,
                                    quotes: {
                                        ...p.quotes,
                                        [name]: {
                                            ...quote,
                                            observedAt:
                                                new Date().toISOString(),
                                        },
                                    },
                                }));
                        } catch {
                            if (
                                request === generation.current &&
                                !controller.signal.aborted
                            )
                                setErrors(old => ({
                                    ...old,
                                    [name]: "조회 실패. 이전 시세와 수동 가격은 유지했습니다.",
                                }));
                        }
                    })
                );
            }
        } finally {
            if (request === generation.current) {
                busy.current = false;
                setLoading(false);
            }
        }
    }
    return { loading, errors, load, cancel };
}
