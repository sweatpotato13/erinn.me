import { z } from "zod";

import {
    type BarterGood,
    BarterGoodSchema,
    type BarterReference,
    type BarterResult,
    type BarterRow,
    barterWeek,
    emptyBarterRow,
    goodIssue,
    IRIA_POSTS,
    parseBarterInteger,
    rowIssue,
} from "@/lib/barter";

export const BARTER_PATH = "/tools/barter";
export const BARTER_STORAGE_KEY = "erinn-barter-v1";
export const BARTER_QUERY_LIMIT = 8192;
export const BARTER_JSON_LIMIT = 16384;
export const BARTER_STORAGE_LIMIT = 256 * 1024;
const id = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const itemKey = z
    .string()
    .regex(/^[1-9]\d{0,15}$/)
    .refine(s => Number.isSafeInteger(Number(s)));
const draft = z.string().max(64);
const numericMap = z
    .record(itemKey, draft)
    .refine(v => Object.keys(v).length <= 1000);
const rowSchema = z
    .object({
        good: BarterGoodSchema,
        q: draft,
        used: draft,
        choices: z.array(id).max(20),
    })
    .strict()
    .refine(
        r =>
            r.good.source !== "manual" ||
            ((IRIA_POSTS as readonly number[]).includes(r.good.postId) &&
                r.good.reset === "weekly" &&
                r.good.key.startsWith("manual:"))
    );

export const BarterQuoteSchema = z
    .object({
        minPrice: z.number().finite().nonnegative(),
        averagePrice: z.number().finite().nonnegative(),
        availableQuantity: z.number().finite().nonnegative(),
        isComplete: z.boolean(),
        fetchedAt: z.iso.datetime({ offset: true }).optional(),
        observedAt: z.iso.datetime({ offset: true }),
    })
    .strict();
export type BarterQuote = z.infer<typeof BarterQuoteSchema>;

export const BarterPlanSchema = z
    .object({
        formatVersion: z.literal(1),
        snapshotVersion: z.string().min(1).max(100),
        weekKey: id.positive(),
        rows: z
            .array(rowSchema)
            .max(100)
            .refine(
                rows => new Set(rows.map(r => r.good.key)).size === rows.length
            ),
        seasonChoices: z.record(
            z.string().regex(/^(201|202|203|204)$/),
            z.string().min(1).max(100)
        ),
        owned: numericMap,
        prices: numericMap,
        quotes: z
            .record(z.string().min(1).max(100), BarterQuoteSchema)
            .refine(v => Object.keys(v).length <= 1000),
        checked: z
            .array(id.positive())
            .max(1000)
            .refine(v => new Set(v).size === v.length),
    })
    .strict();
export type BarterPlan = z.infer<typeof BarterPlanSchema>;

export function emptyBarterPlan(
    data: BarterReference,
    now: number
): BarterPlan {
    return {
        formatVersion: 1,
        snapshotVersion: data.version,
        weekKey: barterWeek(now),
        rows: [],
        seasonChoices: {},
        owned: {},
        prices: {},
        quotes: {},
        checked: [],
    };
}

export function barterRows(
    plan: BarterPlan,
    data: BarterReference
): BarterRow[] {
    const rows = new Map(data.goods.map(g => [g.key, emptyBarterRow(g)]));
    for (const row of plan.rows) rows.set(row.good.key, row);
    return [...rows.values()];
}

export function activeBarterRows(
    plan: BarterPlan,
    data: BarterReference,
    now: number
): BarterRow[] {
    const rows = barterRows(plan, data);
    return rows.filter(row => {
        const good = row.good;
        if (!good.period) return true;
        const selected = plan.seasonChoices[String(good.postId)];
        if (selected) {
            const valid = rows.some(
                r =>
                    r.good.key === selected &&
                    r.good.postId === good.postId &&
                    r.good.period
            );
            return !valid || selected === good.key;
        }
        const saved = plan.rows.filter(
            r =>
                r.good.postId === good.postId &&
                r.good.period &&
                (parseBarterInteger(r.q) !== 0 ||
                    parseBarterInteger(r.used) !== 0)
        );
        if (saved.length) return saved.some(r => r.good.key === good.key);
        const current = data.goods.find(
            g =>
                g.source === "season" &&
                g.postId === good.postId &&
                !goodIssue(g, now)
        );
        if (current) return current.key === good.key;
        // Keep the previous selection visible when it expires; never silently drop demand.
        return good.source === "season" || good.source === "manual";
    });
}

export function barterSelectionIssues(
    plan: BarterPlan,
    data: BarterReference
): string[] {
    const rows = barterRows(plan, data);
    return Object.entries(plan.seasonChoices)
        .filter(
            ([postId, key]) =>
                !rows.some(
                    r =>
                        r.good.key === key &&
                        r.good.postId === Number(postId) &&
                        r.good.period
                )
        )
        .map(
            ([postId]) =>
                `교역소 ${postId}의 시즌 출처를 다시 선택해 주세요. 이전 입력은 보존했습니다.`
        );
}

export function changedBarterRows(
    plan: BarterPlan,
    data: BarterReference
): string[] {
    const current = new Map(data.goods.map(g => [g.key, g]));
    return plan.rows
        .filter(({ good }) => {
            if (good.source === "manual") return false;
            const existing = current.get(good.key);
            return (
                !existing ||
                JSON.stringify(BarterGoodSchema.parse(existing)) !==
                    JSON.stringify(BarterGoodSchema.parse(good))
            );
        })
        .map(r => r.good.key);
}

export function updateBarterRow(plan: BarterPlan, row: BarterRow): BarterPlan {
    const rows = plan.rows.some(r => r.good.key === row.good.key)
        ? plan.rows.map(r => (r.good.key === row.good.key ? row : r))
        : [...plan.rows, row];
    return BarterPlanSchema.parse({
        ...plan,
        rows,
        seasonChoices: row.good.period
            ? { ...plan.seasonChoices, [row.good.postId]: row.good.key }
            : plan.seasonChoices,
        checked: [],
    });
}

export function addManualGood(plan: BarterPlan, input: BarterGood): BarterPlan {
    const good = BarterGoodSchema.parse(input);
    if (good.source !== "manual" || !good.period)
        throw new Error("직접 입력한 시즌 교역품만 추가할 수 있습니다.");
    if (
        plan.rows.some(
            r =>
                r.good.source === "manual" &&
                r.good.postId === good.postId &&
                r.good.key !== good.key &&
                r.good.period!.startAt < good.period!.endAt &&
                good.period!.startAt < r.good.period!.endAt
        )
    )
        throw new Error(
            "같은 교역소의 기간이 겹칩니다. 기존 직접 입력을 수정해 주세요."
        );
    const old = plan.rows.find(r => r.good.key === good.key);
    const next = updateBarterRow(
        plan,
        old
            ? { ...old, good, choices: emptyBarterRow(good).choices }
            : emptyBarterRow(good)
    );
    return {
        ...next,
        seasonChoices: { ...next.seasonChoices, [good.postId]: good.key },
    };
}

export function moveBarterWeek(plan: BarterPlan, now: number): BarterPlan {
    return {
        ...plan,
        weekKey: barterWeek(now),
        rows: plan.rows.map(row => ({ ...row, used: "0" })),
    };
}

export function recordBarterExchanges(
    plan: BarterPlan,
    data: BarterReference,
    now: number
): BarterPlan {
    if (
        plan.weekKey !== barterWeek(now) ||
        changedBarterRows(plan, data).length ||
        barterSelectionIssues(plan, data).length
    )
        throw new Error("주간 기간과 변경된 데이터를 먼저 확인해 주세요.");
    const rows = activeBarterRows(plan, data, now);
    for (const row of rows) {
        const issue = rowIssue(row, now);
        if (issue) throw new Error(issue);
    }
    const active = new Set(rows.map(r => r.good.key));
    return {
        ...plan,
        checked: [],
        rows: plan.rows.map(row =>
            active.has(row.good.key)
                ? {
                      ...row,
                      used: String(
                          parseBarterInteger(row.used)! +
                              parseBarterInteger(row.q)!
                      ),
                      q: "0",
                  }
                : row
        ),
    };
}

export function barterPrices(
    plan: BarterPlan,
    data: Pick<BarterReference, "materials">
): Record<string, string> {
    return Object.fromEntries(
        data.materials.map(m => {
            if (Object.hasOwn(plan.prices, m.id))
                return [m.id, plan.prices[m.id]];
            const quote =
                m.searchable && !m.ambiguous ? plan.quotes[m.name] : undefined;
            return [
                m.id,
                quote &&
                quote.availableQuantity > 0 &&
                Number.isSafeInteger(quote.minPrice)
                    ? String(quote.minPrice)
                    : "",
            ];
        })
    );
}

function bytes(value: string): number {
    return encodeURIComponent(value).replace(/%[A-F\d]{2}/g, "x").length;
}

export function parseBarterStorage(raw: string | null): {
    plan: BarterPlan | null;
    error: string;
} {
    if (raw === null) return { plan: null, error: "" };
    try {
        if (
            raw.length > BARTER_STORAGE_LIMIT ||
            bytes(raw) > BARTER_STORAGE_LIMIT
        )
            throw new Error("oversize");
        return { plan: BarterPlanSchema.parse(JSON.parse(raw)), error: "" };
    } catch {
        return {
            plan: null,
            error: "저장된 계획의 형식·크기를 확인해 주세요. 원래 저장 내용은 보존했습니다.",
        };
    }
}

export function serializeBarterStorage(plan: BarterPlan): string {
    const raw = JSON.stringify(BarterPlanSchema.parse(plan));
    if (bytes(raw) > BARTER_STORAGE_LIMIT)
        throw new Error(
            "저장 용량 256KiB를 넘었습니다. 텍스트로 내보내 주세요."
        );
    return raw;
}

export function parseBarterShare(query: string): {
    plan: BarterPlan | null;
    error: string;
} {
    if (!query || query === "?") return { plan: null, error: "" };
    try {
        const rawQuery = query.replace(/^\?/, "");
        if (rawQuery.length > BARTER_QUERY_LIMIT) throw new Error("oversize");
        const params = new URLSearchParams(rawQuery);
        if (
            params.getAll("s").length !== 1 ||
            [...params.keys()].some(k => k !== "s")
        )
            throw new Error("query");
        const raw = params.get("s")!;
        if (bytes(raw) > BARTER_JSON_LIMIT) throw new Error("oversize");
        return { plan: BarterPlanSchema.parse(JSON.parse(raw)), error: "" };
    } catch {
        return {
            plan: null,
            error: "공유 링크의 형식·버전·크기를 확인해 주세요. 저장된 계획은 변경하지 않았습니다.",
        };
    }
}

export function buildBarterShare(plan: BarterPlan): string {
    const parsed = BarterPlanSchema.parse(plan);
    const rows = parsed.rows.filter(
        r => r.good.source === "manual" || r.q !== "0" || r.used !== "0"
    );
    const ids = new Set(
        rows.flatMap(r => r.good.groups.flat().map(m => String(m.itemId)))
    );
    const raw = JSON.stringify({
        ...parsed,
        rows,
        owned: Object.fromEntries(
            Object.entries(parsed.owned).filter(([id]) => ids.has(id))
        ),
        prices: Object.fromEntries(
            Object.entries(parsed.prices).filter(([id]) => ids.has(id))
        ),
        checked: parsed.checked.filter(id => ids.has(String(id))),
    });
    const query = new URLSearchParams({ s: raw }).toString();
    if (bytes(raw) > BARTER_JSON_LIMIT || query.length > BARTER_QUERY_LIMIT)
        throw new Error(
            "공유 링크 크기 제한(8,192자)을 넘었습니다. 텍스트로 내보내 주세요."
        );
    return `${BARTER_PATH}?${query}`;
}

export function barterText(
    plan: BarterPlan,
    result: BarterResult,
    now: number
): string {
    const date = new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Seoul",
    });
    return [
        "마비노기 물물교환 준비 목록",
        `작성: ${date.format(now)} (서울) / 주간 시작: ${date.format(plan.weekKey)}`,
        `데이터: ${plan.snapshotVersion}`,
        "지원: 스카하 및 이리아 고정 교역품 / 유효 기간을 확인한 시즌 직접 입력·수집 자료",
        ...plan.rows
            .filter(
                r =>
                    r.q !== "0" &&
                    (!r.good.period ||
                        !plan.seasonChoices[r.good.postId] ||
                        plan.seasonChoices[r.good.postId] === r.good.key)
            )
            .flatMap(r => [
                `${r.good.postName} · ${r.good.name} [${r.good.source}]: 추가 ${r.q}회, 사용 ${r.used}/${r.good.limit}${r.good.period ? ` / ${date.format(r.good.period.startAt)}~${date.format(r.good.period.endAt)}` : ""}`,
                ...r.good.groups.map((options, i) => {
                    const selected = options.find(
                        o => o.itemId === r.choices[i]
                    );
                    return selected
                        ? `  교환 1회당 재료 #${selected.itemId} ×${selected.count}`
                        : `  재료 그룹 ${i + 1}: 대안 미선택`;
                }),
            ]),
        ...result.materials.map(
            r =>
                `${r.material.name} (#${r.material.id}): 필요 ${r.required} / 보유 ${r.owned ?? "오류"} / 부족 ${r.missing ?? "미확인"} / 단가 ${r.unitPrice ?? "미입력"} Gold`
        ),
        `전체 재료 가치: ${result.replacement.known} Gold${result.replacement.complete ? "" : ` (알려진 소계, 미확인 ${result.replacement.unknown}행)`}`,
        `추가 구매 예상액: ${result.purchase.known} Gold${result.purchase.complete ? "" : ` (알려진 소계, 미확인 ${result.purchase.unknown}행)`}`,
        ...result.errors,
        "사용량·재고는 직접 입력이며 준비 체크는 재고를 소모하지 않습니다. 시세는 관측한 등록 가격으로 체결을 보장하지 않습니다.",
        ...Object.entries(plan.quotes).map(
            ([name, q]) =>
                `${name} 시세: ${q.minPrice} Gold / 관측 ${q.fetchedAt ?? q.observedAt} / ${q.isComplete ? "전체 조회" : "부분 조회"} / 관측 수량 ${q.availableQuantity}`
        ),
    ].join("\n");
}
