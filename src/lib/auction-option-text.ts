export function normalizeOptionText(value: string | null | undefined) {
    return (value ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

export function parseEnchantName(value: string | null | undefined) {
    return (
        normalizeOptionText(normalizeOptionText(value).split("(", 1)[0]) || null
    );
}

export function parseEnchantContext(
    value: string | null | undefined,
    subtype?: string | null
) {
    const context = `${subtype ?? ""} ${value?.includes("(") ? value.slice(value.indexOf("(")) : ""}`;
    const prefix = context.includes("접두");
    const suffix = context.includes("접미");
    const relic = context.includes("유물");
    const ranks = [
        ...context.matchAll(
            /(?:랭크\s*([1-9A-F]|연습)(?![0-9A-Za-z])|(?<![0-9A-Za-z])([1-9A-F]|연습)\s*랭크)/gi
        ),
    ].map(match => (match[1] ?? match[2]).toUpperCase());
    return {
        position:
            prefix === suffix
                ? null
                : prefix
                  ? ("prefix" as const)
                  : ("suffix" as const),
        conflictingPosition: prefix && suffix,
        relic,
        rank: ranks[0] ?? null,
        invalidRank:
            (context.includes("랭크") && !ranks.length) ||
            new Set(ranks).size > 1,
        usages: prefix
            ? relic
                ? [11]
                : [0, 11]
            : suffix
              ? relic
                  ? [12]
                  : [1, 12]
              : relic
                ? [11, 12]
                : [0, 1, 11, 12],
    };
}
