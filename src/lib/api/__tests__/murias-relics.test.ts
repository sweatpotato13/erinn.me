/** @jest-environment node */
import { fetchCurrentItemMarket } from "@/lib/api/auction-market";
import { fetchRelicMarket, getRelicSnapshot } from "@/lib/api/murias-relics";

jest.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
const item = (price = 100, name = "무리아스의 유물") => ({
    item_name: name,
    item_display_name: name,
    item_count: 2,
    auction_price_per_unit: price,
    date_auction_expire: "2026-09-15T00:00:00Z",
    item_option: [
        {
            option_type: "무리아스 유물",
            option_value: "데바스테이션 캐논 대미지 80% 증가 (최대 400%)",
        },
    ],
});
const page = (items: ReturnType<typeof item>[], cursor: string | null = null) =>
    new Response(JSON.stringify({ auction_item: items, next_cursor: cursor }));
const fetchMock = jest.fn();
beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock.mockReset();
});

test("scans beyond the former ten-page cap and includes the final cheapest listing", async () => {
    let calls = 0;
    fetchMock.mockImplementation(() => {
        calls++;
        return page(
            [item(calls === 12 ? 50 : 100)],
            calls < 12 ? String(calls) : null
        );
    });
    const result = await fetchRelicMarket();
    expect(fetchMock).toHaveBeenCalledTimes(12);
    expect(String(fetchMock.mock.calls[11][0])).toContain("cursor=11");
    expect(result).toMatchObject({
        pages: 12,
        nextCursor: null,
        isComplete: true,
        receivedCount: 12,
    });
    expect(
        result.cells.find(cell => cell.effectId === 73020 && cell.level === 2)
    ).toMatchObject({ minUnitPrice: 50, listingCount: 12 });
});

test("rejects repeating cursors, schema failures and later-page failures", async () => {
    fetchMock.mockImplementation(() => page([item()], "same"));
    await expect(fetchRelicMarket()).rejects.toThrow("Repeated cursor");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock
        .mockReset()
        .mockResolvedValueOnce(page([item()], "a"))
        .mockResolvedValueOnce(new Response("no", { status: 503 }));
    await expect(fetchRelicMarket()).rejects.toThrow();
    fetchMock
        .mockReset()
        .mockResolvedValueOnce(
            new Response(
                JSON.stringify({ auction_item: [{ item_name: "bad" }] })
            )
        );
    await expect(fetchRelicMarket()).rejects.toThrow(
        "Invalid upstream response"
    );
});

test("Idea exact-name summary excludes variants and preserves default callers", async () => {
    const name = "무리아스의 유물(이데아)";
    fetchMock.mockImplementation(() =>
        page([
            item(100, name),
            item(1, name + " 변형"),
            { ...item(2, name), item_display_name: "변형 이데아" },
        ])
    );
    expect(await fetchCurrentItemMarket(name, undefined, true)).toMatchObject({
        minPrice: 100,
        listingCount: 1,
    });
    expect(await fetchCurrentItemMarket(name)).toMatchObject({
        minPrice: 1,
        listingCount: 3,
    });
});

test("independent failures and empty Idea never produce a zero valuation", async () => {
    fetchMock.mockImplementation((url: URL) =>
        url.searchParams.get("item_name")?.includes("이데아")
            ? page([])
            : new Response("no", { status: 503 })
    );
    expect(await getRelicSnapshot()).toMatchObject({
        fetchedAt: null,
        relicError: expect.any(String),
        ideaPrice: null,
        ideaFetchedAt: expect.any(String),
        ideaError: null,
    });
    fetchMock.mockImplementation((url: URL) =>
        url.searchParams.get("item_name")?.includes("이데아")
            ? new Response("no", { status: 503 })
            : page([item()])
    );
    expect(await getRelicSnapshot()).toMatchObject({
        fetchedAt: expect.any(String),
        relicError: null,
        isComplete: true,
        ideaPrice: null,
        ideaFetchedAt: null,
        ideaError: expect.any(String),
    });
});

test("a scan exceeding its deadline fails instead of returning a partial snapshot", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(0);
    fetchMock.mockImplementation(() => {
        now.mockReturnValue(90_001);
        return page([item()], "next");
    });
    try {
        await expect(fetchRelicMarket()).rejects.toMatchObject({
            failureClass: "timeout",
        });
    } finally {
        now.mockRestore();
    }
    fetchMock
        .mockReset()
        .mockRejectedValue(new DOMException("aborted", "AbortError"));
    await expect(fetchRelicMarket()).rejects.toMatchObject({
        failureClass: "timeout",
    });
});
