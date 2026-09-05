import records from "@/data/enchant-index.json";

import { normalizeOptionText, parseEnchantName } from "./auction-options";

type EnchantReference = (typeof records)[number];
const byName = new Map<string, EnchantReference[]>();
for (const record of records) {
    for (const name of record.names) {
        const key = normalizeOptionText(name);
        const matches = byName.get(key) ?? [];
        matches.push(record);
        byName.set(key, matches);
    }
}

export function findEnchantReference(
    value: string | null | undefined,
    subtype?: string | null
) {
    const name = parseEnchantName(value);
    if (!name) return null;
    const context = `${subtype ?? ""} ${value?.includes("(") ? value.slice(value.indexOf("(")) : ""}`;
    const prefix = context.includes("접두");
    const suffix = context.includes("접미");
    if (prefix && suffix) return null;
    const relic = context.includes("유물");
    const usages = prefix
        ? relic
            ? [11]
            : [0, 11]
        : suffix
          ? relic
              ? [12]
              : [1, 12]
          : relic
            ? [11, 12]
            : [0, 1, 11, 12];
    const ranks = [
        ...context.matchAll(
            /(?:랭크\s*([1-9A-F]|연습)(?![0-9A-Za-z])|(?<![0-9A-Za-z])([1-9A-F]|연습)\s*랭크)/gi
        ),
    ].map(match => (match[1] ?? match[2]).toUpperCase());
    if ((context.includes("랭크") && !ranks.length) || new Set(ranks).size > 1)
        return null;
    const matches = (byName.get(name) ?? []).filter(
        record =>
            usages.includes(record.usage) &&
            (!ranks.length || record.rank === ranks[0])
    );
    return matches.length === 1 ? matches[0] : null;
}
