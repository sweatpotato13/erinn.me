import * as z from "zod";

import type { ItemOption } from "@/types/item-option";

export type ErgGrade = "B" | "A" | "S";

export type AuctionOptionFilters = {
    enchantName?: string;
    reforge?: { optionName: string; minLevel: number };
    erg?: { grade?: ErgGrade; minLevel?: number };
};

type MatchResult = "match" | "no-match" | "unknown";

const FILTER_KEYS = [
    "option_enchant",
    "option_reforge",
    "option_reforge_min_level",
    "option_erg",
    "option_erg_grade",
    "option_erg_min_level",
] as const;
const filterKeySet = new Set<string>(FILTER_KEYS);

export function normalizeOptionText(value: string | null | undefined) {
    return (value ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

function optionNameSchema(label: string) {
    return z
        .string()
        .transform(normalizeOptionText)
        .pipe(
            z
                .string()
                .min(1, `${label}을(를) 입력해주세요.`)
                .max(100, `${label}은(는) 100자 이하여야 합니다.`)
        );
}

const positiveLevelSchema = z
    .number()
    .int("최소 레벨은 정수여야 합니다.")
    .positive("최소 레벨은 1 이상이어야 합니다.")
    .max(Number.MAX_SAFE_INTEGER, "최소 레벨이 너무 큽니다.");

const ergGradeSchema = z.preprocess(
    value =>
        typeof value === "string"
            ? normalizeOptionText(value).toUpperCase()
            : value,
    z.enum(["B", "A", "S"], {
        error: "에르그 등급은 B, A, S만 지원합니다.",
    })
);

export const AuctionOptionFiltersSchema = z
    .object({
        enchantName: optionNameSchema("인챈트 이름").optional(),
        reforge: z
            .object({
                optionName: optionNameSchema("세공 옵션 이름"),
                minLevel: positiveLevelSchema,
            })
            .strict()
            .optional(),
        erg: z
            .object({
                grade: ergGradeSchema.optional(),
                minLevel: positiveLevelSchema.optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

export function hasAuctionOptionFilters(
    filters: AuctionOptionFilters | null | undefined
) {
    return Boolean(filters?.enchantName || filters?.reforge || filters?.erg);
}

export function parseEnchantName(value: string | null | undefined) {
    const name = normalizeOptionText(
        normalizeOptionText(value).split("(", 1)[0]
    );
    return name || null;
}

export function parseReforgeOptionValue(value: string | null | undefined) {
    const match = (value ?? "").trim().match(/^(.+?)\((\d+)레벨:(.+)\)$/);
    if (!match) return null;
    const name = normalizeOptionText(match[1]);
    const level = Number(match[2]);
    if (!name || !Number.isSafeInteger(level)) return null;
    return { name, level, effect: match[3].trim() };
}

export function parseErgOptionValue(option: ItemOption) {
    const grade = normalizeOptionText(option.option_sub_type).toUpperCase();
    const levelText = normalizeOptionText(option.option_value);
    const level = /^\d+$/.test(levelText) ? Number(levelText) : null;
    return {
        grade: grade || null,
        level: level !== null && Number.isSafeInteger(level) ? level : null,
    };
}

function combineAny(results: MatchResult[]): MatchResult {
    if (results.includes("match")) return "match";
    return results.includes("unknown") ? "unknown" : "no-match";
}

function combineAll(results: MatchResult[]): MatchResult {
    if (results.includes("no-match")) return "no-match";
    return results.includes("unknown") ? "unknown" : "match";
}

function matchingOptions(
    options: ItemOption[],
    type: string,
    evaluate: (option: ItemOption) => MatchResult
) {
    const relevant = options.filter(option => option.option_type === type);
    return relevant.length
        ? combineAny(relevant.map(evaluate))
        : ("no-match" as const);
}

function matchEnchant(options: ItemOption[], name: string) {
    return matchingOptions(options, "인챈트", option => {
        const candidate = parseEnchantName(option.option_value);
        return candidate === null
            ? "unknown"
            : candidate === name
              ? "match"
              : "no-match";
    });
}

function matchReforge(
    options: ItemOption[],
    filter: NonNullable<AuctionOptionFilters["reforge"]>
) {
    return matchingOptions(options, "세공 옵션", option => {
        const candidate = parseReforgeOptionValue(option.option_value);
        if (!candidate) return "unknown";
        return candidate.name === filter.optionName &&
            candidate.level >= filter.minLevel
            ? "match"
            : "no-match";
    });
}

function matchErg(
    options: ItemOption[],
    filter: NonNullable<AuctionOptionFilters["erg"]>
) {
    return matchingOptions(options, "에르그", option => {
        const candidate = parseErgOptionValue(option);
        const results: MatchResult[] = [];
        if (filter.grade) {
            results.push(
                candidate.grade === null
                    ? "unknown"
                    : candidate.grade === filter.grade
                      ? "match"
                      : "no-match"
            );
        }
        if (filter.minLevel !== undefined) {
            results.push(
                candidate.level === null
                    ? "unknown"
                    : candidate.level >= filter.minLevel
                      ? "match"
                      : "no-match"
            );
        }
        return combineAll(results);
    });
}

function matchItemOptions(
    options: ItemOption[],
    filters: AuctionOptionFilters
) {
    const results: MatchResult[] = [];
    if (filters.enchantName)
        results.push(matchEnchant(options, filters.enchantName));
    if (filters.reforge) results.push(matchReforge(options, filters.reforge));
    if (filters.erg) results.push(matchErg(options, filters.erg));
    return combineAll(results);
}

export function evaluateAuctionItemOptions<
    T extends { item_option?: ItemOption[] | null },
>(items: T[], filters: AuctionOptionFilters) {
    const normalizedFilters = AuctionOptionFiltersSchema.parse(filters);
    let unevaluableCount = 0;
    const matchingItems = items.filter(item => {
        const result = matchItemOptions(
            item.item_option ?? [],
            normalizedFilters
        );
        if (result === "unknown") unevaluableCount++;
        return result === "match";
    });
    return {
        items: matchingItems,
        scannedCount: items.length,
        unevaluableCount,
    };
}

type ParsedFilterQuery =
    | { success: true; filters: AuctionOptionFilters | null }
    | { success: false; error: string };

function parsePositiveLevel(value: string | null): number | null {
    if (value === null || !/^[1-9]\d*$/.test(value)) return null;
    const level = Number(value);
    return Number.isSafeInteger(level) ? level : null;
}

export function parseAuctionOptionFilterQuery(
    params: URLSearchParams
): ParsedFilterQuery {
    const optionKeys = Array.from(new Set(params.keys())).filter(key =>
        key.startsWith("option_")
    );
    const unsupported = optionKeys.find(key => !filterKeySet.has(key));
    if (unsupported) {
        return {
            success: false,
            error: `지원하지 않는 장비 옵션 필터입니다: ${unsupported}`,
        };
    }
    const duplicate = optionKeys.find(key => params.getAll(key).length > 1);
    if (duplicate) {
        return {
            success: false,
            error: `장비 옵션 필터는 같은 항목을 한 번만 지정할 수 있습니다: ${duplicate}`,
        };
    }
    if (optionKeys.length === 0) return { success: true, filters: null };

    const reforgeName = params.get("option_reforge");
    const reforgeLevelText = params.get("option_reforge_min_level");
    if ((reforgeName === null) !== (reforgeLevelText === null)) {
        return {
            success: false,
            error: "세공 옵션 이름과 최소 레벨을 함께 입력해주세요.",
        };
    }
    const reforgeLevel = parsePositiveLevel(reforgeLevelText);
    if (reforgeLevelText !== null && reforgeLevel === null) {
        return {
            success: false,
            error: "세공 최소 레벨은 1 이상의 정수여야 합니다.",
        };
    }

    const ergPresence = params.get("option_erg");
    if (ergPresence !== null && ergPresence !== "present") {
        return {
            success: false,
            error: "에르그 존재 조건은 present만 지원합니다.",
        };
    }
    const ergLevelText = params.get("option_erg_min_level");
    const ergLevel = parsePositiveLevel(ergLevelText);
    if (ergLevelText !== null && ergLevel === null) {
        return {
            success: false,
            error: "에르그 최소 레벨은 1 이상의 정수여야 합니다.",
        };
    }

    const rawFilters: AuctionOptionFilters = {};
    const enchantName = params.get("option_enchant");
    if (enchantName !== null) rawFilters.enchantName = enchantName;
    if (reforgeName !== null && reforgeLevel !== null) {
        rawFilters.reforge = {
            optionName: reforgeName,
            minLevel: reforgeLevel,
        };
    }
    const ergGrade = params.get("option_erg_grade");
    if (ergPresence || ergGrade !== null || ergLevel !== null) {
        rawFilters.erg = {
            ...(ergGrade === null ? {} : { grade: ergGrade as ErgGrade }),
            ...(ergLevel === null ? {} : { minLevel: ergLevel }),
        };
    }
    const parsed = AuctionOptionFiltersSchema.safeParse(rawFilters);
    return parsed.success
        ? { success: true, filters: parsed.data }
        : {
              success: false,
              error:
                  parsed.error.issues[0]?.message ??
                  "장비 옵션 필터가 올바르지 않습니다.",
          };
}

export function appendAuctionOptionFilterQuery(
    params: URLSearchParams,
    filters: AuctionOptionFilters
) {
    for (const key of FILTER_KEYS) params.delete(key);
    const parsed = AuctionOptionFiltersSchema.parse(filters);
    if (parsed.enchantName) params.set("option_enchant", parsed.enchantName);
    if (parsed.reforge) {
        params.set("option_reforge", parsed.reforge.optionName);
        params.set("option_reforge_min_level", String(parsed.reforge.minLevel));
    }
    if (parsed.erg) {
        params.set("option_erg", "present");
        if (parsed.erg.grade) params.set("option_erg_grade", parsed.erg.grade);
        if (parsed.erg.minLevel !== undefined)
            params.set("option_erg_min_level", String(parsed.erg.minLevel));
    }
    return params;
}
