import observed from "@/lib/__tests__/fixtures/murias-options.json";
import {
    aggregateRelicListings,
    matchRelicOption,
    muriasReference,
    type RelicListing,
} from "@/lib/murias-relics";

const option = (value: string) => ({
    option_type: "무리아스 유물",
    option_value: value,
});
const cannon = option("데바스테이션 캐논 대미지 80% 증가 (최대 400%)");
const listing = (
    price = 100,
    extra: Partial<RelicListing> = {}
): RelicListing => ({
    item_name: "무리아스의 유물",
    item_display_name: "무리아스의 유물",
    item_count: 1,
    auction_price_per_unit: price,
    date_auction_expire: "2026-09-15T00:00:00Z",
    item_option: [cannon],
    ...extra,
});

test("all 30 current effects have ten exact values and match sanitized Nexon observations", () => {
    expect(muriasReference.effects).toHaveLength(30);
    expect(observed).toHaveLength(30);
    for (const effect of muriasReference.effects) {
        effect.values.forEach((value, index) =>
            expect(
                matchRelicOption([
                    option(effect.template.replace("{0}", String(value))),
                ])
            ).toEqual({ effectId: effect.id, level: index + 1 })
        );
    }
    for (const row of observed)
        expect(matchRelicOption([row.option])?.effectId).toBe(row.effectId);
    expect(matchRelicOption([cannon])).toEqual({ effectId: 73020, level: 2 });
    expect(
        matchRelicOption([
            option("오버 드라이브 폭발 공격 대미지 280% 증가 (최대 700%)"),
        ])
    ).toEqual({ effectId: 73017, level: 4 });
});

test("rejects malformed, obsolete, duplicate and conflicting options", () => {
    for (const value of [
        "데바스테이션 캐논 대미지 81% 증가 (최대 400%)",
        "데바스테이션 캐논 대미지 80% 증가 (최대 500%)",
        "데바스테이션 캐논 대미지 80.0001% 증가 (최대 400%)",
        "데바스테이션 캐논 대미지 80초 증가 (최대 400%)",
        "고결한 서약 매초 희생 회복량 0.051 증가 (최대 0.5)",
        "익스플로전 런지 재사용 대기 시간 2초 감소 (최대 2초)",
        "미래 효과 10% 증가 (최대 100%)",
    ])
        expect(matchRelicOption([option(value)])).toBeNull();
    expect(matchRelicOption([cannon, cannon])).toBeNull();
    expect(matchRelicOption([{ ...cannon, option_value2: "3" }])).toBeNull();
    expect(
        matchRelicOption([{ ...cannon, option_type: "무리아스 성수" }])
    ).toBeNull();
    expect(matchRelicOption(null)).toBeNull();
});

test("aggregates unit asking prices, keeps all null cells and accounts for rejected listings", () => {
    const result = aggregateRelicListings([
        listing(100, { item_count: 5 }),
        listing(80),
        listing(1, { item_name: "무리아스의 유물(이데아)" }),
        listing(1, {
            item_name: "무리아스의 유물 내구도 상승의 플래티넘 망치",
        }),
        listing(1, {
            item_option: [
                cannon,
                { option_type: "인챈트", option_value: "퓨리" },
            ],
        }),
        listing(1, {
            item_option: [
                cannon,
                { option_type: "내구도", option_value: "1/10" },
            ],
        }),
        listing(0),
        listing(1, { item_count: 0 }),
        listing(1, { item_option: [cannon, cannon] }),
    ]);
    expect(result.cells).toHaveLength(300);
    expect(
        result.cells.find(cell => cell.effectId === 73020 && cell.level === 2)
    ).toMatchObject({ minUnitPrice: 80, listingCount: 2 });
    expect(
        result.cells.filter(cell => cell.minUnitPrice === null)
    ).toHaveLength(299);
    expect(result.excludedCount).toBe(6);
    expect(result.unclassifiedCount).toBe(1);
    expect(result.rejected).toHaveLength(7);
});

test.each(["option_sub_type", "option_value", "option_value2", "option_desc"])(
    "excludes state markers in %s rather than pricing the listing",
    field => {
        const result = aggregateRelicListings([
            listing(1, {
                item_option: [
                    cannon,
                    { option_type: "상태", [field]: "남은 거래 1회" },
                ],
            }),
            listing(80),
        ]);
        expect(result.excludedCount).toBe(1);
        expect(result.unclassifiedCount).toBe(0);
        expect(
            result.cells.find(
                cell => cell.effectId === 73020 && cell.level === 2
            )
        ).toMatchObject({ minUnitPrice: 80, listingCount: 1 });
    }
);
