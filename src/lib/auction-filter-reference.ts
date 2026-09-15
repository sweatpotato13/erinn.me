import reference from "@/data/auction-filter-reference.json";

import {
    normalizeOptionText,
    type parseEnchantContext,
} from "./auction-option-text";

export const auctionFilterReference = reference;
export type AuctionOptionSuggestion = { value: string; label: string };

const enchantsByName = new Map<string, typeof reference.enchants>();
for (const record of reference.enchants) {
    for (const name of record.names) {
        const entries = enchantsByName.get(name) ?? [];
        entries.push(record);
        enchantsByName.set(name, entries);
    }
}

export function matchEnchantAlias(
    candidate: string,
    requested: string,
    context: ReturnType<typeof parseEnchantContext>
): boolean | null {
    if (context.invalidRank) return null;
    const records = (enchantsByName.get(candidate) ?? []).filter(
        record =>
            context.usages.includes(record.usage) &&
            (!context.rank || record.rank === context.rank)
    );
    if (!records.length) return false;
    const results = records.map(record => record.names.includes(requested));
    return results.every(Boolean) ? true : results.some(Boolean) ? null : false;
}

export function enchantSuggestions(position: "prefix" | "suffix") {
    const usages = position === "prefix" ? [0, 11] : [1, 12];
    return reference.enchants
        .filter(record => usages.includes(record.usage))
        .map(record => ({
            value: record.names[0],
            label: `${record.names.join(" / ")} · ${record.usage > 1 ? "유물 " : ""}${position === "prefix" ? "접두" : "접미"} · ${record.rank} 랭크`,
        }));
}

export const reforgeSuggestions = reference.reforges.map(value => ({
    value,
    label: value,
}));

export function echostoneSuggestions(color?: number) {
    return [
        ...new Set(
            reference.echostones
                .filter(entry => color === undefined || entry.id === color)
                .flatMap(entry => entry.names)
        ),
    ].map(value => ({ value, label: value }));
}

export function searchOptionSuggestions(
    options: AuctionOptionSuggestion[],
    text: string
) {
    const query = normalizeOptionText(text).toLocaleLowerCase("ko-KR");
    if (!query || query.length > 100) return [];
    const priority = (option: AuctionOptionSuggestion) =>
        option.value === query ? 0 : option.value.startsWith(query) ? 1 : 2;
    return options
        .filter(option =>
            option.label.toLocaleLowerCase("ko-KR").includes(query)
        )
        .sort(
            (a, b) =>
                priority(a) - priority(b) ||
                a.label.localeCompare(b.label, "ko-KR")
        )
        .filter(
            (option, index, rows) =>
                index === 0 || option.label !== rows[index - 1].label
        )
        .slice(0, 20);
}
