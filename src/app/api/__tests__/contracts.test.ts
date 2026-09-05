/** @jest-environment node */

import { GET as getHistory } from "@/app/api/auction/history/route";
import { GET as getKeyword } from "@/app/api/auction/keyword-search/route";
import { GET as getPriceSummary } from "@/app/api/auction/price-summary/route";
import { GET as getAuction } from "@/app/api/auction/route";
import { GET as getHorn } from "@/app/api/horn/route";
import { GET as getNpcShop } from "@/app/api/npc-shop/route";
import { GET as getSuggest } from "@/app/api/suggest/route";

function request(path: string) {
    return new Request(`http://localhost:3000${path}`, {
        headers: { origin: "http://localhost:3000" },
    });
}

function historySale(id = "sale-1") {
    return {
        item_name: "sword",
        item_display_name: "Sword",
        item_count: 2,
        auction_price_per_unit: 100,
        date_auction_buy: "2026-08-20T00:00:00Z",
        auction_buy_id: id,
        item_option: [],
    };
}

function auctionItem(
    id: string,
    item_option: Array<{
        option_type: string;
        option_value: string | null;
        option_sub_type?: string | null;
    }>
) {
    return {
        item_name: id,
        item_display_name: id,
        item_count: 1,
        auction_price_per_unit: 100,
        date_auction_expire: "2026-08-24T00:00:00Z",
        item_option,
    };
}

function npcShopResponse(itemName = "광폭한 토끼 인형") {
    return {
        shop_tab_count: 2,
        shop: [
            {
                tab_name: "일반 상품",
                item: [
                    {
                        item_display_name: itemName,
                        item_count: 2,
                        item_option: [
                            {
                                option_type: "아이템 색상",
                                option_value: "255,255,255",
                            },
                        ],
                        image_url:
                            "https://open.api.nexon.com/static/mabinogi/img/item.png",
                        price: [
                            { price_type: "Gold", price_value: 1200 },
                            { price_type: "인장", price_value: "3" },
                        ],
                        limit_type: "주간",
                        limit_value: 5,
                    },
                ],
            },
            { tab_name: "교환 상품", item: [] },
        ],
        date_inquire: "2026-09-02T00:00:00Z",
        date_shop_next_update: "2026-09-02T00:36:00Z",
    };
}

describe("API query contracts", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    it.each([
        [getKeyword, "/api/auction/keyword-search"],
        [getHistory, "/api/auction/history"],
        [getPriceSummary, "/api/auction/price-summary"],
        [getHorn, "/api/horn"],
        [getNpcShop, "/api/npc-shop"],
    ])(
        "rejects missing required query without fetch",
        async (handler, path) => {
            expect((await handler(request(path))).status).toBe(400);
            expect(fetch).not.toHaveBeenCalled();
        }
    );

    it("rejects auction requests with no search fields", async () => {
        const response = await getAuction(request("/api/auction"));
        expect(response.status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("accepts auction requests with a valid search field", async () => {
        jest.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({ auction_item: [], next_cursor: null }),
                { status: 200 }
            )
        );
        const response = await getAuction(
            request("/api/auction?item_name=sword")
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            items: [],
            hasMore: false,
            nextCursor: null,
        });
    });

    it("validates and forwards the complete NPC shop response", async () => {
        const payload = npcShopResponse();
        jest.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify(payload), { status: 200 })
        );
        const query = new URLSearchParams({
            npc_name: "상인 라누",
            server_name: "만돌린",
            channel: "12",
        });

        const response = await getNpcShop(
            request("/api/npc-shop?" + query.toString())
        );
        const upstreamUrl = jest.mocked(fetch).mock.calls[0][0] as URL;

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(upstreamUrl.searchParams.get("npc_name")).toBe("상인 라누");
        expect(upstreamUrl.searchParams.get("server_name")).toBe("만돌린");
        expect(upstreamUrl.searchParams.get("channel")).toBe("12");
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(payload);
    });

    it.each([
        "npc_name=없는NPC&server_name=류트&channel=1",
        "npc_name=델&server_name=없는서버&channel=1",
        "npc_name=델&server_name=류트&channel=nope",
        "npc_name=델&server_name=류트&channel=1.5",
        "npc_name=델&server_name=류트&channel=0",
        "npc_name=델&server_name=류트&channel=43",
    ])("rejects invalid NPC shop queries without fetching", async query => {
        const response = await getNpcShop(request("/api/npc-shop?" + query));

        expect(response.status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("preserves encoded auction query values", async () => {
        jest.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({ auction_item: [], next_cursor: null }),
                { status: 200 }
            )
        );
        await getAuction(
            request(
                `/api/auction?item_name=${encodeURIComponent("한글+&雪")}&auction_item_category=${encodeURIComponent("검+창")}`
            )
        );
        const upstreamUrl = jest.mocked(fetch).mock.calls[0][0] as URL;
        expect(upstreamUrl.searchParams.get("item_name")).toBe("한글+&雪");
        expect(upstreamUrl.searchParams.get("auction_item_category")).toBe(
            "검+창"
        );
    });

    it.each([
        [getAuction, "/api/auction?item_name=sword"],
        [getKeyword, "/api/auction/keyword-search?keyword=sword"],
    ])(
        "filters supported options without forwarding them",
        async (handler, path) => {
            const matching = auctionItem("matching", [
                {
                    option_type: "세공 옵션",
                    option_value: "볼트 대미지(10레벨:효과)",
                },
            ]);
            jest.mocked(fetch).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        auction_item: [
                            matching,
                            auctionItem("malformed", [
                                {
                                    option_type: "세공 옵션",
                                    option_value: "깨진 값",
                                },
                            ]),
                            auctionItem("missing", []),
                        ],
                        next_cursor: null,
                    })
                )
            );

            const response = await handler(
                request(
                    `${path}&option_reforge=${encodeURIComponent("볼트 대미지")}&option_reforge_min_level=10`
                )
            );
            const upstreamUrl = jest.mocked(fetch).mock.calls[0][0] as URL;

            expect(upstreamUrl.searchParams.has("option_reforge")).toBe(false);
            expect(await response.json()).toEqual({
                items: [matching],
                hasMore: false,
                nextCursor: null,
                evaluation: { scannedCount: 3, unevaluableCount: 1 },
            });
        }
    );

    it.each([
        [getAuction, "/api/auction?item_name=sword"],
        [getKeyword, "/api/auction/keyword-search?keyword=sword"],
    ])(
        "rejects invalid option filters before fetching",
        async (handler, path) => {
            const response = await handler(
                request(`${path}&option_erg_grade=C`)
            );

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: "에르그 등급은 B, A, S만 지원합니다.",
            });
            expect(fetch).not.toHaveBeenCalled();
        }
    );

    it.each([
        [getAuction, `/api/auction?item_name=${"a".repeat(101)}`],
        [getKeyword, `/api/auction/keyword-search?keyword=${"a".repeat(101)}`],
        [getHistory, `/api/auction/history?item_name=${"a".repeat(101)}`],
        [
            getPriceSummary,
            `/api/auction/price-summary?item_name=${"a".repeat(101)}`,
        ],
        [getHorn, "/api/horn?server_name=invalid"],
        [getNpcShop, "/api/npc-shop?npc_name=델&server_name=류트&channel=43"],
    ])("rejects query bound violations", async (handler, path) => {
        expect((await handler(request(path))).status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("preserves direct multiword keyword results", async () => {
        const direct = auctionItem("소울 리버레이트 소드", []);
        jest.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({ auction_item: [direct], next_cursor: null })
            )
        );

        const response = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("소울 리버레이트")}`
            )
        );
        const upstreamUrl = jest.mocked(fetch).mock.calls[0][0] as URL;

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(upstreamUrl.searchParams.get("keyword")).toBe("소울 리버레이트");
        expect(await response.json()).toEqual({
            items: [direct],
            hasMore: false,
            nextCursor: null,
        });
    });

    it("normalizes whitespace and filters partial final-word fallback results", async () => {
        const matching = auctionItem("소울 리버레이트 소드", []);
        const unrelated = auctionItem("소울 스트림", []);
        jest.mocked(fetch)
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ auction_item: [], next_cursor: null })
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        auction_item: [matching, unrelated],
                        next_cursor: null,
                    })
                )
            );

        const response = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("  소울   리버  ")}`
            )
        );
        const directUrl = jest.mocked(fetch).mock.calls[0][0] as URL;
        const fallbackUrl = jest.mocked(fetch).mock.calls[1][0] as URL;

        expect(directUrl.searchParams.get("keyword")).toBe("소울 리버");
        expect(fallbackUrl.searchParams.get("keyword")).toBe("소울");
        expect(await response.json()).toEqual({
            items: [matching],
            hasMore: false,
            nextCursor: null,
            searchMode: "fallback",
        });
    });

    it("returns an empty fallback result and does not fallback for one word", async () => {
        jest.mocked(fetch).mockImplementation(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({ auction_item: [], next_cursor: null })
                )
            )
        );

        const fallbackResponse = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("없는 일부")}`
            )
        );
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(await fallbackResponse.json()).toEqual({
            items: [],
            hasMore: false,
            nextCursor: null,
            searchMode: "fallback",
        });

        jest.mocked(fetch).mockClear();
        const directResponse = await getKeyword(
            request("/api/auction/keyword-search?keyword=없는")
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(await directResponse.json()).toEqual({
            items: [],
            hasMore: false,
            nextCursor: null,
        });
    });

    it("shares the page bound and continues the fallback source", async () => {
        let callCount = 0;
        jest.mocked(fetch).mockImplementation(() => {
            callCount++;
            return Promise.resolve(
                new Response(
                    JSON.stringify(
                        callCount === 1
                            ? { auction_item: [], next_cursor: null }
                            : {
                                  auction_item: [
                                      auctionItem(
                                          `소울 리버레이트 ${callCount}`,
                                          []
                                      ),
                                  ],
                                  next_cursor: `cursor-${callCount - 1}`,
                              }
                    )
                )
            );
        });

        const firstResponse = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("소울 리버")}`
            )
        );
        const firstBody = await firstResponse.json();

        expect(fetch).toHaveBeenCalledTimes(5);
        expect(firstBody).toMatchObject({
            hasMore: true,
            nextCursor: "cursor-4",
            searchMode: "fallback",
        });
        expect(firstBody.items).toHaveLength(4);

        jest.mocked(fetch).mockReset();
        jest.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    auction_item: [auctionItem("소울 리버레이트 완료", [])],
                    next_cursor: null,
                })
            )
        );
        const continuation = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("소울 리버")}&cursor=cursor-4&search_mode=fallback`
            )
        );
        const continuationUrl = jest.mocked(fetch).mock.calls[0][0] as URL;

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(continuationUrl.searchParams.get("keyword")).toBe("소울");
        expect(continuationUrl.searchParams.get("cursor")).toBe("cursor-4");
        expect(await continuation.json()).toMatchObject({
            hasMore: false,
            nextCursor: null,
            searchMode: "fallback",
        });
    });

    it("evaluates options after filtering fallback names", async () => {
        const matching = auctionItem("소울 리버레이트 일치", [
            {
                option_type: "세공 옵션",
                option_value: "볼트 대미지(10레벨:효과)",
            },
        ]);
        const malformed = auctionItem("소울 리버레이트 판정불가", [
            { option_type: "세공 옵션", option_value: "깨진 값" },
        ]);
        const missing = auctionItem("소울 리버레이트 옵션없음", []);
        const unrelated = auctionItem("소울 스트림", [
            {
                option_type: "세공 옵션",
                option_value: "볼트 대미지(10레벨:효과)",
            },
        ]);
        jest.mocked(fetch)
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ auction_item: [], next_cursor: null })
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        auction_item: [matching, malformed, missing, unrelated],
                        next_cursor: null,
                    })
                )
            );

        const response = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("소울 리버")}&option_reforge=${encodeURIComponent("볼트 대미지")}&option_reforge_min_level=10`
            )
        );

        expect(await response.json()).toEqual({
            items: [matching],
            hasMore: false,
            nextCursor: null,
            evaluation: { scannedCount: 3, unevaluableCount: 1 },
            searchMode: "fallback",
        });
    });

    it.each([
        "/api/auction/keyword-search?keyword=single&cursor=next&search_mode=fallback",
        `/api/auction/keyword-search?keyword=${encodeURIComponent("소울 리버")}&search_mode=fallback`,
    ])("rejects invalid fallback continuation state", async path => {
        expect((await getKeyword(request(path))).status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([
        "가을빛 포도나무 의자(2인)",
        "생활 협회 코인 상자",
        "보호의 6단계 푸른 개조석",
    ])("suggests resolved snapshot names exactly: %s", async name => {
        const response = getSuggest(
            request(`/api/suggest?${new URLSearchParams({ q: name })}`) as never
        );
        const { suggestions } = await response.json();
        expect(suggestions.filter((value: string) => value === name)).toEqual([
            name,
        ]);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("deduplicates and bounds suggestions without exposing source keys", async () => {
        const response = getSuggest(request("/api/suggest?q=최고") as never);
        const { suggestions } = await response.json();
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.length).toBeLessThanOrEqual(20);
        expect(new Set(suggestions).size).toBe(suggestions.length);
        const unresolved = getSuggest(
            request("/api/suggest?q=itemdb") as never
        );
        expect(await unresolved.json()).toEqual({ suggestions: [] });
        expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects oversized suggestions and short-circuits short queries", async () => {
        expect(
            getSuggest(request(`/api/suggest?q=${"a".repeat(101)}`) as never)
                .status
        ).toBe(400);
        const response = getSuggest(request("/api/suggest?q=a") as never);
        expect(await response.json()).toEqual({ suggestions: [] });
        expect(fetch).not.toHaveBeenCalled();
    });

    it("preserves encoded history item names and aggregates cursor pages", async () => {
        jest.mocked(fetch)
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        auction_history: [historySale("first")],
                        next_cursor: "next",
                    })
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        auction_history: [historySale("second")],
                        next_cursor: null,
                    })
                )
            );

        const response = await getHistory(
            request(
                `/api/auction/history?item_name=${encodeURIComponent("한글+&雪")}`
            )
        );
        const firstUrl = jest.mocked(fetch).mock.calls[0][0] as URL;
        const secondUrl = jest.mocked(fetch).mock.calls[1][0] as URL;
        expect(firstUrl.searchParams.get("item_name")).toBe("한글+&雪");
        expect(firstUrl.searchParams.has("cursor")).toBe(false);
        expect(secondUrl.searchParams.get("cursor")).toBe("next");
        const body = await response.json();
        expect(body).toMatchObject({
            sales: [historySale("first"), historySale("second")],
            hasMore: false,
        });
        expect(body.fetchedAt).toMatch(/Z$/);
    });

    it("marks history results incomplete after five cursor pages", async () => {
        jest.mocked(fetch).mockImplementation(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        auction_history: [historySale()],
                        next_cursor: "next",
                    })
                )
            )
        );

        const response = await getHistory(
            request("/api/auction/history?item_name=sword")
        );
        expect(fetch).toHaveBeenCalledTimes(5);
        const body = await response.json();
        expect(body).toMatchObject({
            sales: Array.from({ length: 5 }, () => historySale()),
            hasMore: true,
        });
        expect(body.fetchedAt).toMatch(/Z$/);
    });

    it("keeps current totals partial while a cursor remains after ten pages", async () => {
        jest.mocked(fetch).mockImplementation(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        auction_item: [auctionItem("stable", [])],
                        next_cursor: "next",
                    })
                )
            )
        );

        const response = await getPriceSummary(
            request("/api/auction/price-summary?item_name=stable")
        );
        const body = await response.json();

        expect(fetch).toHaveBeenCalledTimes(10);
        expect(body).toMatchObject({
            minPrice: 100,
            averagePrice: 100,
            availableQuantity: 10,
            listingCount: 10,
            isComplete: false,
        });
        expect(body.fetchedAt).toMatch(/Z$/);
    });
});

describe("API upstream failure contracts", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("maps non-ok and malformed horn responses to 502", async () => {
        jest.mocked(fetch).mockResolvedValueOnce(
            new Response("", { status: 500 })
        );
        expect(
            (await getHorn(request("/api/horn?server_name=류트"))).status
        ).toBe(502);

        jest.mocked(fetch).mockResolvedValueOnce(
            new Response(JSON.stringify({ wrong: [] }), { status: 200 })
        );
        expect(
            (await getHorn(request("/api/horn?server_name=류트"))).status
        ).toBe(502);
    });

    it("maps AbortError to 504", async () => {
        jest.mocked(fetch).mockRejectedValue(
            new DOMException("aborted", "AbortError")
        );
        expect(
            (await getHorn(request("/api/horn?server_name=류트"))).status
        ).toBe(504);
    });

    it("rejects malformed auction history payloads", async () => {
        jest.mocked(fetch).mockResolvedValue(
            new Response(
                JSON.stringify({
                    auction_history: [
                        { ...historySale(), auction_price_per_unit: "100" },
                    ],
                    next_cursor: null,
                })
            )
        );
        expect(
            (await getHistory(request("/api/auction/history?item_name=sword")))
                .status
        ).toBe(502);
    });

    it("maps an inexact history item name to 422", async () => {
        jest.mocked(fetch).mockResolvedValue(new Response("", { status: 400 }));

        const response = await getHistory(
            request("/api/auction/history?item_name=partial")
        );
        expect(response.status).toBe(422);
        expect(await response.json()).toEqual({
            error: "Exact item name required",
        });
    });

    it("returns no partial auction success when the total deadline expires", async () => {
        const startedAt = Date.now();
        const clock = jest.spyOn(Date, "now").mockReturnValue(startedAt);
        jest.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => {
                clock.mockReturnValue(startedAt + 15_001);
                return Promise.resolve({
                    auction_item: [
                        {
                            item_name: "item",
                            item_display_name: "item",
                            item_count: 1,
                            auction_price_per_unit: 10,
                            date_auction_expire: "date",
                        },
                    ],
                    next_cursor: "next",
                });
            },
        } as Response);

        const response = await getAuction(
            request("/api/auction?item_name=sword")
        );
        expect(response.status).toBe(504);
        expect(await response.json()).toEqual({
            error: "Upstream request timed out",
        });
        clock.mockRestore();
    });

    it.each([
        new Response(JSON.stringify({ wrong: [] }), { status: 200 }),
        new Response("", { status: 500 }),
    ])("maps fallback upstream failures to 502", async fallbackResponse => {
        jest.mocked(fetch)
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ auction_item: [], next_cursor: null })
                )
            )
            .mockResolvedValueOnce(fallbackResponse);

        const response = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("소울 리버")}`
            )
        );

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({
            error: "Failed to fetch upstream data",
        });
    });

    it("shares the request deadline with fallback", async () => {
        const startedAt = Date.now();
        const clock = jest.spyOn(Date, "now").mockReturnValue(startedAt);
        jest.mocked(fetch)
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({ auction_item: [], next_cursor: null })
                )
            )
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => {
                    clock.mockReturnValue(startedAt + 5_001);
                    return Promise.resolve({
                        auction_item: [auctionItem("소울 리버레이트 소드", [])],
                        next_cursor: null,
                    });
                },
            } as Response);

        const response = await getKeyword(
            request(
                `/api/auction/keyword-search?keyword=${encodeURIComponent("소울 리버")}`
            )
        );

        expect(response.status).toBe(504);
        expect(await response.json()).toEqual({
            error: "Upstream request timed out",
        });
        clock.mockRestore();
    });

    it.each([
        new Response("", { status: 500 }),
        new Response(JSON.stringify({ wrong: [] }), { status: 200 }),
    ])("maps NPC upstream failures to 502", async upstreamResponse => {
        jest.mocked(fetch).mockResolvedValue(upstreamResponse);

        const response = await getNpcShop(
            request("/api/npc-shop?npc_name=델&server_name=류트&channel=1")
        );

        expect(response.status).toBe(502);
    });

    it("maps an aborted NPC request to 504", async () => {
        jest.mocked(fetch).mockRejectedValue(
            new DOMException("aborted", "AbortError")
        );

        const response = await getNpcShop(
            request("/api/npc-shop?npc_name=델&server_name=류트&channel=1")
        );

        expect(response.status).toBe(504);
    });

    it.each([
        { ...npcShopResponse(), shop_tab_count: -1 },
        { ...npcShopResponse(), date_inquire: "bad-date" },
        { ...npcShopResponse(), date_shop_next_update: "bad-date" },
        {
            ...npcShopResponse(),
            shop: [
                {
                    tab_name: "tab",
                    item: [
                        {
                            ...npcShopResponse().shop[0].item[0],
                            item_count: 1.5,
                        },
                    ],
                },
            ],
        },
        {
            ...npcShopResponse(),
            shop: [
                {
                    tab_name: "tab",
                    item: [
                        {
                            ...npcShopResponse().shop[0].item[0],
                            price: "bad",
                        },
                    ],
                },
            ],
        },
        {
            ...npcShopResponse(),
            shop: [
                {
                    tab_name: "tab",
                    item: [
                        {
                            ...npcShopResponse().shop[0].item[0],
                            item_option: [{ option_value: "missing type" }],
                        },
                    ],
                },
            ],
        },
        {
            ...npcShopResponse(),
            shop: [
                {
                    tab_name: "tab",
                    item: [
                        {
                            ...npcShopResponse().shop[0].item[0],
                            limit_value: "5",
                        },
                    ],
                },
            ],
        },
    ])("rejects malformed NPC payloads", async payload => {
        jest.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify(payload), { status: 200 })
        );
        const response = await getNpcShop(
            request("/api/npc-shop?npc_name=델&server_name=류트&channel=1")
        );
        expect(response.status).toBe(502);
    });
});
