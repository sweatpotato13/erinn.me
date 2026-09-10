import assert from "node:assert/strict";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mock } from "node:test";

import {
    collectBarterSeason,
    publishBarterSeason,
    seasonReference,
} from "./collect-barter-season";

async function main() {
    const reference = seasonReference();
    const now = Date.parse("2026-09-10T12:00:00+09:00");
    const season = {
        id: 16,
        startAt: Date.parse("2026-09-03T07:00:00+09:00"),
        endAt: Date.parse("2026-10-01T07:00:00+09:00"),
        version: 2,
    };
    const materialIds = [
        [5041005, 5041008, 5041013],
        [5041016, 5041022],
        [5100409, 5100405],
        [5000318, 5100404],
    ];
    const names = [
        "나무 조각 퍼즐",
        "유적 탐사 개론",
        "대형 해먹",
        "불의 수정구",
    ];
    const page = {
        props: {
            pageProps: {
                csrf: "fixture-token",
                tradeSeasons: [
                    {
                        ...season,
                        id: 17,
                        startAt: season.endAt,
                        endAt: season.endAt + 86400000,
                    },
                    season,
                ],
            },
        },
    };
    const response = {
        code: 200,
        result: {
            lastSeason: season,
            tradingPosts: materialIds.map((ids, index) => ({
                name: reference.postNames[201 + index],
                tradeItems: [
                    {
                        name: names[index],
                        tear: 6,
                        weekCount: index === 0 ? 3 : 2,
                        ingredients: ids.map(id => ({
                            itemKey: `source-${id}`,
                            count: 1,
                        })),
                    },
                ],
            })),
            itemListDict: Object.fromEntries(
                materialIds
                    .flat()
                    .map(id => [
                        `source-${id}`,
                        {
                            name: reference.items.find(
                                item => item.id === String(id)
                            )!.name,
                        },
                    ])
            ),
        },
    };
    // Skatha tier six must not enter the four rotating Iria slots.
    response.result.tradingPosts.push({
        name: "스카하",
        tradeItems: [
            {
                name: "심연의 별",
                tear: 6,
                weekCount: 100,
                ingredients: [{ itemKey: "source-5041005", count: 1 }],
            },
        ],
    });
    function requestFor(
        pageValue: unknown = page,
        value: unknown = response,
        cookie = true,
        pageStatus = 200,
        responseStatus = 200
    ): typeof fetch {
        return async (input, init) => {
            assert(init?.signal);
            assert.equal(init.redirect, "error");
            if (String(input).endsWith("/trade"))
                return new Response(
                    `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(pageValue)}</script>`,
                    {
                        status: pageStatus,
                        headers: cookie
                            ? {
                                  "set-cookie":
                                      "laba_mabi_key=fixture-cookie; Path=/",
                              }
                            : {},
                    }
                );
            assert.equal(init?.method, "POST");
            assert.deepEqual(JSON.parse(String(init.body)), {
                csrf: "fixture-token",
                seasonId: 16,
            });
            assert.equal(
                new Headers(init.headers).get("Cookie"),
                "laba_mabi_key=fixture-cookie"
            );
            assert.equal(
                new Headers(init.headers).get("Content-Type"),
                "text/plain;charset=UTF-8"
            );
            return new Response(JSON.stringify(value), {
                status: responseStatus,
            });
        };
    }
    const collected = await collectBarterSeason(
        reference,
        requestFor(),
        () => now
    );
    assert.deepEqual(
        collected.goods.map(g => g.limit),
        [3, 2, 2, 2]
    );
    assert.deepEqual(
        collected.goods.map(g => g.groups.flat().map(m => m.itemId)),
        materialIds
    );
    assert.equal(collected.goods.length, 4);
    assert(
        !/fixture-token|fixture-cookie|csrf|cookie|itemKey|auctionData/.test(
            JSON.stringify(collected)
        )
    );
    const root = fs.mkdtempSync(join(tmpdir(), "barter-season-test-"));
    const path = join(root, "season.json");
    fs.writeFileSync(path, "previous snapshot\n");
    const previous = fs.readFileSync(path, "utf8");
    async function reject(request: typeof fetch, refs = reference, time = now) {
        await assert.rejects(async () => {
            const candidate = await collectBarterSeason(
                refs,
                request,
                () => time
            );
            publishBarterSeason(path, candidate, time);
        });
        assert.equal(fs.readFileSync(path, "utf8"), previous);
    }
    try {
        await reject(requestFor({}, response));
        await reject(requestFor(page, response, false));
        await reject(requestFor(page, response, true, 503));
        await reject(requestFor(page, response, true, 200, 502));
        await reject(requestFor(page, { code: 500, result: {} }));
        await reject(requestFor(page, {}));
        await reject(async () => {
            throw new DOMException("Timed out", "TimeoutError");
        });
        await reject(async () => new Response("invalid html"));
        await reject(
            async () => new Response('<script id="__NEXT_DATA__">{</script>')
        );
        for (const edit of [
            (p: typeof page) => {
                p.props.pageProps.csrf = "";
            },
            (p: typeof page) => {
                p.props.pageProps.tradeSeasons = [];
            },
            (p: typeof page) => {
                p.props.pageProps.tradeSeasons.push(season);
            },
        ]) {
            const modified = structuredClone(page);
            edit(modified);
            await reject(requestFor(modified));
        }
        for (const edit of [
            (r: typeof response) => {
                r.result.lastSeason.id++;
            },
            (r: typeof response) => {
                r.result.lastSeason.version++;
            },
            (r: typeof response) => {
                r.result.tradingPosts.shift();
            },
            (r: typeof response) => {
                r.result.tradingPosts.push(r.result.tradingPosts[0]);
            },
            (r: typeof response) => {
                r.result.tradingPosts[0].tradeItems.push(
                    r.result.tradingPosts[0].tradeItems[0]
                );
            },
            (r: typeof response) => {
                r.result.tradingPosts[0].tradeItems[0].weekCount = 0;
            },
            (r: typeof response) => {
                r.result.tradingPosts[0].tradeItems[0].ingredients[0].count = 1.5;
            },
            (r: typeof response) => {
                r.result.tradingPosts[0].tradeItems[0].ingredients = [];
            },
            (r: typeof response) => {
                r.result.itemListDict = {};
            },
            (r: typeof response) => {
                r.result.itemListDict["source-5041005"].name = "unknown";
            },
        ]) {
            const modified = structuredClone(response);
            edit(modified);
            await reject(requestFor(page, modified));
        }
        await reject(requestFor(), {
            ...reference,
            items: [
                ...reference.items,
                {
                    id: "999999",
                    name: reference.items.find(i => i.id === "5041005")!.name,
                },
            ],
        });
        await reject(requestFor(), reference, season.endAt);
        assert.throws(() => publishBarterSeason(path, collected, season.endAt));
        for (const method of ["writeFileSync", "renameSync"] as const) {
            const failure = mock.method(fs, method, () => {
                throw new Error("Simulated filesystem failure");
            });
            try {
                assert.throws(
                    () => publishBarterSeason(path, collected, now),
                    /Simulated/
                );
            } finally {
                failure.mock.restore();
            }
            assert.equal(fs.readFileSync(path, "utf8"), previous);
            assert.deepEqual(fs.readdirSync(root), ["season.json"]);
        }
        publishBarterSeason(path, collected, now);
        assert.deepEqual(JSON.parse(fs.readFileSync(path, "utf8")), collected);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
    console.log(
        "Barter season checks passed: session, period, four posts/nine materials, identity, failure preservation, atomic publication."
    );
}
void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
