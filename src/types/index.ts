export interface Material {
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
}

export interface CraftingItem {
    name: string;
    imageUrl: string;
    materials: Material[];
}
