import catalog from "@/data/auction-item-catalog.json";

export type AuctionCatalogItem = {
    id: string;
    name: string;
    evidence:
        | "current-listing"
        | "recent-sale"
        | "trading-volume-rank"
        | "traded-value-rank";
    sourceRank?: number;
    verifiedAt: string;
};

const items = catalog.items as AuctionCatalogItem[];
const itemsById = new Map(items.map(item => [item.id, item]));
const itemsByName = new Map(items.map(item => [item.name, item]));

export function getAuctionCatalogItems(): readonly AuctionCatalogItem[] {
    return items;
}

export function getAuctionCatalogItemById(
    id: string
): AuctionCatalogItem | undefined {
    return itemsById.get(id);
}

export function getAuctionCatalogItemByExactName(
    name: string
): AuctionCatalogItem | undefined {
    return itemsByName.get(name);
}

export function getAuctionItemPath(
    item: Pick<AuctionCatalogItem, "id">
): string {
    return `/auction/items/${encodeURIComponent(item.id)}`;
}
