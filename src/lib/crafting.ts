import { z } from "zod";

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const CraftingGroupSchema = z.object({
    itemIds: z.array(integer.positive()).min(1),
    count: integer.positive(),
});
export type CraftingGroup = z.infer<typeof CraftingGroupSchema>;

export interface CraftingItem {
    id: number;
    name: string;
    searchable: boolean;
    ambiguous: boolean;
    unresolved?: string;
}
export interface CraftingRecipe {
    fingerprint: string;
    itemId: number;
    type: number;
    formId: number;
    level: number;
    facilityKey: string;
    facility: string;
    skill: string;
    rank: string;
    process: CraftingGroup[];
    finishes: { groups: CraftingGroup[]; extraData: string }[];
    occurrences: number;
    issues: string[];
}
export interface CraftingReference {
    version: string;
    sourceVersion: number;
    ruleVersion: string;
    collectedAt: string;
    items: CraftingItem[];
    recipes: CraftingRecipe[];
    byOutput: Record<string, string[]>;
}
