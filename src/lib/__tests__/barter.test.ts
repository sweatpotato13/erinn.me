import reference from "@/data/barter-reference.json";
import {
    barterDeficits,
    BarterGoodSchema,
    barterMonth,
    barterWeek,
    calculateBarter,
    emptyBarterRow,
    parseBarterInteger,
    parseSeoulDate,
    rowIssue,
    seoulDateInput,
} from "@/lib/barter";

const now = Date.parse("2026-09-10T08:00:00+09:00");
const wood = BarterGoodSchema.parse(
    reference.goods.find(g => g.key === "fixed:201:20101")
);
const row = () => ({ ...emptyBarterRow(wood), q: "3" });

test("real exchange materials, one inventory allocation, two cost bases and net handoff", () => {
    const owned = { 50664: "5", 67201: "2" };
    const result = calculateBarter(
        [row()],
        owned,
        { 50664: "100", 67201: "200" },
        reference.materials,
        now
    );
    expect(result.valid).toBe(true);
    expect(
        result.materials.map(m => [m.required, m.usedOwned, m.missing])
    ).toEqual([
        [12, 5, 7],
        [6, 2, 4],
    ]);
    expect(result.replacement).toEqual({
        known: 2400,
        unknown: 0,
        complete: true,
    });
    expect(result.purchase).toEqual({
        known: 1500,
        unknown: 0,
        complete: true,
    });
    expect(barterDeficits(result)).toEqual([
        { itemId: 50664, count: 7 },
        { itemId: 67201, count: 4 },
    ]);
    expect(owned).toEqual({ 50664: "5", 67201: "2" });
});

test("shared demand aggregates by ID, alternatives are exclusive, names never merge identities", () => {
    const a = { ...wood, key: "a", groups: [[{ itemId: 50664, count: 6 }]] };
    const b = {
        ...wood,
        key: "b",
        postId: 202,
        groups: [
            [
                { itemId: 50664, count: 9 },
                { itemId: 67201, count: 1 },
            ],
        ],
    };
    const rows = [
        { ...emptyBarterRow(a), q: "1" },
        { ...emptyBarterRow(b), q: "1", choices: [50664] },
    ];
    const materials = reference.materials.map(m => ({ ...m, name: "동명" }));
    const result = calculateBarter(rows, { 50664: "8" }, {}, materials, now);
    expect(result.materials.map(m => [m.required, m.missing])).toEqual([
        [15, 7],
    ]);
    expect(result.materials[0].contributions.map(c => c.count)).toEqual([6, 9]);
    rows[1].choices = [67201];
    expect(
        calculateBarter(rows, {}, {}, materials, now).materials
    ).toHaveLength(2);
    rows[1].choices = [0];
    expect(calculateBarter(rows, {}, {}, materials, now).valid).toBe(false);
});

test("limits reject without truncating, including zero, unsafe arithmetic and unsupported reset", () => {
    expect(rowIssue({ ...row(), used: "24", q: "2" }, now)).toMatch(/한도/);
    expect(rowIssue({ ...row(), used: "24", q: "1" }, now)).toBeNull();
    for (const value of [
        "",
        "-1",
        "1.1",
        "1e2",
        " 1",
        "9007199254740992",
        "NaN",
    ])
        expect(parseBarterInteger(value)).toBeNull();
    expect(rowIssue({ ...row(), used: "26", q: "0" }, now)).toMatch(/한도/);
    expect(
        rowIssue({ ...row(), good: { ...wood, reset: "future" } }, now)
    ).toMatch(/초기화/);
    const big = {
        ...row(),
        good: {
            ...wood,
            groups: [[{ itemId: 50664, count: Number.MAX_SAFE_INTEGER }]],
        },
        choices: [50664],
    };
    const invalid = calculateBarter([big], {}, {}, reference.materials, now);
    expect(invalid.valid).toBe(false);
    expect(invalid.materials).toEqual([]);
    expect(() => barterDeficits(invalid)).toThrow();
    expect(calculateBarter([], {}, {}, [], now).purchase).toEqual({
        known: 0,
        unknown: 0,
        complete: true,
    });
    expect(
        calculateBarter([{ ...row(), q: "0" }], {}, {}, [], now).materials
    ).toEqual([]);
    expect(
        calculateBarter([row(), row()], {}, {}, reference.materials, now).valid
    ).toBe(false);
    expect(calculateBarter([row()], {}, {}, [], now).valid).toBe(false);
});

test("unknown price differs from zero; only required purchases affect purchase completeness", () => {
    const covered = calculateBarter(
        [row()],
        { 50664: "100", 67201: "100" },
        {},
        reference.materials,
        now
    );
    expect(covered.purchase.complete).toBe(true);
    expect(covered.replacement.unknown).toBe(2);
    expect(covered.materials[0].owned).toBe(100);
    expect(
        calculateBarter(
            [row()],
            {},
            { 50664: "0", 67201: "0" },
            reference.materials,
            now
        ).replacement.complete
    ).toBe(true);
    const huge = calculateBarter(
        [row()],
        {},
        { 50664: String(Number.MAX_SAFE_INTEGER), 67201: "1" },
        reference.materials,
        now
    );
    expect(huge.replacement).toEqual({ known: 6, unknown: 1, complete: false });
    expect(
        calculateBarter([row()], { 50664: "-1" }, {}, reference.materials, now)
            .materials[0].missing
    ).toBeNull();
});

test("Seoul weekly and first-Thursday monthly periods have independent boundaries", () => {
    const at = (s: string) => Date.parse(`${s}+09:00`);
    const sept = at("2026-09-03T07:00:00");
    const oct = at("2026-10-01T07:00:00");
    expect(barterWeek(sept - 1)).toBe(sept - 7 * 86400000);
    expect(barterWeek(sept)).toBe(sept);
    expect(barterWeek(now)).toBe(at("2026-09-10T07:00:00"));
    expect(barterMonth(now)).toEqual({ startAt: sept, endAt: oct });
    expect(barterMonth(sept - 1).endAt).toBe(sept);
    expect(barterMonth(oct).startAt).toBe(oct);
    expect(barterMonth(at("2027-01-01T00:00:00")).endAt).toBe(
        at("2027-01-07T07:00:00")
    );
    expect(parseSeoulDate("2026-09-03T07:00")).toBe(sept);
    expect(seoulDateInput(sept)).toBe("2026-09-03T07:00");
    expect(parseSeoulDate("2026-02-30T07:00")).toBeNull();
    const seasonal = BarterGoodSchema.parse(reference.season.goods[0]);
    expect(
        rowIssue(
            { ...emptyBarterRow(seasonal), q: "1" },
            seasonal.period!.endAt
        )
    ).toMatch(/기간/);
    expect(
        rowIssue(
            { ...emptyBarterRow(seasonal), q: "1" },
            seasonal.period!.startAt
        )
    ).toBeNull();
    const duplicate = {
        ...seasonal,
        source: "manual" as const,
        key: "manual:duplicate",
    };
    const result = calculateBarter(
        [seasonal, duplicate].map(g => ({ ...emptyBarterRow(g), q: "1" })),
        {},
        {},
        reference.materials,
        now
    );
    expect(result.valid).toBe(false);
    expect(result.materials).toEqual([]);
});
