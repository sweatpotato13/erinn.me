"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { categories } from "@/constant/categories";

const ITEM_QUERY_PARAM = "q";
const CATEGORY_QUERY_PARAM = "category";
const MAX_ITEM_QUERY_LENGTH = 100;
const DEFAULT_CATEGORY = categories[0];

export type AuctionUrlSearch = {
    itemName: string;
    category: string;
};

export type AuctionUrlFeedback = {
    message: string;
    kind: "success" | "info" | "error";
};

export function parseAuctionSearchParams(params: URLSearchParams) {
    const normalized = new URLSearchParams(params);
    const itemValues = params.getAll(ITEM_QUERY_PARAM);
    const itemName = (itemValues[0] ?? "").trim();
    const usableItemName =
        itemName.length > 0 && itemName.length <= MAX_ITEM_QUERY_LENGTH;
    const invalidItemName =
        params.has(ITEM_QUERY_PARAM) &&
        (itemValues.length !== 1 || !usableItemName);
    const categoryValues = params.getAll(CATEGORY_QUERY_PARAM);
    const categoryValue = categoryValues[0] ?? DEFAULT_CATEGORY;
    const usableCategory = categories.includes(categoryValue);
    const invalidCategory =
        params.has(CATEGORY_QUERY_PARAM) &&
        (categoryValues.length !== 1 || !usableCategory);
    const category = usableCategory ? categoryValue : DEFAULT_CATEGORY;

    if (usableItemName) normalized.set(ITEM_QUERY_PARAM, itemName);
    else normalized.delete(ITEM_QUERY_PARAM);
    if (category !== DEFAULT_CATEGORY) {
        normalized.set(CATEGORY_QUERY_PARAM, category);
    } else {
        normalized.delete(CATEGORY_QUERY_PARAM);
    }

    const search =
        usableItemName || category !== DEFAULT_CATEGORY
            ? { itemName: usableItemName ? itemName : "", category }
            : null;
    return {
        search,
        normalized,
        invalid: invalidItemName || invalidCategory,
    };
}

export function setAuctionSearchUrl(currentUrl: URL, search: AuctionUrlSearch) {
    const url = new URL(currentUrl);
    const itemName = search.itemName.trim();
    if (itemName) url.searchParams.set(ITEM_QUERY_PARAM, itemName);
    else url.searchParams.delete(ITEM_QUERY_PARAM);
    if (search.category !== DEFAULT_CATEGORY) {
        url.searchParams.set(CATEGORY_QUERY_PARAM, search.category);
    } else {
        url.searchParams.delete(CATEGORY_QUERY_PARAM);
    }
    const parsed = parseAuctionSearchParams(url.searchParams);
    url.search = parsed.normalized.toString();
    return { ...parsed, url };
}

async function copyUrl(url: string) {
    if (!navigator.clipboard) throw new Error("Clipboard is unavailable");
    await navigator.clipboard.writeText(url);
}

function useTransientFeedback() {
    const [feedback, setFeedback] = useState<AuctionUrlFeedback | null>(null);
    useEffect(() => {
        if (!feedback) return;
        const timer = setTimeout(() => setFeedback(null), 3000);
        return () => clearTimeout(timer);
    }, [feedback]);
    return { feedback, setFeedback };
}

function useUrlRestoration(
    paramsKey: string,
    onRestore: (search: AuctionUrlSearch | null) => void,
    setFeedback: (feedback: AuctionUrlFeedback) => void
) {
    const restoreRef = useRef(onRestore);
    const restoredKeyRef = useRef<string | null>(null);
    restoreRef.current = onRestore;
    useEffect(() => {
        const parsed = parseAuctionSearchParams(new URLSearchParams(paramsKey));
        if (parsed.invalid) {
            setFeedback({
                message:
                    "유효하지 않은 검색 링크의 일부 조건을 기본값으로 복원했습니다.",
                kind: "error",
            });
        }
        const normalizedKey = parsed.normalized.toString();
        if (normalizedKey !== paramsKey) {
            const url = new URL(window.location.href);
            url.search = normalizedKey;
            window.history.replaceState(null, "", url);
            return;
        }
        if (restoredKeyRef.current === paramsKey) return;
        restoredKeyRef.current = paramsKey;
        restoreRef.current(parsed.search);
    }, [paramsKey, setFeedback]);
    return restoreRef;
}

async function shareUrl(url: string): Promise<AuctionUrlFeedback> {
    if (typeof navigator.share !== "function") {
        await copyUrl(url);
        return { message: "검색 링크를 복사했습니다.", kind: "success" };
    }
    try {
        await navigator.share({ title: "Erinn.me 경매장 검색", url });
        return { message: "검색 링크를 공유했습니다.", kind: "success" };
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return { message: "공유를 취소했습니다.", kind: "info" };
        }
        await copyUrl(url);
        return { message: "검색 링크를 복사했습니다.", kind: "success" };
    }
}

export function useAuctionUrlState(
    onRestore: (search: AuctionUrlSearch | null) => void
) {
    const paramsKey = useSearchParams().toString();
    const { feedback, setFeedback } = useTransientFeedback();
    const [sharing, setSharing] = useState(false);
    const restoreRef = useUrlRestoration(paramsKey, onRestore, setFeedback);
    const commit = (itemName: string, category: string) => {
        const next = setAuctionSearchUrl(new URL(window.location.href), {
            itemName,
            category,
        });
        if (next.invalid) {
            setFeedback({
                message: "유효하지 않은 검색 조건을 기본값으로 복원했습니다.",
                kind: "error",
            });
        } else if (!next.search) {
            setFeedback({
                message: "아이템명 또는 카테고리를 선택해주세요.",
                kind: "error",
            });
        }
        if (next.url.href === window.location.href) {
            restoreRef.current(next.search);
            return;
        }
        window.history.pushState(null, "", next.url);
    };

    const parsed = parseAuctionSearchParams(new URLSearchParams(paramsKey));
    const canShare =
        !!parsed.search && parsed.normalized.toString() === paramsKey;
    const share = async () => {
        if (!canShare || sharing) return;
        setSharing(true);
        try {
            setFeedback(await shareUrl(window.location.href));
        } catch {
            setFeedback({
                message: "검색 링크를 공유하거나 복사하지 못했습니다.",
                kind: "error",
            });
        } finally {
            setSharing(false);
        }
    };

    return { canShare, commit, feedback, share, sharing };
}
