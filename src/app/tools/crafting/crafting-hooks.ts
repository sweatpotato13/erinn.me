"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchBarterMaterials } from "@/app/tools/barter/barter-hooks";
import type { CraftingItem, CraftingReference } from "@/lib/crafting";
import {
    CRAFTING_STORAGE_KEY,
    type CraftingPlan,
    craftingPlanIssues,
    CraftingPlanSchema,
    emptyCraftingPlan,
    parseCraftingShare,
    parseCraftingStorage,
    serializeCraftingStorage,
} from "@/lib/crafting-state";

export function useCraftingPlan(reference: CraftingReference) {
    const [plan, setPlan] = useState(() => emptyCraftingPlan(reference));
    const current = useRef(plan);
    const canSave = useRef(false);
    const [ready, setReady] = useState(false);
    const [temporary, setTemporary] = useState(false);
    const [notice, setNotice] = useState("");
    const [backup, setBackup] = useState("");
    const [needsReview, setNeedsReview] = useState(false);
    const [epoch, setEpoch] = useState(0);

    const restore = useCallback(() => {
        let raw: string | null = null;
        let readError = "";
        try {
            raw = localStorage.getItem(CRAFTING_STORAGE_KEY);
        } catch {
            readError =
                "저장소를 사용할 수 없습니다. 현재 입력으로 계속 계산할 수 있습니다.";
        }
        const saved = parseCraftingStorage(raw);
        const shared = parseCraftingShare(window.location.search, reference);
        const isTemporary = !!window.location.search;
        // Even a malformed share is isolated from the device's existing plan.
        const next = isTemporary
            ? (shared.plan ?? emptyCraftingPlan(reference))
            : (saved.plan ?? emptyCraftingPlan(reference));
        const reviewed = !craftingPlanIssues(next, reference).length;
        canSave.current =
            !isTemporary && !readError && !saved.error && reviewed;
        current.current = next;
        setPlan(next);
        setTemporary(isTemporary);
        setNeedsReview(!canSave.current && !isTemporary);
        setBackup(saved.error ? (raw ?? "") : "");
        setNotice(
            [shared.error, saved.error, readError].filter(Boolean).join(" ")
        );
        setEpoch(value => value + 1);
        setReady(true);
    }, [reference]);
    useEffect(() => {
        restore();
        window.addEventListener("popstate", restore);
        return () => window.removeEventListener("popstate", restore);
    }, [restore]);

    const persist = useCallback((next: CraftingPlan) => {
        try {
            localStorage.setItem(
                CRAFTING_STORAGE_KEY,
                serializeCraftingStorage(next)
            );
            return true;
        } catch {
            setNotice(
                "계획을 저장하지 못했습니다. 현재 입력을 텍스트로 내보내 주세요."
            );
            return false;
        }
    }, []);
    const update = useCallback(
        (change: (plan: CraftingPlan) => CraftingPlan) => {
            if (!ready) return;
            try {
                const next = CraftingPlanSchema.parse(change(current.current));
                current.current = next;
                setPlan(next);
                if (canSave.current) persist(next);
            } catch {
                setNotice(
                    "입력 형식이나 계획 크기를 확인해 주세요. 이전 계획은 유지했습니다."
                );
            }
        },
        [ready, persist]
    );

    function adopt(data: CraftingReference) {
        const next = {
            ...current.current,
            sourceVersion: data.sourceVersion,
            referenceVersion: data.version,
            ruleVersion: data.ruleVersion,
        };
        const issues = craftingPlanIssues(next, data);
        if (issues.length) {
            setNotice(issues.join(" "));
            return;
        }
        if (current.current.ruleVersion !== data.ruleVersion) {
            next.choices = Object.fromEntries(
                Object.entries(next.choices).map(([id, choice]) => [
                    id,
                    { ...choice, yield: "", passes: "" },
                ])
            );
        }
        if (!persist(next)) return;
        current.current = next;
        setPlan(next);
        canSave.current = true;
        setTemporary(false);
        setNeedsReview(false);
        setBackup("");
        window.history.replaceState(null, "", window.location.pathname);
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
        needsReview,
        epoch,
        adopt,
        openSaved,
    };
}

/** Only missing target IDs need the existing bounded, local identity endpoint. */
export function useCraftingItems(
    reference: CraftingReference,
    plan: CraftingPlan,
    epoch: number
) {
    const [items, setItems] = useState<CraftingItem[]>([]);
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    const [attempt, retry] = useState(0);
    const known = new Set(reference.items.map(item => item.id));
    const ids = [...new Set(plan.targets.map(target => target.itemId))]
        .filter(id => !known.has(id))
        .sort((a, b) => a - b)
        .join(",");
    useEffect(() => {
        const controller = new AbortController();
        setError("");
        setItems([]);
        setPending(!!ids);
        if (!ids) return;
        void fetchBarterMaterials(
            new URLSearchParams({ ids }),
            reference.sourceVersion,
            controller.signal
        )
            .then(response => {
                if (controller.signal.aborted) return;
                const found = new Set(response.materials.map(item => item.id));
                setItems(response.materials);
                const missing = ids
                    .split(",")
                    .filter(id => !found.has(Number(id)));
                if (missing.length)
                    setError(
                        `현재 자료에 없는 아이템: ${missing.join(", ")}. 원래 입력은 유지했습니다.`
                    );
            })
            .catch(() => {
                if (!controller.signal.aborted)
                    setError(
                        "아이템 확인에 실패했습니다. 입력을 유지했으니 다시 시도해 주세요."
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setPending(false);
            });
        return () => controller.abort();
    }, [ids, reference.sourceVersion, epoch, attempt]);
    return { items, error, pending, retry: () => retry(value => value + 1) };
}
