/**
 * Generates a compact name→id map for getItemImageUrl.
 * Output: src/data/item-id-map.json (~38K entries, ~500KB)
 * Much smaller than importing the full all-item-list.ts into client.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const inputPath = resolve(__dirname, "../src/data/all-item-list.json");
const outputPath = resolve(__dirname, "../src/data/item-id-map.json");

try {
    const raw = readFileSync(inputPath, "utf-8");
    const items: { name: string; id: string }[] = JSON.parse(raw);

    const map: Record<string, string> = {};
    for (const item of items) {
        map[item.name] = item.id;
    }

    writeFileSync(outputPath, JSON.stringify(map), "utf-8");
    console.log(`Generated item-id-map.json: ${Object.keys(map).length} entries`);
} catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
}
