import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

import { resolveItems } from "./item-reference";
import { readSnapshot } from "./reference-data";

const { manifest, data } = readSnapshot(
    resolve(__dirname, "../src/data/reference")
);
const strings = new Map(data.StringTable.map(r => [r.Id, r.Str]));
const names = new Map(
    resolveItems(data.ItemList, data.StringTable).items.map(r => [
        Number(r.id),
        r.name,
    ])
);
const items = new Map(data.ItemList.map(r => [r.Id, r]));
const text = (key: string) => {
    const value = strings.get(key);
    assert(
        value?.trim() && !["None", "<nil>"].includes(value),
        `Missing echo string ${key}`
    );
    return value
        .replace(/\\n/g, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();
};
const item = (id: number) => {
    const raw = items.get(id);
    const name = names.get(id);
    assert(raw && name, `Missing echo item ${id}`);
    return {
        id,
        name,
        description: text(raw.Desc),
        searchable: raw.IsAuctionSearchable,
    };
};
const unique = <T>(rows: T[], key: (row: T) => number, label: string) => {
    assert.equal(
        new Set(rows.map(key)).size,
        rows.length,
        `Duplicate ${label}`
    );
    return rows;
};
const tables = new Map(
    unique(data.RandomTableList, r => r.Id, "random table").map(r => [r.Id, r])
);
const abilities = new Map(data.MetalWareAbilityList.map(r => [r.Id, r]));
const positive = z.number().int().positive();
const effectSchema = z.object({
    InitialValue: z.number(),
    ValuePerLevel: z.number(),
    Standard: z.number(),
    SubDesc: z.string(),
});
const checkTotal = (table: (typeof data.RandomTableList)[number]) => {
    assert(table.TotalProb > 0 && Number.isFinite(table.TotalProb));
    assert(table.Elements.every(r => Number.isFinite(r.Prob) && r.Prob > 0));
    assert.equal(
        table.Elements.reduce((sum, r) => sum + r.Prob, 0),
        table.TotalProb,
        `Wrong total ${table.Id}`
    );
};
let missingEffects = 0;
const colors = data.EchoStoneList.map(color => {
    assert(color.Id >= 1 && color.Id <= 5, `Unknown color ${color.Id}`);
    const table = tables.get(color.Id);
    assert(table, `Missing color table ${color.Id}`);
    checkTotal(table);
    return {
        id: color.Id,
        name: item(color.ItemId).name,
        total: table.TotalProb,
        options: table.Elements.map((raw, index) => {
            const r = z
                .object({
                    Name: z.string().min(1),
                    MWAbilityId: z.number().int().nonnegative(),
                    Min: positive,
                    Max: positive,
                    Prob: z.number().positive(),
                    Type: z.literal(1),
                })
                .parse(raw);
            assert.equal(r.Min, 1, "Review new option minimum rule");
            const ability = abilities.get(r.MWAbilityId);
            assert(
                ability || r.MWAbilityId === 0,
                `Missing effect ${r.MWAbilityId}`
            );
            const e = ability ? effectSchema.parse(ability) : null;
            if (!e) missingEffects++;
            return {
                id: index + 1,
                name: r.Name,
                abilityId: r.MWAbilityId,
                max: r.Max,
                weight: r.Prob,
                effect: e
                    ? {
                          initial: e.InitialValue,
                          perLevel: e.ValuePerLevel,
                          standard: e.Standard,
                          unit: text(e.SubDesc),
                      }
                    : null,
            };
        }),
    };
});
assert.equal(unique(colors, r => r.id, "color").length, 5);
const maxima = [
    ...new Set(colors.flatMap(c => c.options.map(o => o.max))),
].sort((a, b) => a - b);
const levels = Object.fromEntries(
    maxima.map(max => {
        const table = tables.get(10000 + max);
        assert(table, `Missing level table ${10000 + max}`);
        checkTotal(table);
        const rows = table.Elements.map(r => {
            assert.equal(r.Type, 10);
            const level = positive.parse(Number(r.Name));
            assert(level <= max);
            return { level, weight: r.Prob };
        }).sort((a, b) => a.level - b.level);
        unique(rows, r => r.level, `level ${max}`);
        return [max, rows];
    })
);
const grades = Object.fromEntries(
    unique(data.EchoStoneAwakenAdjustByGradeList, r => r.Grade, "grade").map(
        r => {
            assert(r.Grade >= 1 && r.Grade <= 30);
            unique(r.Elements, e => e.MaxLevel, `grade ${r.Grade} maximum`);
            return [
                r.Grade,
                Object.fromEntries(
                    maxima.map(max => {
                        const e = r.Elements.find(e => e.MaxLevel === max);
                        assert(
                            e &&
                                e.AdjustMaxLevel >= 1 &&
                                e.AdjustMaxLevel <= max,
                            `Missing/invalid grade ${r.Grade}/${max}`
                        );
                        return [max, e.AdjustMaxLevel];
                    })
                ),
            ];
        }
    )
);
assert.equal(Object.keys(grades).length, 30);
const agents = unique(
    data.EchoStoneAwakenAdjustByItemList,
    r => r.ItemId,
    "agent"
)
    .map(r => {
        unique(r.Elements, e => e.MaxLevel, `agent ${r.ItemId} maximum`);
        return {
            ...item(r.ItemId),
            lower: Object.fromEntries(
                maxima.map(max => {
                    const e = r.Elements.find(e => e.MaxLevel === max);
                    assert(
                        e && e.AdjustMinLevel >= 0 && e.AdjustMinLevel < max,
                        `Missing/invalid agent ${r.ItemId}/${max}`
                    );
                    return [max, e.AdjustMinLevel];
                })
            ),
        };
    })
    .sort((a, b) => a.id - b.id);
assert.deepEqual(
    agents.map(r => r.id),
    [53940, 53941, 53942, 5000078]
);
const result = {
    version: String(manifest.sourceVersion.CreatedAt),
    colors,
    levels,
    grades,
    agents,
    stone: item(5040961),
};
const path = resolve(__dirname, "../src/data/echostone-reference.json");
const output = JSON.stringify(result) + "\n";
if (process.argv.includes("--check"))
    assert.equal(
        readFileSync(path, "utf8"),
        output,
        "Run pnpm echostone:build after snapshot review"
    );
else writeFileSync(path, output);
console.log(
    `Echostone: ${colors.reduce((n, c) => n + c.options.length, 0)} entries, ${missingEffects} explicitly unavailable effects, ${Buffer.byteLength(output)} bytes`
);
