import { z } from "zod";

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positive = integer.positive();
const name = z.string().trim().min(1).max(100);

export const BarterMaterialSchema = z
    .object({
        id: positive,
        name,
        searchable: z.boolean(),
        ambiguous: z.boolean(),
    })
    .strict();
export type BarterMaterial = z.infer<typeof BarterMaterialSchema>;

export const BarterPeriodSchema = z
    .object({
        startAt: positive,
        endAt: positive,
    })
    .strict()
    .refine(p => p.startAt < p.endAt, "기간의 시작은 종료보다 빨라야 합니다.");

export const BarterGoodSchema = z
    .object({
        key: z
            .string()
            .min(1)
            .max(100)
            .regex(/^[\w:-]+$/),
        source: z.enum(["fixed", "season", "manual"]),
        revision: z.string().min(1).max(100),
        postId: positive,
        postName: name,
        name,
        limit: positive,
        reset: z.string().min(1).max(30),
        period: BarterPeriodSchema.optional(),
        groups: z
            .array(
                z
                    .array(
                        z
                            .object({
                                itemId: positive,
                                count: positive,
                            })
                            .strict()
                    )
                    .min(1)
                    .max(20)
                    .refine(
                        options =>
                            new Set(options.map(o => o.itemId)).size ===
                            options.length,
                        "대체 재료 ID가 중복됩니다."
                    )
            )
            .min(1)
            .max(20),
    })
    .strict()
    .refine(
        good => (good.source === "fixed") === !good.period,
        "시즌 교역품의 유효 기간을 확인해 주세요."
    );
export type BarterGood = z.infer<typeof BarterGoodSchema>;

export const IRIA_POSTS = [201, 202, 203, 204] as const;
export const BarterSeasonSchema = z
    .object({
        formatVersion: z.literal(1),
        source: z.literal("https://labanyu.com/trade"),
        collectedAt: z.iso.datetime(),
        sourceVersion: positive,
        seasonId: positive,
        seasonVersion: z.union([z.string().min(1).max(100), integer]),
        period: BarterPeriodSchema,
        goods: z.array(BarterGoodSchema).length(4),
    })
    .strict()
    .refine(
        s =>
            IRIA_POSTS.every(
                id => s.goods.filter(g => g.postId === id).length === 1
            ) &&
            s.goods.every(
                g =>
                    g.source === "season" &&
                    g.reset === "weekly" &&
                    g.period?.startAt === s.period.startAt &&
                    g.period?.endAt === s.period.endAt
            ),
        "시즌 교역소 또는 유효 기간이 일치하지 않습니다."
    );
export type BarterSeason = z.infer<typeof BarterSeasonSchema>;

export interface BarterReference {
    version: string;
    sourceVersion: number;
    collectedAt: string;
    goods: BarterGood[];
    materials: BarterMaterial[];
    season: BarterSeason | null;
}
