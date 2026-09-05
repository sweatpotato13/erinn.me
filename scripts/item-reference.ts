import { resolve } from "node:path";

import { hasExcludedKeyword } from "../src/constant/excluded-keywords";

import { readSnapshot } from "./reference-data";

type SourceItem = { Id: number; Name: string; IsAuctionSearchable: boolean };
export type ReferenceItem = { id: string; name: string };
const placeholders = new Set(["", "None", "<nil>"]);
const excludedKeywords = ["피터", "머미", "스폰서", "낡은", "뮤턴트", "점령전"];

// Preserve the pre-migration image: the snapshot adds duplicate ID 4090093.
export const imageIdOverrides: Record<string, string> = {
    "생활 협회 코인 상자": "4090082",
};

export function resolveItems(
    source: SourceItem[],
    strings: Array<{ Id: string; Str: string }>
) {
    const names = new Map(strings.map(row => [row.Id, row.Str]));
    const items: ReferenceItem[] = [];
    const unresolved: Array<{ id: string; key: string }> = [];
    for (const row of [...source].sort((a, b) => a.Id - b.Id)) {
        const name = names.get(row.Name);
        if (
            name === undefined ||
            placeholders.has(name.trim()) ||
            hasExcludedKeyword(name)
        ) {
            unresolved.push({ id: String(row.Id), key: row.Name });
        } else {
            items.push({ id: String(row.Id), name });
        }
    }
    return { items, unresolved };
}

export function readItemReference() {
    const { data } = readSnapshot(resolve(__dirname, "../src/data/reference"));
    return resolveItems(data.ItemList, data.StringTable);
}

export function buildSuggestIndex(items: ReferenceItem[]) {
    const index: Record<string, string[]> = Object.create(null);
    // IsAuctionSearchable is advisory; retain the existing all-name policy.
    for (const name of new Set(items.map(item => item.name))) {
        if (
            name.length < 2 ||
            excludedKeywords.some(keyword => name.includes(keyword))
        )
            continue;
        const prefix = name.substring(0, 2).toLowerCase();
        (index[prefix] ??= []).push(name);
    }
    return index;
}

export function buildItemIdMap(
    items: ReferenceItem[],
    overrides = imageIdOverrides
) {
    const map: Record<string, string> = Object.create(null);
    for (const { id, name } of items) {
        if (!Object.hasOwn(map, name) || Number(id) > Number(map[name]))
            map[name] = id;
    }
    for (const [name, id] of Object.entries(overrides)) {
        if (!items.some(item => item.id === id && item.name === name))
            throw new Error(
                `Image override missing or renamed: ${id} (${name}); review compatibility before regenerating`
            );
        map[name] = id;
    }
    return map;
}
