/** @jest-environment node */
import { revalidateTag } from "next/cache";

import { GET, maxDuration, POST } from "@/app/api/murias-relics/route";
import { getRelicSnapshot, MURIAS_CACHE_TAG } from "@/lib/api/murias-relics";

jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }));
jest.mock("@/lib/api/murias-relics", () => ({
    getRelicSnapshot: jest.fn(() => ({
        fetchedAt: null,
        relicError: "unavailable",
    })),
    MURIAS_CACHE_TAG: "murias-market-v2-full",
}));
jest.mock("@/lib/utils/check-origin", () => ({ checkOrigin: () => null }));
beforeEach(() => jest.clearAllMocks());
test("rejects pagination controls before reading or invalidating caches", async () => {
    for (const query of [
        "pages=0",
        "pages=11",
        "pages=1.5",
        "cursor=arbitrary",
        "pages=no",
    ])
        expect(
            (
                await POST(
                    new Request(`http://localhost/api/murias-relics?${query}`)
                )
            ).status
        ).toBe(400);
    expect(getRelicSnapshot).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
});
test("GET uses cache and POST explicitly expires ten-minute market caches", async () => {
    expect(maxDuration).toBe(60);
    const response = await GET(
        new Request("http://localhost/api/murias-relics")
    );
    expect(getRelicSnapshot).toHaveBeenCalledWith();
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ relicError: "unavailable" });
    await POST(
        new Request("http://localhost/api/murias-relics", {
            method: "POST",
        })
    );
    expect(revalidateTag).toHaveBeenCalledWith(MURIAS_CACHE_TAG, { expire: 0 });
    expect(getRelicSnapshot).toHaveBeenLastCalledWith();
});
