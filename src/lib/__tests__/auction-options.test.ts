import {
    appendAuctionOptionFilterQuery,
    evaluateAuctionItemOptions,
    parseAuctionOptionFilterQuery,
} from "@/lib/auction-options";
import type { ItemOption } from "@/types/item-option";

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
                reforge: { optionName: "볼트 대미지", minLevel: 10 },
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
                reforge: { optionName: "볼트 대미지", minLevel: 10 },
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
        const filters = { reforge: { optionName: "첫째", minLevel: 1 } };

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
            reforge: { optionName: "볼트  대미지", minLevel: 10 },
            erg: { grade: "S", minLevel: 40 },
        });

        expect(parseAuctionOptionFilterQuery(params)).toEqual({
            success: true,
            filters: {
                enchantName: "여명",
                reforge: { optionName: "볼트 대미지", minLevel: 10 },
                erg: { grade: "S", minLevel: 40 },
            },
        });
    });

    it.each([
        [
            "option_unknown=x",
            "지원하지 않는 장비 옵션 필터입니다: option_unknown",
        ],
        [
            "option_enchant=a&option_enchant=b",
            "장비 옵션 필터는 같은 항목을 한 번만 지정할 수 있습니다: option_enchant",
        ],
        [
            "option_reforge=볼트",
            "세공 옵션 이름과 최소 레벨을 함께 입력해주세요.",
        ],
        [
            "option_reforge=볼트&option_reforge_min_level=1.5",
            "세공 최소 레벨은 1 이상의 정수여야 합니다.",
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
