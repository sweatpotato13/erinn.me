import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateAuctionItemCatalog } from "../src/lib/auction-item-catalog-validator";

import { readItemReference } from "./item-reference";

const readJson = (path: string) =>
    JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));

try {
    const catalog = validateAuctionItemCatalog(
        readJson("src/data/auction-item-catalog.json"),
        readItemReference().items
    );
    console.log(
        `Validated auction item catalog: ${catalog.items.length} items`
    );
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
}
