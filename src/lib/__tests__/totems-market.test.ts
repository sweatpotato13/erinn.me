import { fetchTotemListings } from "@/lib/totems-market";

import fixtures from "./fixtures/totem-listings.json";

const row = fixtures.find(r => r.item_name.startsWith("물망초"))!;
const signal = new AbortController().signal;
const fetchMock = jest.fn();
beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock.mockReset();
});
const reply = (body: unknown, ok = true) =>
    fetchMock.mockResolvedValue({ ok, json: () => Promise.resolve(body) });

test("one bounded request filters exact names and retains zero prices, null options and duplicate rows", async () => {
    const zero = {
        ...row,
        auction_price_per_unit: 0,
        item_count: 0,
        item_option: null,
    };
    reply({
        items: [row, zero, row, { ...row, item_name: `${row.item_name} 변형` }],
        hasMore: false,
        nextCursor: null,
    });
    const result = await fetchTotemListings(row.item_name, signal, "request-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
        string,
        { signal: AbortSignal },
    ];
    const query = new URL(url, "http://localhost").searchParams;
    expect(query.get("auction_item_category")).toBe("토템");
    expect(query.get("item_name")).toBe(row.item_name);
    expect([...query.keys()]).toHaveLength(2);
    expect(init.signal).toBe(signal);
    expect(result.receivedCount).toBe(4);
    expect(result.listings.map(r => r.key)).toEqual([
        "request-1:0",
        "request-1:1",
        "request-1:2",
    ]);
    expect(result.listings[1].item).toEqual(zero);
    expect(result.listings[0].item).toEqual(row);
    expect(Number.isFinite(Date.parse(result.observedAt))).toBe(true);
});

test("500 rows plus cursor remain explicitly partial without following the cursor", async () => {
    reply({
        items: Array.from({ length: 500 }, () => row),
        hasMore: true,
        nextCursor: "next-page",
    });
    const result = await fetchTotemListings(row.item_name, signal, "batch");
    expect(result.listings).toHaveLength(500);
    expect(result.hasMore).toBe(true);
    expect(new Set(result.listings.map(r => r.key)).size).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test.each([
    {},
    { items: [], hasMore: true },
    { items: [], hasMore: false, nextCursor: "next" },
    { items: [], hasMore: true, nextCursor: "x".repeat(2049) },
    {
        items: [{ ...row, item_option: [{ option_type: 123 }] }],
        hasMore: false,
    },
    { items: [{ ...row, auction_price_per_unit: "100" }], hasMore: false },
    { items: Array.from({ length: 2501 }, () => row), hasMore: false },
])(
    "malformed envelopes fail without pretending a partial request succeeded",
    async body => {
        reply(body);
        await expect(
            fetchTotemListings(row.item_name, signal, "bad")
        ).rejects.toThrow("응답 형식");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    }
);

test("HTTP/JSON/abort errors do not retry; no results is a valid empty observation", async () => {
    reply({}, false);
    await expect(
        fetchTotemListings(row.item_name, signal, "error")
    ).rejects.toThrow("불러오지 못했습니다");
    fetchMock.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    await expect(
        fetchTotemListings(row.item_name, signal, "abort")
    ).rejects.toThrow("Aborted");
    reply({ items: [], hasMore: false });
    expect(
        (await fetchTotemListings(row.item_name, signal, "empty")).listings
    ).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await expect(fetchTotemListings("", signal, "bad-name")).rejects.toThrow(
        "이름"
    );
    await expect(
        fetchTotemListings("x".repeat(101), signal, "bad-name")
    ).rejects.toThrow("이름");
    expect(fetchMock).toHaveBeenCalledTimes(3);
});
