/** @jest-environment node */

import localItems from "@/data/all-item-list.json";
import catalog from "@/data/auction-item-catalog.json";
import {
    getAuctionCatalogItemByExactName,
    getAuctionCatalogItemById,
    getAuctionCatalogItems,
    getAuctionItemPath,
} from "@/lib/auction-item-catalog";
import { validateAuctionItemCatalog } from "@/lib/auction-item-catalog-validator";

const cloneCatalog = () => structuredClone(catalog);

describe("auction item catalog", () => {
    it("validates the checked-in catalog and exposes exact lookups", () => {
        const validated = validateAuctionItemCatalog(catalog, localItems);
        expect(validated.items).toHaveLength(500);
        expect(validated.selection.method).toBe("trading-demand");
        expect(
            validated.items.every(
                item => item.sourceRank && item.sourceRank <= 300
            )
        ).toBe(true);
        const item = getAuctionCatalogItems()[0];
        expect(getAuctionCatalogItemById(item.id)).toEqual(item);
        expect(getAuctionCatalogItemByExactName(item.name)).toEqual(item);
        expect(
            getAuctionCatalogItemByExactName(` ${item.name}`)
        ).toBeUndefined();
        expect(getAuctionItemPath(item)).toBe(`/auction/items/${item.id}`);
    });

    it.each([
        [
            "malformed date",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[0].verifiedAt = "not-a-date";
            },
        ],
        [
            "unknown id",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[0].id = "UNKNOWN_SAFE_ID";
            },
        ],
        [
            "mismatched name",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[0].name = "다른 이름";
            },
        ],
        [
            "duplicate id",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[1].id = value.items[0].id;
            },
        ],
        [
            "duplicate name",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[1].name = value.items[0].name;
            },
        ],
        [
            "untrimmed name",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[0].name = ` ${value.items[0].name}`;
            },
        ],
        [
            "stale evidence",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[0].verifiedAt = "2026-01-01T00:00:00Z";
            },
        ],
        [
            "future evidence",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items[0].verifiedAt = "2027-01-01T00:00:00Z";
            },
        ],
        [
            "too few items",
            (value: ReturnType<typeof cloneCatalog>) => {
                value.items = value.items.slice(0, 499);
            },
        ],
    ])("rejects %s", (_label, mutate) => {
        const value = cloneCatalog();
        mutate(value);
        expect(() => validateAuctionItemCatalog(value, localItems)).toThrow();
    });
});
