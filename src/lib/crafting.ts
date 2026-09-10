import { z } from "zod";

import {
    type MaterialQuote,
    parseMaterialInteger,
    safeMaterialInteger,
} from "@/lib/material-cost";

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const CraftingGroupSchema = z.object({
    itemIds: z.array(integer.positive()).min(1),
    count: integer.positive(),
    mixed: z.boolean().optional(),
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

export const CRAFTING_LIMITS = {
    targets: 100,
    nodes: 1000,
    edges: 5000,
    depth: 32,
};

export interface CraftingChoice {
    mode: "buy" | "craft";
    recipe: string;
    yield: string;
    passes: string;
    includesFailures: boolean;
    finish: number | null;
    processChoices: number[];
    finishChoices: number[];
    allocations: Record<string, { itemId: number; count: string }[]>;
}
export interface CraftingInput {
    targets: { itemId: number; count: string }[];
    choices: Record<string, CraftingChoice>;
    prices: Record<string, string>;
    quotes: Record<string, MaterialQuote>;
}
export interface CraftingNode {
    item: CraftingItem;
    mode: "buy" | "craft";
    recipe?: CraftingRecipe;
    target: number;
    required: number;
    missing: number | null;
    batches: number | null;
    produced: number | null;
    surplus: number | null;
    children: number[];
    contributions: { itemId: number; count: number }[];
    issues: string[];
    complete: boolean;
}
export interface CraftingResult {
    nodes: CraftingNode[];
    shopping: CraftingNode[];
    issues: string[];
    complete: boolean;
}

export interface CraftingCost {
    known: number;
    complete: boolean;
    unresolved: string[];
}

export function calculateCraftingCosts(
    input: CraftingInput,
    result: CraftingResult
) {
    const cost = (): CraftingCost => ({
        known: 0,
        complete: result.complete,
        unresolved: [],
    });
    const total = cost();
    const direct = cost();
    direct.complete = input.targets.every(
        target => (parseMaterialInteger(target.count) ?? 0) > 0
    );
    const add = (
        total: CraftingCost,
        count: number | null,
        price: number | null,
        label: string
    ) => {
        if (count === 0) return;
        try {
            if (count === null || price === null) throw new Error(label);
            total.known = safeMaterialInteger(
                total.known + safeMaterialInteger(count * price)
            );
        } catch {
            total.complete = false;
            total.unresolved.push(label);
        }
    };
    for (const node of result.nodes) {
        const unitPrice = parseMaterialInteger(
            input.prices[node.item.id] ?? ""
        );
        if (node.mode === "buy")
            add(
                total,
                node.complete ? node.missing : null,
                unitPrice,
                `${node.item.name} 구매 수량·단가 확인 필요`
            );
    }
    for (const target of input.targets) {
        const item = result.nodes.find(
            node => node.item.id === target.itemId
        )?.item;
        const quote = item ? input.quotes[item.name] : undefined;
        const count = parseMaterialInteger(target.count);
        const price =
            quote && quote.availableQuantity > 0
                ? parseMaterialInteger(String(quote.minPrice))
                : null;
        add(
            direct,
            count,
            price,
            `${item?.name ?? `#${target.itemId}`} 완제품 경매장 최저가 조회 필요`
        );
    }
    return {
        total,
        direct,
        difference:
            direct.complete && total.complete
                ? direct.known - total.known
                : null,
    };
}

export function emptyCraftingChoice(
    mode: "buy" | "craft" = "buy"
): CraftingChoice {
    return {
        mode,
        recipe: "",
        yield: "",
        passes: "",
        includesFailures: false,
        finish: null,
        processChoices: [],
        finishChoices: [],
        allocations: {},
    };
}

export function hasCraftingPasses(recipe: Pick<CraftingRecipe, "type">) {
    return recipe.type === 65537 || recipe.type === 65538;
}

export function selectCraftingRecipe(recipe: CraftingRecipe): CraftingChoice {
    return {
        ...emptyCraftingChoice("craft"),
        recipe: recipe.fingerprint,
        passes: hasCraftingPasses(recipe) ? "" : "1",
        finish: recipe.finishes.length === 1 ? 0 : null,
        processChoices: recipe.process.map(g =>
            g.itemIds.length === 1 ? g.itemIds[0] : 0
        ),
        finishChoices:
            recipe.finishes.length === 1
                ? recipe.finishes[0].groups.map(g =>
                      g.itemIds.length === 1 ? g.itemIds[0] : 0
                  )
                : [],
    };
}

/** Targets always craft; a single recipe needs no manual selection. */
export function resolveCraftingChoice(
    saved: CraftingChoice | undefined,
    recipes: CraftingRecipe[],
    isTarget = false
): CraftingChoice {
    const choice = saved ?? emptyCraftingChoice();
    const mode = isTarget ? (recipes.length ? "craft" : "buy") : choice.mode;
    if (mode === "craft" && !choice.recipe && recipes.length === 1) {
        const selected = selectCraftingRecipe(recipes[0]);
        return {
            ...selected,
            yield: choice.yield,
            passes: choice.passes || selected.passes,
            includesFailures: choice.includesFailures,
        };
    }
    return { ...choice, mode };
}

function positive(value: string, label: string) {
    const parsed = parseMaterialInteger(value);
    if (parsed === null || parsed === 0)
        throw new Error(`${label}은 1 이상의 정수로 입력해 주세요.`);
    return parsed;
}

function selectedMaterials(
    groups: CraftingGroup[],
    choices: number[],
    label: string,
    allocations: CraftingChoice["allocations"],
    stage: "p" | "f"
) {
    return groups.flatMap((group, index) => {
        const allocation = allocations[`${stage}:${index}`];
        if (allocation) {
            if (!group.mixed)
                throw new Error(
                    `${label} 재료의 혼합 사용은 확인되지 않았습니다.`
                );
            const seen = new Set<number>();
            const result = allocation.map(entry => {
                const count = parseMaterialInteger(entry.count);
                if (
                    count === null ||
                    !group.itemIds.includes(entry.itemId) ||
                    seen.has(entry.itemId)
                )
                    throw new Error(`${label} 배분 수량·재료를 확인해 주세요.`);
                seen.add(entry.itemId);
                return { itemId: entry.itemId, count };
            });
            if (
                result.reduce(
                    (total, entry) => safeMaterialInteger(total + entry.count),
                    0
                ) !== group.count
            )
                throw new Error(
                    `${label} 배분 합계는 ${group.count}개여야 합니다.`
                );
            return result.filter(entry => entry.count > 0);
        }
        const itemId =
            group.itemIds.length === 1 ? group.itemIds[0] : choices[index];
        if (!group.itemIds.includes(itemId))
            throw new Error(`${label} 대체 재료 ${index + 1}을 선택해 주세요.`);
        return [{ itemId, count: group.count }];
    });
}

/** Resolve choices first; all parents contribute before an item's batch is rounded. */
export function calculateCrafting(
    input: CraftingInput,
    reference: CraftingReference
): CraftingResult {
    const issues: string[] = [];
    const nodes = new Map<number, CraftingNode>();
    const items = new Map(reference.items.map(item => [item.id, item]));
    const recipes = new Map(
        reference.recipes.map(recipe => [recipe.fingerprint, recipe])
    );
    const choices = new Map<number, CraftingChoice>();
    const targetIds = new Set(input.targets.map(target => target.itemId));
    const process = new Map<number, { itemId: number; count: number }[]>();
    const finish = new Map<number, { itemId: number; count: number }[]>();
    const selectionIssues = new Map<number, string>();
    const issue = (node: CraftingNode, message: string) => {
        node.issues.push(message);
        node.complete = false;
    };
    const add = (id: number): CraftingNode => {
        if (!Number.isSafeInteger(id) || id <= 0)
            throw new Error("아이템 ID를 확인해 주세요.");
        const existing = nodes.get(id);
        if (existing) return existing;
        if (nodes.size >= CRAFTING_LIMITS.nodes)
            throw new Error("한 계획은 재료 1,000종까지 계산할 수 있습니다.");
        const item = items.get(id) ?? {
            id,
            name: `이름 미확인 #${id}`,
            searchable: false,
            ambiguous: false,
            unresolved: `아이템 확인 필요 #${id}`,
        };
        const choice = resolveCraftingChoice(
            input.choices[id],
            (reference.byOutput[id] ?? []).flatMap(
                key => recipes.get(key) ?? []
            ),
            targetIds.has(id)
        );
        choices.set(id, choice);
        const node: CraftingNode = {
            item,
            mode: choice.mode,
            target: 0,
            required: 0,
            missing: null,
            batches: null,
            produced: null,
            surplus: null,
            children: [],
            contributions: [],
            issues: [],
            complete: !item.unresolved,
        };
        if (item.unresolved) node.issues.push(item.unresolved);
        nodes.set(id, node);
        return node;
    };
    try {
        if (input.targets.length > CRAFTING_LIMITS.targets)
            throw new Error("목표는 100개까지 추가할 수 있습니다.");
        for (const target of input.targets) {
            const node = add(target.itemId);
            try {
                node.target = safeMaterialInteger(
                    node.target + positive(target.count, "만들 수량")
                );
                node.required = node.target;
            } catch (error) {
                issue(node, (error as Error).message);
            }
        }
    } catch (error) {
        issues.push((error as Error).message);
    }

    let edges = 0;
    // Map iteration includes newly discovered materials, without recursive expansion.
    for (const [id, node] of nodes) {
        if (node.mode === "buy") continue;
        const choice = choices.get(id)!;
        const recipe = recipes.get(choice.recipe);
        if (!recipe || recipe.itemId !== id) {
            selectionIssues.set(
                id,
                "사용할 제작법을 선택해 주세요. 이전 제작법은 자동 대체하지 않습니다."
            );
            continue;
        }
        node.recipe = recipe;
        try {
            const p = selectedMaterials(
                recipe.process,
                choice.processChoices,
                hasCraftingPasses(recipe) ? "공정" : "제작",
                choice.allocations,
                "p"
            );
            const f = recipe.finishes.length
                ? recipe.finishes[choice.finish ?? -1]
                : null;
            if (recipe.finishes.length && !f)
                throw new Error("마감 방식을 선택해 주세요.");
            const finishing = f
                ? selectedMaterials(
                      f.groups,
                      choice.finishChoices,
                      "마감",
                      choice.allocations,
                      "f"
                  )
                : [];
            const ids = [...new Set([...p, ...finishing].map(m => m.itemId))];
            if (edges + ids.length > CRAFTING_LIMITS.edges)
                throw new Error("재료 연결은 5,000개까지 계산할 수 있습니다.");
            for (const child of ids) add(child);
            edges += ids.length;
            node.children = ids;
            process.set(id, p);
            finish.set(id, finishing);
        } catch (error) {
            selectionIssues.set(id, (error as Error).message);
        }
    }
    const incoming = new Map([...nodes.keys()].map(id => [id, 0]));
    const depth = new Map<number, number>();
    for (const node of nodes.values())
        for (const child of node.children)
            incoming.set(child, incoming.get(child)! + 1);
    const queue = [...nodes.keys()]
        .filter(id => incoming.get(id) === 0)
        .sort((a, b) => a - b);
    const processed = new Set<number>();
    const uncertainDemand = new Set<number>();
    for (let cursor = 0; cursor < queue.length; cursor++) {
        const id = queue[cursor];
        const node = nodes.get(id)!;
        processed.add(id);
        const inactive =
            node.required === 0 &&
            !targetIds.has(id) &&
            !uncertainDemand.has(id);
        if (inactive) {
            node.complete = true;
            node.issues = [];
        }
        if ((depth.get(id) ?? 0) > CRAFTING_LIMITS.depth)
            issue(
                node,
                "제작 단계가 32단계를 넘었습니다. 중간재를 구매로 바꿔 주세요."
            );
        try {
            if (!node.complete)
                throw new Error("확인되지 않은 수요·제작 조건이 있습니다.");
            const missing = node.required;
            node.missing = missing;
            node.batches = node.produced = node.surplus = 0;
            if (node.mode === "craft" && missing > 0) {
                if (selectionIssues.has(id))
                    throw new Error(selectionIssues.get(id));
                const choice = choices.get(id)!;
                const yieldCount = positive(
                    choice.yield,
                    "성공한 제작 1회당 완성 수량"
                );
                const passes = hasCraftingPasses(node.recipe!)
                    ? positive(choice.passes, "완성 1회까지 공정 횟수")
                    : 1;
                const batches = Number(
                    (BigInt(missing) + BigInt(yieldCount) - BigInt(1)) /
                        BigInt(yieldCount)
                );
                const produced = safeMaterialInteger(batches * yieldCount);
                const demands = new Map<number, number>();
                for (const [materials, repeats] of [
                    [process.get(id) ?? [], passes],
                    [finish.get(id) ?? [], 1],
                ] as const) {
                    for (const material of materials) {
                        const count = safeMaterialInteger(
                            safeMaterialInteger(material.count * repeats) *
                                batches
                        );
                        demands.set(
                            material.itemId,
                            safeMaterialInteger(
                                (demands.get(material.itemId) ?? 0) + count
                            )
                        );
                    }
                }
                // Validate the entire contribution before changing shared demand.
                for (const [child, count] of demands)
                    safeMaterialInteger(nodes.get(child)!.required + count);
                for (const [child, count] of demands) {
                    const next = nodes.get(child)!;
                    next.required += count;
                    next.contributions.push({ itemId: id, count });
                }
                node.batches = batches;
                node.produced = produced;
                node.surplus = produced - missing;
            }
        } catch (error) {
            issue(node, (error as Error).message);
            node.batches = node.produced = node.surplus = null;
        }
        for (const child of node.children) {
            const next = nodes.get(child)!;
            if (!node.complete) {
                uncertainDemand.add(child);
                issue(
                    next,
                    `${node.item.name}의 필요 수량을 먼저 확인해 주세요.`
                );
            }
            depth.set(
                child,
                Math.max(depth.get(child) ?? 0, (depth.get(id) ?? 0) + 1)
            );
            incoming.set(child, incoming.get(child)! - 1);
            if (incoming.get(child) === 0) queue.push(child);
        }
    }
    const blocked = [...nodes.keys()].filter(id => !processed.has(id));
    if (blocked.length) {
        // ponytail: scan is bounded at 1,000 nodes; use reverse adjacency if this limit grows.
        // Follow parents within the blocked graph to find a real cycle, not its tail.
        const path: number[] = [];
        let id = blocked[0];
        while (!path.includes(id)) {
            path.push(id);
            id = blocked.find(parent =>
                nodes.get(parent)!.children.includes(id)
            )!;
        }
        const cycle = [...path.slice(path.indexOf(id)), id].reverse();
        const message = `제작 순환: ${cycle.map(key => nodes.get(key)!.item.name).join(" → ")}. 구매 또는 다른 제작법을 선택해 주세요.`;
        issues.push(message);
        for (const key of blocked) issue(nodes.get(key)!, message);
    }
    const result = [...nodes.values()]
        .filter(
            node =>
                targetIds.has(node.item.id) ||
                node.required > 0 ||
                uncertainDemand.has(node.item.id) ||
                !node.complete
        )
        .sort((a, b) => a.item.id - b.item.id);
    for (const node of result)
        issues.push(
            ...node.issues.map(message => `${node.item.name}: ${message}`)
        );
    return {
        nodes: result,
        shopping: result.filter(
            node => node.mode === "buy" && (node.required > 0 || !node.complete)
        ),
        issues: [...new Set(issues)],
        complete: input.targets.length > 0 && issues.length === 0,
    };
}
