"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
    muriasReference as reference,
    type RelicSnapshot,
} from "@/lib/murias-relics";

export function useRelicSnapshot() {
    const [snapshot, setSnapshot] = useState<RelicSnapshot | null>(null);
    const [busy, setBusy] = useState(true);
    const [marketError, setMarketError] = useState<string | null>(null);
    const active = useRef<AbortController | null>(null);
    const load = useCallback(async (refresh = false) => {
        active.current?.abort();
        const controller = new AbortController();
        active.current = controller;
        setBusy(true);
        setMarketError(null);
        try {
            const response = await fetch("/api/murias-relics", {
                method: refresh ? "POST" : "GET",
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error(
                    "가격 조회 실패 · 이전 가격을 유지합니다. 수동 가격으로 복원할 수 있습니다."
                );
            const next: RelicSnapshot = await response.json();
            if (controller.signal.aborted) return;
            if (next.referenceVersion !== reference.version)
                throw new Error(
                    "참조 데이터가 변경되었습니다. 페이지를 새로고침해 주세요."
                );
            setSnapshot(previous => ({
                ...next,
                ...(next.relicError &&
                previous?.fetchedAt &&
                (!next.fetchedAt || previous.fetchedAt > next.fetchedAt)
                    ? {
                          cells: previous.cells,
                          fetchedAt: previous.fetchedAt,
                          isComplete: previous.isComplete,
                      }
                    : {}),
                ...(next.ideaError && previous
                    ? {
                          ideaPrice: previous.ideaPrice,
                          ideaFetchedAt: previous.ideaFetchedAt,
                          ideaIsComplete: previous.ideaIsComplete,
                      }
                    : {}),
            }));
        } catch (caught) {
            if (!controller.signal.aborted)
                setMarketError(
                    caught instanceof Error ? caught.message : "가격 조회 실패"
                );
        } finally {
            if (!controller.signal.aborted) setBusy(false);
        }
    }, []);
    useEffect(() => {
        void load();
        return () => active.current?.abort();
    }, [load]);
    return { load, snapshot, busy, marketError };
}
