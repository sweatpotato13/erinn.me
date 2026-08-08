/**
 * Builds the image endpoint URL for an item name.
 *
 * @param itemName - The name of the item to retrieve an image for
 * @returns The URL for the item's image endpoint
 */
export function getItemImageUrl(itemName: string): string {
    return `/api/item-image?${new URLSearchParams({ name: itemName })}`;
}
