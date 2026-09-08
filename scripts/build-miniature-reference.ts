import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
    knownEffect,
    type Miniature,
    MINIATURE_EFFECTS,
} from "../src/lib/miniatures";
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
const text = (key: string) => {
    const value = strings.get(key);
    assert(
        value && !["None", "<nil>"].includes(value.trim()),
        `Missing miniature string: ${key}`
    );
    return clean(value);
};
function derive(rows: typeof data.MiniatureList): Miniature[] {
    assert.equal(
        new Set(rows.map(r => r.Id)).size,
        rows.length,
        "Duplicate facility ID"
    );
    return [...rows]
        .sort((a, b) => a.Id - b.Id)
        .map(r => {
            const item = items.get(r.ItemId);
            const itemName = names.get(r.ItemId);
            assert(item && itemName, `Unresolved miniature item: ${r.ItemId}`);
            assert(
                Object.values(r.BonusStatMap).every(
                    v => Number.isFinite(v) && v >= 0
                ),
                "Review negative/non-finite miniature effect"
            );
            const description = text(r.Description);
            const itemDescription = text(item.Desc);
            return {
                id: r.Id,
                itemId: r.ItemId,
                name: text(r.Name),
                itemName,
                description:
                    description === itemDescription
                        ? description
                        : `${description}\n\n아이템 설명\n${itemDescription}`,
                effects: r.BonusStatMap,
                extra: r.IsExtraMiniature,
                searchable: r.IsAuctionSearchable,
            };
        });
}
// Facility, source stat, description label, exact raw value; these are evidence,
// not a requirement that future snapshots contain exactly 200 rows/21 effects.
const fixtures: Array<[number, string, string, number]> = [
    [1281, "Strength", "체력", 2],
    [564, "Will", "의지", 5],
    [341, "Intelligence", "지력", 5],
    [564, "Dexterity", "솜씨", 5],
    [190, "Luck", "행운", 5],
    [1375, "Life", "최대 생명력", 10],
    [232, "Mana", "마나", 25],
    [165, "Stamina", "스태미나", 10],
    [789, "AttackMax", "최대 대미지", 5],
    [829, "MagicAttack", "마법 공격력", 6],
    [790, "MusicSkill", "음악 버프 스킬 효과", 2],
    [1387, "BonusDamage", "보너스 대미지", 2],
    [1372, "CriticalDamage", "크리티컬 대미지", 2],
    [740, "MoveSpeed", "이동 속도", 1],
    [1143, "Defense", "방어", 1],
    [1207, "Protect", "보호", 1],
    [1287, "MagicDefense", "마법방어", 2],
    [1207, "MagicProtect", "마법보호", 1],
    [1439, "AllAlchemy", "모든 연금술 대미지", 4],
    [1440, "HealingEffect", "힐링 효과", 2],
    [1218, "CriticalRateLimitUp", "크리티컬 상한 증가", 1],
];
const miniatures = derive(data.MiniatureList);
assert.deepEqual(
    new Set(fixtures.map(f => f[1])),
    new Set(Object.keys(MINIATURE_EFFECTS))
);
for (const [id, stat, label, value] of fixtures) {
    const raw = data.MiniatureList.find(r => r.Id === id)!;
    assert(raw, `Missing evidence facility ${id}`);
    const item = items.get(raw.ItemId)!;
    assert.equal(raw.BonusStatMap[stat], value, `Review changed ${id}/${stat}`);
    const description = text(item.Desc);
    const match = description.match(
        new RegExp(`${label}\\s*:?\\s*\\+\\s*(${value})(%?)(?![\\d.])`)
    );
    assert(match, `Review description ${item.Desc}/${stat}`);
    assert.equal(match[2], MINIATURE_EFFECTS[stat].unit, `Review unit ${stat}`);
}
assert.equal(miniatures.find(r => r.id === 564)?.itemId, 54536);
assert.equal(miniatures.find(r => r.id === 790)?.extra, true);
assert.equal(miniatures.find(r => r.id === 1207)?.searchable, false);
assert(miniatures.find(r => r.id === 1207)?.description.includes("세트"));
assert.notEqual(
    miniatures.find(r => r.id === 341)?.name,
    miniatures.find(r => r.id === 341)?.itemName
);
assert.equal(
    clean("a\\n<color=1>b</color>\\\\nc<script>x</script>"),
    "a\nb\ncx"
);
assert.throws(
    () => derive([data.MiniatureList[0], data.MiniatureList[0]]),
    /Duplicate/
);
assert.throws(
    () =>
        derive([{ ...data.MiniatureList[0], ItemId: Number.MAX_SAFE_INTEGER }]),
    /Unresolved/
);
assert.throws(
    () =>
        derive([{ ...data.MiniatureList[0], BonusStatMap: { AttackMax: -1 } }]),
    /negative/
);
assert.equal(
    derive([{ ...data.MiniatureList[0], BonusStatMap: { FutureEffect: 2 } }])[0]
        .effects.FutureEffect,
    2
);
const payload = {
    sourceVersion: manifest.sourceVersion.CreatedAt,
    collectedAt: manifest.collectedAt,
    coverage: [
        ...new Set(
            miniatures
                .flatMap(r => Object.keys(r.effects))
                .filter(k => !knownEffect(k))
        ),
    ].sort(),
    miniatures,
};
const version = `${payload.sourceVersion}:${sha256(stableJson(payload))}`;
const output = JSON.stringify({ version, ...payload }) + "\n";
const path = resolve(__dirname, "../src/data/miniature-reference.json");
if (process.argv.includes("--check"))
    assert.equal(
        readFileSync(path, "utf8"),
        output,
        "Run pnpm miniatures:build"
    );
else writeFileSync(path, output);
console.log(
    `Miniatures: ${miniatures.length} entries, ${payload.coverage.length} unknown effects, ${Buffer.byteLength(output)} bytes; fixtures passed`
);
