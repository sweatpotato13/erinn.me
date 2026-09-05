import "server-only";

import reference from "@/data/reforge-reference.json";
import { createReforgePool, type ReforgeModel } from "@/lib/reforge";

export const reforgeVersion = reference.version;
export const reforgeTools = reference.tools;
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
    const tool = reference.tools.find(t => t.id === toolId);
    if (!equipment || !tool || equipment.unsupported) return null;
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
