import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { resolveItems } from "./item-reference";
import rules from "./murias-rules.json";
import { readSnapshot, sha256, stableJson } from "./reference-data";

const { data, manifest } = readSnapshot(
    resolve(__dirname, "../src/data/reference")
);
const strings = new Map(data.StringTable.map(row => [row.Id, row.Str]));
const rows = data.OptionSetList.filter(row => row.Usage === 10);
assert.deepEqual(
    rows.map(row => row.Id).sort(),
    rules.effects.map(row => row.id).sort()
);
assert.equal(new Set(rules.effects.map(row => row.id)).size, 30);
assert.equal(new Set(rules.effects.map(row => row.template)).size, rows.length);
for (const effect of rules.effects) {
    const skill = data.SkillList.find(row => row.Id === effect.skillId);
    assert(skill, `Unknown skill ${effect.skillId}`);
    assert(effect.template.startsWith(strings.get(skill.Name)!));
    assert(
        readFileSync(
            resolve(__dirname, `../public/images/murias/${effect.skillId}.png`)
        )
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    );
    const row = rows.find(row => row.Id === effect.id)!;
    assert.equal(
        strings.get(row.Desc),
        effect.template,
        `Re-audit changed effect ${effect.id}`
    );
    assert.equal(effect.values.length, 10);
    assert.equal(new Set(effect.values).size, 10);
    assert(
        effect.values.every(
            (value, i) =>
                value > 0 &&
                Number.isFinite(value) &&
                (i === 0 || value > effect.values[i - 1])
        )
    );
    const maximum = effect.template.match(/\(최대 ([\d.]+)(%|초)?\)$/);
    assert(maximum);
    assert.equal(effect.values[9], Number(maximum[1]));
    assert.equal(effect.unit, maximum[2] ?? "");
    assert(effect.template.includes(`{0}${effect.unit}`));
}
const names = new Map(
    resolveItems(data.ItemList, data.StringTable).items.map(row => [
        Number(row.id),
        row.name,
    ])
);
assert.equal(names.get(3600007), "무리아스의 유물");
assert.equal(names.get(3600006), "무리아스의 유물(이데아)");
const payload = {
    sourceVersion: manifest.sourceVersion.CreatedAt,
    collectedAt: manifest.collectedAt,
    item: { id: 3600007, name: names.get(3600007)! },
    idea: { id: 3600006, name: names.get(3600006)! },
    effects: rules.effects,
};
const output =
    JSON.stringify({
        version: `${payload.sourceVersion}:${sha256(stableJson(payload))}`,
        ...payload,
    }) + "\n";
const path = resolve(__dirname, "../src/data/murias-reference.json");
if (process.argv.includes("--check"))
    assert.equal(readFileSync(path, "utf8"), output, "Run pnpm murias:build");
else writeFileSync(path, output);
console.log(
    `Murias: ${rows.length} effects, 300 level values audited; ${Buffer.byteLength(output)} bytes`
);
