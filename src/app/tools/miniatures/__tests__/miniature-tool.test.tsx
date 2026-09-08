import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";

import MiniatureTool from "@/app/tools/miniatures/miniature-tool";
import { fetchItemPriceSummary } from "@/lib/api/auction";
import type { Miniature, MiniatureReference } from "@/lib/miniatures";
import {
    defaultMiniatureConfig,
    MINIATURE_STORAGE_KEY,
} from "@/lib/miniatures-state";

let query = "";
jest.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(query),
}));
jest.mock("@/lib/api/auction", () => ({ fetchItemPriceSummary: jest.fn() }));
const priceFetch = jest.mocked(fetchItemPriceSummary);
const makeItem = (
    id: number,
    effects: Record<string, number>,
    extra = false
): Miniature => ({
    id,
    itemId: id + 100,
    name: `후보 ${id}`,
    itemName: `판매명 ${id}`,
    description: "안전한 설명",
    extra,
    effects,
    searchable: true,
});
const data: MiniatureReference = {
    version: `1788405829:${"a".repeat(64)}`,
    sourceVersion: 1788405829,
    collectedAt: "2026-09-05T00:00:00Z",
    coverage: ["FutureStat"],
    miniatures: [
        makeItem(1, { AttackMax: 5, MagicAttack: 2 }),
        makeItem(2, { AttackMax: 3, MagicAttack: 7 }),
        makeItem(3, { AttackMax: 2 }, true),
        makeItem(4, { AttackMax: 6 }),
        makeItem(5, { AttackMax: 8 }),
        {
            ...makeItem(6, { FutureStat: 2, Protect: 1 }),
            searchable: false,
            description: "<script>세트 설명</script>",
        },
        { ...makeItem(7, { AttackMax: 9 }), itemId: 105, itemName: "판매명 5" },
    ],
};
const stored = (ids: number[]) =>
    JSON.stringify({
        formatVersion: 1,
        snapshotVersion: data.version,
        installedIds: ids,
    });
const market = {
    minPrice: 300,
    averagePrice: 400,
    availableQuantity: 2,
    isComplete: false,
    fetchedAt: "2026-09-08T00:00:00Z",
};
const row = (id: number) =>
    within(screen.getByRole("article", { name: `후보 ${id}` }));
const add = (id: number) =>
    fireEvent.click(row(id).getByRole("button", { name: "비교 추가" }));
const detail = (id: number) =>
    within(screen.getByRole("article", { name: `후보 ${id} 가격 비교` }));
function mount() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const element = (
        <QueryClientProvider client={client}>
            <MiniatureTool data={data} />
        </QueryClientProvider>
    );
    return { ...render(element), client, element };
}
function openDetails() {
    fireEvent.click(screen.getAllByRole("button", { name: "상세 비교" })[0]);
}

beforeEach(() => {
    query = "";
    localStorage.clear();
    priceFetch.mockReset();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

test("preview, comparison, independent filters and installation stay separate; four maximum", () => {
    localStorage.setItem(MINIATURE_STORAGE_KEY, stored([1, 2, 3]));
    mount();
    fireEvent.click(row(5).getByRole("button", { name: "미리보기" }));
    const preview = within(
        screen.getByRole("region", { name: "구매 후 효과 미리보기" })
    );
    expect(preview.getByText(/\+3 증가/)).toBeInTheDocument();
    expect(
        JSON.parse(localStorage.getItem(MINIATURE_STORAGE_KEY)!).installedIds
    ).toEqual([1, 2, 3]);
    add(4);
    add(5);
    expect(
        within(screen.getByRole("region", { name: "함께 설치하면" })).getByText(
            /\+3/
        )
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("미니어처 검색"), {
        target: { value: "존재하지않음" },
    });
    expect(
        screen.getByRole("button", { name: "후보 4 비교 제거" })
    ).toBeInTheDocument();
    expect(
        preview.getByText("현재 검색 결과 밖의 후보입니다.")
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("미니어처 검색"), {
        target: { value: "" },
    });
    add(1);
    add(2);
    add(3);
    expect(screen.getByRole("status")).toHaveTextContent("최대 4개");
    fireEvent.click(screen.getByRole("button", { name: "설치 목록 편집" }));
    fireEvent.click(screen.getByText("설치된 미니어처 목록"));
    fireEvent.click(
        within(screen.getByRole("group", { name: "설치 목록 종류" })).getByRole(
            "button",
            { name: "엑스트라" }
        )
    );
    expect(preview.getByText(/\+3 증가/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "설치 목록 초기화" }));
    expect(localStorage.getItem(MINIATURE_STORAGE_KEY)).toBeNull();
    expect(priceFetch).not.toHaveBeenCalled();
});

test("explicit bounded deduplicated lookup preserves zero/blank edits and late selection changes", async () => {
    let resolve!: (value: typeof market) => void;
    priceFetch.mockImplementation(
        () =>
            new Promise(r => {
                resolve = r;
            })
    );
    mount();
    add(5);
    add(7);
    add(6);
    openDetails();
    expect(priceFetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "가격 조회" }));
    await waitFor(() => expect(priceFetch).toHaveBeenCalledTimes(1));
    expect(priceFetch).toHaveBeenCalledWith(
        "판매명 5",
        expect.any(AbortSignal)
    );
    fireEvent.change(detail(5).getByRole("textbox"), {
        target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "후보 7 비교 제거" }));
    await act(async () => {
        resolve(market);
        await Promise.resolve();
    });
    expect(detail(5).getByRole("textbox")).toHaveValue("0");
    expect(detail(5).getByText(/일부 조회/)).toBeInTheDocument();
    expect(detail(5).getByText(/조회 시각/)).toBeInTheDocument();
    expect(detail(6).queryByRole("link")).not.toBeInTheDocument();
    fireEvent.change(detail(5).getByRole("textbox"), { target: { value: "" } });
    priceFetch.mockResolvedValue({ ...market, minPrice: 500 });
    fireEvent.click(screen.getByRole("button", { name: "가격 조회" }));
    await waitFor(() => expect(priceFetch).toHaveBeenCalledTimes(2));
    expect(detail(5).getByRole("textbox")).toHaveValue("");
    fireEvent.click(detail(5).getByRole("button", { name: "조회 가격 사용" }));
    await waitFor(() =>
        expect(detail(5).getByText("500 Gold")).toBeInTheDocument()
    );
});

test("mixed empty/error quotes remain unknown, manual price budget includes boundary only", async () => {
    priceFetch.mockImplementation(name =>
        name === "판매명 4"
            ? Promise.resolve({
                  ...market,
                  minPrice: 0,
                  availableQuantity: 0,
                  fetchedAt: undefined,
              })
            : Promise.reject(new Error("upstream"))
    );
    mount();
    add(4);
    add(5);
    openDetails();
    fireEvent.click(screen.getByRole("button", { name: "가격 조회" }));
    await waitFor(() =>
        expect(detail(5).getByRole("alert")).toHaveTextContent("가격 조회 실패")
    );
    expect(detail(4).getByText(/조회 시각 확인 불가/)).toBeInTheDocument();
    expect(detail(4).getByRole("textbox")).toHaveValue("");
    fireEvent.change(detail(4).getByRole("textbox"), {
        target: { value: "100" },
    });
    fireEvent.change(detail(5).getByRole("textbox"), {
        target: { value: "101" },
    });
    fireEvent.click(screen.getByText("상세 필터"));
    fireEvent.change(screen.getByLabelText("개당 예산 (Gold)"), {
        target: { value: "100" },
    });
    expect(screen.getByRole("article", { name: "후보 4" })).toBeInTheDocument();
    expect(
        screen.queryByRole("article", { name: "후보 5" })
    ).not.toBeInTheDocument();
    expect(
        screen.getByRole("region", { name: "가격 미확인 · 예산 판정 제외" })
    ).toBeInTheDocument();
    expect(
        screen.getByRole("article", { name: "후보 5 가격 비교" })
    ).toBeInTheDocument();
});

test("opening and editing shared baseline never writes the device collection; query changes restore", () => {
    localStorage.setItem(MINIATURE_STORAGE_KEY, stored([1, 2]));
    const config = {
        ...defaultMiniatureConfig(data),
        candidateIds: [5],
        installedIds: [3],
    };
    query = new URLSearchParams({ s: JSON.stringify(config) }).toString();
    const app = mount();
    expect(
        screen.getByRole("heading", { name: /공유된 설치 기준/ })
    ).toBeInTheDocument();
    fireEvent.click(row(4).getByRole("checkbox"));
    expect(localStorage.getItem(MINIATURE_STORAGE_KEY)).toBe(stored([1, 2]));
    query = "";
    app.rerender(
        <QueryClientProvider client={app.client}>
            <MiniatureTool data={data} />
        </QueryClientProvider>
    );
    expect(
        screen.getByRole("heading", { name: /내 설치 현황/ })
    ).toHaveTextContent("2개");
    expect(row(4).getByRole("checkbox")).not.toBeChecked();
    expect(priceFetch).not.toHaveBeenCalled();
});

test("storage denial, safe descriptions/icon fallback, focus and clipboard fallback", async () => {
    const get = jest
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
            throw new Error("denied");
        });
    const set = jest
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
            throw new Error("denied");
        });
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("설치 목록");
    fireEvent.click(row(6).getByRole("checkbox"));
    expect(row(6).getByRole("checkbox")).toBeChecked();
    fireEvent.click(row(6).getByText("효과·설명"));
    expect(row(6).getByText("<script>세트 설명</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
    fireEvent.error(row(6).getByAltText(""));
    expect(row(6).getByLabelText("아이콘 없음")).toBeInTheDocument();
    add(6);
    openDetails();
    await waitFor(() =>
        expect(screen.getByRole("heading", { name: "상세 비교" })).toHaveFocus()
    );
    fireEvent.click(screen.getByRole("button", { name: "상세 비교 닫기" }));
    expect(
        screen.getAllByRole("button", { name: "상세 비교" })[0]
    ).toHaveFocus();
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) },
    });
    fireEvent.click(screen.getByRole("button", { name: "공유" }));
    await waitFor(() =>
        expect(screen.getByText(/직접 복사/)).toBeInTheDocument()
    );
    expect(
        (screen.getByLabelText("공유 링크")).value
    ).toContain("/tools/miniatures?s=");
    get.mockRestore();
    set.mockRestore();
});
