import assert from "node:assert/strict";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mock } from "node:test";

import {
    publishSnapshot,
    readSnapshot,
    stableJson,
    tableNames,
    validateData,
} from "./reference-data";

const { data, manifest, warnings } = readSnapshot(
    resolve("src/data/reference")
);
assert.equal(tableNames.length, 15);
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
            ...data,
            StringTable: data.StringTable.filter(row => row.Id !== item.Name),
        }),
    /unresolved string/
);
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
const stringIds = new Set(data.StringTable.map(row => row.Id));
const knownKey = data.ItemList.find(row => !stringIds.has(row.Name))?.Name;
assert.ok(
    knownKey,
    "The initial snapshot contains reviewed untranslated item names"
);
assert.equal(
    validateData(withItem({ Name: knownKey })).data.ItemList[0].Name,
    knownKey
);
const duplicateUpgrades = [...data.ItemUpgradeList, data.ItemUpgradeList[0]];
assert.equal(
    validateData({ ...data, ItemUpgradeList: duplicateUpgrades }).data
        .ItemUpgradeList.length,
    duplicateUpgrades.length
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
    const first = publishSnapshot(root, data, manifest.source);
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
