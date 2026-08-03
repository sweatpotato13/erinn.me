/**
 * Converts src/constant/all-item-list.ts to src/data/all-item-list.json
 * Run: npx tsx scripts/convert-item-list.ts
 */
import { writeFileSync } from "fs";
import { resolve } from "path";

import { AllItemList } from "../src/constant/all-item-list";

const outputPath = resolve(__dirname, "../src/data/all-item-list.json");
writeFileSync(outputPath, JSON.stringify(AllItemList), "utf-8");

console.log(`Written ${AllItemList.length} items to ${outputPath}`);
