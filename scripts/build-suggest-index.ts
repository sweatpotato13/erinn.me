import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildSuggestIndex, readItemReference } from "./item-reference";

const { items, unresolved } = readItemReference();
const index = buildSuggestIndex(items);
writeFileSync(
    resolve(__dirname, "../src/data/suggest-index.json"),
    JSON.stringify(index)
);
console.log(
    `Generated suggest-index.json: ${Object.keys(index).length} prefixes, ${Object.values(index).flat().length} unique names; skipped ${unresolved.length} unresolved/placeholder names`
);
