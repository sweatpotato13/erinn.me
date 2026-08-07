export function getItemImageUrl(itemName: string): string {
    return `/api/item-image?${new URLSearchParams({ name: itemName })}`;
}
