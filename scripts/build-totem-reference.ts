import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
    ROYAL_TOTEM_IDS,
    type Totem,
    totemRanges,
    TOTEM_SOURCE_KEYS,
} from "../src/lib/totems";
import { resolveItems } from "./item-reference";
import { readSnapshot, sha256, stableJson } from "./reference-data";

const { data, manifest } = readSnapshot(
    resolve(__dirname, "../src/data/reference")
);
const strings = new Map(data.StringTable.map(r => [r.Id, r.Str]));
const items = new Map(data.ItemList.map(r => [r.Id, r]));
const names = new Map(
    resolveItems(data.ItemList, data.StringTable).items.map(r => [
        Number(r.id),
        r.name,
    ])
);
const clean = (value: string) =>
    value
        .replace(/\\+n/g, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();
function text(key: string): string {
    const value = strings.get(key);
    assert(
        value && !["None", "<nil>"].includes(value.trim()),
        `Unresolved totem string: ${key}`
    );
    return clean(value);
}
function derive(rows: typeof data.ItemExtendTotemList): Totem[] {
    assert.equal(
        new Set(rows.map(r => r.Id)).size,
        rows.length,
        "Duplicate totem ID"
    );
    return [...rows]
        .sort((a, b) => a.Id - b.Id)
        .map(r => {
            const item = items.get(r.Id);
            const name = names.get(r.Id);
            assert(item && name, `Unresolved totem item: ${r.Id}`);
            assert(
                /^\/totem_[a-z_]+\/$/.test(r.TotemType),
                `Review totem type: ${r.TotemType}`
            );
            return {
                id: r.Id,
                name,
                description: text(item.Desc),
                type: r.TotemType.slice(7, -1),
                isExtra: r.isExtra,
                isPet: r.isPet,
                searchable: item.IsAuctionSearchable,
                bonuses: r.Bonuses,
                ranges: totemRanges(r.Bonuses),
            };
        });
}

const totems = derive(data.ItemExtendTotemList);
// Evidence rows, not fixed catalog counts. Re-review changed bounds/units on refresh.
const evidence: Array<[number, string, number, number]> = [
    [5160032, "critical", 1, 22],
    [5160030, "stamina", 10, 110],
    [5160034, "magicattack", 1, 20],
    [5160026, "allstat", 1, 25],
    [5160033, "maxdamage", 1, 30],
    [5160052, "bonusdamage", 10, 10],
    [5160031, "life", 10, 110],
    [5160029, "mana", 10, 110],
    [5160469, "speed", 2, 2],
    [5160028, "def", 1, 22],
    [5160028, "magic_defense", 1, 22],
    [5160100, "stat_int", 1, 10],
    [5160005, "mindamage", 1, 20],
];
assert.deepEqual(
    new Set(evidence.map(r => r[1])),
    new Set(Object.keys(TOTEM_SOURCE_KEYS))
);
for (const [id, key, min, max] of evidence) {
    const row = totems.find(r => r.id === id);
    assert(row, `Missing totem evidence ${id}`);
    const bonus = row.bonuses.find(b => b.StatName === key);
    assert.deepEqual(
        bonus,
        { Max: max, Min: min, StatName: key },
        `Review ${id}/${key}`
    );
}
assert(
    totems.find(r => r.id === 5160469)?.description.includes("이동 속도 2%")
);
assert(
    totems
        .find(r => r.id === 5160100)
        ?.description.includes("왕립 학회 주화 아이템과 중복적용이 되지 않는다")
);
for (const id of ROYAL_TOTEM_IDS) {
    const row = totems.find(r => r.id === id);
    assert(
        row &&
            !row.isExtra &&
            !row.isPet &&
            ["intmagicattack", "minmaxdamage"].includes(row.type)
    );
    assert(row.name.startsWith("왕립 "));
}
assert.equal(totems.find(r => r.id === 5160052)?.ranges.bonusdamage?.max, 1);
assert.equal(totems.find(r => r.id === 5160004)?.ranges.bonusdamage?.min, 0.1);
assert.equal(Object.keys(totems.find(r => r.id === 52289)!.ranges).length, 5);
assert.equal(totems.find(r => r.id === 52201)?.ranges.critical?.max, 16);
assert.equal(totems.find(r => r.id === 52518)?.ranges.magic_defense?.max, 20);
assert.equal(totems.find(r => r.id === 5160373)?.isExtra, true);
assert.equal(totems.find(r => r.id === 5160442)?.isPet, true);
for (const id of [5160492, 5160402])
    assert.deepEqual(totems.find(r => r.id === id)?.ranges, {});
assert.equal(
    totems.find(r => r.id === 52189)?.name,
    totems.find(r => r.id === 52197)?.name
);
assert.notDeepEqual(
    totems.find(r => r.id === 52189)?.ranges,
    totems.find(r => r.id === 52197)?.ranges
);
assert.throws(
    () => derive([data.ItemExtendTotemList[0], data.ItemExtendTotemList[0]]),
    /Duplicate/
);
assert.throws(
    () =>
        derive([
            { ...data.ItemExtendTotemList[0], Id: Number.MAX_SAFE_INTEGER },
        ]),
    /Unresolved/
);
assert.throws(
    () => totemRanges([{ StatName: "life", Min: 2, Max: 1 }]),
    /Invalid/
);
assert.throws(
    () => totemRanges([{ StatName: "life", Min: 0, Max: Infinity }]),
    /Invalid/
);
assert.throws(
    () =>
        totemRanges([
            { StatName: "life", Min: 1, Max: 2 },
            { StatName: "life", Min: 1, Max: 2 },
        ]),
    /Duplicate/
);
const unknown = derive([
    {
        ...data.ItemExtendTotemList[0],
        Bonuses: [{ StatName: "future", Min: 1, Max: 2 }],
        isExtra: true,
        isPet: true,
    },
])[0];
assert.deepEqual(unknown.bonuses, [{ StatName: "future", Min: 1, Max: 2 }]);
assert.deepEqual(unknown.ranges, {});
assert(unknown.isExtra && unknown.isPet);
assert.deepEqual(
    derive([{ ...data.ItemExtendTotemList[0], Bonuses: [] }])[0].ranges,
    {}
);
assert.equal(totems.length, data.ItemExtendTotemList.length);
for (const row of totems)
    assert.deepEqual(
        row.bonuses,
        data.ItemExtendTotemList.find(r => r.Id === row.id)!.Bonuses
    );

const payload = {
    sourceVersion: manifest.sourceVersion.CreatedAt,
    collectedAt: manifest.collectedAt,
    coverage: [
        ...new Set(
            totems
                .flatMap(r => r.bonuses.map(b => b.StatName))
                .filter(k => !Object.hasOwn(TOTEM_SOURCE_KEYS, k))
        ),
    ].sort(),
    totems,
};
const version = `${payload.sourceVersion}:${sha256(stableJson(payload))}`;
const output = JSON.stringify({ version, ...payload }) + "\n";
const path = resolve(__dirname, "../src/data/totem-reference.json");
if (process.argv.includes("--check"))
    assert.equal(readFileSync(path, "utf8"), output, "Run pnpm totems:build");
else writeFileSync(path, output);
console.log(
    `Totems: ${totems.length} entries, ${totems.filter(r => !r.bonuses.length).length} empty ranges, ${Buffer.byteLength(output)} bytes; fixtures passed`
);
