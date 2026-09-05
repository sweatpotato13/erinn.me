import assert from "node:assert/strict";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mock } from "node:test";

import {
    publishSnapshot,
    readSnapshot,
    sha256,
    stableJson,
    tableNames,
    validateData,
} from "./reference-data";
import knownMissingStrings from "./reference-known-missing-strings.json";

const { data, manifest, warnings } = readSnapshot(
    resolve("src/data/reference")
);
assert.deepEqual(Object.keys(manifest.tables).sort(), [...tableNames].sort());
assert.ok(!Object.hasOwn(manifest.tables, "EffectList"));
assert.deepEqual(warnings, manifest.warnings);
assert.equal(
    stableJson({ b: 2, a: { y: 1, x: [2, 1] } }),
    '{"a":{"x":[2,1],"y":1},"b":2}'
);
for (const name of tableNames) {
    assert.throws(() => validateData({ ...data, [name]: undefined }));
    assert.throws(() => validateData({ ...data, [name]: [{}] }));
}
assert.throws(() => validateData({ ...data, Version: { CreatedAt: 0 } }));
assert.throws(() => validateData({ ...data, Version: { CreatedAt: "123" } }));
const item = data.ItemList[0];
const withItem = (changes: Record<string, unknown>) => ({
    ...data,
    ItemList: [{ ...item, ...changes }, ...data.ItemList.slice(1)],
});
assert.throws(() => validateData(withItem({ Id: "broken" })));
assert.throws(
    () => validateData(withItem({ Name: "itemdb.unexpected-missing" })),
    /unresolved string/
);
assert.throws(
    () =>
        validateData({
            ...withItem({ Name: "reference-check.present" }),
            StringTable: data.StringTable.filter(
                row => row.Id !== "reference-check.present"
            ),
        }),
    /unresolved string/
);
validateData({
    ...withItem({ Name: "reference-check.present" }),
    StringTable: [
        ...data.StringTable,
        { Id: "reference-check.present", Str: "검증" },
    ],
});
const placeholders = validateData(
    withItem({
        Name: "<nil>",
        Desc: "None",
        NewField: { untouched: [3, 1, 3] },
    })
);
assert.equal(placeholders.data.ItemList[0].Name, "<nil>");
assert.deepEqual(placeholders.data.ItemList[0].NewField, {
    untouched: [3, 1, 3],
});
assert.ok(placeholders.warnings["ItemList.Name: placeholder"].count);
const knownKey = knownMissingStrings[0];
if (knownKey) {
    const knownGap = validateData({
        ...withItem({ Name: knownKey }),
        StringTable: data.StringTable.filter(row => row.Id !== knownKey),
    });
    assert.equal(knownGap.data.ItemList[0].Name, knownKey);
    assert.ok(knownGap.warnings["ItemList.Name: known missing string"].count);
}
const duplicateUpgrades = [...data.ItemUpgradeList, data.ItemUpgradeList[0]];
assert.equal(
    validateData({ ...data, ItemUpgradeList: duplicateUpgrades }).data
        .ItemUpgradeList.length,
    duplicateUpgrades.length
);
assert.deepEqual(
    readSnapshot(resolve("src/data/reference")).data.CommercePostNameMap,
    data.CommercePostNameMap
);
assert.throws(() => validateData({ ...data, CommercePostNameMap: {} }));
assert.throws(
    () =>
        validateData({
            ...data,
            CommercePostNameMap: {
                ...data.CommercePostNameMap,
                "201": "reference-check.missing-post-name",
            },
        }),
    /unresolved string/
);
assert.throws(
    () =>
        validateData({
            ...data,
            CommercePostNameMap: Object.fromEntries(
                Object.entries(data.CommercePostNameMap).filter(
                    ([key]) => key !== String(data.BarterList[0].PostId)
                )
            ),
        }),
    /BarterList.PostId: unresolved reference/
);
assert.throws(
    () =>
        validateData({
            ...data,
            MiniatureList: [
                { ...data.MiniatureList[0], ItemId: Number.MAX_SAFE_INTEGER },
            ],
        }),
    /MiniatureList.ItemId: unresolved reference/
);
assert.throws(
    () =>
        validateData({
            ...data,
            BarterList: [
                {
                    ...data.BarterList[0],
                    Prices: [{ Id: Number.MAX_SAFE_INTEGER, Count: 1 }],
                },
            ],
        }),
    /BarterList.Prices.Id: unresolved reference/
);
assert.equal(
    validateData({
        ...data,
        ItemExtendTotemList: [{ ...data.ItemExtendTotemList[0], Bonuses: [] }],
    }).data.ItemExtendTotemList[0].Bonuses.length,
    0
);
const unknownSkill = {
    ...data.SkillList[0],
    Name: `unknownid:${data.SkillList[0].Id}`,
};
assert.equal(
    validateData({ ...data, SkillList: [unknownSkill] }).data.SkillList[0].Name,
    unknownSkill.Name
);
assert.throws(
    () =>
        validateData({
            ...data,
            SkillList: [{ ...unknownSkill, Name: "unknownid:invalid" }],
        }),
    /unresolved string/
);
assert.throws(
    () => validateData({ ...data, ItemList: [...data.ItemList, item] }),
    /duplicate lookup/
);
assert.throws(
    () =>
        validateData({
            ...data,
            ItemExtendUpgradeList: [
                {
                    ...data.ItemExtendUpgradeList[0],
                    UpgradeIds: [Number.MAX_SAFE_INTEGER],
                },
            ],
        }),
    /unresolved reference/
);
assert.throws(
    () =>
        validateData({
            ...data,
            ProductionList: [
                { ...data.ProductionList[0], ItemId: Number.MAX_SAFE_INTEGER },
            ],
        }),
    /unresolved reference/
);

const root = fs.mkdtempSync(join(tmpdir(), "reference-check-"));
const log = mock.method(console, "log", () => {});
try {
    // Reproduce this change's 15 -> 20 transition without downloading or retaining a second dataset.
    const addedTables = new Set([
        "MiniatureList",
        "ItemExtendTotemList",
        "BarterList",
        "CommercePostNameMap",
        "SkillList",
    ]);
    const legacyTables = Object.fromEntries(
        Object.entries(manifest.tables).filter(
            ([name]) => !addedTables.has(name)
        )
    );
    const legacySnapshot = `snapshots/${data.Version.CreatedAt}-${sha256(stableJson(legacyTables))}`;
    fs.mkdirSync(join(root, legacySnapshot), { recursive: true });
    for (const name of Object.keys(legacyTables)) {
        fs.copyFileSync(
            resolve("src/data/reference", manifest.snapshot, `${name}.json`),
            join(root, legacySnapshot, `${name}.json`)
        );
    }
    const legacyManifest = JSON.stringify({
        ...manifest,
        snapshot: legacySnapshot,
        tables: legacyTables,
    });
    fs.writeFileSync(join(root, "manifest.json"), legacyManifest);
    // An incomplete candidate cannot publish just because historical coverage is readable.
    assert.throws(() =>
        publishSnapshot(
            root,
            { ...data, MiniatureList: undefined },
            manifest.source
        )
    );
    assert.equal(
        fs.readFileSync(join(root, "manifest.json"), "utf8"),
        legacyManifest
    );
    const first = publishSnapshot(root, data, manifest.source);
    for (const [name, meta] of Object.entries(legacyTables)) {
        assert.equal(
            sha256(
                fs.readFileSync(
                    join(root, legacySnapshot, `${name}.json`),
                    "utf8"
                )
            ),
            meta.sha256
        );
    }
    assert.deepEqual(
        readSnapshot(root).data.CommercePostNameMap,
        data.CommercePostNameMap
    );
    assert.equal(
        first.tables.CommercePostNameMap?.count,
        Object.keys(data.CommercePostNameMap).length
    );
    const originalManifest = fs.readFileSync(
        join(root, "manifest.json"),
        "utf8"
    );
    assert.deepEqual(publishSnapshot(root, data, manifest.source), first);
    assert.equal(
        fs.readFileSync(join(root, "manifest.json"), "utf8"),
        originalManifest
    );
    const unchanged = () => {
        assert.equal(
            fs.readFileSync(join(root, "manifest.json"), "utf8"),
            originalManifest
        );
        assert.equal(readSnapshot(root).manifest.snapshot, first.snapshot);
        assert.equal(fs.existsSync(join(root, ".collect-lock")), false);
    };
    assert.throws(() =>
        publishSnapshot(root, { ...data, StringTable: [] }, manifest.source)
    );
    unchanged();
    assert.throws(
        () =>
            publishSnapshot(
                root,
                { ...data, Version: { CreatedAt: 1 } },
                manifest.source
            ),
        /older/
    );
    unchanged();
    const changed = {
        ...data,
        Version: { CreatedAt: data.Version.CreatedAt + 1 },
    };
    const write = fs.writeFileSync;
    const failWrite = mock.method(
        fs,
        "writeFileSync",
        (...args: Parameters<typeof write>) => {
            if (
                String(args[0]).includes(".collect-lock") &&
                String(args[0]).endsWith("StringTable.json")
            )
                throw new Error("simulated disk full");
            return write(...args);
        }
    );
    try {
        assert.throws(
            () => publishSnapshot(root, changed, manifest.source),
            /simulated disk full/
        );
    } finally {
        failWrite.mock.restore();
    }
    unchanged();
    const rename = fs.renameSync;
    const failPromotion = mock.method(
        fs,
        "renameSync",
        (...args: Parameters<typeof rename>) => {
            if (String(args[0]).endsWith("manifest.json"))
                throw new Error("simulated manifest rename failure");
            return rename(...args);
        }
    );
    try {
        assert.throws(
            () => publishSnapshot(root, changed, manifest.source),
            /simulated manifest rename failure/
        );
    } finally {
        failPromotion.mock.restore();
    }
    unchanged();
    const second = publishSnapshot(root, changed, manifest.source);
    assert.equal(readSnapshot(root).manifest.snapshot, second.snapshot);
    assert.ok(fs.existsSync(join(root, first.snapshot, "ItemList.json")));
    fs.writeFileSync(join(root, "manifest.json"), originalManifest);
    assert.equal(readSnapshot(root).manifest.snapshot, first.snapshot); // Rollback only changes the pointer.
    fs.appendFileSync(join(root, first.snapshot, "ItemList.json"), " ");
    assert.throws(() => readSnapshot(root), /checksum/);
} finally {
    log.mock.restore();
    fs.rmSync(root, { recursive: true, force: true });
}
console.log(
    `Prilus checks passed: version ${manifest.sourceVersion.CreatedAt}, ${tableNames.length} tables; validation, deterministic collection, failed writes/promotion and rollback.`
);
