import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { readEnchantReference } from "./enchant-reference";

const records = readEnchantReference();
writeFileSync(
    resolve(__dirname, "../src/data/enchant-index.json"),
    `${JSON.stringify(records)}\n`
);
console.log(`Generated ${records.length} localized enchantment records`);
