/**
 * Generates a prefix index for autocomplete from all-item-list.json.
 * Output: src/data/suggest-index.json (map: first-2-chars → name[])
 * Run: npx tsx scripts/build-suggest-index.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const EXCLUDED_KEYWORDS = [
    "피터",
    "머미",
    "스폰서",
    "낡은",
    "뮤턴트",
    "점령전",
];

const inputPath = resolve(__dirname, "../src/data/all-item-list.json");
const outputPath = resolve(__dirname, "../src/data/suggest-index.json");

try {
    const raw = readFileSync(inputPath, "utf-8");
    const items: { name: string; id: string }[] = JSON.parse(raw);

    if (!Array.isArray(items) || items.length === 0) {
        console.error("ERROR: Input file is empty or not an array");
        process.exit(1);
    }

    const index: Record<string, string[]> = {};

    for (const item of items) {
        const name = item.name;
        if (!name || name.length < 2) continue;

        const hasExcluded = EXCLUDED_KEYWORDS.some((kw) =>
            name.includes(kw)
        );
        if (hasExcluded) continue;

        const prefix = name.substring(0, 2).toLowerCase();
        if (!index[prefix]) {
            index[prefix] = [];
        }
        index[prefix].push(name);
    }

    writeFileSync(outputPath, JSON.stringify(index), "utf-8");

    const prefixCount = Object.keys(index).length;
    const totalNames = Object.values(index).reduce(
        (sum, arr) => sum + arr.length,
        0
    );
    console.log(
        `Generated suggest-index.json: ${prefixCount} prefixes, ${totalNames} items`
    );
} catch (error) {
    console.error("ERROR: Failed to build suggest index:", error);
    process.exit(1);
}
