/** @jest-environment node */
import { GET } from "@/app/api/barter/materials/route";

const request = (query: string) =>
    new Request(`http://localhost/api/barter/materials?${query}`);

test("bounded local ID/name search preserves actual identities without external requests", async () => {
    const external = jest
        .spyOn(global, "fetch")
        .mockRejectedValue(new Error("Unexpected network"));
    try {
        const byId = await GET(request("ids=50664,67201,999999999")).json();
        expect(byId.materials.map((m: { id: number }) => m.id)).toEqual([
            50664, 67201,
        ]);
        expect(byId.sourceVersion).toBe(1788405829);
        const names = await GET(
            request(new URLSearchParams({ q: "포션" }).toString())
        ).json();
        expect(names.materials).toHaveLength(20);
        expect(names.hasMore).toBe(true);
        const selected = await GET(
            request(new URLSearchParams({ q: "실리엔" }).toString())
        ).json();
        expect(selected.materials).toContainEqual(
            expect.objectContaining({ id: 67201, name: "실리엔" })
        );
        expect(external).not.toHaveBeenCalled();
    } finally {
        external.mockRestore();
    }
});

test.each([
    "",
    "q=a",
    "q=aa&q=bb",
    "ids=1&ids=2",
    "q=aa&ids=1",
    "ids=-1",
    "ids=1.2",
    "ids=1,1",
    "ids=9007199254740992",
    "ids=" + Array.from({ length: 101 }, (_, i) => i + 1).join(","),
    "q=aa&extra=1",
])("rejects invalid query %s", query => {
    expect(GET(request(query)).status).toBe(400);
});
