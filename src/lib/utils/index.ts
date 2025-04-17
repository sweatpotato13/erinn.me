import { AllItemList } from "@/constant/all-item-list";

export function getItemImageUrl(itemName: string): string {
    const item = AllItemList.find(item => item.name === itemName);
    return `/api/item-image?id=${item?.id}`;
}
