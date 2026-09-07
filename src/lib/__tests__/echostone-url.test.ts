import reference from "@/data/echostone-reference.json";
import {
    defaultEchoConfig,
    echoConfigPath,
    parseEchoConfig,
} from "@/lib/echostone-url";

test("round trips all agent prices, zero vs blank and independent one-use state", () => {
    const config = {
        ...defaultEchoConfig(reference),
        current: { id: 1, level: 2, polishingUsed: true },
    };
    config.prices[5000078] = "0";
    config.prices[53942] = "9007199254740993";
    const path = echoConfigPath(config, reference);
    expect(
        parseEchoConfig(
            new URL(path, "https://erinn.me").searchParams,
            reference
        )
    ).toEqual({ config, error: null, changedVersion: false });
    config.version = "1";
    expect(
        parseEchoConfig(
            new URLSearchParams({ s: JSON.stringify(config) }),
            reference
        ).config.current
    ).toBeNull();
    expect(
        parseEchoConfig(
            new URL(echoConfigPath(config, reference), "https://erinn.me")
                .searchParams,
            reference
        ).changedVersion
    ).toBe(true);
});
test("rejects malformed, oversized, duplicate and semantically invalid settings", () => {
    const config = defaultEchoConfig(reference);
    for (const params of [
        new URLSearchParams("s={"),
        new URLSearchParams({ s: "x".repeat(4001) }),
        new URLSearchParams("s={}&s={}"),
    ])
        expect(parseEchoConfig(params, reference).error).toBeTruthy();
    for (const patch of [
        { grade: 31 },
        { color: 0 },
        { agent: 1 },
        { cap: 0 },
        { cap: 1_000_001 },
        { budget: "-1" },
        { fee: "1.1" },
        { target: { name: "missing", level: 1 } },
        { current: { id: 999, level: 1, polishingUsed: false } },
        { current: { id: 1, level: 4, polishingUsed: false } },
        { prices: { ...config.prices, 53942: "NaN" } },
    ])
        expect(
            parseEchoConfig(
                new URLSearchParams({
                    s: JSON.stringify({ ...config, ...patch }),
                }),
                reference
            ).error
        ).toBeTruthy();
    expect(parseEchoConfig(new URLSearchParams(), reference).config).toEqual(
        config
    );
});
