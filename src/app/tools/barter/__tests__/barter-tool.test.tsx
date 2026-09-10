import {
    act,
    fireEvent,
    render,
    renderHook,
    screen,
    waitFor,
    within,
} from "@testing-library/react";

import {
    useBarterMaterials,
    useBarterPlan,
} from "@/app/tools/barter/barter-hooks";
import BarterTool from "@/app/tools/barter/barter-tool";
import raw from "@/data/barter-reference.json";
import { useMaterialMarket } from "@/hooks/use-material-market";
import { fetchItemPriceSummary } from "@/lib/api/auction";
import { type BarterReference, emptyBarterRow } from "@/lib/barter";
import {
    BARTER_STORAGE_KEY,
    buildBarterShare,
    emptyBarterPlan,
    serializeBarterStorage,
    updateBarterRow,
} from "@/lib/barter-state";

jest.mock("@/lib/api/auction", () => ({ fetchItemPriceSummary: jest.fn() }));
const prices = jest.mocked(fetchItemPriceSummary);
const data = raw as BarterReference;

test("shared market lookup rejects an oversized click without launching requests", async () => {
    const names = Array.from({ length: 101 }, (_, i) => `item-${i}`);
    const { result } = renderHook(() => useMaterialMarket(names, jest.fn(), 0));
    await act(() => result.current.load());
    expect(result.current.errors.request).toContain("100종");
    expect(prices).not.toHaveBeenCalled();
});
const now = Date.parse("2026-09-10T08:00:00+09:00");
const good = data.goods.find(g => g.key === "fixed:201:20101")!;
const quote = {
    minPrice: 100,
    averagePrice: 120,
    availableQuantity: 2,
    isComplete: false,
    fetchedAt: "2026-09-10T00:00:00Z",
};
const input = (name: string, value: string) => {
    const field = screen.getByLabelText(name);
    const details = field.closest("details");
    if (details && !details.open)
        fireEvent.click(details.querySelector("summary")!);
    fireEvent.change(field, { target: { value } });
};
const openRecord = () =>
    fireEvent.click(screen.getByText("교환을 마쳤나요? · 교환 기록"));
const saved = () => JSON.parse(localStorage.getItem(BARTER_STORAGE_KEY)!);
beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "/tools/barter");
    jest.spyOn(Date, "now").mockReturnValue(now);
    prices.mockReset();
    prices.mockResolvedValue(quote);
});
afterEach(() => jest.restoreAllMocks());

test.each([
    ["network", "재료 확인 실패"],
    ["schema", "재료 확인 실패"],
    ["http", "재료 목록을 불러오지 못했습니다."],
    ["version", "참조 데이터가 변경되었습니다. 페이지를 새로 열어 주세요."],
    ["batch", "한 계획의 재료 ID는 1,000개까지 확인할 수 있습니다."],
])(
    "material lookup exposes only domain messages: %s",
    async (failure, message) => {
        const originalFetch = global.fetch;
        const request = jest.fn(() => {
            if (failure === "network")
                return Promise.reject(
                    new TypeError("Failed to fetch internal URL")
                );
            return Promise.resolve({
                ok: failure !== "http",
                json: () =>
                    Promise.resolve(
                        failure === "schema"
                            ? { unexpected: "raw schema data" }
                            : {
                                  version: "fixture",
                                  sourceVersion: data.sourceVersion + 1,
                                  materials: [],
                                  hasMore: false,
                              }
                    ),
            } as Response);
        });
        global.fetch = request;
        try {
            const plan = {
                ...emptyBarterPlan(data, now),
                rows: [
                    {
                        ...emptyBarterRow(good),
                        good: {
                            ...good,
                            groups: Array.from(
                                { length: failure === "batch" ? 1001 : 1 },
                                (_, i) => [{ itemId: 9000000 + i, count: 1 }]
                            ),
                        },
                    },
                ],
            };
            const { result, unmount } = renderHook(() =>
                useBarterMaterials(data, plan)
            );
            await waitFor(() => expect(result.current.error).toBe(message));
            expect(result.current.pending).toBe(false);
            if (failure === "batch") expect(request).not.toHaveBeenCalled();
            unmount();
        } finally {
            global.fetch = originalFetch;
        }
    }
);

test("weekly selection uses its action time when a season expires mid-action", () => {
    const period = { ...data.season!.period, endAt: now + 1 };
    const seasonalData = {
        ...data,
        season: {
            ...data.season!,
            period,
            goods: data.season!.goods.map(good => ({ ...good, period })),
        },
    };
    render(<BarterTool data={seasonalData} />);
    jest.mocked(Date.now)
        .mockReturnValue(now + 1)
        .mockReturnValueOnce(now);
    fireEvent.click(screen.getByRole("button", { name: "이번 주 전체 담기" }));
    for (const good of seasonalData.season.goods)
        expect(saved().rows).toContainEqual(
            expect.objectContaining({
                good: expect.objectContaining({ key: good.key }),
                q: String(good.limit),
            })
        );
});

test("preparation is local, stock is allocated once, and checks never consume inventory", () => {
    render(<BarterTool data={data} />);
    input("우드 테이블 준비할 횟수", "3");
    input("새우 조련 미끼 보유 수량", "5");
    input("실리엔 보유 수량", "2");
    input("새우 조련 미끼 단가 (Gold)", "100");
    input("실리엔 단가 (Gold)", "200");
    expect(screen.getByLabelText("준비 비용")).toHaveTextContent("2,400 Gold");
    expect(screen.getByLabelText("준비 비용")).toHaveTextContent("1,500 Gold");
    const stock = saved().owned;
    fireEvent.click(
        screen.getByRole("checkbox", { name: "새우 조련 미끼 준비 완료" })
    );
    expect(saved().owned).toEqual(stock);
    expect(prices).not.toHaveBeenCalled();
    openRecord();
    fireEvent.click(screen.getByRole("button", { name: "실제 교환으로 기록" }));
    fireEvent.click(screen.getByRole("button", { name: "교환 기록 확인" }));
    expect(saved().rows[0]).toMatchObject({ q: "0", used: "3" });
    expect(saved().owned).toEqual(stock);
    fireEvent.click(screen.getByRole("button", { name: "교환 기록 되돌리기" }));
    expect(saved().rows[0]).toMatchObject({ q: "3", used: "0" });
    fireEvent.click(screen.getByRole("button", { name: "선택 비우기" }));
    expect(saved().owned).toEqual(stock);
    expect(prices).not.toHaveBeenCalled();
});

test("late market results preserve manual zero/empty overrides and expose partial availability", async () => {
    let release!: (value: typeof quote) => void;
    prices.mockImplementationOnce(
        () =>
            new Promise(resolve => {
                release = resolve;
            })
    );
    render(<BarterTool data={data} />);
    input("우드 테이블 준비할 횟수", "3");
    fireEvent.click(
        screen.getByRole("button", { name: "부족한 재료 시세 조회" })
    );
    expect(prices).toHaveBeenCalledTimes(2);
    input("새우 조련 미끼 단가 (Gold)", "0");
    await act(async () => {
        release(quote);
        await Promise.resolve();
    });
    expect(
        screen.getByRole("textbox", { name: "새우 조련 미끼 단가 (Gold)" })
    ).toHaveValue("0");
    expect(
        screen.getAllByText(/부분 조회 · 관측 수량 2 · 관측 수량 부족/)
    ).toHaveLength(2);
    input("새우 조련 미끼 단가 (Gold)", "");
    input("우드 테이블 준비할 횟수", "2");
    expect(prices).toHaveBeenCalledTimes(2);
    expect(
        screen.getByRole("textbox", { name: "새우 조련 미끼 단가 (Gold)" })
    ).toHaveValue("");
    const row = within(
        screen.getByRole("article", { name: "새우 조련 미끼 재료" })
    );
    expect(
        new URL(
            row.getByRole("link").getAttribute("href")!,
            "https://erinn.me"
        ).searchParams.get("q")
    ).toBe("새우 조련 미끼");
});

test("market requests deduplicate names, run at most three at once, and stop after cancellation", async () => {
    const materials = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        name: `재료${Math.min(i, 5)}`,
        searchable: true,
        ambiguous: false,
    }));
    const synthetic = {
        ...data,
        season: null,
        materials,
        goods: [
            {
                ...good,
                name: "테스트 교역품",
                groups: materials.map(m => [{ itemId: m.id, count: 1 }]),
            },
        ],
    };
    const pending: ((value: typeof quote) => void)[] = [];
    prices.mockImplementation(
        () => new Promise(resolve => pending.push(resolve))
    );
    render(<BarterTool data={synthetic} />);
    input("테스트 교역품 준비할 횟수", "1");
    fireEvent.click(
        screen.getByRole("button", { name: "부족한 재료 시세 조회" })
    );
    expect(prices).toHaveBeenCalledTimes(3);
    await act(async () => {
        pending.splice(0).forEach(resolve => resolve(quote));
        await Promise.resolve();
    });
    await waitFor(() => expect(prices).toHaveBeenCalledTimes(6));
    fireEvent.click(screen.getByRole("button", { name: "조회 취소" }));
    const before = localStorage.getItem(BARTER_STORAGE_KEY);
    await act(async () => {
        pending.splice(0).forEach(resolve => resolve(quote));
        await Promise.resolve();
    });
    expect(prices).toHaveBeenCalledTimes(6);
    expect(localStorage.getItem(BARTER_STORAGE_KEY)).toBe(before);
});

test("received shares remain temporary through edits and only explicit import replaces storage", () => {
    const local = updateBarterRow(emptyBarterPlan(data, now), {
        ...emptyBarterRow(good),
        q: "1",
    });
    const shared = updateBarterRow(emptyBarterPlan(data, now), {
        ...emptyBarterRow(good),
        q: "3",
    });
    const rawSaved = serializeBarterStorage(local);
    localStorage.setItem(BARTER_STORAGE_KEY, rawSaved);
    window.history.replaceState(null, "", buildBarterShare(shared));
    render(<BarterTool data={data} />);
    input("우드 테이블 준비할 횟수", "4");
    expect(localStorage.getItem(BARTER_STORAGE_KEY)).toBe(rawSaved);
    expect(prices).not.toHaveBeenCalled();
    fireEvent.click(
        screen.getByRole("button", { name: "내 계획으로 가져오기" })
    );
    expect(saved().rows[0].q).toBe("4");
    expect(window.location.search).toBe("");
});

test("week rollover is explicit and preserves quantities and prices", () => {
    const previous = {
        ...updateBarterRow(emptyBarterPlan(data, now - 7 * 86400000), {
            ...emptyBarterRow(good),
            q: "3",
            used: "10",
        }),
        owned: { 50664: "5" },
        prices: { 50664: "100" },
    };
    localStorage.setItem(BARTER_STORAGE_KEY, serializeBarterStorage(previous));
    render(<BarterTool data={data} />);
    expect(
        screen.getByRole("textbox", { name: "우드 테이블 준비할 횟수" })
    ).toBeDisabled();
    expect(saved().rows[0].used).toBe("10");
    fireEvent.click(screen.getByRole("button", { name: "이번 주로 전환" }));
    expect(saved().rows[0]).toMatchObject({ q: "3", used: "0" });
    expect(saved().owned).toEqual(previous.owned);
    expect(saved().prices).toEqual(previous.prices);
});

test("history restoration clears exchange undo from the previous plan", () => {
    render(<BarterTool data={data} />);
    input("우드 테이블 준비할 횟수", "3");
    openRecord();
    fireEvent.click(screen.getByRole("button", { name: "실제 교환으로 기록" }));
    fireEvent.click(screen.getByRole("button", { name: "교환 기록 확인" }));
    expect(
        screen.getByRole("button", { name: "교환 기록 되돌리기" })
    ).toBeEnabled();
    const shared = updateBarterRow(emptyBarterPlan(data, now), {
        ...emptyBarterRow(good),
        q: "7",
        used: "2",
    });
    act(() => {
        window.history.pushState(null, "", buildBarterShare(shared));
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(
        screen.getByRole("textbox", { name: "우드 테이블 준비할 횟수" })
    ).toHaveValue("7");
    expect(
        screen.queryByRole("button", { name: "교환 기록 되돌리기" })
    ).not.toBeInTheDocument();
    expect(saved().rows[0]).toMatchObject({ q: "0", used: "3" });
});

test("corrupt storage is preserved and unavailable storage stays usable", () => {
    localStorage.setItem(BARTER_STORAGE_KEY, "broken original");
    const { unmount } = render(<BarterTool data={data} />);
    input("우드 테이블 준비할 횟수", "3");
    expect(localStorage.getItem(BARTER_STORAGE_KEY)).toBe("broken original");
    expect(screen.getByLabelText("원래 저장 내용")).toHaveValue(
        "broken original"
    );
    unmount();
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("unavailable");
    });
    render(<BarterTool data={data} />);
    input("우드 테이블 준비할 횟수", "2");
    expect(
        screen.getByRole("article", { name: "실리엔 재료" })
    ).toHaveTextContent("필요 4");
});

test("failed/empty price lookup keeps the previous observation and manual values", async () => {
    prices
        .mockResolvedValueOnce({ ...quote, availableQuantity: 0, minPrice: 0 })
        .mockRejectedValueOnce(new Error("offline"));
    render(<BarterTool data={data} />);
    input("우드 테이블 준비할 횟수", "1");
    input("실리엔 단가 (Gold)", "300");
    fireEvent.click(
        screen.getByRole("button", { name: "부족한 재료 시세 조회" })
    );
    await waitFor(() =>
        expect(screen.getByText(/조회 실패/)).toBeInTheDocument()
    );
    expect(screen.getByText(/매물 없음/)).toBeInTheDocument();
    expect(
        screen.getByRole("textbox", { name: "새우 조련 미끼 단가 (Gold)" })
    ).toHaveValue("");
    expect(
        screen.getByRole("textbox", { name: "실리엔 단가 (Gold)" })
    ).toHaveValue("300");
});

test("one-click weekly selection includes all four sixth-tier goods while prior exchanges stay optional", () => {
    render(<BarterTool data={data} />);
    expect(
        screen.queryByRole("button", { name: "시즌 교역품 직접 입력" })
    ).not.toBeInTheDocument();
    const seasonal = within(
        screen.getByRole("region", { name: "이달의 6티어" })
    );
    for (const good of data.season!.goods) {
        const checkbox = seasonal.getByRole("checkbox", {
            name: `${good.name} 주간분 담기`,
        });
        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(
            seasonal.getByRole("textbox", { name: `${good.name} 준비할 횟수` })
        ).toHaveValue(String(good.limit));
    }
    expect(screen.getAllByRole("article", { name: /재료$/ })).toHaveLength(9);
    expect(screen.getByLabelText("준비 비용")).toHaveTextContent(
        "가격 확인 필요"
    );
    expect(
        screen.getByLabelText("우드 테이블 이미 교환한 횟수").closest("details")
    ).not.toHaveAttribute("open");
    input("우드 테이블 이미 교환한 횟수", "5");
    fireEvent.click(
        screen.getByRole("checkbox", { name: "우드 테이블 주간분 담기" })
    );
    expect(screen.getByLabelText("우드 테이블 준비할 횟수")).toHaveValue("20");
    fireEvent.click(
        screen.getByRole("button", { name: "우드 테이블 준비 횟수 줄이기" })
    );
    expect(screen.getByLabelText("우드 테이블 준비할 횟수")).toHaveValue("19");
    fireEvent.click(screen.getByRole("button", { name: "이번 주 전체 담기" }));
    expect(
        saved().rows.filter((row: { q: string }) => Number(row.q) > 0)
    ).toHaveLength(32);
    fireEvent.click(screen.getByRole("button", { name: "스카하 제외 담기" }));
    const selected = saved().rows.filter(
        (row: { q: string }) => Number(row.q) > 0
    );
    expect(selected).toHaveLength(24);
    expect(
        selected.every(
            (row: { good: { postId: number } }) => row.good.postId !== 9
        )
    ).toBe(true);
    for (const good of data.season!.goods) {
        expect(selected).toContainEqual(
            expect.objectContaining({
                good: expect.objectContaining({ key: good.key }),
                q: String(good.limit),
            })
        );
    }
    expect(screen.getByLabelText("우드 테이블 준비할 횟수")).toHaveValue("20");
    expect(prices).not.toHaveBeenCalled();
});

test("restoring barter rejects a late callback before effects cancel requests", () => {
    const { result } = renderHook(() => useBarterPlan(data));
    const staleUpdate = result.current.update;
    const saved = { ...emptyBarterPlan(data, now), owned: { 1: "20" } };
    localStorage.setItem(BARTER_STORAGE_KEY, serializeBarterStorage(saved));
    act(() => {
        result.current.openSaved();
        staleUpdate(p => ({ ...p, owned: { 1: "999" } }));
    });
    expect(result.current.plan.owned).toEqual({ 1: "20" });
    expect(JSON.parse(localStorage.getItem(BARTER_STORAGE_KEY)!).owned).toEqual(
        { 1: "20" }
    );
});
