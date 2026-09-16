import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { resolveItems } from "./item-reference";
import { readSnapshot, sha256, stableJson } from "./reference-data";

const { data, manifest } = readSnapshot(
    resolve(__dirname, "../src/data/reference")
);
const strings = new Map(data.StringTable.map(row => [row.Id, row.Str]));
const text = (key: string) => {
    const value = strings.get(key);
    assert(
        typeof value === "string" && value.trim(),
        `Missing Ogham string: ${key}`
    );
    return value;
};
const effects = [...data.OghamAbilityList]
    .sort((a, b) => a.Id - b.Id)
    .map(row => {
        const template = text(row.Desc);
        assert(template.includes("[*"), `Missing value placeholder: ${row.Id}`);
        assert(
            !/[[\]<>]/.test(template.replace(/\[\*(-?\d+(?:\.\d+)?)\]/g, "")),
            `Unsupported Ogham text: ${row.Id}`
        );
        return {
            id: row.Id,
            generalPool: row.GeneralPool,
            template,
            values: row.Values,
        };
    });
assert(
    effects.some(row => row.generalPool),
    "Empty general pool"
);
const words = [...data.OghamWordList]
    .sort((a, b) => a.Id - b.Id)
    .map(row => ({
        id: row.Id,
        name: text(row.Name),
        special: row.Group === 1,
        grades: row.Grades,
    }));
const names = new Map(
    resolveItems(data.ItemList, data.StringTable).items.map(row => [
        Number(row.id),
        row.name,
    ])
);
const materialIds = new Set([
    5300305,
    ...data.OghamCost.ResetCosts.flatMap(row =>
        row.Items.map(item => item.ItemId)
    ),
]);
const materials = [...materialIds]
    .sort((a, b) => a - b)
    .map(id => {
        const name = names.get(id);
        assert(name, `Missing material name: ${id}`);
        return { id, name };
    });
assert.equal(names.get(5300305), "오검 파편");
const payload = {
    sourceVersion: manifest.sourceVersion.CreatedAt,
    collectedAt: manifest.collectedAt,
    source: "https://prilus.gitlab.io/ogham",
    rulesSource:
        "https://mabinogi.nexon.com/page/archive/guide_view.asp?id=4893656&num=13",
    words,
    effects,
    materials,
    fragmentId: 5300305,
    costs: data.OghamCost.ResetCosts.map(row => ({
        grade: row.Grade,
        locks: row.LockCount,
        gold: row.Gold,
        fragments: row.Fragments,
        items: row.Items.map(item => ({ id: item.ItemId, count: item.Count })),
    })),
};
const output =
    JSON.stringify({
        version: `${payload.sourceVersion}:${sha256(stableJson(payload))}`,
        ...payload,
    }) + "\n";
const path = resolve(__dirname, "../src/data/ogham-reference.json");
if (process.argv.includes("--check"))
    assert.equal(readFileSync(path, "utf8"), output, "Run pnpm ogham:build");
else writeFileSync(path, output);
console.log(
    `Ogham: ${words.length} words, ${effects.length} effects (${effects.filter(row => row.generalPool).length} general); ${Buffer.byteLength(output)} bytes`
);
