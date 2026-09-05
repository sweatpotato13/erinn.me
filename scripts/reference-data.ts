import { createHash } from "node:crypto";
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";

import * as z from "zod";

import knownMissingStrings from "./reference-known-missing-strings.json";

const id = z.number().int().nonnegative();
const rows = <T extends z.ZodType>(schema: T) => z.array(schema).min(1);
const record = z.looseObject({});
const material = z.looseObject({ ItemIds: z.array(id).min(1), Count: id });
const reward = z.looseObject({ Id: id, Count: id, Rate: z.number() });
const named = { Id: id, Name: z.string(), Desc: z.string() };

// Validate relationships without stripping any decoded fields or defaulting values.
const tableSchemas = {
    ItemList: rows(
        z.looseObject({
            ...named,
            ColorTableIds: z.array(id),
            IsAuctionSearchable: z.boolean(),
            HaveMesh: z.boolean(),
            IsDyeAble: z.boolean(),
        })
    ),
    OptionSetList: rows(
        z.looseObject({ ...named, Name2: z.string(), Usage: id, Level: id })
    ),
    StringTable: rows(
        z.looseObject({ Id: z.string().min(1), Str: z.string() })
    ),
    ItemExtendMetalWareList: rows(
        z.looseObject({
            Id: id,
            EquipType: z.string(),
            Human: z.boolean(),
            Elf: z.boolean(),
            Giant: z.boolean(),
        })
    ),
    MetalWareAbilityList: rows(
        z.looseObject({
            Id: id,
            Desc: z.string(),
            SubDesc: z.string(),
            EquipFilterMap: z.record(z.string(), z.boolean()),
            TypeFilterMap: z.record(z.string(), z.boolean()),
            BaseMaxLevel: id,
            InitialValue: z.number(),
            ValuePerLevel: z.number(),
        })
    ),
    MetalWareItemList: rows(
        z.looseObject({
            ...named,
            ItemId: id,
            RateRank1: z.number(),
            RateRank2: z.number(),
            RateRank3: z.number(),
            AbilityLimit: id,
        })
    ),
    MetalWareLevelList: rows(
        z.looseObject({
            Level: id,
            Rank1MinLevel: id,
            Rank1MaxLevel: id,
            Rank2MinLevel: id,
            Rank2MaxLevel: id,
            Rank3MinLevel: id,
            Rank3MaxLevel: id,
            LimitBreakMinLevel: id,
            LimitBreakMaxLevel: id,
        })
    ),
    EchoStoneList: rows(
        z.looseObject({
            Id: id,
            ItemId: id,
            Upgrades: rows(
                z.looseObject({
                    Grade: id,
                    ConvertFixedRewards: z.array(reward),
                    ConvertAdditionalRewardIds: z.array(id),
                })
            ),
        })
    ),
    EchoStoneAwakenAdjustByGradeList: rows(
        z.looseObject({
            Grade: id,
            Elements: rows(z.looseObject({ MaxLevel: id, AdjustMaxLevel: id })),
        })
    ),
    EchoStoneAwakenAdjustByItemList: rows(
        z.looseObject({
            ItemId: id,
            Elements: rows(z.looseObject({ MaxLevel: id, AdjustMinLevel: id })),
        })
    ),
    EchoStoneConvertAdditionalRewardList: rows(
        z.looseObject({ Id: id, Rate: z.number(), RewardTables: rows(reward) })
    ),
    RandomTableList: rows(
        z.looseObject({
            Id: id,
            Name: z.string(),
            TotalProb: z.number(),
            Elements: rows(
                z.looseObject({
                    Name: z.string(),
                    Type: id,
                    Prob: z.number(),
                    MWAbilityId: id,
                })
            ),
        })
    ),
    ProductionList: rows(
        z.looseObject({
            ItemId: id,
            Type: id,
            FormId: id,
            Essentials: z.array(material),
            CompleteEssentials: z.array(
                z.looseObject({
                    Essentials: z.array(material),
                    ExtraData: z.string(),
                })
            ),
        })
    ),
    ItemExtendUpgradeList: rows(
        z.looseObject({
            Id: id,
            UpgradeMax: id,
            GemUpgradeMax: id,
            UpgradeIds: z.array(id),
        })
    ),
    ItemUpgradeList: rows(
        z.looseObject({
            ...named,
            NeedGems: z.array(record),
            AvailableNpcs: z.array(z.string()),
            ModifyStats: z.array(record),
            OptionSetIds: z.array(id),
            Personalize: z.boolean(),
        })
    ),
};

export const tableNames = Object.keys(tableSchemas) as Array<
    keyof typeof tableSchemas
>;
export const versionSchema = z.looseObject({
    CreatedAt: z.number().int().positive(),
});
const dataSchema = z.object({ Version: versionSchema, ...tableSchemas });
const placeholders = new Set(["", "None", "<nil>"]);
const knownMissing = new Set(knownMissingStrings);

export function validateData(input: unknown) {
    const data = dataSchema.parse(input);
    const warnings: Record<string, { count: number; examples: string[] }> = {};
    const warn = (kind: string, value: string) => {
        const entry = (warnings[kind] ??= { count: 0, examples: [] });
        entry.count++;
        if (entry.examples.length < 5 && !entry.examples.includes(value))
            entry.examples.push(value);
    };
    const lookup = (table: "ItemList" | "OptionSetList" | "StringTable") => {
        const ids = new Set(data[table].map(row => row.Id));
        if (ids.size !== data[table].length)
            throw new Error(`${table}: duplicate lookup key`);
        return ids;
    };
    const items = lookup("ItemList");
    const options = lookup("OptionSetList");
    const strings = lookup("StringTable");
    const requireRef = (
        ids: Set<string | number>,
        value: string | number,
        path: string
    ) => {
        if (!ids.has(value))
            throw new Error(`${path}: unresolved reference ${value}`);
    };
    for (const name of [
        "ItemList",
        "OptionSetList",
        "MetalWareAbilityList",
        "MetalWareItemList",
        "ItemUpgradeList",
        "RandomTableList",
    ] as const) {
        for (const row of data[name]) {
            for (const field of ["Name", "Name2", "Desc", "SubDesc"]) {
                const value = row[field];
                if (typeof value !== "string" || strings.has(value)) continue;
                if (placeholders.has(value))
                    warn(`${name}.${field}: placeholder`, value);
                else if (name === "ItemList" && knownMissing.has(value))
                    warn(`${name}.${field}: known missing string`, value);
                else
                    throw new Error(
                        `${name}.${field}: unresolved string ${value}; review upstream before extending the known-missing list`
                    );
            }
        }
    }
    for (const name of [
        "ItemExtendMetalWareList",
        "ItemExtendUpgradeList",
    ] as const) {
        for (const row of data[name]) requireRef(items, row.Id, `${name}.Id`);
    }
    for (const name of [
        "MetalWareItemList",
        "EchoStoneList",
        "EchoStoneAwakenAdjustByItemList",
        "ProductionList",
    ] as const) {
        for (const row of data[name])
            requireRef(items, row.ItemId, `${name}.ItemId`);
    }
    const upgrades = new Set(data.ItemUpgradeList.map(row => row.Id));
    for (const row of data.ItemExtendUpgradeList) {
        for (const value of row.UpgradeIds)
            requireRef(upgrades, value, "ItemExtendUpgradeList.UpgradeIds");
    }
    for (const row of data.ItemUpgradeList) {
        for (const value of row.OptionSetIds)
            requireRef(options, value, "ItemUpgradeList.OptionSetIds");
    }
    for (const row of data.ProductionList) {
        for (const material of [
            ...row.Essentials,
            ...row.CompleteEssentials.flatMap(group => group.Essentials),
        ]) {
            for (const value of material.ItemIds)
                requireRef(items, value, "ProductionList.Essentials.ItemIds");
        }
    }
    const rewards = new Set(
        data.EchoStoneConvertAdditionalRewardList.map(row => row.Id)
    );
    const grades = new Set(
        data.EchoStoneAwakenAdjustByGradeList.map(row => row.Grade)
    );
    for (const row of data.EchoStoneList) {
        for (const upgrade of row.Upgrades) {
            requireRef(grades, upgrade.Grade, "EchoStoneList.Upgrades.Grade");
            for (const value of upgrade.ConvertAdditionalRewardIds)
                requireRef(
                    rewards,
                    value,
                    "EchoStoneList.ConvertAdditionalRewardIds"
                );
            for (const reward of upgrade.ConvertFixedRewards)
                requireRef(
                    items,
                    reward.Id,
                    "EchoStoneList.ConvertFixedRewards"
                );
        }
    }
    for (const row of data.EchoStoneConvertAdditionalRewardList) {
        for (const reward of row.RewardTables)
            requireRef(
                items,
                reward.Id,
                "EchoStoneConvertAdditionalRewardList.RewardTables"
            );
    }
    return { data, warnings };
}

export function stableJson(value: unknown): string {
    return JSON.stringify(value, (_key, entry) =>
        entry && typeof entry === "object" && !Array.isArray(entry)
            ? Object.fromEntries(
                  Object.keys(entry)
                      .sort()
                      .map(key => [key, entry[key]])
              )
            : entry
    );
}

export const sha256 = (value: string) =>
    createHash("sha256").update(value).digest("hex");
const readJson = (path: string): unknown =>
    JSON.parse(readFileSync(path, "utf8"));
const tableMetadata = z.object({
    count: id,
    bytes: id,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const sourceSchema = z.object({
    site: z.literal("https://prilus.gitlab.io/"),
    region: z.literal("kr"),
    language: z.literal("kr"),
    resourceUrl: z.url(),
    versionUrl: z.url(),
    decoder: z.literal("upstream-playwright-indexeddb"),
    assets: z.array(z.url()).min(1),
});
export type Source = z.infer<typeof sourceSchema>;
const manifestSchema = z.object({
    formatVersion: z.literal(1),
    snapshot: z.string().regex(/^snapshots\/[1-9][0-9]*-[a-f0-9]{64}$/),
    source: sourceSchema,
    sourceVersion: versionSchema,
    collectedAt: z.iso.datetime(),
    tables: z.record(z.enum(tableNames), tableMetadata),
    warnings: z.record(
        z.string(),
        z.object({ count: id, examples: z.array(z.string()) })
    ),
});
export type Manifest = z.infer<typeof manifestSchema>;

export function readSnapshot(root: string) {
    const manifest = manifestSchema.parse(
        readJson(join(root, "manifest.json"))
    );
    if (
        manifest.snapshot !==
        `snapshots/${manifest.sourceVersion.CreatedAt}-${sha256(stableJson(manifest.tables))}`
    ) {
        throw new Error(
            "Snapshot path does not match its version/table metadata"
        );
    }
    const input: Record<string, unknown> = { Version: manifest.sourceVersion };
    for (const name of tableNames) {
        const text = readFileSync(
            join(root, manifest.snapshot, `${name}.json`),
            "utf8"
        );
        const meta = manifest.tables[name];
        if (
            sha256(text) !== meta.sha256 ||
            Buffer.byteLength(text) !== meta.bytes
        )
            throw new Error(`${name}: snapshot checksum/size mismatch`);
        const table = JSON.parse(text);
        if (!Array.isArray(table) || table.length !== meta.count)
            throw new Error(`${name}: snapshot count mismatch`);
        input[name] = table;
    }
    return { manifest, ...validateData(input) };
}

export function publishSnapshot(
    root: string,
    input: unknown,
    source: Source
): Manifest {
    const { data, warnings } = validateData(input);
    sourceSchema.parse(source);
    mkdirSync(root, { recursive: true });
    const lock = join(root, ".collect-lock");
    // ponytail: one local writer; per-region locks only if more regions are added.
    try {
        mkdirSync(lock);
    } catch {
        throw new Error(
            `Collector lock exists or cannot be created: ${lock}. If no collector is running, remove a stale lock and retry.`
        );
    }
    try {
        const previous = existsSync(join(root, "manifest.json"))
            ? readSnapshot(root).manifest
            : undefined;
        if (
            previous &&
            data.Version.CreatedAt < previous.sourceVersion.CreatedAt
        )
            throw new Error(
                "Source version is older than the committed snapshot; retry a current mirror"
            );
        const tables = {} as Manifest["tables"];
        const stage = mkdtempSync(join(lock, "candidate-"));
        for (const name of tableNames) {
            // One record per line; preserve all upstream array ordering and duplicate IDs.
            const text = `[\n${data[name].map(row => stableJson(row)).join(",\n")}\n]\n`;
            tables[name] = {
                count: data[name].length,
                bytes: Buffer.byteLength(text),
                sha256: sha256(text),
            };
            writeFileSync(join(stage, `${name}.json`), text, { flag: "wx" });
            const old = previous?.tables[name];
            console.log(
                `${name}: ${old?.count ?? 0} -> ${tables[name].count} rows; ${tables[name].bytes} bytes; ${old?.sha256 === tables[name].sha256 ? "unchanged" : "changed"}`
            );
        }
        const digest = sha256(stableJson(tables));
        const snapshot = `snapshots/${data.Version.CreatedAt}-${digest}`;
        console.log(
            `Source version: ${data.Version.CreatedAt}; warnings: ${JSON.stringify(warnings)}`
        );
        if (previous?.snapshot === snapshot) {
            console.log(
                "No data changes; keeping the existing manifest and collection timestamp."
            );
            return previous;
        }
        if (previous?.sourceVersion.CreatedAt === data.Version.CreatedAt)
            console.warn(
                "Same source version has changed table content; inspect the table hashes/diff before committing."
            );
        const manifest: Manifest = {
            formatVersion: 1,
            snapshot,
            source,
            sourceVersion: data.Version,
            collectedAt: new Date().toISOString(),
            tables,
            warnings,
        };
        mkdirSync(join(root, "snapshots"), { recursive: true });
        const target = join(root, snapshot);
        if (existsSync(target)) {
            for (const name of tableNames) {
                if (
                    sha256(
                        readFileSync(join(target, `${name}.json`), "utf8")
                    ) !== tables[name].sha256
                )
                    throw new Error(
                        `Existing candidate ${name} is corrupt; remove the unreferenced candidate and retry`
                    );
            }
        } else renameSync(stage, target);
        const manifestPath = join(lock, "manifest.json");
        writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`, {
            flag: "wx",
        });
        // The only publication point. Never mutate or delete the previously referenced files.
        renameSync(manifestPath, join(root, "manifest.json"));
        return manifest;
    } finally {
        try {
            rmSync(lock, { recursive: true, force: true });
        } catch (error) {
            console.warn(
                `Could not remove collector lock ${lock}: ${String(error)}`
            );
        }
    }
}
