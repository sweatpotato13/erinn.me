"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import type { MaterialQuote } from "@/lib/material-cost";

export interface MaterialMarket {
    loading: boolean;
    errors: Record<string, string>;
    load: (requestedNames?: string[]) => Promise<void>;
    cancel: () => void;
}

/** A click captures its name list; edits never launch or restart market requests. */
export function useMaterialMarket(
    names: string[],
    onQuote: (name: string, quote: MaterialQuote) => void,
    epoch: number,
    enabled = true
): MaterialMarket {
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
    async function load(requestedNames = names) {
        if (busy.current || !enabled) return;
        const selected = [...new Set(requestedNames)];
        if (!selected.length) return;
        if (selected.length > 100) {
            setErrors({
                request:
                    "한 번에 시세 100종까지 조회할 수 있습니다. 조회 범위를 줄이거나 직접 입력해 주세요.",
            });
            return;
        }
        busy.current = true;
        setLoading(true);
        setErrors(old =>
            Object.fromEntries(
                Object.entries(old).filter(
                    ([name]) => name !== "request" && !selected.includes(name)
                )
            )
        );
        const request = ++generation.current;
        const controller = new AbortController();
        active.current = controller;
        try {
            for (
                let i = 0;
                i < selected.length && !controller.signal.aborted;
                i += 3
            ) {
                await Promise.allSettled(
                    selected.slice(i, i + 3).map(async name => {
                        try {
                            const quote = await fetchItemPriceSummary(
                                name,
                                controller.signal
                            );
                            if (
                                request === generation.current &&
                                !controller.signal.aborted
                            )
                                onQuote(name, {
                                    ...quote,
                                    observedAt: new Date().toISOString(),
                                });
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
