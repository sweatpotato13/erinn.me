/** @jest-environment node */

import { GET } from "@/app/api/item-image/route";

function request(query: string) {
    return new Request(`http://localhost:3000/api/item-image?${query}`, {
        headers: { origin: "http://localhost:3000" },
    });
}

describe("item image route", () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue(
            new Response(new Uint8Array([1, 2, 3]), {
                status: 200,
                headers: { "Content-Type": "image/png" },
            })
        );
    });

    it("supports legacy id and retains image headers", async () => {
        const response = await GET(request("id=1000") as never);
        expect(response.status).toBe(200);
        expect(response.headers.get("Cache-Control")).toBe(
            "public, max-age=86400"
        );
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(fetch).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: "/invimage/kr/1000/1000.png" }),
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
    });

    it("resolves names server-side, gives id precedence, and falls back", async () => {
        await GET(
            request(`name=${encodeURIComponent("최고급 실크")}`) as never
        );
        expect((jest.mocked(fetch).mock.calls[0][0] as URL).pathname).not.toBe(
            "/invimage/kr/1000/1000.png"
        );

        await GET(request("id=777&name=unknown") as never);
        expect((jest.mocked(fetch).mock.calls[1][0] as URL).pathname).toBe(
            "/invimage/kr/777/777.png"
        );

        await GET(request("name=definitely-unknown") as never);
        expect((jest.mocked(fetch).mock.calls[2][0] as URL).pathname).toBe(
            "/invimage/kr/1000/1000.png"
        );

        await GET(request("name=toString") as never);
        expect((jest.mocked(fetch).mock.calls[3][0] as URL).pathname).toBe(
            "/invimage/kr/1000/1000.png"
        );
    });

    it.each([
        ["가을빛 포도나무 의자(2인)", "5400282"],
        ["생활 협회 코인 상자", "4090082"],
    ])("keeps snapshot image identity for %s", async (name, id) => {
        const response = await GET(
            request(new URLSearchParams({ name }).toString()) as never
        );
        expect(response.status).toBe(200);
        expect((jest.mocked(fetch).mock.calls[0][0] as URL).pathname).toBe(
            `/invimage/kr/${id}/${id}.png`
        );
    });

    it("rejects missing and invalid identifiers without fetch", async () => {
        expect((await GET(request("") as never)).status).toBe(400);
        expect((await GET(request("id=bad%21") as never)).status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("preserves upstream 404 and maps timeout", async () => {
        jest.mocked(fetch).mockResolvedValueOnce(
            new Response("", { status: 404 })
        );
        expect((await GET(request("id=1000") as never)).status).toBe(404);

        jest.mocked(fetch).mockRejectedValueOnce(
            new DOMException("aborted", "AbortError")
        );
        const log = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        expect((await GET(request("id=1000") as never)).status).toBe(504);
        expect(log).toHaveBeenCalledWith({
            route: "/api/item-image",
            failureClass: "timeout",
        });
    });
});
