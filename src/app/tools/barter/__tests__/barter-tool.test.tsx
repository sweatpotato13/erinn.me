import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";

import BarterTool from "@/app/tools/barter/barter-tool";
import raw from "@/data/barter-reference.json";
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
const now = Date.parse("2026-09-10T08:00:00+09:00");
const good = data.goods.find(g => g.key === "fixed:201:20101")!;
const quote = {
    minPrice: 100,
    averagePrice: 120,
    availableQuantity: 2,
    isComplete: false,
    fetchedAt: "2026-09-10T00:00:00Z",
};
const input = (name: string, value: string) =>
    fireEvent.change(screen.getByRole("textbox", { name }), {
        target: { value },
    });
const saved = () => JSON.parse(localStorage.getItem(BARTER_STORAGE_KEY)!);
beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "/tools/barter");
    jest.spyOn(Date, "now").mockReturnValue(now);
    prices.mockReset();
    prices.mockResolvedValue(quote);
});
afterEach(() => jest.restoreAllMocks());

test("preparation is local, stock is allocated once, and checks never consume inventory", () => {
    render(<BarterTool data={data} />);
    input("우드 테이블 추가 교환", "3");
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
    fireEvent.click(screen.getByRole("button", { name: "실제 교환으로 기록" }));
    fireEvent.click(screen.getByRole("button", { name: "교환 기록 확인" }));
    expect(saved().rows[0]).toMatchObject({ q: "0", used: "3" });
    expect(saved().owned).toEqual(stock);
    fireEvent.click(screen.getByRole("button", { name: "교환 기록 되돌리기" }));
    expect(saved().rows[0]).toMatchObject({ q: "3", used: "0" });
    fireEvent.click(screen.getByRole("button", { name: "계획 비우기" }));
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
    input("우드 테이블 추가 교환", "3");
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
    input("우드 테이블 추가 교환", "2");
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
    input("테스트 교역품 추가 교환", "1");
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
    input("우드 테이블 추가 교환", "4");
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
        screen.getByRole("textbox", { name: "우드 테이블 추가 교환" })
    ).toBeDisabled();
    expect(saved().rows[0].used).toBe("10");
    fireEvent.click(screen.getByRole("button", { name: "이번 주로 전환" }));
    expect(saved().rows[0]).toMatchObject({ q: "3", used: "0" });
    expect(saved().owned).toEqual(previous.owned);
    expect(saved().prices).toEqual(previous.prices);
});

test("corrupt storage and invalid drafts are preserved, and unavailable storage stays usable", () => {
    localStorage.setItem(BARTER_STORAGE_KEY, "broken original");
    const { unmount } = render(<BarterTool data={data} />);
    input("우드 테이블 추가 교환", "3");
    expect(localStorage.getItem(BARTER_STORAGE_KEY)).toBe("broken original");
    expect(screen.getByRole("textbox", { name: "원래 저장 내용" })).toHaveValue(
        "broken original"
    );
    fireEvent.click(
        screen.getByRole("button", {
            name: "시즌 교역품 직접 입력",
        })
    );
    input("교역품 이름", "입력 보존");
    fireEvent.click(screen.getByRole("button", { name: "직접 입력 적용" }));
    expect(screen.getByRole("textbox", { name: "교역품 이름" })).toHaveValue(
        "입력 보존"
    );
    unmount();
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("unavailable");
    });
    render(<BarterTool data={data} />);
    input("우드 테이블 추가 교환", "2");
    expect(
        screen.getByRole("article", { name: "실리엔 재료" })
    ).toHaveTextContent("필요 4");
});

test("failed/empty price lookup keeps the previous observation and manual values", async () => {
    prices
        .mockResolvedValueOnce({ ...quote, availableQuantity: 0, minPrice: 0 })
        .mockRejectedValueOnce(new Error("offline"));
    render(<BarterTool data={data} />);
    input("우드 테이블 추가 교환", "1");
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
