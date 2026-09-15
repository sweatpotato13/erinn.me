import evidence from "@/data/auction-filter-evidence.json";

import {
    auctionFilterReference,
    echostoneSuggestions,
    enchantSuggestions,
    matchEnchantAlias,
    reforgeSuggestions,
    searchOptionSuggestions,
} from "../auction-filter-reference";
import { parseEnchantContext } from "../auction-option-text";

it("ships only searchable identities and retains observed echo names in their colors", () => {
    expect(Object.keys(auctionFilterReference).sort()).toEqual([
        "echostones",
        "enchants",
        "fixedAwakenings",
        "reforges",
    ]);
    expect(JSON.stringify(auctionFilterReference)).not.toMatch(
        /equipment|probability|weight|description/
    );
    expect(reforgeSuggestions.length).toBeGreaterThan(0);
    for (const entry of evidence.observedAwakenings) {
        expect(
            echostoneSuggestions(entry.color).map(row => row.value)
        ).toContain(entry.name);
    }
    expect(auctionFilterReference.fixedAwakenings).toEqual([
        {
            color: 1,
            name: "돌진 인간 및 엘프일 때 방패 없이 사용 가능",
            level: 1,
        },
    ]);
});

it("finds aliases and limits suggestions without mixing enchant positions", () => {
    expect(
        searchOptionSuggestions(enchantSuggestions("prefix"), "망가진")
    ).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                label: expect.stringContaining("브로큰"),
            }),
        ])
    );
    expect(
        searchOptionSuggestions(enchantSuggestions("suffix"), "망가진")
    ).toEqual([]);
    expect(searchOptionSuggestions(reforgeSuggestions, "대미지")).toHaveLength(
        20
    );
    expect(searchOptionSuggestions(reforgeSuggestions, "")).toEqual([]);
    expect(
        searchOptionSuggestions(reforgeSuggestions, "가".repeat(101))
    ).toEqual([]);
    expect(
        matchEnchantAlias(
            "야상곡",
            "녹턴",
            parseEnchantContext("야상곡", "접미")
        )
    ).toBe(true);
    expect(
        matchEnchantAlias(
            "야상곡",
            "녹턴",
            parseEnchantContext("야상곡", "접두")
        )
    ).toBe(false);
});
