import { z } from "zod";

import {
    calculateCraftingCosts,
    type CraftingInput,
    type CraftingReference,
    type CraftingResult,
    hasCraftingPasses,
    resolveCraftingChoice,
} from "@/lib/crafting";
import { MaterialQuoteSchema } from "@/lib/material-cost";

export const CRAFTING_PATH = "/tools/crafting";
export const CRAFTING_STORAGE_KEY = "erinn-crafting-v1";
export const CRAFTING_QUERY_LIMIT = 8192;
export const CRAFTING_JSON_LIMIT = 16384;
export const CRAFTING_STORAGE_LIMIT = 256 * 1024;
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const itemKey = z
    .string()
    .regex(/^[1-9]\d{0,15}$/)
    .refine(s => Number.isSafeInteger(Number(s)));
const draft = z.string().max(64);
const boundedMap = <T extends z.ZodType>(schema: T) =>
    z.record(itemKey, schema).refine(map => Object.keys(map).length <= 1000);
const choiceSchema = z
    .object({
        mode: z.enum(["buy", "craft"]),
        recipe: z.string().max(100),
        yield: draft,
        passes: draft,
        includesFailures: z.boolean(),
        finish: z.number().int().nonnegative().max(100).nullable(),
        processChoices: z.array(id.or(z.literal(0))).max(100),
        finishChoices: z.array(id.or(z.literal(0))).max(100),
        allocations: z
            .record(
                z.string().regex(/^[pf]:\d{1,2}$/),
                z
                    .array(z.object({ itemId: id, count: draft }).strict())
                    .max(100)
            )
            .refine(map => Object.keys(map).length <= 100),
        // Accept old drafts, but discard the removed per-batch fee.
        batchFee: draft.optional(),
    })
    .strict()
    .transform(choice => {
        delete choice.batchFee;
        return choice;
    });

export const CraftingPlanSchema = z
    .object({
        formatVersion: z.literal(1),
        sourceVersion: id,
        referenceVersion: z.string().min(1).max(100),
        ruleVersion: z.string().min(1).max(100),
        origin: z.enum(["local", "barter-net-deficit"]),
        targets: z
            .array(z.object({ itemId: id, count: draft }).strict())
            .max(100),
        choices: boundedMap(choiceSchema),
        owned: boundedMap(draft).optional(),
        prices: boundedMap(draft),
        fee: draft.optional(),
        comparisons: boundedMap(
            z
                .object({
                    price: draft,
                    comparable: z.boolean(),
                    note: z.string().max(200),
                })
                .strict()
        ).optional(),
        quotes: z
            .record(z.string().min(1).max(100), MaterialQuoteSchema)
            .refine(map => Object.keys(map).length <= 1000),
        checked: z
            .array(id)
            .max(1000)
            .refine(ids => new Set(ids).size === ids.length)
            .optional(),
    })
    .strict()
    .transform(plan => {
        delete plan.owned;
        delete plan.checked;
        delete plan.comparisons;
        delete plan.fee;
        return plan;
    });
export type CraftingPlan = z.infer<typeof CraftingPlanSchema>;

export function emptyCraftingPlan(reference: CraftingReference): CraftingPlan {
    return {
        formatVersion: 1,
        sourceVersion: reference.sourceVersion,
        referenceVersion: reference.version,
        ruleVersion: reference.ruleVersion,
        origin: "local",
        targets: [],
        choices: {},
        prices: {},
        quotes: {},
    };
}

/** Semantic checks are separate from draft validation, so invalid edits remain editable. */
export function craftingPlanIssues(
    plan: CraftingPlan,
    reference: CraftingReference
): string[] {
    const issues: string[] = [];
    if (
        plan.sourceVersion !== reference.sourceVersion ||
        plan.referenceVersion !== reference.version ||
        plan.ruleVersion !== reference.ruleVersion
    )
        issues.push(
            "참조 자료 또는 제작 규칙이 변경되었습니다. 선택과 제작 조건을 검토한 뒤 이 기기에 저장해 주세요."
        );
    const items = new Set(reference.items.map(item => item.id));
    const recipes = new Map(
        reference.recipes.map(recipe => [recipe.fingerprint, recipe])
    );
    const ids = new Set([
        ...plan.targets.map(target => target.itemId),
        ...Object.keys(plan.choices).map(Number),
        ...Object.keys(plan.prices).map(Number),
    ]);
    for (const id of ids)
        if (!items.has(id)) issues.push(`아이템 확인 필요 #${id}`);
    for (const [key, choice] of Object.entries(plan.choices)) {
        if (choice.mode !== "craft" || !choice.recipe) continue;
        const recipe = recipes.get(choice.recipe);
        if (!recipe || recipe.itemId !== Number(key)) {
            issues.push(
                `아이템 #${key}의 제작법이 변경되거나 삭제되었습니다. 다시 선택해 주세요.`
            );
            continue;
        }
        if (choice.finish !== null && !recipe.finishes[choice.finish])
            issues.push(`아이템 #${key}의 마감 방식을 다시 선택해 주세요.`);
        for (const [groups, selections, stage] of [
            [recipe.process, choice.processChoices, "p"],
            [
                recipe.finishes[choice.finish ?? -1]?.groups ?? [],
                choice.finishChoices,
                "f",
            ],
        ] as const) {
            if (
                selections.length > groups.length ||
                selections.some(
                    (id, index) =>
                        id !== 0 && !groups[index]?.itemIds.includes(id)
                )
            )
                issues.push(`아이템 #${key}의 대체 재료를 다시 선택해 주세요.`);
            for (const [name, allocation] of Object.entries(
                choice.allocations
            ).filter(([name]) => name.startsWith(`${stage}:`))) {
                const group = groups[Number(name.slice(2))];
                if (
                    !group?.mixed ||
                    allocation.some(
                        entry => !group.itemIds.includes(entry.itemId)
                    )
                )
                    issues.push(
                        `아이템 #${key}의 혼합 배분을 다시 확인해 주세요.`
                    );
            }
        }
    }
    return [...new Set(issues)];
}

export function craftingBytes(text: string) {
    return encodeURIComponent(text).replace(/%[A-F\d]{2}/g, "x").length;
}
export function serializeCraftingStorage(plan: CraftingPlan) {
    const raw = JSON.stringify(CraftingPlanSchema.parse(plan));
    if (craftingBytes(raw) > CRAFTING_STORAGE_LIMIT)
        throw new Error(
            "저장 용량 256KiB를 넘었습니다. 제작품 수를 줄여 주세요."
        );
    return raw;
}
export function parseCraftingStorage(raw: string | null): {
    plan: CraftingPlan | null;
    error: string;
} {
    if (raw === null) return { plan: null, error: "" };
    try {
        if (
            raw.length > CRAFTING_STORAGE_LIMIT ||
            craftingBytes(raw) > CRAFTING_STORAGE_LIMIT
        )
            throw new Error("oversize");
        return { plan: CraftingPlanSchema.parse(JSON.parse(raw)), error: "" };
    } catch {
        return {
            plan: null,
            error: "저장된 계획의 형식·버전·크기를 확인해 주세요. 원래 저장 내용은 보존했습니다.",
        };
    }
}

function shareQuery(key: "s" | "b", value: unknown) {
    const raw = JSON.stringify(value);
    const query = new URLSearchParams({ [key]: raw }).toString();
    if (
        craftingBytes(raw) > CRAFTING_JSON_LIMIT ||
        query.length > CRAFTING_QUERY_LIMIT
    )
        throw new Error(
            "공유 링크 크기 제한을 넘었습니다. 전체 목록을 텍스트로 내보내 주세요."
        );
    return `${CRAFTING_PATH}?${query}`;
}
export function buildCraftingShare(plan: CraftingPlan) {
    return shareQuery("s", { ...CraftingPlanSchema.parse(plan), quotes: {} });
}
const handoffSchema = z
    .object({
        formatVersion: z.literal(1),
        sourceVersion: id,
        origin: z.literal("barter-net-deficit"),
        targets: z
            .array(z.object({ itemId: id, count: id }).strict())
            .min(1)
            .max(100),
    })
    .strict();
export function buildCraftingHandoff(
    targets: { itemId: number; count: number }[],
    sourceVersion: number
) {
    return shareQuery(
        "b",
        handoffSchema.parse({
            formatVersion: 1,
            origin: "barter-net-deficit",
            sourceVersion,
            targets,
        })
    );
}
export function parseCraftingShare(
    query: string,
    reference: CraftingReference
): { plan: CraftingPlan | null; error: string } {
    if (!query || query === "?") return { plan: null, error: "" };
    try {
        const rawQuery = query.replace(/^\?/, "");
        if (rawQuery.length > CRAFTING_QUERY_LIMIT) throw new Error("oversize");
        const params = new URLSearchParams(rawQuery);
        const entries = [...params.entries()];
        if (entries.length !== 1 || !["s", "b"].includes(entries[0][0]))
            throw new Error("query");
        const [key, raw] = entries[0];
        if (craftingBytes(raw) > CRAFTING_JSON_LIMIT)
            throw new Error("oversize");
        if (key === "s")
            return {
                plan: CraftingPlanSchema.parse(JSON.parse(raw)),
                error: "",
            };
        const handoff = handoffSchema.parse(JSON.parse(raw));
        const plan = emptyCraftingPlan(reference);
        plan.origin = handoff.origin;
        plan.sourceVersion = handoff.sourceVersion;
        plan.targets = handoff.targets.map(target => ({
            ...target,
            count: String(target.count),
        }));
        plan.choices = Object.fromEntries(
            plan.targets.map(target => [
                target.itemId,
                resolveCraftingChoice(
                    undefined,
                    reference.recipes.filter(
                        recipe => recipe.itemId === target.itemId
                    ),
                    true
                ),
            ])
        );
        return { plan, error: "" };
    } catch {
        return {
            plan: null,
            error: "공유 링크의 형식·버전·크기를 확인해 주세요. 저장된 계획은 변경하지 않았습니다.",
        };
    }
}

export function craftingText(
    plan: CraftingPlan,
    result: CraftingResult,
    prices: CraftingInput["prices"] = plan.prices
) {
    const costs = calculateCraftingCosts({ ...plan, prices }, result);
    const total = (label: string, cost: typeof costs.total) =>
        `${label}: ${cost.known} Gold${cost.complete ? "" : " (확인된 소계)"}`;
    return [
        "마비노기 제작 원가 계산",
        `자료: ${plan.sourceVersion} / ${plan.referenceVersion} / 규칙 ${plan.ruleVersion}`,
        `출처: ${plan.origin === "barter-net-deficit" ? "물물교환 순부족분 (원래 보유분 차감 완료)" : "직접 계획"}`,
        ...plan.targets.map(
            target => `목표 #${target.itemId}: ${target.count}개`
        ),
        ...result.nodes
            .filter(node => node.mode === "craft")
            .map(node => {
                const id = node.item.id;
                const choice = resolveCraftingChoice(
                    plan.choices[id],
                    node.recipe ? [node.recipe] : [],
                    node.target > 0
                );
                const passes =
                    node.recipe && hasCraftingPasses(node.recipe)
                        ? ` / 공정 ${choice.passes || "미입력"}회 (실패 소비 ${choice.includesFailures ? "포함" : "미포함"})`
                        : "";
                return `제작 #${id}: ${choice.recipe || "미선택"} / 산출량 ${choice.yield || "미입력"}${passes} / 마감 ${choice.finish ?? "없음·미선택"} / 제작 재료 ${choice.processChoices.join(",")} / 마감 재료 ${choice.finishChoices.join(",")} / 혼합 ${JSON.stringify(choice.allocations)}`;
            }),
        ...result.nodes.map(
            node =>
                `${node.item.name} (#${node.item.id}): ${node.mode === "buy" ? "구매" : "제작"} / 필요 ${node.complete ? node.required : "미확인"} / 제작 ${node.batches ?? "미확인"}회 / 잉여 ${node.surplus ?? "미확인"} / 단가 ${prices[node.item.id] || "미입력"} Gold`
        ),
        total("제작 원가", costs.total),
        total("완제품 경매장 최저가", costs.direct),
        `구매 대비 원가 차이: ${costs.difference ?? "미확인"} Gold`,
        ...Object.entries(plan.prices).map(
            ([id, price]) => `수동 단가 #${id}: ${price || "미입력"} Gold`
        ),
        ...Object.entries(plan.quotes).map(
            ([name, quote]) =>
                `${name} 관측: ${quote.minPrice} Gold / ${quote.fetchedAt ?? quote.observedAt} / ${quote.isComplete ? "전체" : "부분"} 조회 / 매물 ${quote.availableQuantity}`
        ),
        ...result.issues,
        ...costs.total.unresolved,
        ...costs.direct.unresolved,
        "입력한 제작 조건 기준입니다. 시세는 경매장 등록 최저가 기준입니다.",
    ].join("\n");
}
