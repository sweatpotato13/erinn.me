"use client";

import {
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type { Totem, TotemReference } from "@/lib/totems";
import {
    fetchTotemListings,
    type TotemMarketResult,
} from "@/lib/totems-market";
import {
    emptyTotemConfig,
    parseTotemQuery,
    type TotemCandidate,
} from "@/lib/totems-state";

export function useTotemMarket(target?: Totem) {
    const [result, setResult] = useState<TotemMarketResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const active = useRef<AbortController | null>(null);
    const sequence = useRef(0);
    const pending = useRef(false);
    useEffect(() => {
        setResult(null);
        setError("");
        setLoading(false);
        pending.current = false;
        return () => {
            sequence.current++;
            active.current?.abort();
            pending.current = false;
        };
    }, [target?.id]);
    async function load() {
        if (!target?.searchable || pending.current) return;
        pending.current = true;
        const request = ++sequence.current;
        const controller = new AbortController();
        active.current = controller;
        setLoading(true);
        setError("");
        try {
            const next = await fetchTotemListings(
                target.name,
                controller.signal,
                crypto.randomUUID()
            );
            if (request === sequence.current && !controller.signal.aborted)
                setResult(next);
        } catch (cause) {
            if (request === sequence.current && !controller.signal.aborted)
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "매물을 불러오지 못했습니다."
                );
        } finally {
            if (request === sequence.current) {
                pending.current = false;
                setLoading(false);
            }
        }
    }
    return { result, loading, error, load };
}

export function useTotemConfig(data: TotemReference) {
    const [config, updateConfig] = useState(() => emptyTotemConfig(data));
    const currentConfig = useRef(config);
    const setConfig = useCallback((action: SetStateAction<typeof config>) => {
        const next =
            typeof action === "function"
                ? action(currentConfig.current)
                : action;
        currentConfig.current = next;
        updateConfig(next);
    }, []);
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState("");
    const [historicalKeys, setHistoricalKeys] = useState<string[]>([]);
    const currentQuery = useRef("");
    useEffect(() => {
        function restore() {
            currentQuery.current = window.location.search;
            const query = parseTotemQuery(window.location.search, data);
            setConfig({
                ...(query.config ?? emptyTotemConfig(data)),
                baseline: null,
            });
            setHistoricalKeys(
                query.config?.candidates
                    .filter(c => c.kind === "listing")
                    .map(c => c.key) ?? []
            );
            setNotice(query.notice);
            setReady(true);
        }
        function onPopState() {
            // Hash anchors also emit popstate; they must preserve unsaved comparisons.
            if (window.location.search !== currentQuery.current) restore();
        }
        restore();
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [data, setConfig]);
    function add(candidate: TotemCandidate): boolean {
        const config = currentConfig.current;
        if (config.candidates.some(c => c.key === candidate.key)) {
            setNotice("이미 비교에 담긴 후보입니다.");
            return false;
        }
        if (config.candidates.length >= 4) {
            setNotice("비교 후보는 최대 4개입니다. 기존 후보를 제거해 주세요.");
            return false;
        }
        setConfig({ ...config, candidates: [...config.candidates, candidate] });
        setNotice(
            "비교에 추가했습니다. 아래 후보 비교에서 확인할 수 있습니다."
        );
        return true;
    }
    function remove(key?: string) {
        setConfig(c => ({
            ...c,
            candidates: key ? c.candidates.filter(r => r.key !== key) : [],
        }));
        setNotice(
            key ? "비교 후보를 제거했습니다." : "비교 후보를 모두 비웠습니다."
        );
    }
    return {
        config,
        setConfig,
        ready,
        notice,
        setNotice,
        historicalKeys,
        add,
        remove,
    };
}
