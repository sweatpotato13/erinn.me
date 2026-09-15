import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import evidence from "../src/data/auction-filter-evidence.json";
import echoes from "../src/data/echostone-reference.json";
import enchants from "../src/data/enchant-index.json";
import reforges from "../src/data/reforge-reference.json";
import { normalizeOptionText } from "../src/lib/auction-option-text";
import { readSnapshot } from "./reference-data";

const names = (values: string[]) =>
    [
        ...new Set(
            values.map(value => {
                const name = normalizeOptionText(value);
                assert(
                    name.length > 0 && name.length <= 100,
                    `Invalid option name: ${name}`
                );
                return name;
            })
        ),
    ].sort((a, b) => a.localeCompare(b, "ko-KR"));
const { data } = readSnapshot(resolve(__dirname, "../src/data/reference"));
for (const fixed of evidence.fixedAwakenings) {
    const table = data.RandomTableList.find(row => row.Id === fixed.color);
    const rows = table?.Elements.filter(row => row.Name === fixed.name);
    assert.equal(rows?.length, 1, `Missing fixed awakening ${fixed.name}`);
    assert.equal(rows![0].MWAbilityId, fixed.abilityId);
    assert.equal(rows![0].Min, fixed.level);
    assert.equal(rows![0].Max, fixed.level);
}
for (const observed of evidence.observedAwakenings) {
    assert(echoes.colors.some(color => color.id === observed.color));
    assert(normalizeOptionText(observed.value).startsWith(`${observed.name} `));
}
const output =
    JSON.stringify({
        enchants: enchants.map(({ names: aliases, usage, rank }) => {
            assert([0, 1, 11, 12].includes(usage));
            return { names: names(aliases), usage, rank };
        }),
        reforges: names(reforges.abilities.map(option => option.name)),
        echostones: echoes.colors.map(color => ({
            id: color.id,
            name: color.name,
            names: names([
                ...color.options.map(option => option.name),
                ...evidence.observedAwakenings
                    .filter(row => row.color === color.id)
                    .map(row => row.name),
            ]),
        })),
        fixedAwakenings: evidence.fixedAwakenings.map(
            ({ color, name, level }) => ({ color, name, level })
        ),
    }) + "\n";
const path = resolve(__dirname, "../src/data/auction-filter-reference.json");
if (process.argv.includes("--check"))
    assert.equal(
        readFileSync(path, "utf8"),
        output,
        "Run pnpm auction-filters:build"
    );
else writeFileSync(path, output);
console.log(`Auction filter reference: ${Buffer.byteLength(output)} bytes`);
