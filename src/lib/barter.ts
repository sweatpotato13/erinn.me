import { z } from "zod";

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positive = integer.positive();
const name = z
    .string()
    .min(1)
    .max(100)
    .refine(value => value.trim().length > 0);

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

export interface BarterRow {
    good: BarterGood;
    q: string;
    used: string;
    choices: number[];
}

export function emptyBarterRow(good: BarterGood): BarterRow {
    return {
        good,
        q: "0",
        used: "0",
        choices: good.groups.map(g => (g.length === 1 ? g[0].itemId : 0)),
    };
}

export function parseBarterInteger(value: string): number | null {
    if (!/^\d{1,16}$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
}

const DAY = 86_400_000;
const SEOUL_OFFSET = 9 * 60 * 60 * 1000;

/** A week starts Thursday 07:00 Seoul time, independent of device timezone. */
export function barterWeek(now: number): number {
    const shifted = new Date(now + SEOUL_OFFSET - 7 * 60 * 60 * 1000);
    const day = Date.UTC(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate()
    );
    return day - ((shifted.getUTCDay() + 3) % 7) * DAY - 2 * 60 * 60 * 1000;
}

export function barterMonth(now: number): { startAt: number; endAt: number } {
    const seoul = new Date(now + SEOUL_OFFSET);
    const firstThursday = (month: number) => {
        const first = new Date(Date.UTC(seoul.getUTCFullYear(), month, 1));
        return (
            first.getTime() +
            ((4 - first.getUTCDay() + 7) % 7) * DAY -
            2 * 60 * 60 * 1000
        );
    };
    const month = seoul.getUTCMonth();
    return now >= firstThursday(month)
        ? { startAt: firstThursday(month), endAt: firstThursday(month + 1) }
        : { startAt: firstThursday(month - 1), endAt: firstThursday(month) };
}

export function parseSeoulDate(value: string): number | null {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const time = Date.parse(`${value}:00+09:00`);
    return Number.isFinite(time) &&
        new Date(time + SEOUL_OFFSET).toISOString().slice(0, 16) === value
        ? time
        : null;
}

export function seoulDateInput(time: number): string {
    return new Date(time + SEOUL_OFFSET).toISOString().slice(0, 16);
}

export function goodIssue(good: BarterGood, now: number): string | null {
    if (good.reset !== "weekly")
        return `지원하지 않는 초기화 기준: ${good.reset}`;
    if (good.period && !(good.period.startAt <= now && now < good.period.endAt))
        return "시즌 유효 기간 밖입니다. 현재 재료를 확인해 주세요.";
    return null;
}

export function rowIssue(row: BarterRow, now: number): string | null {
    const { q, used, good } = row;
    const planned = parseBarterInteger(q);
    const exchanged = parseBarterInteger(used);
    if (planned === null || exchanged === null)
        return "교환 횟수는 0 이상의 안전한 정수로 입력해 주세요.";
    if (exchanged > good.limit || planned > good.limit - exchanged)
        return `주간 한도 ${good.limit}회를 넘었습니다. 입력값을 확인해 주세요.`;
    if (planned === 0 && exchanged === 0) return null;
    const issue = goodIssue(good, now);
    if (issue) return issue;
    if (
        planned > 0 &&
        good.groups.some(
            (options, index) =>
                !options.some(o => o.itemId === row.choices[index])
        )
    )
        return "각 그룹의 대체 재료를 하나씩 선택해 주세요.";
    return null;
}

export interface BarterMaterialTotal {
    material: BarterMaterial;
    required: number;
    owned: number | null;
    usedOwned: number | null;
    missing: number | null;
    unitPrice: number | null;
    contributions: { key: string; name: string; count: number }[];
}

function safe(value: number): number {
    if (!Number.isSafeInteger(value) || value < 0)
        throw new Error("계산값이 안전한 정수 범위를 넘었습니다.");
    return value;
}

export function calculateBarter(
    rows: BarterRow[],
    owned: Record<string, string>,
    prices: Record<string, string>,
    materials: BarterMaterial[],
    now: number
) {
    const errors: string[] = [];
    const totals = new Map<
        number,
        {
            required: number;
            contributions: BarterMaterialTotal["contributions"];
        }
    >();
    const byId = new Map(materials.map(m => [m.id, m]));
    const keys = new Set<string>();
    const seasonal = rows.filter(
        r => r.good.period && parseBarterInteger(r.q) !== 0
    );
    for (const row of rows) {
        try {
            if (keys.has(row.good.key))
                throw new Error("같은 교역품이 중복되었습니다.");
            keys.add(row.good.key);
            const issue = rowIssue(row, now);
            if (issue) throw new Error(issue);
            const q = parseBarterInteger(row.q)!;
            if (!q) continue;
            if (
                row.good.period &&
                seasonal.some(
                    other =>
                        other !== row &&
                        other.good.postId === row.good.postId &&
                        other.good.period!.startAt < row.good.period!.endAt &&
                        row.good.period!.startAt < other.good.period!.endAt
                )
            )
                throw new Error(
                    "같은 교역소의 시즌 출처를 하나만 선택해 주세요."
                );
            const contribution = new Map<number, number>();
            row.good.groups.forEach((options, i) => {
                const option = options.find(o => o.itemId === row.choices[i])!;
                if (!byId.has(option.itemId))
                    throw new Error(`확인되지 않은 재료 ID ${option.itemId}`);
                contribution.set(
                    option.itemId,
                    safe(
                        (contribution.get(option.itemId) ?? 0) +
                            safe(q * option.count)
                    )
                );
            });
            // Validate the whole row before adding any of it to the known subtotal.
            for (const [id, count] of contribution)
                safe((totals.get(id)?.required ?? 0) + count);
            for (const [id, count] of contribution) {
                const total = totals.get(id) ?? {
                    required: 0,
                    contributions: [],
                };
                total.required += count;
                total.contributions.push({
                    key: row.good.key,
                    name: row.good.name,
                    count,
                });
                totals.set(id, total);
            }
        } catch (error) {
            errors.push(
                `${row.good.name}: ${error instanceof Error ? error.message : "계산 오류"}`
            );
        }
    }
    const result: BarterMaterialTotal[] = [...totals]
        .sort(([a], [b]) => a - b)
        .map(([id, total]) => {
            const stock = parseBarterInteger(owned[id] ?? "0");
            if (stock === null)
                errors.push(
                    `${byId.get(id)!.name}: 보유 수량을 확인해 주세요.`
                );
            return {
                material: byId.get(id)!,
                ...total,
                owned: stock,
                usedOwned:
                    stock === null ? null : Math.min(total.required, stock),
                missing:
                    stock === null ? null : Math.max(0, total.required - stock),
                unitPrice: parseBarterInteger(prices[id] ?? ""),
            };
        });
    function cost(kind: "required" | "missing") {
        let known = 0;
        let unknown = 0;
        for (const row of result) {
            const count = row[kind];
            if (count === 0) continue;
            if (count === null || row.unitPrice === null) {
                unknown++;
                continue;
            }
            try {
                known = safe(known + safe(count * row.unitPrice));
            } catch {
                unknown++;
            }
        }
        return {
            known,
            unknown,
            complete: errors.length === 0 && unknown === 0,
        };
    }
    return {
        materials: result,
        errors,
        valid: errors.length === 0,
        replacement: cost("required"),
        purchase: cost("missing"),
    };
}
export type BarterResult = ReturnType<typeof calculateBarter>;

/** These targets are net deficits; receivers must not reapply the original stock. */
export function barterDeficits(result: BarterResult) {
    if (!result.valid) throw new Error("재료 수량을 먼저 확인해 주세요.");
    return result.materials
        .filter(m => m.missing! > 0)
        .map(m => ({ itemId: m.material.id, count: m.missing! }));
}
