import { resolve } from "node:path";

import { normalizeOptionText } from "../src/lib/auction-options";
import { readSnapshot } from "./reference-data";

interface SourceEnchant {
    Id: number;
    Name: string;
    Name2: string;
    Desc: string;
    Usage: number;
    Level: number;
}

export function resolveEnchants(
    source: SourceEnchant[],
    strings: Array<{ Id: string; Str: string }>
) {
    // Legacy exact listing spellings; source names remain intact. No numeric fallback.
    const listingAliases: Record<number, string> = {
        30809: "다크크로스",
        30505: "다이어울프",
        20714: "실버폭스",
    };
    const localized = new Map(strings.map(row => [row.Id, row.Str]));
    const text = (key: string) => {
        const value = localized.get(key);
        return value &&
            !/^(?:None|<nil>)$|not found key|optionset\.\d+/i.test(value)
            ? value
            : "";
    };
    const ranks = [
        "연습",
        "F",
        "E",
        "D",
        "C",
        "B",
        "A",
        "9",
        "8",
        "7",
        "6",
        "5",
        "4",
        "3",
        "2",
        "1",
    ];
    return [...source]
        .sort((a, b) => a.Id - b.Id)
        .filter(row => [0, 1, 11, 12].includes(row.Usage))
        .flatMap(row => {
            const names = [
                ...new Set(
                    [text(row.Name), text(row.Name2)]
                        .map(normalizeOptionText)
                        .filter(Boolean)
                ),
            ];
            if (!names.length) return [];
            if (
                listingAliases[row.Id] &&
                !names.includes(listingAliases[row.Id])
            )
                names.push(listingAliases[row.Id]);
            return [
                {
                    id: row.Id,
                    names,
                    usage: row.Usage,
                    rank: ranks[row.Level] ?? "",
                    description: text(row.Desc),
                },
            ];
        });
}

export function readEnchantReference() {
    const { data } = readSnapshot(resolve(__dirname, "../src/data/reference"));
    return resolveEnchants(data.OptionSetList, data.StringTable);
}
