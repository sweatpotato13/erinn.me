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
        [getAuction, `/api/auction?item_name=${"a".repeat(101)}`],
        [getKeyword, `/api/auction/keyword-search?keyword=${"a".repeat(101)}`],
        [getHistory, `/api/auction/history?item_name=${"a".repeat(101)}`],
        [
            getPriceSummary,
            `/api/auction/price-summary?item_name=${"a".repeat(101)}`,
        ],
        [getHorn, "/api/horn?server_name=invalid"],
        [getNpcShop, "/api/npc-shop?npc_name=n&server_name=류트&channel=43"],
    ])("rejects query bound violations", async (handler, path) => {
        expect((await handler(request(path))).status).toBe(400);
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
        expect(await response.json()).toEqual({
            sales: [historySale("first"), historySale("second")],
            hasMore: false,
        });
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
        expect(await response.json()).toEqual({
            sales: Array.from({ length: 5 }, () => historySale()),
            hasMore: true,
        });
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
        {
            shop: [
                { tab_name: "tab", item: [{ image_url: "url", price: [] }] },
            ],
        },
        {
            shop: [
                {
                    tab_name: "tab",
                    item: [
                        {
                            item_display_name: "item",
                            image_url: "url",
                            price: "bad",
                        },
                    ],
                },
            ],
        },
        {
            shop: [
                {
                    tab_name: "tab",
                    item: [
                        {
                            item_display_name: "item",
                            image_url: "url",
                            price: [{ price_value: 10 }],
                        },
                    ],
                },
            ],
        },
    ])("rejects malformed nested NPC payloads", async payload => {
        jest.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify(payload), { status: 200 })
        );
        const response = await getNpcShop(
            request("/api/npc-shop?npc_name=델&server_name=류트&channel=1")
        );
        expect(response.status).toBe(502);
    });
});
