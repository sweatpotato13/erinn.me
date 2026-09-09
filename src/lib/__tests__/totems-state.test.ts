import { act, renderHook } from "@testing-library/react";

import { useTotemConfig, useTotemMarket } from "@/app/tools/totems/totem-hooks";
import reference from "@/data/totem-reference.json";
import { totemContribution } from "@/lib/totems";
import {
    buildTotemShare,
    candidateTotemPrice,
    candidateTotemRoll,
    emptyTotemConfig,
    parseTotemQuery,
    parseTotemStorage,
    serializeTotemStorage,
    snapshotTotemListing,
    sourceTotemCandidate,
    TOTEM_QUERY_LIMIT,
    TOTEM_STORAGE_KEY,
    type TotemCandidate,
    type TotemConfig,
} from "@/lib/totems-state";

import fixtures from "./fixtures/totem-listings.json";

const painting = reference.totems.find(r => r.id === 5160004)!;
const handkerchief = reference.totems.find(r => r.id === 52289)!;
const row = fixtures.find(r => r.item_name === painting.name)!;
const live: TotemCandidate = snapshotTotemListing({
    kind: "listing",
    key: "request:1",
    observedAt: "2026-09-09T00:00:00Z",
    item: row,
});
const config: TotemConfig = {
    ...emptyTotemConfig(reference),
    baseline: { id: painting.id, values: { bonusdamage: "0.3" } },
    targetStat: "bonusdamage",
    budget: "1200000",
    candidates: [
        sourceTotemCandidate(painting),
        sourceTotemCandidate(painting, true),
        {
            kind: "manual",
            key: "manual:1",
            id: painting.id,
            values: { bonusdamage: "0.5" },
            price: "1000000",
        },
        live,
    ],
};
const query = (value: unknown) =>
    new URLSearchParams({ s: JSON.stringify(value) }).toString();
const parse = (value: unknown) => parseTotemQuery(query(value), reference);

beforeEach(() => {
    window.history.replaceState(null, "", "/tools/totems");
    localStorage.clear();
    jest.restoreAllMocks();
});

test("four kinds round-trip with actual values, baseline, target, money, expiry and raw options", () => {
    const shared = buildTotemShare(config);
    expect(shared.path).not.toBeNull();
    const parsed = parseTotemQuery(shared.path!.split("?")[1], reference);
    expect(parsed.config).toEqual(config);
    expect(parsed.notice).toBe("");
    expect(candidateTotemPrice(config.candidates[2])).toBe(1000000);
    expect(candidateTotemPrice(config.candidates[0])).toBeNull();
    expect(
        totemContribution(candidateTotemRoll(live, reference), "bonusdamage")
    ).toBe(0.4);
    expect(
        candidateTotemRoll(config.candidates[1], reference).values.bonusdamage
    ).toBe(1);
    expect(parseTotemQuery("", reference)).toEqual({
        config: null,
        notice: "",
    });
});

test.each([
    { ...config, formatVersion: 2 },
    { ...config, targetStat: "__proto__" },
    { ...config, unknown: true },
    { ...config, budget: "-1" },
    { ...config, budget: "9007199254740992" },
    { ...config, baseline: { id: -1, values: {} } },
    { ...config, baseline: { id: 1, values: { life: "1".repeat(65) } } },
    { ...config, baseline: { id: 1, values: { invented: "2" } } },
    {
        ...config,
        candidates: [...config.candidates, sourceTotemCandidate(handkerchief)],
    },
    { ...config, candidates: [config.candidates[0], config.candidates[0]] },
    {
        ...config,
        candidates: [{ ...config.candidates[0], values: { bonusdamage: "1" } }],
    },
])("invalid bounded input is rejected without coercion", invalid => {
    expect(parse(invalid).config).toBeNull();
    expect(buildTotemShare(invalid as TotemConfig).path).toBeNull();
});

test("unknown IDs/version changes retain old actual values rather than deleting candidates", () => {
    const modified = {
        ...config,
        snapshotVersion: `1:${"a".repeat(64)}`,
        baseline: { id: 999999999, values: { bonusdamage: "0.3" } },
    };
    const parsed = parse(modified);
    expect(parsed.config).toEqual(modified);
    expect(parsed.notice).toContain("현재 범위");
    expect(parsed.notice).toContain("999999999");
    expect(
        parseTotemStorage(
            serializeTotemStorage(modified.baseline, reference),
            reference
        ).baseline
    ).toEqual(modified.baseline);
    const missing = {
        kind: "manual" as const,
        id: 999999999,
        key: "missing",
        values: { bonusdamage: "0.4" },
        price: "",
    };
    expect(candidateTotemRoll(missing, reference)).toMatchObject({
        status: "missing",
        values: { bonusdamage: 0.4 },
    });
});

test("malformed option values and HTML stay plain snapshot strings, never executable or zero", () => {
    const altered = {
        ...config,
        baseline: {
            id: painting.id,
            values: { bonusdamage: "<img src=x onerror=alert(1)>" },
        },
    };
    expect(parse(altered).config?.baseline?.values.bonusdamage).toBe(
        altered.baseline.values.bonusdamage
    );
    const manual: TotemCandidate = {
        kind: "manual",
        id: painting.id,
        key: "bad-value",
        values: altered.baseline.values,
        price: "",
    };
    expect(candidateTotemRoll(manual, reference).values.bonusdamage).toBeNull();
});

test("duplicate query keys, oversized encoded/decoded input, invalid names/dates/options fail", () => {
    const valid = query(config);
    expect(parseTotemQuery(`${valid}&${valid}`, reference).config).toBeNull();
    expect(parseTotemQuery(`${valid}&other=1`, reference).config).toBeNull();
    expect(
        parseTotemQuery("s=" + "x".repeat(TOTEM_QUERY_LIMIT), reference).config
    ).toBeNull();
    expect(
        parseTotemQuery(
            new URLSearchParams({ s: "x".repeat(16385) }),
            reference
        ).config
    ).toBeNull();
    expect(parseTotemQuery("s=%E0%A4%A", reference).config).toBeNull();
    if (live.kind !== "listing") throw new Error("fixture");
    for (const item of [
        { ...live.item, item_name: "x".repeat(101) },
        { ...live.item, item_display_name: "x".repeat(201) },
        { ...live.item, date_auction_expire: "not-a-date" },
        {
            ...live.item,
            item_option: Array.from({ length: 33 }, () => ({
                option_type: "토템 효과",
            })),
        },
        {
            ...live.item,
            item_option: [
                { option_type: "토템 효과", option_desc: "x".repeat(257) },
            ],
        },
    ])
        expect(
            parse({ ...config, candidates: [{ ...live, item }] }).config
        ).toBeNull();
    expect(
        parse({ ...config, candidates: [{ ...live, observedAt: "tomorrow" }] })
            .config
    ).toBeNull();
});

test("oversized listings are not silently shortened; explicit settings-only preserves assumptions", () => {
    if (live.kind !== "listing") throw new Error("fixture");
    const long = {
        ...config,
        candidates: [
            config.candidates[1],
            {
                ...live,
                item: {
                    ...live.item,
                    item_option: Array.from({ length: 32 }, () => ({
                        option_type: "토템 효과",
                        option_desc: "가".repeat(256),
                    })),
                },
            },
        ],
    };
    expect(buildTotemShare(long).path).toBeNull();
    const settings = buildTotemShare(long, true);
    expect(settings.notice).toContain("실제 매물을 제외");
    expect(
        parseTotemQuery(settings.path!.split("?")[1], reference).config
            ?.candidates
    ).toEqual([config.candidates[1]]);
    expect(long.candidates).toHaveLength(2);
    // An exact 8192-character query is accepted; the following character is rejected.
    const base = query({ ...emptyTotemConfig(reference) });
    const padded = base + "&".repeat(TOTEM_QUERY_LIMIT - base.length);
    expect(parseTotemQuery(padded, reference).config).not.toBeNull();
    expect(parseTotemQuery(padded + "&", reference).config).toBeNull();
});

test("storage has its own contract and corrupt/denied storage does not block current comparisons", () => {
    const saved = serializeTotemStorage(config.baseline, reference);
    expect(parseTotemStorage(saved, reference).baseline).toEqual(
        config.baseline
    );
    expect(parseTotemStorage(null, reference)).toEqual({
        baseline: null,
        notice: "",
    });
    for (const raw of ["{", "x".repeat(16385), JSON.stringify(config)])
        expect(parseTotemStorage(raw, reference).notice).toContain("읽지");
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Denied");
    });
    const { result } = renderHook(() => useTotemConfig(reference));
    expect(result.current.ready).toBe(true);
    expect(result.current.config.baseline).toBeNull();
    act(() => {
        result.current.add(sourceTotemCandidate(painting));
    });
    expect(result.current.config.candidates).toHaveLength(1);
});

test("legacy links restore candidates but ignore saved and shared baselines", () => {
    const saved = serializeTotemStorage(config.baseline, reference);
    localStorage.setItem(TOTEM_STORAGE_KEY, saved);
    window.history.replaceState(null, "", buildTotemShare(config).path);
    const { result } = renderHook(() => useTotemConfig(reference));
    expect(result.current.config).toEqual({ ...config, baseline: null });
    expect(result.current.historicalKeys).toEqual([live.key]);
    act(() => {
        window.history.replaceState(
            null,
            "",
            buildTotemShare({ ...config, budget: "100" }).path
        );
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.config.baseline).toBeNull();
    expect(result.current.config.budget).toBe("100");
    expect(localStorage.getItem(TOTEM_STORAGE_KEY)).toBe(saved);
});

test("same-page anchor navigation never clears unsaved baseline or candidates", () => {
    const { result } = renderHook(() => useTotemConfig(reference));
    act(() => result.current.setConfig(config));
    act(() => {
        window.history.pushState(null, "", "#totem-comparison");
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.config).toEqual(config);
    act(() => {
        window.history.replaceState(null, "", "#totem-selected");
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.config).toEqual(config);
});

test("four independent candidates survive configuration changes; fifth is refused", () => {
    const { result } = renderHook(() => useTotemConfig(reference));
    act(() => result.current.setConfig(config));
    act(() => {
        result.current.add(sourceTotemCandidate(handkerchief));
    });
    expect(result.current.config.candidates).toEqual(config.candidates);
    expect(result.current.notice).toContain("최대 4개");
    act(() =>
        result.current.setConfig(c => ({
            ...c,
            budget: "1",
            targetStat: "life",
        }))
    );
    expect(result.current.config.candidates).toHaveLength(4);
    act(() => result.current.remove(live.key));
    expect(result.current.config.candidates).toHaveLength(3);
    act(() => result.current.remove());
    expect(result.current.config.candidates).toHaveLength(0);
});

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => {
        resolve = r;
    });
    return { promise, resolve };
}

test("market hook loads only on demand, cancels old targets and preserves previous observations on failure", async () => {
    const first = deferred<{ ok: boolean; json: () => Promise<unknown> }>();
    const fetchMock = jest
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockResolvedValueOnce({
            ok: true,
            json: () =>
                Promise.resolve({
                    items: [],
                    hasMore: true,
                    nextCursor: "next",
                }),
        });
    global.fetch = fetchMock;
    Object.defineProperty(crypto, "randomUUID", {
        configurable: true,
        value: () => "request-id",
    });
    const { result, rerender, unmount } = renderHook(
        ({ target }) => useTotemMarket(target),
        { initialProps: { target: painting } }
    );
    expect(fetchMock).not.toHaveBeenCalled();
    let oldRequest!: Promise<void>;
    act(() => {
        oldRequest = result.current.load();
    });
    act(() => {
        void result.current.load();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const oldSignal = (
        fetchMock.mock.calls[0] as [string, { signal: AbortSignal }]
    )[1].signal;
    rerender({ target: handkerchief });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
        await result.current.load();
    });
    expect(result.current.result?.name).toBe(handkerchief.name);
    await act(async () => {
        first.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [row], hasMore: false }),
        });
        await oldRequest;
    });
    expect(result.current.result?.name).toBe(handkerchief.name);
    const previous = result.current.result;
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
        await result.current.load();
    });
    expect(result.current.result).toBe(previous);
    expect(result.current.error).toContain("offline");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    unmount();
});

test("add reports actual acceptance even for multiple calls in one update batch", () => {
    const { result } = renderHook(() => useTotemConfig(reference));
    act(() => {
        expect(result.current.add(config.candidates[0])).toBe(true);
        expect(result.current.add(config.candidates[0])).toBe(false);
        for (const candidate of config.candidates.slice(1))
            expect(result.current.add(candidate)).toBe(true);
        expect(result.current.add(sourceTotemCandidate(handkerchief))).toBe(
            false
        );
    });
    expect(result.current.config.candidates).toEqual(config.candidates);
    act(() => {
        result.current.remove();
        expect(result.current.add(config.candidates[0])).toBe(true);
    });
    expect(result.current.config.candidates).toEqual([config.candidates[0]]);
});
