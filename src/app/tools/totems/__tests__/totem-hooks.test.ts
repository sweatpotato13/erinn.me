import { act, renderHook } from "@testing-library/react";

import { useTotemMarket } from "@/app/tools/totems/totem-hooks";
import reference from "@/data/totem-reference.json";

import listingFixtures from "../../../../lib/__tests__/fixtures/totem-listings.json";

const painting = reference.totems.find(t => t.id === 5160004)!;
const handkerchief = reference.totems.find(t => t.id === 52289)!;

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => {
        resolve = r;
    });
    return { promise, resolve };
}

test("ignores a late market response after the target changes", async () => {
    const first = deferred<Response>();
    const fetchMock = jest
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    items: [],
                    hasMore: false,
                    nextCursor: null,
                }),
        });
    global.fetch = fetchMock;
    Object.defineProperty(crypto, "randomUUID", {
        configurable: true,
        value: () => "request-id",
    });

    const { result, rerender } = renderHook(
        ({ target }) => useTotemMarket(target),
        { initialProps: { target: painting } }
    );

    let firstLoad!: Promise<void>;
    act(() => {
        firstLoad = result.current.load();
    });
    const abortedSignal = (
        fetchMock.mock.calls[0] as [string, { signal: AbortSignal }]
    )[1].signal;

    rerender({ target: handkerchief });
    expect(abortedSignal.aborted).toBe(true);

    await act(async () => {
        await result.current.load();
    });

    await act(async () => {
        first.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
                    items: [
                        {
                            ...listingFixtures[0],
                            item_name: painting.name,
                            item_display_name: painting.name,
                            item_count: 1,
                            date_auction_expire: "2099-01-01T00:00:00Z",
                            auction_price_per_unit: 9_999_999,
                        },
                    ],
                    hasMore: false,
                    nextCursor: null,
                }),
        } as Response);
        await firstLoad;
    });

    expect(result.current.result?.name).toBe(handkerchief.name);
});
