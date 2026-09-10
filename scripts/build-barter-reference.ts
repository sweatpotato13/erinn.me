import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
    BarterGoodSchema,
    type BarterMaterial,
    BarterMaterialSchema,
    BarterSeasonSchema,
} from "../src/lib/barter";
import { resolveItems } from "./item-reference";
import { readSnapshot, sha256, stableJson } from "./reference-data";

const root = resolve(__dirname, "../src/data");
const { data, manifest } = readSnapshot(resolve(root, "reference"));
const strings = new Map(data.StringTable.map(r => [r.Id, r.Str]));
const rawItems = new Map(data.ItemList.map(r => [r.Id, r]));
const resolved = resolveItems(data.ItemList, data.StringTable).items;
const nameCounts = new Map<string, number>();
for (const item of resolved) {
    if (!rawItems.get(Number(item.id))?.IsAuctionSearchable) continue;
    nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1);
}
const materials: BarterMaterial[] = resolved.map(item =>
    BarterMaterialSchema.parse({
        id: Number(item.id),
        name: item.name,
        searchable: rawItems.get(Number(item.id))!.IsAuctionSearchable,
        ambiguous: (nameCounts.get(item.name) ?? 0) > 1,
    })
);
const byId = new Map(materials.map(item => [item.id, item]));

function derive(rows: typeof data.BarterList) {
    const goods = rows.map(row => {
        const payload = {
            key: `fixed:${row.PostId}:${row.Id}`,
            source: "fixed",
            postId: row.PostId,
            postName: strings.get(data.CommercePostNameMap[String(row.PostId)]),
            name: strings.get(row.Name),
            limit: row.Limit,
            reset: row.ResetType,
            groups: row.Prices.map(p => [{ itemId: p.Id, count: p.Count }]),
        };
        for (const p of row.Prices)
            assert(byId.has(p.Id), `Unresolved barter material ${p.Id}`);
        return BarterGoodSchema.parse({
            ...payload,
            revision: sha256(stableJson(payload)),
        });
    });
    assert.equal(
        new Set(goods.map(g => g.key)).size,
        goods.length,
        "Duplicate barter key"
    );
    return goods.sort((a, b) => a.key.localeCompare(b.key, "en"));
}

const fixed = derive(data.BarterList);
const seasonPath = resolve(root, "barter-season.json");
const season = existsSync(seasonPath)
    ? BarterSeasonSchema.parse(JSON.parse(readFileSync(seasonPath, "utf8")))
    : null;
const goods = [...fixed, ...(season?.goods ?? [])];
const needed = new Set(
    goods.flatMap(g => g.groups.flatMap(options => options.map(o => o.itemId)))
);
for (const id of needed)
    assert(byId.has(id), `Unresolved barter material ${id}`);
const payload = {
    sourceVersion: manifest.sourceVersion.CreatedAt,
    collectedAt: manifest.collectedAt,
    goods,
    materials: materials.filter(item => needed.has(item.id)),
    season,
};
const version = `${payload.sourceVersion}:${sha256(stableJson(payload))}`;
const outputs = {
    "barter-reference.json": { version, ...payload },
    "barter-material-index.json": {
        version: `${payload.sourceVersion}:${sha256(stableJson(materials))}`,
        sourceVersion: payload.sourceVersion,
        materials,
    },
};

// Source evidence, not a permanent catalog-size constraint.
assert.equal(fixed.length, data.BarterList.length);
const wood = fixed.find(g => g.key === "fixed:201:20101");
assert.equal(wood?.name, "우드 테이블");
assert.deepEqual(wood?.groups, [
    [{ itemId: 50664, count: 4 }],
    [{ itemId: 67201, count: 2 }],
]);
assert.equal(byId.get(50664)?.name, "새우 조련 미끼");
assert.equal(byId.get(67201)?.name, "실리엔");
assert.throws(
    () => derive([data.BarterList[0], data.BarterList[0]]),
    /Duplicate/
);
assert.throws(() => derive([{ ...data.BarterList[0], Limit: 0 }]));
assert.throws(() => derive([{ ...data.BarterList[0], Name: "missing" }]));
assert.throws(() =>
    derive([
        {
            ...data.BarterList[0],
            Prices: [{ Id: Number.MAX_SAFE_INTEGER, Count: 1 }],
        },
    ])
);
assert.equal(
    derive([{ ...data.BarterList[0], ResetType: "future" }])[0].reset,
    "future"
);
for (const [file, value] of Object.entries(outputs)) {
    const output = JSON.stringify(value) + "\n";
    const path = resolve(root, file);
    if (process.argv.includes("--check"))
        assert.equal(
            readFileSync(path, "utf8"),
            output,
            "Run pnpm barter:build"
        );
    else writeFileSync(path, output);
    console.log(`${file}: ${Buffer.byteLength(output)} bytes`);
}
console.log(
    `Barter: ${fixed.length} fixed goods, ${season?.goods.length ?? 0} seasonal goods; fixtures passed`
);
