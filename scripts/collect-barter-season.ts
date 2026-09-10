import assert from "node:assert/strict";
import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { z } from "zod";

import {
    type BarterSeason,
    BarterSeasonSchema,
    IRIA_POSTS,
} from "../src/lib/barter";
import { resolveItems, type ReferenceItem } from "./item-reference";
import { readSnapshot, sha256, stableJson } from "./reference-data";

const SOURCE = "https://labanyu.com/trade";
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const seasonSchema = z.object({
    id: positive,
    startAt: positive,
    endAt: positive,
    version: z.union([
        z.string().min(1).max(100),
        z.number().int().nonnegative(),
    ]),
});
const pageSchema = z.object({
    props: z.object({
        pageProps: z.object({
            csrf: z.string().min(1),
            tradeSeasons: z.array(seasonSchema).min(1),
        }),
    }),
});
const responseSchema = z.object({
    code: z.literal(200),
    result: z.object({
        lastSeason: seasonSchema,
        tradingPosts: z.array(
            z.object({
                name: z.string().min(1),
                tradeItems: z.array(
                    z.object({
                        name: z.string().min(1).max(100),
                        tear: positive,
                        weekCount: positive,
                        ingredients: z
                            .array(
                                z
                                    .object({
                                        itemKey: z.string().min(1),
                                        count: positive,
                                    })
                                    .strict()
                            )
                            .min(1)
                            .max(20),
                    })
                ),
            })
        ),
        itemListDict: z.record(
            z.string(),
            z.object({ name: z.string().min(1) })
        ),
    }),
});

interface Reference {
    sourceVersion: number;
    items: ReferenceItem[];
    postNames: Record<string, string>;
}

export function seasonReference(): Reference {
    const { data, manifest } = readSnapshot(resolve("src/data/reference"));
    const strings = new Map(data.StringTable.map(s => [s.Id, s.Str]));
    return {
        sourceVersion: manifest.sourceVersion.CreatedAt,
        items: resolveItems(data.ItemList, data.StringTable).items,
        postNames: Object.fromEntries(
            IRIA_POSTS.map(id => [
                id,
                strings.get(data.CommercePostNameMap[String(id)])!,
            ])
        ),
    };
}

function requireCurrent(
    period: { startAt: number; endAt: number },
    now: number
) {
    assert(
        period.startAt <= now && now < period.endAt,
        "Season is not currently effective"
    );
}

export async function collectBarterSeason(
    reference: Reference,
    request: typeof fetch = fetch,
    now: () => number = Date.now
): Promise<BarterSeason> {
    const page = await request(SOURCE, {
        signal: AbortSignal.timeout(15_000),
        redirect: "error",
    });
    assert(page.ok, `Trade page HTTP ${page.status}`);
    const html = await page.text();
    const match = html.match(
        /<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/
    );
    assert(match, "Missing page JSON");
    const { csrf, tradeSeasons } = pageSchema.parse(JSON.parse(match[1])).props
        .pageProps;
    const active = tradeSeasons.filter(
        s => s.startAt <= now() && now() < s.endAt
    );
    assert.equal(active.length, 1, "Expected one active season");
    const selected = active[0];
    const cookie = page.headers
        .getSetCookie()
        .find(c => c.startsWith("laba_mabi_key="))
        ?.split(";")[0];
    assert(cookie && cookie !== "laba_mabi_key=", "Missing visitor cookie");
    const response = await request(
        "https://labanyu.com/api/trade/season-item",
        {
            method: "POST",
            headers: {
                Cookie: cookie,
                "Content-Type": "text/plain;charset=UTF-8",
            },
            body: JSON.stringify({ csrf, seasonId: selected.id }),
            signal: AbortSignal.timeout(15_000),
            redirect: "error",
        }
    );
    assert(response.ok, `Season response HTTP ${response.status}`);
    const { result } = responseSchema.parse(await response.json());
    assert.deepEqual(
        result.lastSeason,
        selected,
        "Returned season does not match selection"
    );
    requireCurrent(selected, now());
    const period = { startAt: selected.startAt, endAt: selected.endAt };
    const names = new Map<string, number[]>();
    for (const item of reference.items)
        names.set(item.name, [
            ...(names.get(item.name) ?? []),
            Number(item.id),
        ]);
    const goods = IRIA_POSTS.map(postId => {
        const postName = reference.postNames[postId];
        const posts = result.tradingPosts.filter(p => p.name === postName);
        assert.equal(posts.length, 1, `Expected one post: ${postId}`);
        const entries = posts[0].tradeItems.filter(item => item.tear === 6);
        assert.equal(
            entries.length,
            1,
            `Expected one rotating good: ${postId}`
        );
        const good = entries[0];
        const payload = {
            key: `season:${postId}:${selected.id}`,
            source: "season" as const,
            postId,
            postName,
            name: good.name,
            limit: good.weekCount,
            reset: "weekly",
            period,
            groups: good.ingredients.map(ingredient => {
                const name = result.itemListDict[ingredient.itemKey]?.name;
                const ids = names.get(name) ?? [];
                assert.equal(
                    ids.length,
                    1,
                    `Missing or ambiguous material: ${name ?? "unknown source key"}`
                );
                return [{ itemId: ids[0], count: ingredient.count }];
            }),
        };
        return { ...payload, revision: sha256(stableJson(payload)) };
    });
    return BarterSeasonSchema.parse({
        formatVersion: 1,
        source: SOURCE,
        collectedAt: new Date(now()).toISOString(),
        sourceVersion: reference.sourceVersion,
        seasonId: selected.id,
        seasonVersion: selected.version,
        period,
        goods,
    });
}

export function publishBarterSeason(
    path: string,
    input: BarterSeason,
    now = Date.now()
) {
    const data = BarterSeasonSchema.parse(input);
    requireCurrent(data.period, now);
    const temporary = fs.mkdtempSync(join(dirname(path), ".barter-season-"));
    try {
        const candidate = join(temporary, "season.json");
        fs.writeFileSync(candidate, JSON.stringify(data, null, 2) + "\n", {
            flag: "wx",
        });
        fs.renameSync(candidate, path);
    } finally {
        fs.rmSync(temporary, { recursive: true, force: true });
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
    void collectBarterSeason(seasonReference())
        .then(data => {
            publishBarterSeason(resolve("src/data/barter-season.json"), data);
            console.log(
                `Collected season ${data.seasonId}: ${data.goods.length} posts, ${new Date(data.period.startAt).toISOString()}–${new Date(data.period.endAt).toISOString()}`
            );
        })
        .catch(error => {
            // Never log page/response bodies, visitor cookies or CSRF values.
            console.error(
                error instanceof z.ZodError
                    ? `Season validation failed: ${error.issues.map(i => i.path.join(".")).join(", ")}`
                    : error instanceof SyntaxError
                      ? "Invalid source JSON"
                      : String(error)
            );
            process.exitCode = 1;
        });
}
