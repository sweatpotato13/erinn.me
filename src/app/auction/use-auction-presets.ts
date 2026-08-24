"use client";

import { useEffect, useState } from "react";

import {
    type AuctionUrlSearch,
    parseAuctionSearchParams,
} from "@/app/auction/use-auction-url-state";
import { categories } from "@/constant/categories";
import {
    type AuctionOptionFilters,
    AuctionOptionFiltersSchema,
    normalizeOptionText,
} from "@/lib/auction-options";

export const AUCTION_PRESETS_KEY = "auctionOptionPresets";
export const MAX_AUCTION_PRESETS = 20;
export const MAX_PRESET_NAME_LENGTH = 50;

export type AuctionPreset = {
    name: string;
    itemName: string;
    category: string;
    optionFilters: Record<string, unknown>;
};

export type PresetOperationResult = {
    success: boolean;
    kind: "success" | "warning" | "error";
    message: string;
};

const FILTER_LABELS = {
    enchantName: "인챈트",
    reforge: "세공",
    erg: "에르그",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export function normalizePresetName(name: string) {
    return normalizeOptionText(name);
}

function parseBaseSearch(itemName: string, category: string) {
    const params = new URLSearchParams();
    if (itemName.trim()) params.set("q", itemName);
    if (category !== categories[0]) params.set("category", category);
    const parsed = parseAuctionSearchParams(params);
    return parsed.invalid ? null : parsed.search;
}

export function parseStoredAuctionPresets(value: string | null) {
    if (!value) return { presets: [] as AuctionPreset[], discardedCount: 0 };
    try {
        const parsed: unknown = JSON.parse(value);
        if (!Array.isArray(parsed)) {
            return { presets: [] as AuctionPreset[], discardedCount: 1 };
        }
        const presets: AuctionPreset[] = [];
        const names = new Set<string>();
        let discardedCount = 0;
        for (const item of parsed) {
            if (
                !isRecord(item) ||
                typeof item.name !== "string" ||
                typeof item.itemName !== "string" ||
                typeof item.category !== "string" ||
                !isRecord(item.optionFilters)
            ) {
                discardedCount++;
                continue;
            }
            const name = normalizePresetName(item.name);
            const search = parseBaseSearch(item.itemName, item.category);
            if (
                !name ||
                name.length > MAX_PRESET_NAME_LENGTH ||
                !search ||
                names.has(name) ||
                presets.length >= MAX_AUCTION_PRESETS
            ) {
                discardedCount++;
                continue;
            }
            names.add(name);
            presets.push({
                name,
                itemName: search.itemName,
                category: search.category,
                optionFilters: { ...item.optionFilters },
            });
        }
        return { presets, discardedCount };
    } catch {
        return { presets: [] as AuctionPreset[], discardedCount: 1 };
    }
}

export function prepareAuctionPresetSearch(preset: AuctionPreset) {
    const optionFilters: AuctionOptionFilters = {};
    const unsupportedConditions: string[] = [];
    for (const [key, value] of Object.entries(preset.optionFilters)) {
        if (!Object.hasOwn(FILTER_LABELS, key)) {
            unsupportedConditions.push(`지원하지 않는 조건 (${key})`);
            continue;
        }
        const parsed = AuctionOptionFiltersSchema.safeParse({ [key]: value });
        if (parsed.success) Object.assign(optionFilters, parsed.data);
        else {
            unsupportedConditions.push(
                `${FILTER_LABELS[key as keyof typeof FILTER_LABELS]} (${key})`
            );
        }
    }
    return {
        search: {
            itemName: preset.itemName,
            category: preset.category,
            optionFilters,
        } satisfies AuctionUrlSearch,
        unsupportedConditions,
    };
}

function validateName(name: string) {
    const normalized = normalizePresetName(name);
    if (!normalized)
        return { name: normalized, error: "프리셋 이름을 입력해주세요." };
    if (normalized.length > MAX_PRESET_NAME_LENGTH) {
        return {
            name: normalized,
            error: `프리셋 이름은 ${MAX_PRESET_NAME_LENGTH}자 이하여야 합니다.`,
        };
    }
    return { name: normalized, error: null };
}

function result(action: string, persisted: boolean): PresetOperationResult {
    return persisted
        ? { success: true, kind: "success", message: `${action}했습니다.` }
        : {
              success: true,
              kind: "warning",
              message: `${action}했지만 브라우저 저장소를 사용할 수 없어 현재 페이지에서만 유지됩니다.`,
          };
}

export function useAuctionPresets() {
    const [presets, setPresets] = useState<AuctionPreset[]>([]);
    const [storageWarning, setStorageWarning] = useState<string | null>(null);

    useEffect(() => {
        try {
            const parsed = parseStoredAuctionPresets(
                localStorage.getItem(AUCTION_PRESETS_KEY)
            );
            setPresets(parsed.presets);
            if (parsed.discardedCount > 0) {
                setStorageWarning(
                    `읽을 수 없는 저장 프리셋 ${parsed.discardedCount}개를 제외했습니다.`
                );
            }
        } catch {
            setStorageWarning(
                "브라우저 저장소를 사용할 수 없어 프리셋을 현재 페이지에서만 관리합니다."
            );
        }
    }, []);

    const save = (next: AuctionPreset[]) => {
        setPresets(next);
        try {
            localStorage.setItem(AUCTION_PRESETS_KEY, JSON.stringify(next));
            setStorageWarning(null);
            return true;
        } catch {
            setStorageWarning(
                "브라우저 저장소를 사용할 수 없어 변경 사항은 현재 페이지에서만 유지됩니다."
            );
            return false;
        }
    };

    const add = (
        rawName: string,
        activeSearch: AuctionUrlSearch | null
    ): PresetOperationResult => {
        if (!activeSearch) {
            return {
                success: false,
                kind: "error",
                message: "먼저 저장할 경매 검색을 실행해주세요.",
            };
        }
        const { name, error } = validateName(rawName);
        if (error) return { success: false, kind: "error", message: error };
        if (presets.some(preset => preset.name === name)) {
            return {
                success: false,
                kind: "error",
                message: "같은 이름의 프리셋이 이미 있습니다.",
            };
        }
        if (presets.length >= MAX_AUCTION_PRESETS) {
            return {
                success: false,
                kind: "error",
                message: `프리셋은 최대 ${MAX_AUCTION_PRESETS}개까지 저장할 수 있습니다.`,
            };
        }
        const baseSearch = parseBaseSearch(
            activeSearch.itemName,
            activeSearch.category
        );
        const optionFilters = AuctionOptionFiltersSchema.safeParse(
            activeSearch.optionFilters
        );
        if (!baseSearch || !optionFilters.success) {
            return {
                success: false,
                kind: "error",
                message: "현재 검색 조건이 올바르지 않아 저장할 수 없습니다.",
            };
        }
        return result(
            "프리셋을 저장",
            save([
                ...presets,
                {
                    name,
                    itemName: baseSearch.itemName,
                    category: baseSearch.category,
                    optionFilters: { ...optionFilters.data },
                },
            ])
        );
    };

    const rename = (
        currentName: string,
        rawName: string
    ): PresetOperationResult => {
        const { name, error } = validateName(rawName);
        if (error) return { success: false, kind: "error", message: error };
        if (!presets.some(preset => preset.name === currentName)) {
            return {
                success: false,
                kind: "error",
                message: "이름을 바꿀 프리셋을 찾지 못했습니다.",
            };
        }
        if (
            name !== currentName &&
            presets.some(preset => preset.name === name)
        ) {
            return {
                success: false,
                kind: "error",
                message: "같은 이름의 프리셋이 이미 있습니다.",
            };
        }
        if (name === currentName) {
            return {
                success: true,
                kind: "success",
                message: "프리셋 이름이 같습니다.",
            };
        }
        return result(
            "프리셋 이름을 변경",
            save(
                presets.map(preset =>
                    preset.name === currentName ? { ...preset, name } : preset
                )
            )
        );
    };

    const remove = (name: string): PresetOperationResult => {
        if (!presets.some(preset => preset.name === name)) {
            return {
                success: false,
                kind: "error",
                message: "삭제할 프리셋을 찾지 못했습니다.",
            };
        }
        return result(
            "프리셋을 삭제",
            save(presets.filter(preset => preset.name !== name))
        );
    };

    return { presets, storageWarning, add, rename, remove };
}
