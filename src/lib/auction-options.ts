import * as z from "zod";

import type { ItemOption } from "@/types/item-option";

import {
    auctionFilterReference,
    matchEnchantAlias,
} from "./auction-filter-reference";
import {
    normalizeOptionText,
    parseEnchantContext,
    parseEnchantName,
} from "./auction-option-text";
import { matchRelicOption, muriasReference } from "./murias-relics";
import { knownTotemStat, TOTEM_STATS, totemTicks } from "./totems";

export { normalizeOptionText, parseEnchantName } from "./auction-option-text";

export type ErgGrade = "B" | "A" | "S";
export const ECHO_INNATE_STATS = {
    strength: "체력",
    intelligence: "지력",
    dexterity: "솜씨",
    will: "의지",
    vitals: "생명력, 마나, 스태미나",
} as const;
export type EchoInnateStat = keyof typeof ECHO_INNATE_STATS;
export type AuctionLevelFilter = { optionName: string; minLevel: number };
export type AuctionOptionFilters = {
    enchantName?: string;
    enchantPrefix?: string;
    enchantSuffix?: string;
    reforges?: AuctionLevelFilter[];
    erg?: { grade?: ErgGrade; minLevel?: number };
    echostone?: {
        color?: number;
        minGrade?: number;
        awakening?: AuctionLevelFilter;
        innate?: { stat: EchoInnateStat; minValue: number };
    };
    murias?: { effectId: number; minLevel: number };
    totem?: Record<string, number>;
};
export const MAX_OPTION_QUERY_LENGTH = 8192;
const QUERY_LENGTH_ERROR = "검색 필터가 너무 깁니다. 조건을 줄여주세요.";
const REFORGE_CONFLICT_ERROR =
    "구형 세공 조건과 새 세공 조건을 함께 지정할 수 없습니다.";
export type MatchResult = "match" | "no-match" | "unknown";

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
const levelFilterSchema = z
    .object({
        optionName: optionNameSchema("옵션 이름"),
        minLevel: positiveLevelSchema,
    })
    .strict();
const ergGradeSchema = z.preprocess(
    value =>
        typeof value === "string"
            ? normalizeOptionText(value).toUpperCase()
            : value,
    z.enum(["B", "A", "S"], { error: "에르그 등급은 B, A, S만 지원합니다." })
);
const nonemptyGroup = (value: object) =>
    Object.values(value).some(entry => entry !== undefined);
const canonicalSchema = z
    .object({
        enchantName: optionNameSchema("인챈트 이름").optional(),
        enchantPrefix: optionNameSchema("접두 인챈트 이름").optional(),
        enchantSuffix: optionNameSchema("접미 인챈트 이름").optional(),
        reforges: z
            .array(levelFilterSchema)
            .min(1)
            .max(3, "세공 조건은 최대 3개까지 지정할 수 있습니다.")
            .refine(
                rows =>
                    new Set(rows.map(row => row.optionName)).size ===
                    rows.length,
                "같은 세공 옵션을 중복 지정할 수 없습니다."
            )
            .optional(),
        erg: z
            .object({
                grade: ergGradeSchema.optional(),
                minLevel: positiveLevelSchema.optional(),
            })
            .strict()
            .optional(),
        echostone: z
            .object({
                color: z
                    .number()
                    .int()
                    .refine(
                        value =>
                            auctionFilterReference.echostones.some(
                                color => color.id === value
                            ),
                        "에코스톤 종류를 확인해주세요."
                    )
                    .optional(),
                minGrade: positiveLevelSchema
                    .max(30, "에코스톤 등급은 1~30입니다.")
                    .optional(),
                awakening: levelFilterSchema.optional(),
                innate: z
                    .object({
                        stat: z.enum([
                            "strength",
                            "intelligence",
                            "dexterity",
                            "will",
                            "vitals",
                        ]),
                        minValue: z
                            .number()
                            .int()
                            .min(0)
                            .max(Number.MAX_SAFE_INTEGER),
                    })
                    .strict()
                    .optional(),
            })
            .strict()
            .refine(nonemptyGroup, "에코스톤 조건을 입력해주세요.")
            .optional(),
        murias: z
            .object({
                effectId: z
                    .number()
                    .int()
                    .refine(
                        value =>
                            muriasReference.effects.some(
                                effect => effect.id === value
                            ),
                        "유물 효과를 확인해주세요."
                    ),
                minLevel: positiveLevelSchema.max(
                    10,
                    "유물 레벨은 1~10입니다."
                ),
            })
            .strict()
            .optional(),
        totem: z
            .unknown()
            .superRefine((value, ctx) => {
                if (
                    value &&
                    typeof value === "object" &&
                    Object.keys(value).some(key => !knownTotemStat(key))
                )
                    ctx.addIssue({
                        code: "custom",
                        message: "지원하지 않는 토템 능력치입니다.",
                    });
            })
            .pipe(z.record(z.string(), z.number()))
            .superRefine((values, ctx) => {
                const entries = Object.entries(values);
                if (
                    !entries.length ||
                    entries.length > Object.keys(TOTEM_STATS).length
                )
                    ctx.addIssue({
                        code: "custom",
                        message: "토템 능력치 조건을 확인해주세요.",
                    });
                for (const [stat, value] of entries) {
                    if (
                        !knownTotemStat(stat) ||
                        totemTicks(stat, String(value)) === null
                    )
                        ctx.addIssue({
                            code: "custom",
                            path: [stat],
                            message:
                                "토템 능력치의 종류·수치·소수 자릿수를 확인해주세요.",
                        });
                }
            })
            .optional(),
    })
    .strict();

export const AuctionOptionFiltersSchema = z
    .unknown()
    .transform((value, ctx) => {
        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            Object.hasOwn(value, "reforge")
        ) {
            if (Object.hasOwn(value, "reforges")) {
                ctx.addIssue({
                    code: "custom",
                    message: REFORGE_CONFLICT_ERROR,
                });
                return z.NEVER;
            }
            const { reforge, ...rest } = value as Record<string, unknown>;
            return { ...rest, reforges: [reforge] };
        }
        return value;
    })
    .pipe(canonicalSchema)
    .refine(
        filters =>
            serializeOptionFilters(filters).toString().length <=
            MAX_OPTION_QUERY_LENGTH,
        QUERY_LENGTH_ERROR
    );

export function hasAuctionOptionFilters(
    filters: AuctionOptionFilters | null | undefined
) {
    return Boolean(
        filters &&
        (filters.enchantName ||
            filters.enchantPrefix ||
            filters.enchantSuffix ||
            filters.reforges?.length ||
            filters.erg ||
            filters.echostone ||
            filters.murias ||
            (filters.totem && Object.keys(filters.totem).length))
    );
}

export function parseReforgeOptionValue(value: string | null | undefined) {
    const text = normalizeOptionText(value);
    const match =
        text.match(/^(.+?)\((\d+)레벨:(.+)\)$/) ??
        text.match(/^(.+?)\s+(\d+)\s*레벨$/);
    if (!match) return null;
    const name = normalizeOptionText(match[1]),
        level = Number(match[2]);
    return name && Number.isSafeInteger(level) && level > 0
        ? { name, level, effect: match[3]?.trim() ?? "" }
        : null;
}

export function parseErgOptionValue(option: ItemOption) {
    const grade = normalizeOptionText(option.option_sub_type).toUpperCase();
    return {
        grade: grade || null,
        level: parseInteger(option.option_value ?? null, 0),
    };
}

function combineAny(results: MatchResult[]): MatchResult {
    return results.includes("match")
        ? "match"
        : results.includes("unknown")
          ? "unknown"
          : "no-match";
}
function combineAll(results: MatchResult[]): MatchResult {
    return results.includes("no-match")
        ? "no-match"
        : results.includes("unknown")
          ? "unknown"
          : "match";
}
function result(matches: boolean): MatchResult {
    return matches ? "match" : "no-match";
}
function optionsOfType(options: ItemOption[], type: string) {
    return options.filter(option => option.option_type === type);
}
function matchSingle(
    options: ItemOption[],
    type: string,
    evaluate: (option: ItemOption) => MatchResult
): MatchResult {
    const entries = optionsOfType(options, type);
    return !entries.length
        ? "no-match"
        : entries.length !== 1
          ? "unknown"
          : evaluate(entries[0]);
}
function matchEnchant(
    options: ItemOption[],
    name: string,
    position?: "prefix" | "suffix"
): MatchResult {
    const entries = optionsOfType(options, "인챈트");
    if (!position)
        return combineAny(
            entries.map(option => {
                const candidate = parseEnchantName(option.option_value);
                return candidate === null
                    ? "unknown"
                    : result(candidate === name);
            })
        );
    const relevant = entries
        .map(option => ({
            option,
            context: parseEnchantContext(
                option.option_value,
                option.option_sub_type
            ),
        }))
        .filter(
            ({ context }) => !context.position || context.position === position
        );
    if (!relevant.length) return "no-match";
    if (relevant.length !== 1) return "unknown";
    const { option, context } = relevant[0];
    const candidate = parseEnchantName(option.option_value);
    if (context.conflictingPosition || !context.position || candidate === null)
        return "unknown";
    if (candidate === name) return "match";
    const alias = matchEnchantAlias(candidate, name, context);
    return alias === null ? "unknown" : result(alias);
}
function matchReforge(
    options: ItemOption[],
    filter: AuctionLevelFilter
): MatchResult {
    const candidates = optionsOfType(options, "세공 옵션").map(option =>
        parseReforgeOptionValue(option.option_value)
    );
    const matching = candidates.filter(
        candidate => candidate?.name === filter.optionName
    );
    if (matching.length > 1) return "unknown";
    if (matching.length) return result(matching[0]!.level >= filter.minLevel);
    return candidates.includes(null) ? "unknown" : "no-match";
}
function matchErg(
    options: ItemOption[],
    filter: NonNullable<AuctionOptionFilters["erg"]>
): MatchResult {
    return combineAny(
        optionsOfType(options, "에르그").map(option => {
            const candidate = parseErgOptionValue(option),
                results: MatchResult[] = [];
            if (filter.grade)
                results.push(
                    candidate.grade === null
                        ? "unknown"
                        : result(candidate.grade === filter.grade)
                );
            if (filter.minLevel !== undefined)
                results.push(
                    candidate.level === null
                        ? "unknown"
                        : result(candidate.level >= filter.minLevel)
                );
            return combineAll(results);
        })
    );
}

type AuctionOptionItem = {
    item_name?: string;
    item_option?: ItemOption[] | null;
};
export function parseEchoAwakening(
    value: string | null | undefined,
    itemName?: string
) {
    const text = normalizeOptionText(value);
    const match = text.match(/^(.+?)\s+(\d+)\s*레벨(?:\s*\([^()]*\))?$/);
    if (match) {
        const level = Number(match[2]);
        return Number.isSafeInteger(level) && level > 0
            ? { name: match[1], level }
            : null;
    }
    const color = auctionFilterReference.echostones.find(
        entry => entry.name === itemName
    );
    const fixed = auctionFilterReference.fixedAwakenings.find(
        entry => entry.color === color?.id && entry.name === text
    );
    return fixed ? { name: fixed.name, level: fixed.level } : null;
}
function matchEchostone(
    item: AuctionOptionItem,
    options: ItemOption[],
    filter: NonNullable<AuctionOptionFilters["echostone"]>
): MatchResult {
    const results: MatchResult[] = [];
    if (filter.color !== undefined) {
        const color = auctionFilterReference.echostones.find(
            entry => entry.name === item.item_name
        );
        results.push(
            color
                ? result(color.id === filter.color)
                : !item.item_name ||
                    options.some(option =>
                        option.option_type.startsWith("에코스톤 ")
                    )
                  ? "unknown"
                  : "no-match"
        );
    }
    if (filter.minGrade !== undefined)
        results.push(
            matchSingle(options, "에코스톤 등급", option => {
                const grade = parseInteger(option.option_value ?? null, 1);
                return grade === null || grade > 30
                    ? "unknown"
                    : result(grade >= filter.minGrade!);
            })
        );
    if (filter.awakening)
        results.push(
            matchSingle(options, "에코스톤 각성 능력", option => {
                const candidate = parseEchoAwakening(
                    option.option_value,
                    item.item_name
                );
                return candidate
                    ? result(
                          candidate.name === filter.awakening!.optionName &&
                              candidate.level >= filter.awakening!.minLevel
                      )
                    : "unknown";
            })
        );
    if (filter.innate)
        results.push(
            matchSingle(options, "에코스톤 고유 능력", option => {
                if (!option.option_sub_type) return "unknown";
                if (
                    normalizeOptionText(option.option_sub_type) !==
                    ECHO_INNATE_STATS[filter.innate!.stat]
                )
                    return "no-match";
                const value = parseInteger(option.option_value ?? null, 0);
                return value === null
                    ? "unknown"
                    : result(value >= filter.innate!.minValue);
            })
        );
    return combineAll(results);
}
function matchItemOptions(
    item: AuctionOptionItem,
    filters: AuctionOptionFilters
): MatchResult {
    const options = item.item_option ?? [],
        results: MatchResult[] = [];
    if (filters.enchantName)
        results.push(matchEnchant(options, filters.enchantName));
    if (filters.enchantPrefix)
        results.push(matchEnchant(options, filters.enchantPrefix, "prefix"));
    if (filters.enchantSuffix)
        results.push(matchEnchant(options, filters.enchantSuffix, "suffix"));
    for (const filter of filters.reforges ?? [])
        results.push(matchReforge(options, filter));
    if (filters.erg) results.push(matchErg(options, filters.erg));
    if (filters.echostone)
        results.push(matchEchostone(item, options, filters.echostone));
    if (filters.murias) {
        const match = matchRelicOption(options);
        results.push(
            match
                ? result(
                      match.effectId === filters.murias.effectId &&
                          match.level >= filters.murias.minLevel
                  )
                : optionsOfType(options, "무리아스 유물").length
                  ? "unknown"
                  : "no-match"
        );
    }
    for (const [stat, minimum] of Object.entries(filters.totem ?? {})) {
        const entries = options.filter(
            option =>
                option.option_type === "토템 효과" &&
                option.option_sub_type === TOTEM_STATS[stat].subtype
        );
        const value =
            entries.length === 1
                ? totemTicks(stat, entries[0].option_value)
                : null;
        results.push(
            !entries.length
                ? "no-match"
                : value === null
                  ? "unknown"
                  : result(value >= totemTicks(stat, String(minimum))!)
        );
    }
    return combineAll(results);
}
export function evaluateAuctionItemOptions<T extends AuctionOptionItem>(
    items: T[],
    filters: AuctionOptionFilters
) {
    const normalizedFilters = AuctionOptionFiltersSchema.parse(filters);
    let unevaluableCount = 0;
    const matchingItems = items.filter(item => {
        const match = matchItemOptions(item, normalizedFilters);
        if (match === "unknown") unevaluableCount++;
        return match === "match";
    });
    return {
        items: matchingItems,
        scannedCount: items.length,
        unevaluableCount,
    };
}

const FILTER_KEYS = [
    "option_enchant",
    "option_enchant_prefix",
    "option_enchant_suffix",
    "option_reforge",
    "option_reforge_min_level",
    ...[1, 2, 3].flatMap(index => [
        `option_reforge_${index}`,
        `option_reforge_${index}_min_level`,
    ]),
    "option_erg",
    "option_erg_grade",
    "option_erg_min_level",
    "option_echo_color",
    "option_echo_min_grade",
    "option_echo_awakening",
    "option_echo_awakening_min_level",
    "option_echo_stat",
    "option_echo_min_value",
    "option_murias_effect",
    "option_murias_min_level",
    ...Object.keys(TOTEM_STATS).map(stat => `option_totem_${stat}`),
];
const filterKeySet = new Set(FILTER_KEYS);
function parseInteger(value: string | null, minimum: number): number | null {
    if (value === null || !/^\d+$/.test(value.trim())) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= minimum ? number : null;
}
function queryInteger(
    params: URLSearchParams,
    key: string,
    minimum = 1
): number | undefined {
    const text = params.get(key);
    if (text === null) return undefined;
    if (!(minimum === 0 ? /^(0|[1-9]\d*)$/ : /^[1-9]\d*$/).test(text))
        throw new Error("최소 레벨·등급·수치는 유효한 정수여야 합니다.");
    const number = parseInteger(text, minimum);
    if (number === null) throw new Error("최소 레벨·등급·수치가 너무 큽니다.");
    return number;
}
function queryPair(
    params: URLSearchParams,
    nameKey: string,
    levelKey: string,
    label: string
): AuctionLevelFilter | undefined {
    const name = params.get(nameKey);
    if ((name === null) !== !params.has(levelKey))
        throw new Error(`${label} 이름과 최소 레벨을 함께 입력해주세요.`);
    if (name === null) return undefined;
    return { optionName: name, minLevel: queryInteger(params, levelKey)! };
}
function readReforges(params: URLSearchParams) {
    const legacy = queryPair(
        params,
        "option_reforge",
        "option_reforge_min_level",
        "세공 옵션"
    );
    const rows: AuctionLevelFilter[] = [];
    for (let index = 1; index <= 3; index++) {
        const row = queryPair(
            params,
            `option_reforge_${index}`,
            `option_reforge_${index}_min_level`,
            "세공 옵션"
        );
        if (row) {
            if (legacy) throw new Error(REFORGE_CONFLICT_ERROR);
            if (rows.length !== index - 1)
                throw new Error("세공 조건은 1번부터 순서대로 지정해주세요.");
            rows.push(row);
        }
    }
    return legacy ? [legacy] : rows.length ? rows : undefined;
}
function readEcho(params: URLSearchParams): AuctionOptionFilters["echostone"] {
    if (![...params.keys()].some(key => key.startsWith("option_echo_")))
        return undefined;
    const stat = params.get("option_echo_stat"),
        value = queryInteger(params, "option_echo_min_value", 0);
    if ((stat === null) !== (value === undefined))
        throw new Error("에코스톤 고유 능력과 최소 수치를 함께 입력해주세요.");
    return {
        color: queryInteger(params, "option_echo_color"),
        minGrade: queryInteger(params, "option_echo_min_grade"),
        awakening: queryPair(
            params,
            "option_echo_awakening",
            "option_echo_awakening_min_level",
            "에코스톤 각성 옵션"
        ),
        ...(stat !== null && value !== undefined
            ? { innate: { stat: stat as EchoInnateStat, minValue: value } }
            : {}),
    };
}
function readFilterQuery(params: URLSearchParams) {
    const filters: AuctionOptionFilters = {};
    for (const [field, key] of [
        ["enchantName", "option_enchant"],
        ["enchantPrefix", "option_enchant_prefix"],
        ["enchantSuffix", "option_enchant_suffix"],
    ] as const) {
        if (params.has(key)) filters[field] = params.get(key)!;
    }
    const reforges = readReforges(params);
    if (reforges) filters.reforges = reforges;
    const presence = params.get("option_erg");
    if (presence !== null && presence !== "present")
        throw new Error("에르그 존재 조건은 present만 지원합니다.");
    const ergLevel = queryInteger(params, "option_erg_min_level"),
        grade = params.get("option_erg_grade");
    if (presence || grade !== null || ergLevel !== undefined)
        filters.erg = {
            ...(grade === null ? {} : { grade: grade as ErgGrade }),
            ...(ergLevel === undefined ? {} : { minLevel: ergLevel }),
        };
    const echo = readEcho(params);
    if (echo) filters.echostone = echo;
    const effectId = queryInteger(params, "option_murias_effect"),
        minLevel = queryInteger(params, "option_murias_min_level");
    if ((effectId === undefined) !== (minLevel === undefined))
        throw new Error("유물 효과와 최소 레벨을 함께 입력해주세요.");
    if (effectId !== undefined && minLevel !== undefined)
        filters.murias = { effectId, minLevel };
    const stats: Array<[string, number]> = [];
    for (const stat of Object.keys(TOTEM_STATS)) {
        const value = params.get(`option_totem_${stat}`);
        if (value === null) continue;
        if (!/^\d+(?:\.\d+)?$/.test(value) || totemTicks(stat, value) === null)
            throw new Error("토템 최소 수치와 소수 자릿수를 확인해주세요.");
        stats.push([stat, Number(value)]);
    }
    if (stats.length) filters.totem = Object.fromEntries(stats);
    return filters;
}
export function parseAuctionOptionFilterQuery(
    params: URLSearchParams
):
    | { success: true; filters: AuctionOptionFilters | null }
    | { success: false; error: string } {
    try {
        const entries = [...params].filter(([key]) =>
            key.startsWith("option_")
        );
        if (!entries.length) return { success: true, filters: null };
        if (
            new URLSearchParams(entries).toString().length >
            MAX_OPTION_QUERY_LENGTH
        )
            throw new Error(QUERY_LENGTH_ERROR);
        for (const [key] of entries) {
            if (!filterKeySet.has(key))
                throw new Error(`지원하지 않는 검색 필터입니다: ${key}`);
            if (params.getAll(key).length !== 1)
                throw new Error(
                    `검색 필터는 같은 항목을 한 번만 지정할 수 있습니다: ${key}`
                );
        }
        const parsed = AuctionOptionFiltersSchema.safeParse(
            readFilterQuery(params)
        );
        return parsed.success
            ? { success: true, filters: parsed.data }
            : {
                  success: false,
                  error:
                      parsed.error.issues[0]?.message ??
                      "검색 필터가 올바르지 않습니다.",
              };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "검색 필터가 올바르지 않습니다.",
        };
    }
}
function serializeOptionFilters(filters: AuctionOptionFilters) {
    const params = new URLSearchParams();
    if (filters.enchantName) params.set("option_enchant", filters.enchantName);
    if (filters.enchantPrefix)
        params.set("option_enchant_prefix", filters.enchantPrefix);
    if (filters.enchantSuffix)
        params.set("option_enchant_suffix", filters.enchantSuffix);
    filters.reforges?.forEach((filter, index) => {
        params.set(`option_reforge_${index + 1}`, filter.optionName);
        params.set(
            `option_reforge_${index + 1}_min_level`,
            String(filter.minLevel)
        );
    });
    if (filters.erg) {
        params.set("option_erg", "present");
        if (filters.erg.grade)
            params.set("option_erg_grade", filters.erg.grade);
        if (filters.erg.minLevel !== undefined)
            params.set("option_erg_min_level", String(filters.erg.minLevel));
    }
    const echo = filters.echostone;
    if (echo?.color !== undefined)
        params.set("option_echo_color", String(echo.color));
    if (echo?.minGrade !== undefined)
        params.set("option_echo_min_grade", String(echo.minGrade));
    if (echo?.awakening) {
        params.set("option_echo_awakening", echo.awakening.optionName);
        params.set(
            "option_echo_awakening_min_level",
            String(echo.awakening.minLevel)
        );
    }
    if (echo?.innate) {
        params.set("option_echo_stat", echo.innate.stat);
        params.set("option_echo_min_value", String(echo.innate.minValue));
    }
    if (filters.murias) {
        params.set("option_murias_effect", String(filters.murias.effectId));
        params.set("option_murias_min_level", String(filters.murias.minLevel));
    }
    for (const stat of Object.keys(filters.totem ?? {}).sort())
        params.set(`option_totem_${stat}`, String(filters.totem![stat]));
    return params;
}
export function appendAuctionOptionFilterQuery(
    params: URLSearchParams,
    filters: AuctionOptionFilters
) {
    const parsed = AuctionOptionFiltersSchema.parse(filters);
    for (const key of [...params.keys()])
        if (key.startsWith("option_")) params.delete(key);
    for (const [key, value] of serializeOptionFilters(parsed))
        params.set(key, value);
    return params;
}
