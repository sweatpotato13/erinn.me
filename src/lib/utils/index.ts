import itemIdMap from "@/data/item-id-map.json";

const idMap: Record<string, string> = itemIdMap;

export function getItemImageUrl(itemName: string): string {
    const id = idMap[itemName];
    if (!id) {
        return `/api/item-image?id=1000`;
    }
    return `/api/item-image?id=${id}`;
}
