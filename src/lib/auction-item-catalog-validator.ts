import * as z from "zod";

const isoUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const trimmedText = z
    .string()
    .min(1)
    .refine(value => value === value.trim(), "must be trimmed");
const utcDateTime = z.iso.datetime().regex(isoUtc);
const rankedEvidence = z.enum(["trading-volume-rank", "traded-value-rank"]);

const catalogItemSchema = z
    .object({
        id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
        name: trimmedText,
        evidence: z.enum([
            "current-listing",
            "recent-sale",
            ...rankedEvidence.options,
        ]),
        sourceRank: z.number().int().min(1).max(300).optional(),
        verifiedAt: utcDateTime,
    })
    .superRefine((item, context) => {
        const needsRank = rankedEvidence.safeParse(item.evidence).success;
        if (needsRank !== (item.sourceRank !== undefined)) {
            context.addIssue({
                code: "custom",
                message: "ranked evidence must include sourceRank",
                path: ["sourceRank"],
            });
        }
    });

const catalogSchema = z.object({
    version: z.literal(1),
    updatedAt: z.iso.date(),
    selection: z.object({
        method: z.enum([
            "search-demand",
            "trading-demand",
            "reviewed-auction-activity-seed",
        ]),
        source: trimmedText,
        observedFrom: utcDateTime,
        observedTo: utcDateTime,
        limitations: trimmedText,
    }),
    items: z.array(catalogItemSchema).min(500).max(1000),
});

type LocalItem = { id: string; name: string };

export function validateAuctionItemCatalog(
    input: unknown,
    localItems: unknown,
    now = new Date()
) {
    const catalog = catalogSchema.parse(input);
    const source = z
        .array(z.object({ id: z.string(), name: z.string() }))
        .parse(localItems) as LocalItem[];
    if (
        Date.parse(catalog.selection.observedFrom) >
        Date.parse(catalog.selection.observedTo)
    ) {
        throw new Error("selection observedFrom must not be after observedTo");
    }

    const sourceById = new Map<string, LocalItem[]>();
    for (const item of source) {
        const matches = sourceById.get(item.id) ?? [];
        matches.push(item);
        sourceById.set(item.id, matches);
    }

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const oldestAllowedEvidence = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    for (const item of catalog.items) {
        if (seenIds.has(item.id)) {
            throw new Error(`duplicate catalog id: ${item.id}`);
        }
        if (seenNames.has(item.name)) {
            throw new Error(`duplicate catalog name: ${item.name}`);
        }
        seenIds.add(item.id);
        seenNames.add(item.name);

        const matches = sourceById.get(item.id) ?? [];
        if (matches.length !== 1) {
            throw new Error(
                `catalog id must exist exactly once in local data: ${item.id}`
            );
        }
        if (matches[0].name !== item.name) {
            throw new Error(
                `catalog name mismatch for ${item.id}: ${item.name} !== ${matches[0].name}`
            );
        }
        const verifiedAt = Date.parse(item.verifiedAt);
        if (verifiedAt > now.getTime()) {
            throw new Error(
                `catalog evidence is in the future: ${item.id} (${item.name})`
            );
        }
        if (verifiedAt < oldestAllowedEvidence) {
            throw new Error(
                `catalog evidence is older than 30 days: ${item.id} (${item.name})`
            );
        }
    }
    return catalog;
}
