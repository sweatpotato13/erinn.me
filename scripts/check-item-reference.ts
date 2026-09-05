import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
    buildItemIdMap,
    buildSuggestIndex,
    readItemReference,
    resolveItems,
} from "./item-reference";

const source = [
    { Id: 2, Name: "duplicate", IsAuctionSearchable: true },
    { Id: 10, Name: "duplicate", IsAuctionSearchable: false },
    { Id: 3, Name: "missing", IsAuctionSearchable: true },
    { Id: 4, Name: "placeholder", IsAuctionSearchable: true },
    { Id: 5, Name: "excluded", IsAuctionSearchable: true },
    { Id: 6, Name: "short", IsAuctionSearchable: true },
    { Id: 7, Name: "blank", IsAuctionSearchable: true },
    { Id: 8, Name: "key", IsAuctionSearchable: true },
];
const name = "한글  아이템 (2인)+&!";
const strings = [
    { Id: "duplicate", Str: name },
    { Id: "placeholder", Str: "<nil>" },
    { Id: "excluded", Str: "낡은 장비" },
    { Id: "short", Str: "검" },
    { Id: "blank", Str: " " },
    { Id: "key", Str: "itemdb.123" },
];
const resolved = resolveItems(source, strings);
assert.deepEqual(
    resolved.unresolved.map(item => item.id),
    ["3", "4", "7", "8"]
);
assert.equal(resolved.items.filter(item => item.name === name).length, 2);
assert.deepEqual(Object.values(buildSuggestIndex(resolved.items)), [[name]]);
assert.equal(buildItemIdMap(resolved.items, {})[name], "10");
assert.equal(buildItemIdMap(resolved.items, { [name]: "2" })[name], "2");
assert.throws(
    () => buildItemIdMap(resolved.items, { renamed: "2" }),
    /missing or renamed/
);
assert.throws(
    () => buildItemIdMap(resolved.items, { [name]: "999" }),
    /missing or renamed/
);
const reordered = resolveItems([...source].reverse(), [...strings].reverse());
assert.deepEqual(reordered, resolved);
assert.equal(
    JSON.stringify(buildSuggestIndex(reordered.items)),
    JSON.stringify(buildSuggestIndex(resolved.items))
);
assert.equal(
    JSON.stringify(buildItemIdMap(reordered.items, {})),
    JSON.stringify(buildItemIdMap(resolved.items, {}))
);
assert.equal(new URLSearchParams({ q: name }).get("q"), name);

const { items, unresolved } = readItemReference();
const index = buildSuggestIndex(items);
const imageMap = buildItemIdMap(items);
for (const [file, expected] of [
    ["suggest-index", index],
    ["item-id-map", imageMap],
] as const) {
    assert.equal(
        readFileSync(resolve(__dirname, `../src/data/${file}.json`), "utf8"),
        JSON.stringify(expected),
        `${file} is stale; run pnpm items:build`
    );
}
const suggestions = Object.values(index).flat();
assert.equal(new Set(suggestions).size, suggestions.length);
assert.equal(imageMap["생활 협회 코인 상자"], "4090082");
assert.equal(imageMap["가을빛 포도나무 의자(2인)"], "5400282");
assert(suggestions.includes("가을빛 포도나무 의자(2인)"));
console.log(
    `Item reference checks passed: ${items.length} resolved records, ${suggestions.length} unique suggestions, ${Object.keys(imageMap).length} image names; ${unresolved.length} unresolved names (sample: ${JSON.stringify(unresolved.slice(0, 5))})`
);
