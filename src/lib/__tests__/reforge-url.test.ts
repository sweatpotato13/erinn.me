/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });
import { GET } from "@/app/api/reforge/route";
import { parseReforgeOptionValue } from "@/lib/auction-options";
import { parseAuctionSearchParams } from "@/lib/auction-url";
import {
    getReforgeModel,
    reforgeVersion,
    searchReforgeEquipment,
} from "@/lib/reforge-reference";
import {
    defaultReforgeConfig,
    parseReforgeConfig,
    reforgeAuctionPath,
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
test("only a verified single reforge target can enter the existing auction contract", () => {
    const model = getReforgeModel(item.id, 1)!;
    expect(parseReforgeOptionValue("마법 공격력(20레벨:80 증가)")).toEqual({
        name: "마법 공격력",
        level: 20,
        effect: "80 증가",
    });
    const link = reforgeAuctionPath(model, config.targets)!;
    expect(link).toContain("option_reforge=");
    expect(
        parseAuctionSearchParams(new URL(link, "https://erinn.me").searchParams)
            .search
    ).toMatchObject({
        itemName: item.name,
        optionFilters: { reforge: { optionName: "마법 공격력", minLevel: 20 } },
    });
    expect(
        reforgeAuctionPath(model, [...config.targets, { id: 1, level: 1 }])
    ).toBeNull();
    expect(reforgeAuctionPath(model, [{ id: 1, level: 1 }])).toBeNull();
    expect(
        reforgeAuctionPath(
            {
                ...model,
                pool: model.pool.map(a =>
                    a.id === 15 ? { ...a, name: "변경된 이름" } : a
                ),
            },
            config.targets
        )
    ).toBeNull();
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
