import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

import { createReforgePool, EQUIPMENT_TYPES } from "../src/lib/reforge";
import { resolveItems } from "./item-reference";
import { readSnapshot } from "./reference-data";

const root = resolve(__dirname, "../src/data/reference");
const { manifest, data } = readSnapshot(root);
const int = z.number().int().nonnegative();
const raceFields = { Human: z.boolean(), Elf: z.boolean(), Giant: z.boolean() };
const mask = (r: { Human: boolean; Elf: boolean; Giant: boolean }) =>
    Number(r.Human) + 2 * Number(r.Elf) + 4 * Number(r.Giant);
const names = new Map(data.StringTable.map(r => [r.Id, r.Str]));
const text = (key: string) => {
    const value = names.get(key);
    assert(
        typeof value === "string" &&
            value.trim() &&
            !["None", "<nil>"].includes(value),
        `Missing reforge string ${key}`
    );
    return value
        .replace(/\\n/g, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();
};
const itemNames = new Map(
    resolveItems(data.ItemList, data.StringTable).items.map(r => [
        Number(r.id),
        r.name,
    ])
);
const items = new Map(data.ItemList.map(r => [r.Id, r]));
const knownTools = new Map([
    [1, 5050005],
    [2, 5050006],
    [4, 5050013],
    [5, 5050014],
    [6, 5050020],
]);
const tools = data.MetalWareItemList.map(raw => {
    const r = z
        .object({
            Id: int,
            ItemId: int,
            Name: z.string(),
            AbilityLimit: int,
            MinLevelFactor: z.number().min(0).max(100),
            MaxLevelFactor: z.number().positive().max(100),
            LimitBreakRateFactor: z.number().min(0).max(10000),
        })
        .parse(raw);
    assert(items.has(r.ItemId), `Missing tool item ${r.ItemId}`);
    const known = knownTools.get(r.Id) === r.ItemId;
    if (known)
        assert.equal(
            r.AbilityLimit,
            r.Id === 5 ? 1 : 3,
            `Review official tool count ${r.Id}`
        );
    return {
        id: r.Id,
        itemId: r.ItemId,
        name: text(r.Name),
        lines: r.AbilityLimit,
        minFactor: r.MinLevelFactor,
        maxFactor: r.MaxLevelFactor,
        breakRate: r.LimitBreakRateFactor / 10000,
        legacy: r.Id === 5,
        ...(!known ? { unsupported: "아직 검증하지 않은 도구 ID입니다." } : {}),
    };
});
const levels = data.MetalWareLevelList.map(r => {
    assert(
        r.Rank1MinLevel >= 1 &&
            r.Rank1MaxLevel >= r.Rank1MinLevel &&
            r.LimitBreakMinLevel > r.Rank1MaxLevel &&
            r.LimitBreakMaxLevel >= r.LimitBreakMinLevel,
        `Invalid level ${r.Level}`
    );
    return {
        level: r.Level,
        min: r.Rank1MinLevel,
        max: r.Rank1MaxLevel,
        breakMin: r.LimitBreakMinLevel,
        breakMax: r.LimitBreakMaxLevel,
    };
});
const abilities = data.MetalWareAbilityList.map(raw => {
    const r = z
        .object({
            Id: int,
            Desc: z.string(),
            SubDesc: z.string(),
            ...raceFields,
            EquipFilterMap: z.record(z.string(), z.boolean()),
            TypeFilterMap: z.record(z.string().regex(/^\d+$/), z.boolean()),
            BaseMaxLevel: int,
            BaseMaxLevelOH: int,
            BaseMaxLevelAcc: int,
            InitialValue: z.number(),
            ValuePerLevel: z.number(),
            Standard: z.number(),
            LimitBreak: z.boolean(),
        })
        .parse(raw);
    const max = [r.BaseMaxLevel, r.BaseMaxLevelOH, r.BaseMaxLevelAcc];
    assert(
        max.every(value => value === 0 || levels.some(l => l.level === value)),
        `Missing level ${r.Id}`
    );
    assert(mask(r) > 0, `Empty ability races ${r.Id}`);
    return {
        id: r.Id,
        name: text(r.Desc),
        unit: text(r.SubDesc),
        races: mask(r),
        max,
        types: Object.keys(r.EquipFilterMap).filter(k => r.EquipFilterMap[k]),
        tools: Object.keys(r.TypeFilterMap)
            .filter(k => r.TypeFilterMap[k])
            .map(Number),
        initial: r.InitialValue,
        perLevel: r.ValuePerLevel,
        standard: r.Standard,
        limitBreak: r.LimitBreak,
    };
});
const equipment = data.ItemExtendMetalWareList.map(r => {
    assert(items.has(r.Id), `Missing equipment ${r.Id}`);
    const name = itemNames.get(r.Id);
    const supported =
        name && Object.hasOwn(EQUIPMENT_TYPES, r.EquipType) && mask(r) > 0;
    return {
        id: r.Id,
        name: name ?? `이름 미지원 #${r.Id}`,
        type: r.EquipType,
        races: mask(r),
        ...(!supported
            ? {
                  unsupported:
                      "이름, 장비 타입 또는 종족 데이터가 지원되지 않습니다.",
              }
            : {}),
    };
}).sort((a, b) => a.id - b.id);
for (const rows of [tools, abilities, equipment])
    assert.equal(
        new Set(rows.map(r => r.id)).size,
        rows.length,
        "Duplicate identity"
    );
assert.equal(
    new Set(levels.map(r => r.level)).size,
    levels.length,
    "Duplicate level key"
);
const checked = new Set<string>();
for (const item of equipment.filter(r => !r.unsupported)) {
    for (const tool of tools.filter(r => !r.unsupported)) {
        const key = `${item.type}/${item.races}/${tool.id}`;
        if (checked.has(key)) continue;
        createReforgePool(item, tool, abilities, levels);
        checked.add(key);
    }
}
// Unknown tool membership (e.g. 3) remains in the compact data, never mapped to an item ID.
const result = {
    version: String(manifest.sourceVersion.CreatedAt),
    tools,
    equipment,
    abilities,
    levels,
};
const path = resolve(__dirname, "../src/data/reforge-reference.json");
const output = JSON.stringify(result) + "\n";
if (process.argv.includes("--check"))
    assert.equal(
        readFileSync(path, "utf8"),
        output,
        "Run pnpm reforge:build after reviewing snapshot changes"
    );
else writeFileSync(path, output);
console.log(
    `Reforge: ${equipment.length} equipment, ${abilities.length} abilities, ${checked.size} validated configurations, ${Buffer.byteLength(output)} bytes (server only)`
);
