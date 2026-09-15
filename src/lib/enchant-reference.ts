import records from "@/data/enchant-index.json";

import {
    normalizeOptionText,
    parseEnchantContext,
    parseEnchantName,
} from "./auction-option-text";
import { enchantDescriptionLines } from "./enchant-effects";

type EnchantReference = (typeof records)[number];
const byName = new Map<string, EnchantReference[]>();
for (const record of records) {
    const reference = {
        ...record,
        description: enchantDescriptionLines(record.description)
            .filter(line => line !== "[인챈트 추출 불가]")
            .join("\n"),
    };
    for (const name of record.names) {
        const key = normalizeOptionText(name);
        const matches = byName.get(key) ?? [];
        matches.push(reference);
        byName.set(key, matches);
    }
}

export function findEnchantReference(
    value: string | null | undefined,
    subtype?: string | null
) {
    const name = parseEnchantName(value);
    if (!name) return null;
    const context = parseEnchantContext(value, subtype);
    if (context.conflictingPosition || context.invalidRank) return null;
    const matches = (byName.get(name) ?? []).filter(
        record =>
            context.usages.includes(record.usage) &&
            (!context.rank || record.rank === context.rank)
    );
    const first = matches[0];
    // Different source IDs can describe the same enchantment.
    if (
        matches.length > 1 &&
        matches.some(
            record =>
                !record.description ||
                record.description !== first.description ||
                record.usage !== first.usage ||
                record.rank !== first.rank
        )
    )
        return null;
    return first ?? null;
}
