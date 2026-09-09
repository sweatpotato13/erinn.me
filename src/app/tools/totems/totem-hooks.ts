"use client";

import { useEffect, useRef, useState } from "react";

import type { Totem, TotemReference } from "@/lib/totems";
import {
    fetchTotemListings,
    type TotemMarketResult,
} from "@/lib/totems-market";
import {
    buildTotemShare,
    emptyTotemConfig,
    parseTotemQuery,
    parseTotemStorage,
    serializeTotemStorage,
    TOTEM_STORAGE_KEY,
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
    const [config, setConfig] = useState(() => emptyTotemConfig(data));
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState("");
    const [storageNotice, setStorageNotice] = useState("");
    const [shareNotice, setShareNotice] = useState("");
    const [shareUrl, setShareUrl] = useState("");
    const [received, setReceived] = useState(false);
    const [historicalKeys, setHistoricalKeys] = useState<string[]>([]);
    useEffect(() => {
        function restore() {
            const query = parseTotemQuery(window.location.search, data);
            let saved: ReturnType<typeof parseTotemStorage> = {
                baseline: null,
                notice: "",
            };
            try {
                saved = parseTotemStorage(
                    localStorage.getItem(TOTEM_STORAGE_KEY),
                    data
                );
            } catch {
                saved.notice =
                    "저장소를 사용할 수 없습니다. 현재 화면에서는 계속 비교할 수 있습니다.";
            }
            setConfig(
                query.config ?? {
                    ...emptyTotemConfig(data),
                    baseline: saved.baseline,
                }
            );
            setReceived(query.config !== null);
            setHistoricalKeys(
                query.config?.candidates
                    .filter(c => c.kind === "listing")
                    .map(c => c.key) ?? []
            );
            setStorageNotice(saved.notice);
            setNotice(query.notice);
            setShareNotice("");
            setShareUrl("");
            setReady(true);
        }
        restore();
        window.addEventListener("popstate", restore);
        return () => window.removeEventListener("popstate", restore);
    }, [data]);
    function saveBaseline() {
        try {
            localStorage.setItem(
                TOTEM_STORAGE_KEY,
                serializeTotemStorage(config.baseline, data)
            );
            setStorageNotice("현재 기준을 이 기기에 저장했습니다.");
        } catch {
            setStorageNotice(
                "기준을 저장하지 못했습니다. 현재 화면에서는 계속 비교할 수 있습니다."
            );
        }
    }
    function useSavedBaseline() {
        try {
            const saved = parseTotemStorage(
                localStorage.getItem(TOTEM_STORAGE_KEY),
                data
            );
            setConfig(c => ({ ...c, baseline: saved.baseline }));
            setStorageNotice(
                saved.notice || "이 기기의 저장 기준을 불러왔습니다."
            );
        } catch {
            setStorageNotice("저장 기준을 불러오지 못했습니다.");
        }
    }
    function add(candidate: TotemCandidate) {
        if (config.candidates.some(c => c.key === candidate.key)) {
            setNotice("이미 비교에 담긴 후보입니다.");
            return;
        }
        if (config.candidates.length >= 4) {
            setNotice("비교 후보는 최대 4개입니다. 기존 후보를 제거해 주세요.");
            return;
        }
        setConfig(c =>
            c.candidates.length >= 4 ||
            c.candidates.some(r => r.key === candidate.key)
                ? c
                : { ...c, candidates: [...c.candidates, candidate] }
        );
        setNotice(
            "비교에 추가했습니다. 아래 후보 비교에서 확인할 수 있습니다."
        );
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
    async function share(settingsOnly = false) {
        const shared = buildTotemShare(config, settingsOnly);
        setShareNotice(shared.notice);
        setShareUrl("");
        if (!shared.path) return;
        const url = new URL(shared.path, window.location.origin).href;
        setShareUrl(url);
        try {
            window.history.pushState(null, "", shared.path);
            if (!navigator.clipboard) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(url);
            setShareNotice(
                shared.notice ||
                    "비교 링크를 복사했습니다. 매물은 조회 당시 정보로 공유됩니다."
            );
        } catch {
            setShareNotice(
                `${shared.notice} 링크를 자동 복사하지 못했습니다. 아래 주소를 직접 복사해 주세요.`.trim()
            );
        }
    }
    return {
        config,
        setConfig,
        ready,
        notice,
        setNotice,
        storageNotice,
        shareNotice,
        shareUrl,
        received,
        historicalKeys,
        saveBaseline,
        useSavedBaseline,
        add,
        remove,
        share,
    };
}
