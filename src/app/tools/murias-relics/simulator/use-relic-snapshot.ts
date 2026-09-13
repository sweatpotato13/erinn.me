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
                    "가격 조회 실패 · 가격을 불러오지 못했습니다. 이전 조회 결과를 유지합니다."
                );
            const next: RelicSnapshot = await response.json();
            if (controller.signal.aborted) return;
            if (next.referenceVersion !== reference.version)
                throw new Error(
                    "참조 데이터가 변경되었습니다. 페이지를 새로고침해 주세요."
                );
            setSnapshot(previous => retainSnapshot(previous, next));
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

function retainSnapshot(
    previous: RelicSnapshot | null,
    next: RelicSnapshot
): RelicSnapshot {
    if (!previous) return next;
    return {
        ...next,
        ...(next.relicError &&
        previous.fetchedAt &&
        (!next.fetchedAt || previous.fetchedAt > next.fetchedAt)
            ? {
                  cells: previous.cells,
                  fetchedAt: previous.fetchedAt,
                  pages: previous.pages,
                  nextCursor: previous.nextCursor,
                  isComplete: previous.isComplete,
                  receivedCount: previous.receivedCount,
                  unclassifiedCount: previous.unclassifiedCount,
                  excludedCount: previous.excludedCount,
                  rejected: previous.rejected,
              }
            : {}),
        ...(next.ideaError
            ? {
                  ideaPrice: previous.ideaPrice,
                  ideaFetchedAt: previous.ideaFetchedAt,
                  ideaIsComplete: previous.ideaIsComplete,
              }
            : {}),
    };
}
