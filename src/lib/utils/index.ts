import { AllItemList } from "@/constant/all-item-list";

export function getItemImageUrl(itemName: string): string {
    const item = AllItemList.find(item => item.name === itemName);
    if (!item) {
        console.warn(`Item not found: ${itemName}`);
        return `/api/item-image?id=1000`;
    }
    return `/api/item-image?id=${item.id}`;
}
