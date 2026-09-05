import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { readEnchantReference, resolveEnchants } from "./enchant-reference";

const row = {
    Id: 1,
    Name: "name",
    Name2: "alias",
    Desc: "desc",
    Usage: 0,
    Level: 10,
};
const strings = [
    { Id: "name", Str: "  한글 이름 " },
    { Id: "alias", Str: "별명" },
    { Id: "desc", Str: "마법 공격력 0~5 증가" },
    { Id: "bad", Str: "not found key, optionset.1" },
];
const source = [
    row,
    { ...row, Id: 2, Usage: 1 },
    { ...row, Id: 3, Usage: 7 },
    { ...row, Id: 4, Name: "missing", Name2: "bad" },
    { ...row, Id: 5, Desc: "missing", Level: 99 },
];
const records = resolveEnchants(source, strings);
assert.deepEqual(
    records.map(record => record.id),
    [1, 2, 5]
);
assert.deepEqual(records[0], {
    id: 1,
    names: ["한글 이름", "별명"],
    usage: 0,
    rank: "6",
    description: "마법 공격력 0~5 증가",
});
assert.equal(records[2].description, "");
assert.equal(records[2].rank, "");
assert.deepEqual(
    resolveEnchants([...source].reverse(), [...strings].reverse()),
    records
);

const actual = readEnchantReference();
assert.equal(
    readFileSync(resolve(__dirname, "../src/data/enchant-index.json"), "utf8"),
    `${JSON.stringify(actual)}\n`,
    "Enchant index is stale; run pnpm enchants:build"
);
assert(actual.every(record => [0, 1, 11, 12].includes(record.usage)));
assert(
    actual.every(
        record =>
            !/optionset\.\d+|not found key/.test(
                record.description + record.names.join(" ")
            )
    )
);
assert.equal(
    actual.find(record => record.names.includes("어스름한"))?.rank,
    "6"
);
assert.equal(actual.find(record => record.names.includes("햄스터헌터"))?.id, 1);
console.log(
    `Enchant reference checks passed: ${actual.length} records, ${actual.filter(record => !record.description).length} unavailable descriptions; localized index matches snapshot`
);
