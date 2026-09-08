import data from "@/data/miniature-reference.json";
import {
    defaultMiniatureConfig,
    miniatureShareUrl,
    parseMiniatureShare,
    parseMiniatureStorage,
} from "@/lib/miniatures-state";

const config = {
    ...defaultMiniatureConfig(data),
    candidateIds: [564, 790],
    installedIds: [485],
    manualPrices: { "54536": "0", "5030119": "200" },
};
const rawUrl = (value: unknown) =>
    new URL(
        `https://erinn.me/tools/miniatures?s=${encodeURIComponent(JSON.stringify(value))}`
    );

test("round-trip share and local baseline are distinct; only manual price schema allowed", () => {
    const url = new URL(miniatureShareUrl(config, "https://erinn.me", data));
    expect(parseMiniatureShare(url, data)).toEqual({ config, notice: "" });
    expect(
        parseMiniatureShare(new URL("https://erinn.me/tools/miniatures"), data)
            .config
    ).toBeNull();
    const local = {
        formatVersion: 1,
        snapshotVersion: data.version,
        installedIds: [485, 485, 826],
    };
    expect(
        parseMiniatureStorage(JSON.stringify(local), data).installedIds
    ).toEqual([485, 826]);
    expect(
        parseMiniatureShare(rawUrl({ ...config, markets: {} }), data).config
    ).toBeNull();
});

test("corrupt, oversized and ownership-only storage cannot activate effects", () => {
    for (const input of [
        "{",
        "[]",
        " ".repeat(65537),
        JSON.stringify({ ...config, ownedIds: [485] }),
        JSON.stringify({
            formatVersion: 2,
            snapshotVersion: data.version,
            installedIds: [485],
        }),
    ]) {
        const parsed = parseMiniatureStorage(input, data);
        expect(parsed.installedIds).toEqual([]);
        expect(parsed.notice).not.toBe("");
    }
    expect(parseMiniatureStorage(null, data)).toEqual({
        installedIds: [],
        notice: "",
    });
});

test("snapshot changes retain valid identities and explain removed entries", () => {
    const old = {
        ...config,
        snapshotVersion: `1788405829:${"a".repeat(64)}`,
        installedIds: [485, 999999],
        candidateIds: [564, 999998],
    };
    const parsed = parseMiniatureShare(rawUrl(old), data);
    expect(parsed.config?.installedIds).toEqual([485]);
    expect(parsed.config?.candidateIds).toEqual([564]);
    expect(parsed.config?.manualPrices).toEqual({ "54536": "0" });
    expect(parsed.notice).toContain("999999");
    expect(parsed.notice).toContain("999998");
    expect(parsed.notice).toContain("버전");
});

test("strict numeric/ID/URL bounds reject malformed share inputs", () => {
    for (const value of [
        { ...config, candidateIds: [1, 2, 3, 4, 5] },
        { ...config, installedIds: [-1] },
        { ...config, installedIds: [1.1] },
        { ...config, installedIds: [Number.MAX_SAFE_INTEGER + 1] },
        { ...config, targetStat: "__proto__" },
        { ...config, formatVersion: 2 },
        { ...config, manualPrices: { "123": "200" } },
        { ...config, manualPrices: { "54536": "1.1" } },
        { ...config, manualPrices: { "54536": "-1" } },
        { ...config, manualPrices: { "54536": "9007199254740992" } },
        { ...config, installedIds: Array.from({ length: 1001 }, () => 485) },
    ])
        expect(parseMiniatureShare(rawUrl(value), data).config).toBeNull();
    const duplicate = rawUrl(config);
    duplicate.searchParams.append("s", "{}");
    expect(parseMiniatureShare(duplicate, data).config).toBeNull();
    const big = rawUrl(config);
    big.searchParams.append("extra", "x".repeat(4000));
    expect(parseMiniatureShare(big, data).config).toBeNull();
    const standard = miniatureShareUrl(config, "https://erinn.me", data);
    const atLimit = new URL(standard);
    atLimit.hash = "x".repeat(4000 - standard.length - 1);
    expect(atLimit.href.length).toBe(4000);
    expect(parseMiniatureShare(atLimit, data).config).not.toBeNull();
    atLimit.hash += "x";
    expect(parseMiniatureShare(atLimit, data).config).toBeNull();
    expect(() =>
        miniatureShareUrl(
            {
                ...config,
                installedIds: Array.from({ length: 1000 }, () => 485),
            },
            "https://erinn.me",
            data
        )
    ).toThrow();
});
