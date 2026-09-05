import {
    compareEnchantEffect,
    enchantDescriptionLines,
    parseEnchantEffect,
    referenceEffects,
} from "../enchant-effects";
import { findEnchantReference } from "../enchant-reference";

const description = (name: string) => findEnchantReference(name)!.description;

describe("enchant reference identity", () => {
    it("resolves aliases and legacy listing spellings without changing search normalization", () => {
        expect(findEnchantReference("  녹턴 (접미) ")).toEqual(
            findEnchantReference("야상곡")
        );
        expect(findEnchantReference("다크크로스")).toEqual(
            findEnchantReference("다크 크로스")
        );
        expect(findEnchantReference("실버폭스")).toEqual(
            findEnchantReference("은 여우")
        );
        expect(findEnchantReference("어스름한", "접두")).toMatchObject({
            id: 21639,
            rank: "6",
            usage: 0,
        });
    });
    it("requires enough identity context, never chooses a colliding name by value", () => {
        expect(findEnchantReference("스네이크")).toBeNull();
        expect(findEnchantReference("스네이크", "접두")?.id).toBe(206);
        expect(findEnchantReference("스네이크 (접미)")?.id).toBe(31101);
        expect(findEnchantReference("견고한", "접두")).toBeNull();
        expect(findEnchantReference("견고한 (A 랭크)", "접두")?.id).toBe(20602);
        expect(findEnchantReference("견고한 (랭크 5)", "접두")?.id).toBe(21102);
        expect(findEnchantReference("견고한", "접두 접미")).toBeNull();
        expect(findEnchantReference("견고한 (랭크 10)", "접두")).toBeNull();
        expect(
            findEnchantReference("견고한 (A 랭크, 5 랭크)", "접두")
        ).toBeNull();
        expect(findEnchantReference("어스름한", "접미")).toBeNull();
        expect(findEnchantReference("편린", "접미")).toMatchObject({
            usage: 12,
            id: 31790,
        });
        expect(findEnchantReference("편린", "유물 접미")).toMatchObject({
            usage: 12,
        });
        expect(findEnchantReference("편린", "접두")).toBeNull();
        expect(findEnchantReference("알 수 없음")).toBeNull();
        expect(findEnchantReference(null)).toBeNull();
    });
});

describe("effect parsing and best rolls", () => {
    it.each([
        ["마법 공격력 0~1.5 증가", { min: 0, max: 1.5, unit: "" }],
        ["[수리비 200% 증가]", { min: 200, max: 200, unit: "%" }],
        ["체력 -5~-1 증가", { min: -5, max: -1 }],
        ["체력 +0 증가", { min: 0, max: 0 }],
        ["크리티컬 0.3 % 증가", { min: 0.3, unit: "%" }],
        ["솜씨20감소", { min: 20, direction: "감소" }],
        ["프로즌 블래스트 동결 시간 2초 증가", { min: 2, unit: "초" }],
        ["상점 판매가 25만 Gold 증가", { min: 250000, unit: "Gold" }],
    ])("parses %s", (text, expected) =>
        expect(parseEnchantEffect(text)).toMatchObject(expected)
    );

    it.each([
        "마법 공격력 3~1 증가",
        "마법 공격력 NaN 증가",
        "알 수 없는 효과 10 증가",
        "시즌 2 최대대미지 15 증가",
        "최대대미지 1 증가 추가 효과",
        "최대대미지 1~2~3 증가",
        "수리비 2배",
        "최대대미지 1.2.3 증가",
    ])("leaves unsupported text unresolved: %s", text => {
        expect(parseEnchantEffect(text)).toBeNull();
    });

    it("preserves actual values, zero minima, decimals and signed benefit direction", () => {
        expect(
            compareEnchantEffect("마법 공격력 60 증가", description("어스름한"))
        ).toMatchObject({
            best: 65,
            difference: -5,
            outsideRange: false,
            referenceText: expect.stringContaining("3단 이상일 때"),
        });
        expect(
            compareEnchantEffect("마법 공격력 65 증가", description("어스름한"))
                ?.difference
        ).toBe(0);
        expect(
            compareEnchantEffect("마법 공격력 70 증가", description("어스름한"))
                ?.outsideRange
        ).toBe(true);
        expect(
            compareEnchantEffect("마법 공격력 49 증가", description("어스름한"))
                ?.outsideRange
        ).toBe(true);
        expect(
            compareEnchantEffect("마법 공격력 0 증가", "마법 공격력 0~5 증가")
                ?.difference
        ).toBe(-5);
        expect(
            compareEnchantEffect(
                "마법 공격력 1.2 증가",
                "마법 공격력 0~1.5 증가"
            )?.difference
        ).toBe(-0.3);
        expect(
            compareEnchantEffect(
                "최대대미지 12 감소",
                description("햄스터헌터")
            )
        ).toMatchObject({ best: 10, difference: -2 });
        expect(
            compareEnchantEffect("수리비 20% 증가", "수리비 10~30% 증가")
        ).toMatchObject({ best: 10, difference: -10 });
        expect(
            compareEnchantEffect("수리비 20% 감소", "수리비 10~30% 감소")
        ).toMatchObject({ best: 30, difference: -10 });
        expect(
            compareEnchantEffect("체력 -3 증가", "체력 -5~-1 증가")?.difference
        ).toBe(-2);
        expect(
            compareEnchantEffect("최대대미지 15 증가", description("잔허의"))
        ).toBeNull();
        expect(compareEnchantEffect("지력 30 증가", "지력 30 증가")).toBeNull();
        expect(
            compareEnchantEffect("수리비 200% 증가", "수리비 200% 증가")
        ).toBeNull();
        expect(compareEnchantEffect("체력 0 증가", "체력 0 증가")).toBeNull();
    });

    it("matches conditions and units conservatively", () => {
        const reference = description("주먹의");
        expect(compareEnchantEffect("의지 25 증가", reference)).toBeNull();
        expect(
            compareEnchantEffect(
                "너클 마스터리 랭크 5 이상일 때 의지 25 증가",
                reference
            )?.difference
        ).toBe(-5);
        expect(
            compareEnchantEffect(
                "너클 마스터리 랭크 9 이상일 때 의지 25 증가",
                reference
            )?.difference
        ).toBe(0);
        expect(
            compareEnchantEffect(
                "너클 마스터리 랭크 1 이상일 때 의지 25 증가",
                reference
            )
        ).toBeNull();
        expect(
            compareEnchantEffect("수리비 20 증가", "수리비 10~30% 증가")
        ).toBeNull();
        expect(
            compareEnchantEffect("마법 공격력 1~2 증가", "마법 공격력 1~5 증가")
        ).toBeNull();
        expect(compareEnchantEffect("체력 3 감소", "체력 1~5 증가")).toBeNull();
        expect(
            compareEnchantEffect(
                "체력 3 증가",
                "체력 1~5 증가\\n체력 특수 보너스 20 적용"
            )
        ).toBeNull();
    });

    it("carries a standalone condition through its following effects and stops at a new condition", () => {
        const effects = referenceEffects(description("폭스"));
        expect(effects).toHaveLength(2);
        expect(
            effects.every(({ effect }) => effect.condition === "레벨14이상일때")
        ).toBe(true);
        const poacher = referenceEffects(description("밀렵꾼"));
        expect(
            poacher.find(({ effect }) => effect.type === "솜씨")?.effect
                .condition
        ).toBe("실리엔생태학랭크5이상일때");
        expect(
            poacher.find(({ effect }) => effect.type === "행운")?.effect
                .condition
        ).toBe("");
        expect(referenceEffects(description("햄스터"))).toHaveLength(2);
        expect(enchantDescriptionLines("가\\n나\n다\r\n라")).toEqual([
            "가",
            "나",
            "다",
            "라",
        ]);
    });
});
