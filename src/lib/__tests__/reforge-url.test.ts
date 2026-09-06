/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });
import { GET } from "@/app/api/reforge/route";
import {
    reforgeVersion,
    searchReforgeEquipment,
} from "@/lib/reforge-reference";
import {
    defaultReforgeConfig,
    parseReforgeConfig,
    reforgeConfigPath,
} from "@/lib/reforge-url";

const item = searchReforgeEquipment("켈틱 드루이드 스태프")[0];
const config = {
    ...defaultReforgeConfig(reforgeVersion),
    equipmentId: item.id,
    targets: [{ id: 15, level: 20 }],
    price: "0",
    budget: "9007199254740993",
    cap: 12345,
};
const params = () =>
    new URL(reforgeConfigPath(config), "https://erinn.me").searchParams;

test("bounded versioned settings roundtrip preserves zero and unknown prices, rejects conflicts", () => {
    expect(parseReforgeConfig(params(), reforgeVersion)).toEqual({
        config,
        error: null,
        changedVersion: false,
    });
    const blank = params();
    blank.delete("price");
    expect(parseReforgeConfig(blank, reforgeVersion).config.price).toBe("");
    expect(parseReforgeConfig(params(), "9999999999").changedVersion).toBe(
        true
    );
    for (const [key, value] of [
        ["goals", "15:1,15:2"],
        ["goals", "15:1,2:1,3:1,4:1"],
        ["price", "-1"],
        ["cap", "0"],
        ["cap", "1000001"],
        ["e", "1e5"],
        ["v", ""],
    ]) {
        const p = params();
        p.set(key, value);
        expect(parseReforgeConfig(p, reforgeVersion).error).not.toBeNull();
    }
    const duplicate = params();
    duplicate.append("t", "1");
    expect(parseReforgeConfig(duplicate, reforgeVersion).error).not.toBeNull();
    expect(
        parseReforgeConfig(
            new URLSearchParams("q=" + "x".repeat(1300)),
            reforgeVersion
        ).error
    ).not.toBeNull();
});
test("API returns only bounded equipment search or selected model; rejects unsupported IDs", async () => {
    const get = (q: string) =>
        GET(new Request(`http://localhost/api/reforge?${q}`));
    const found = (await get(`q=${encodeURIComponent("장갑")}`).json()) as {
        equipment: unknown[];
    };
    expect(found.equipment.length).toBeLessThanOrEqual(30);
    expect(get(`e=${item.id}&t=3`).status).toBe(404);
    expect(get("e=999999999999&t=1").status).toBe(404);
    expect(get(`e=${item.id}&t=1&t=2`).status).toBe(400);
    expect(get("q=" + "x".repeat(101)).status).toBe(400);
    const response = get(`e=${item.id}&t=1`);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text.length).toBeLessThan(100_000);
    expect(text).not.toMatch(
        /StringTable|ItemList|EquipFilterMap|TypeFilterMap|RateRank/
    );
    expect(JSON.parse(text)).toMatchObject({
        version: reforgeVersion,
        equipment: { id: item.id },
        tool: { id: 1 },
    });
});
