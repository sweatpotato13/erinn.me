import "server-only";

import reference from "@/data/reforge-reference.json";
import {
    createReforgePool,
    type ReforgeModel,
    type ReforgeTool,
} from "@/lib/reforge";

export const reforgeVersion = reference.version;
export const reforgeTools: ReforgeTool[] = reference.tools;
export function searchReforgeEquipment(query: string) {
    const q = query.trim().toLocaleLowerCase("ko-KR");
    if (!q || q.length > 100) return [];
    return reference.equipment
        .filter(
            e =>
                e.name.toLocaleLowerCase("ko-KR").includes(q) ||
                String(e.id) === q
        )
        .slice(0, 30);
}
export function getReforgeModel(
    equipmentId: number,
    toolId: number
): ReforgeModel | null {
    const equipment = reference.equipment.find(e => e.id === equipmentId);
    const tool = reforgeTools.find(t => t.id === toolId);
    if (!equipment || !tool || tool.unsupported || equipment.unsupported)
        return null;
    return {
        version: reforgeVersion,
        equipment,
        tool,
        pool: createReforgePool(
            equipment,
            tool,
            reference.abilities,
            reference.levels
        ),
    };
}
