import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildItemIdMap, readItemReference } from "./item-reference";

const { items, unresolved } = readItemReference();
const map = buildItemIdMap(items);
writeFileSync(
    resolve(__dirname, "../src/data/item-id-map.json"),
    JSON.stringify(map)
);
console.log(
    `Generated item-id-map.json: ${Object.keys(map).length} names; skipped ${unresolved.length} unresolved/placeholder names`
);
