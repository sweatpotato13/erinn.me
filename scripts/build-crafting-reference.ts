import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

import rules from "../src/data/crafting-rules.json";
import {
    type CraftingItem,
    type CraftingRecipe,
    CraftingGroupSchema,
} from "../src/lib/crafting";
import { resolveItems } from "./item-reference";
import { readSnapshot, sha256, stableJson } from "./reference-data";

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const group = z.looseObject({
    ItemIds: z.array(integer.positive()).min(1),
    Count: integer.positive(),
});
const recipeSchema = z.looseObject({
    Type: integer,
    ItemId: integer.positive(),
    FormId: integer,
    Level: integer,
    NeedPropName: z.string(),
    Essentials: z.array(group),
    CompleteEssentials: z.array(
        z.looseObject({ Essentials: z.array(group), ExtraData: z.string() })
    ),
});
const root = resolve(__dirname, "../src/data");
const { data, manifest } = readSnapshot(resolve(root, "reference"));
const strings = new Map(data.StringTable.map(r => [r.Id, r.Str]));
const resolved = resolveItems(data.ItemList, data.StringTable);
const names = new Map(resolved.items.map(r => [Number(r.id), r.name]));
const nameCounts = new Map<string, number>();
for (const name of names.values())
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
const skills = new Map(data.SkillList.map(r => [r.Id, strings.get(r.Name)]));
const rawItems = new Map(data.ItemList.map(r => [r.Id, r]));
const skillIds: Record<string, number> = rules.skills;
const suffixes: Record<string, string> = rules.suffixes;

function derive(input: unknown[], hash = sha256) {
    const originals = new Map<string, string>();
    const recipes = new Map<string, CraftingRecipe>();
    for (const record of input) {
        const row = recipeSchema.parse(record);
        const original = stableJson(record);
        const fingerprint = hash(original);
        const existing = recipes.get(fingerprint);
        if (existing) {
            assert.equal(
                originals.get(fingerprint),
                original,
                "Recipe fingerprint collision"
            );
            existing.occurrences++;
            continue;
        }
        originals.set(fingerprint, original);
        const convert = (g: z.infer<typeof group>) =>
            CraftingGroupSchema.parse({ itemIds: g.ItemIds, count: g.Count });
        const skill = skills.get(skillIds[row.Type]);
        const facility = row.NeedPropName ? strings.get(row.NeedPropName) : "";
        const ids = [
            row.ItemId,
            ...row.Essentials.flatMap(g => g.ItemIds),
            ...row.CompleteEssentials.flatMap(f =>
                f.Essentials.flatMap(g => g.ItemIds)
            ),
        ];
        recipes.set(fingerprint, {
            fingerprint,
            itemId: row.ItemId,
            type: row.Type,
            formId: row.FormId,
            level: row.Level,
            facilityKey: row.NeedPropName,
            facility: facility ?? `시설 설명 미확인 (${row.NeedPropName})`,
            skill: skill
                ? `${skill}${suffixes[row.Type] ? ` · ${suffixes[row.Type]}` : ""}`
                : `스킬 설명 미확인 (${row.Type})`,
            rank: rules.ranks[row.Level] ?? `랭크 설명 미확인 (${row.Level})`,
            process: row.Essentials.map(convert),
            finishes: row.CompleteEssentials.map(f => ({
                groups: f.Essentials.map(convert),
                extraData: f.ExtraData,
            })),
            occurrences: 1,
            issues: [
                ...[...new Set(ids)]
                    .filter(id => !names.has(id))
                    .map(id => `아이템 이름 미확인 #${id}`),
                ...(facility === undefined
                    ? [`시설 설명 미확인 ${row.NeedPropName}`]
                    : []),
            ],
        });
    }
    const sorted = [...recipes.values()].sort((a, b) =>
        a.fingerprint.localeCompare(b.fingerprint, "en")
    );
    const needed = new Set(
        sorted.flatMap(r => [
            r.itemId,
            ...r.process.flatMap(g => g.itemIds),
            ...r.finishes.flatMap(f => f.groups.flatMap(g => g.itemIds)),
        ])
    );
    const items: CraftingItem[] = [...needed]
        .sort((a, b) => a - b)
        .map(id => ({
            id,
            name: names.get(id) ?? `이름 미확인 #${id}`,
            searchable: rawItems.get(id)?.IsAuctionSearchable ?? false,
            ambiguous: (nameCounts.get(names.get(id) ?? "") ?? 0) > 1,
            ...(!names.has(id)
                ? { unresolved: `아이템 이름 미확인 #${id}` }
                : {}),
        }));
    const byOutput = Object.fromEntries(
        [...new Set(sorted.map(r => r.itemId))]
            .sort((a, b) => a - b)
            .map(id => [
                id,
                sorted.filter(r => r.itemId === id).map(r => r.fingerprint),
            ])
    );
    return { items, recipes: sorted, byOutput };
}

const catalog = derive(data.ProductionList);
assert.equal(
    catalog.recipes.reduce((n, r) => n + r.occurrences, 0),
    data.ProductionList.length
);
assert.deepEqual(derive([...data.ProductionList].reverse()), catalog);
const mithril = catalog.recipes.filter(
    r => r.itemId === 64009 && r.type === 3 && r.level === 0
);
assert.equal(mithril.length, 2);
assert.equal(new Set(mithril.map(r => r.fingerprint)).size, 2);
assert.throws(
    () => derive(data.ProductionList.slice(0, 2), () => "collision"),
    /collision/
);
assert.equal(
    derive([data.ProductionList[0], data.ProductionList[0]]).recipes[0]
        .occurrences,
    2
);
const sillien = catalog.recipes.find(r => r.itemId === 67201)!;
assert.deepEqual(sillien.process, [{ itemIds: [67200, 67244], count: 5 }]);
assert.equal(sillien.finishes.length, 0);
assert(catalog.recipes.some(r => r.finishes.length === 4));
assert.throws(() => derive([{ ...data.ProductionList[0], Level: -1 }]));
assert(
    derive([{ ...data.ProductionList[0], NeedPropName: "missing" }]).recipes[0]
        .issues.length
);

const payload = {
    sourceVersion: manifest.sourceVersion.CreatedAt,
    ruleVersion: rules.version,
    collectedAt: manifest.collectedAt,
    ...catalog,
};
const output =
    JSON.stringify({
        version: `${payload.sourceVersion}:${sha256(stableJson({ ...payload, rules }))}`,
        ...payload,
    }) + "\n";
const path = resolve(root, "crafting-reference.json");
if (process.argv.includes("--check"))
    assert.equal(readFileSync(path, "utf8"), output, "Run pnpm crafting:build");
else writeFileSync(path, output);
console.log(
    `Crafting: ${data.ProductionList.length} raw / ${catalog.recipes.length} choices / ${catalog.items.length} items / ${Buffer.byteLength(output)} bytes; ${catalog.recipes.filter(r => r.issues.length).length} unresolved recipes; fixtures passed`
);
