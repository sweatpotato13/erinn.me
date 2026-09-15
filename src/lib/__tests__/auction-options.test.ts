import filterEvidence from "@/data/auction-filter-evidence.json";
import {
    appendAuctionOptionFilterQuery,
    evaluateAuctionItemOptions,
    parseAuctionOptionFilterQuery,
} from "@/lib/auction-options";
import type { ItemOption } from "@/types/item-option";

import {
    type AuctionOptionFilters,
    AuctionOptionFiltersSchema,
    hasAuctionOptionFilters,
    MAX_OPTION_QUERY_LENGTH,
    parseEchoAwakening,
    parseReforgeOptionValue,
} from "../auction-options";
import { TOTEM_STATS } from "../totems";
import filterFixture from "./fixtures/auction-filter-options.json";
import relicFixtures from "./fixtures/murias-options.json";
import totemFixtures from "./fixtures/totem-listings.json";

function item(...item_option: ItemOption[]) {
    return { item_option };
}

function option(
    option_type: string,
    option_value: string | null,
    option_sub_type?: string | null
): ItemOption {
    return { option_type, option_value, option_sub_type };
}

describe("auction option matching", () => {
    it("matches normalized exact enchant names without partial matching", () => {
        const exact = item(option("인챈트", "  여명 (접두) "));
        const partial = item(option("인챈트", "찬란한 여명"));
        const missing = item();

        expect(
            evaluateAuctionItemOptions([exact, partial, missing], {
                enchantName: "여명",
            })
        ).toEqual({
            items: [exact],
            scannedCount: 3,
            unevaluableCount: 0,
        });
    });

    it("compares only reforge names and levels", () => {
        const boundary = item(
            option("세공 옵션", "볼트 대미지(10레벨:대미지 1% 증가)")
        );
        const wrongName = item(
            option("세공 옵션", "마법 공격력(20레벨:대미지 999% 증가)")
        );
        const malformed = item(option("세공 옵션", "볼트 대미지 20"));

        expect(
            evaluateAuctionItemOptions([boundary, wrongName, malformed], {
                reforges: [{ optionName: "볼트 대미지", minLevel: 10 }],
            })
        ).toEqual({
            items: [boundary],
            scannedCount: 3,
            unevaluableCount: 1,
        });
    });

    it("supports Erg presence, exact grade, and minimum level", () => {
        const gradeAndLevel = item(option("에르그", "40", "s"));
        const lowerLevel = item(option("에르그", "39", "S"));
        const malformed = item(option("에르그", "unknown", null));

        expect(
            evaluateAuctionItemOptions([gradeAndLevel, lowerLevel, malformed], {
                erg: { grade: "S", minLevel: 40 },
            })
        ).toEqual({
            items: [gradeAndLevel],
            scannedCount: 3,
            unevaluableCount: 1,
        });
        expect(
            evaluateAuctionItemOptions([malformed], { erg: {} }).items
        ).toEqual([malformed]);
    });

    it("uses OR within an option type and three-valued AND across filters", () => {
        const match = item(
            option("인챈트", "여명"),
            option("세공 옵션", "깨진 값"),
            option("세공 옵션", "볼트 대미지(12레벨:효과)")
        );
        const definiteMiss = item(
            option("인챈트", "다른 이름"),
            option("세공 옵션", "깨진 값")
        );

        expect(
            evaluateAuctionItemOptions([match, definiteMiss], {
                enchantName: "여명",
                reforges: [{ optionName: "볼트 대미지", minLevel: 10 }],
            })
        ).toEqual({
            items: [match],
            scannedCount: 2,
            unevaluableCount: 0,
        });
    });

    it("does not mutate source items and stays deterministic", () => {
        const items = [
            item(
                option("세공 옵션", "둘째(2레벨:효과)"),
                option("세공 옵션", "첫째(1레벨:효과)")
            ),
        ];
        const before = JSON.parse(JSON.stringify(items));
        const filters = { reforges: [{ optionName: "첫째", minLevel: 1 }] };

        expect(evaluateAuctionItemOptions(items, filters)).toEqual(
            evaluateAuctionItemOptions(items, filters)
        );
        expect(items).toEqual(before);
    });
});

describe("auction option filter query", () => {
    it("round-trips normalized supported filters", () => {
        const params = appendAuctionOptionFilterQuery(new URLSearchParams(), {
            enchantName: "  여명  ",
            reforges: [{ optionName: "볼트  대미지", minLevel: 10 }],
            erg: { grade: "S", minLevel: 40 },
        });

        expect(parseAuctionOptionFilterQuery(params)).toEqual({
            success: true,
            filters: {
                enchantName: "여명",
                reforges: [{ optionName: "볼트 대미지", minLevel: 10 }],
                erg: { grade: "S", minLevel: 40 },
            },
        });
    });

    it.each([
        ["option_unknown=x", "지원하지 않는 검색 필터입니다: option_unknown"],
        [
            "option_enchant=a&option_enchant=b",
            "검색 필터는 같은 항목을 한 번만 지정할 수 있습니다: option_enchant",
        ],
        [
            "option_reforge=볼트",
            "세공 옵션 이름과 최소 레벨을 함께 입력해주세요.",
        ],
        [
            "option_reforge=볼트&option_reforge_min_level=1.5",
            "최소 레벨·등급·수치는 유효한 정수여야 합니다.",
        ],
        ["option_erg=missing", "에르그 존재 조건은 present만 지원합니다."],
        ["option_erg_grade=C", "에르그 등급은 B, A, S만 지원합니다."],
    ])("rejects invalid query %s", (query, error) => {
        expect(
            parseAuctionOptionFilterQuery(new URLSearchParams(query))
        ).toEqual({ success: false, error });
    });

    it("treats an absent option query as unfiltered", () => {
        expect(
            parseAuctionOptionFilterQuery(
                new URLSearchParams("item_name=롱 소드")
            )
        ).toEqual({ success: true, filters: null });
    });
});

// Current listing formats observed on 2026-09-15; threshold/invalid cases are synthetic.
describe("expanded search filters", () => {
    it("matches separate enchant positions and verified aliases without requiring descriptions", () => {
        const listing = item(
            option("인챈트", "브로큰 (랭크 C)", "접두"),
            option("인챈트", "야상곡", "접미")
        );
        expect(
            evaluateAuctionItemOptions([listing], {
                enchantPrefix: "망가진",
                enchantSuffix: "녹턴",
            }).items
        ).toEqual([listing]);
        expect(
            evaluateAuctionItemOptions([listing], { enchantPrefix: "녹턴" })
                .items
        ).toEqual([]);
        expect(
            evaluateAuctionItemOptions([listing], { enchantName: "망가진" })
                .items
        ).toEqual([]);
        expect(
            evaluateAuctionItemOptions([listing], {
                enchantName: "야상곡",
                enchantPrefix: "브로큰",
            }).items
        ).toEqual([listing]);
        for (const subtype of [null, "접두 접미"]) {
            expect(
                evaluateAuctionItemOptions(
                    [item(option("인챈트", "브로큰", subtype))],
                    { enchantPrefix: "브로큰" }
                ).unevaluableCount
            ).toBe(1);
        }
        expect(
            evaluateAuctionItemOptions(
                [item(option("인챈트", "편린", "유물 접미"))],
                { enchantSuffix: "편린" }
            ).items
        ).toHaveLength(1);
    });

    it("matches three distinct reforge thresholds regardless of listing order and preserves plain text levels", () => {
        const listing = item(
            ...filterFixture.reforges
                .map(value => option("세공 옵션", value))
                .reverse()
        );
        const filters = {
            reforges: [
                { optionName: "매그넘 샷 대미지", minLevel: 19 },
                { optionName: "컴뱃 마스터리 최대 대미지", minLevel: 19 },
                { optionName: "마나실드 마나 1당 대미지 방어량", minLevel: 11 },
            ],
        };
        expect(evaluateAuctionItemOptions([listing], filters).items).toEqual([
            listing,
        ]);
        expect(
            evaluateAuctionItemOptions([listing], {
                reforges: [
                    ...filters.reforges.slice(0, 2),
                    {
                        optionName: "마나실드 마나 1당 대미지 방어량",
                        minLevel: 12,
                    },
                ],
            }).items
        ).toEqual([]);
        expect(parseReforgeOptionValue(filterFixture.reforges[2])).toEqual({
            name: "마나실드 마나 1당 대미지 방어량",
            level: 11,
            effect: "",
        });
        expect(
            evaluateAuctionItemOptions(
                [item(option("세공 옵션", "체력 25 레벨"))],
                { reforges: [{ optionName: "체력", minLevel: 25 }] }
            ).items
        ).toHaveLength(1);
        expect(
            evaluateAuctionItemOptions(
                [
                    item(
                        option("세공 옵션", "체력 20 레벨"),
                        option("세공 옵션", "체력 25 레벨")
                    ),
                ],
                { reforges: [{ optionName: "체력", minLevel: 20 }] }
            ).unevaluableCount
        ).toBe(1);
    });

    it("separates echo grade, awakening and innate values", () => {
        const filters: AuctionOptionFilters = {
            echostone: {
                color: 3,
                minGrade: 30,
                awakening: {
                    optionName: "보우 마스터리 최대 대미지",
                    minLevel: 20,
                },
                innate: { stat: "dexterity", minValue: 100 },
            },
        };
        expect(
            evaluateAuctionItemOptions([filterFixture.echo], filters).items
        ).toHaveLength(1);
        expect(
            evaluateAuctionItemOptions([filterFixture.echo], {
                echostone: { color: 2 },
            }).items
        ).toEqual([]);
        const unawakened = {
            ...filterFixture.echo,
            item_option: filterFixture.echo.item_option.slice(0, 2),
        };
        expect(
            evaluateAuctionItemOptions([unawakened], {
                echostone: { minGrade: 30 },
            }).items
        ).toHaveLength(1);
        expect(evaluateAuctionItemOptions([unawakened], filters).items).toEqual(
            []
        );
        const black = {
            item_name: "블랙 에코스톤",
            item_option: [
                option("에코스톤 고유 능력", "91", "생명력, 마나, 스태미나"),
            ],
        };
        expect(
            evaluateAuctionItemOptions([black], {
                echostone: { innate: { stat: "vitals", minValue: 92 } },
            }).items
        ).toEqual([]);
        expect(
            evaluateAuctionItemOptions([item(option("에코스톤 등급", "30"))], {
                echostone: { color: 3 },
            }).unevaluableCount
        ).toBe(1);
    });

    it("handles observed echo spellings and only the verified unnumbered fixed effect", () => {
        for (const row of filterEvidence.observedAwakenings) {
            expect(parseEchoAwakening(row.value)?.name).toBe(row.name);
            expect(
                evaluateAuctionItemOptions(
                    [item(option("에코스톤 각성 능력", row.value))],
                    {
                        echostone: {
                            awakening: { optionName: row.name, minLevel: 1 },
                        },
                    }
                ).items
            ).toHaveLength(1);
        }
        const fixed = filterEvidence.fixedAwakenings[0];
        expect(parseEchoAwakening(fixed.name, "레드 에코스톤")).toEqual({
            name: fixed.name,
            level: 1,
        });
        expect(parseEchoAwakening(fixed.name, "블루 에코스톤")).toBeNull();
        expect(
            parseEchoAwakening("알 수 없는 효과", "레드 에코스톤")
        ).toBeNull();
        expect(
            evaluateAuctionItemOptions(
                [
                    {
                        item_name: "레드 에코스톤",
                        item_option: [option("에코스톤 각성 능력", fixed.name)],
                    },
                ],
                {
                    echostone: {
                        awakening: { optionName: fixed.name, minLevel: 2 },
                    },
                }
            ).items
        ).toEqual([]);
    });

    it("reuses relic effect matching without excluding enchanted listings", () => {
        for (const fixture of relicFixtures) {
            const listing = item(
                fixture.option,
                option("인챈트", "편린", "유물 접미")
            );
            expect(
                evaluateAuctionItemOptions([listing], {
                    murias: { effectId: fixture.effectId, minLevel: 1 },
                    enchantSuffix: "편린",
                }).items
            ).toEqual([listing]);
        }
        expect(
            evaluateAuctionItemOptions(
                [item(option("무리아스 유물", "미등록 효과 100%"))],
                { murias: { effectId: 73001, minLevel: 1 } }
            ).unevaluableCount
        ).toBe(1);
    });

    it("compares totem ticks independently without item reference bounds", () => {
        for (const [stat, meta] of Object.entries(TOTEM_STATS)) {
            const listing = item(option("토템 효과", "0", meta.subtype));
            expect(
                evaluateAuctionItemOptions([listing], { totem: { [stat]: 0 } })
                    .items
            ).toEqual([listing]);
        }
        const listing = item(
            option("토템 효과", "0.4", "보너스 대미지"),
            option("토템 효과", "3%", "이동속도 증가"),
            option("토템 효과", "9.000001", "힐링 효과")
        );
        expect(
            evaluateAuctionItemOptions([listing], {
                totem: { bonusdamage: 0.4, speed: 3, healing: 9.000001 },
            }).items
        ).toEqual([listing]);
        expect(
            evaluateAuctionItemOptions([listing], {
                totem: { bonusdamage: 0.5 },
            }).items
        ).toEqual([]);
        const duplicate = item(
            option("토템 효과", "3", "체력"),
            option("토템 효과", "9", "체력")
        );
        expect(
            evaluateAuctionItemOptions([duplicate], { totem: { strength: 1 } })
                .unevaluableCount
        ).toBe(1);
        const all = totemFixtures.find(row =>
            row.item_name.startsWith("콜튼")
        )!;
        expect(
            evaluateAuctionItemOptions([all], {
                totem: {
                    strength: 9,
                    dexterity: 13,
                    intelligence: 5,
                    will: 13,
                    luck: 7,
                },
            }).items
        ).toEqual([all]);
        expect(
            evaluateAuctionItemOptions([all], { totem: { strength: 10 } }).items
        ).toEqual([]);
    });
});

describe("expanded filter encoding", () => {
    const filters: AuctionOptionFilters = {
        enchantName: "여명",
        enchantPrefix: "브로큰",
        enchantSuffix: "녹턴",
        reforges: [
            { optionName: "체력", minLevel: 25 },
            { optionName: "지력", minLevel: 10 },
        ],
        erg: {},
        echostone: {
            color: 3,
            minGrade: 30,
            awakening: {
                optionName: "보우 마스터리 최대 대미지",
                minLevel: 20,
            },
            innate: { stat: "dexterity", minValue: 0 },
        },
        totem: { healing: 0.000001, bonusdamage: 0.4, strength: 0 },
    };
    it.each(["echo", "totem", "relic"])(
        "round-trips %s with equipment filters",
        kind => {
            const current = { ...filters };
            if (kind === "echo") delete current.totem;
            else delete current.echostone;
            if (kind === "relic") {
                delete current.totem;
                current.murias = { effectId: 73020, minLevel: 1 };
            }
            const params = appendAuctionOptionFilterQuery(
                new URLSearchParams(),
                current
            );
            const parsed = parseAuctionOptionFilterQuery(params);
            expect(parsed).toEqual({ success: true, filters: current });
            if (kind === "totem")
                expect(params.get("option_totem_healing")).toBe("0.000001");
            expect(params.has("option_reforge")).toBe(false);
            expect(
                appendAuctionOptionFilterQuery(
                    new URLSearchParams(),
                    parsed.success ? parsed.filters! : {}
                ).toString()
            ).toBe(params.toString());
            for (const [key, value] of Object.entries(filters))
                expect(hasAuctionOptionFilters({ [key]: value })).toBe(true);
        }
    );
    it("migrates legacy single reforge without changing the any-position enchant", () => {
        expect(
            parseAuctionOptionFilterQuery(
                new URLSearchParams(
                    "option_enchant=여명&option_reforge=체력&option_reforge_min_level=20"
                )
            )
        ).toEqual({
            success: true,
            filters: {
                enchantName: "여명",
                reforges: [{ optionName: "체력", minLevel: 20 }],
            },
        });
        expect(
            AuctionOptionFiltersSchema.parse({
                reforge: { optionName: "체력", minLevel: 20 },
            })
        ).toEqual({ reforges: [{ optionName: "체력", minLevel: 20 }] });
        expect(
            AuctionOptionFiltersSchema.safeParse({
                reforge: { optionName: "체력", minLevel: 20 },
                reforges: [{ optionName: "체력", minLevel: 20 }],
            }).success
        ).toBe(false);
    });
    it.each([
        "option_reforge_1=체력",
        "option_reforge_2=체력&option_reforge_2_min_level=20",
        "option_reforge_4=체력",
        "option_reforge_01=체력",
        "option_reforge=체력&option_reforge_min_level=20&option_reforge_1=체력&option_reforge_1_min_level=20",
        "option_reforge_1=체력&option_reforge_1_min_level=20&option_reforge_2=체력&option_reforge_2_min_level=25",
        "option_echo_min_grade=31",
        "option_echo_color=6",
        "option_echo_awakening=체력",
        "option_echo_stat=strength",
        "option_echo_min_value=0",
        "option_murias_effect=73001",
        "option_murias_effect=999&option_murias_min_level=1",
        "option_murias_effect=73001&option_murias_min_level=11",
        "option_totem___proto__=1",
        "option_totem_strength=NaN",
        "option_totem_strength=1.5",
        "option_totem_bonusdamage=0.01",
        "option_totem_healing=0.0000001",
        "option_totem_healing=1e-6",
        "option_totem_strength=1&option_totem_strength=2",
        "option_enchant_prefix=a&option_enchant_prefix=b",
    ])("rejects invalid or conflicting query %s", query =>
        expect(
            parseAuctionOptionFilterQuery(new URLSearchParams(query)).success
        ).toBe(false)
    );
    it.each([
        { echostone: {} },
        { totem: {} },
        { reforges: [] },
        {
            reforges: Array.from({ length: 4 }, (_, i) => ({
                optionName: String(i),
                minLevel: 1,
            })),
        },
        { totem: { strength: -1 } },
        { totem: { strength: Infinity } },
        {
            echostone: {
                innate: { stat: "strength", minValue: 0, extra: true },
            },
        },
    ])("rejects malformed canonical groups %j", value =>
        expect(AuctionOptionFiltersSchema.safeParse(value).success).toBe(false)
    );
    it("bounds encoded filter input without charging unrelated cursors", () => {
        expect(
            parseAuctionOptionFilterQuery(
                new URLSearchParams({
                    option_enchant: "가".repeat(MAX_OPTION_QUERY_LENGTH),
                })
            ).success
        ).toBe(false);
        expect(
            parseAuctionOptionFilterQuery(
                new URLSearchParams({
                    option_enchant: "여명",
                    cursor: "x".repeat(MAX_OPTION_QUERY_LENGTH),
                })
            ).success
        ).toBe(true);
    });
});

it("rejects unsupported raw totem keys before record parsing can discard them", () => {
    expect(
        AuctionOptionFiltersSchema.safeParse(
            JSON.parse('{"totem":{"maxdamage":0,"__proto__":1}}')
        ).success
    ).toBe(false);
});

it.each([
    { murias: { effectId: 73020, minLevel: 1 }, echostone: { color: 1 } },
    { murias: { effectId: 73020, minLevel: 1 }, totem: { maxdamage: 0 } },
    { echostone: { color: 1 }, totem: { maxdamage: 0 } },
])("rejects competing automatic search targets: %j", filters => {
    expect(AuctionOptionFiltersSchema.safeParse(filters).success).toBe(false);
});
