import {
    act,
    fireEvent,
    render,
    renderHook,
    screen,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useRef, useState } from "react";

import { AuctionControls } from "@/app/auction/auction-controls";
import {
    AuctionResults,
    ItemOptionsDialog,
} from "@/app/auction/auction-results";
import {
    FavoritesDialog,
    FavoriteToolbar,
} from "@/app/auction/favorites-dialog";
import type { AuctionItem, AuctionSale } from "@/app/auction/types";
import {
    prepareAuctionResults,
    useAuctionSearch,
} from "@/app/auction/use-auction-search";
import { useAuctionSuggestions } from "@/app/auction/use-auction-suggestions";
import {
    parseStoredFavorites,
    useFavorites,
} from "@/app/auction/use-favorites";
import {
    prepareRecentSales,
    useRecentSales,
} from "@/app/auction/use-recent-sales";
import { categories } from "@/constant/categories";

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(promiseResolve => {
        resolve = promiseResolve;
    });
    return { promise, resolve };
}

function item(name: string, price: number, quantity = 1): AuctionItem {
    return {
        item_name: name,
        item_display_name: name,
        item_count: quantity,
        auction_price_per_unit: price,
        date_auction_expire: "2026-01-01",
        item_option: [],
    };
}

function response(items: AuctionItem[], hasMore = false) {
    return {
        ok: true,
        json: () => Promise.resolve({ items, hasMore }),
    } as Response;
}

function sale(
    id: string,
    price: number,
    quantity = 1,
    date = "2026-08-20T00:00:00Z"
): AuctionSale {
    return {
        item_name: id,
        item_display_name: id,
        item_count: quantity,
        auction_price_per_unit: price,
        date_auction_buy: date,
        auction_buy_id: id,
        item_option: [],
    };
}

function historyResponse(sales: AuctionSale[], hasMore = false) {
    return {
        ok: true,
        json: () => Promise.resolve({ sales, hasMore }),
    } as Response;
}

function suggestionResponse(suggestions: string[]) {
    return {
        ok: true,
        json: () => Promise.resolve({ suggestions }),
    } as Response;
}

describe("parseStoredFavorites", () => {
    it.each([
        ["null input", null],
        ["malformed JSON", "{"],
        ["non-array JSON", JSON.stringify({ itemName: "검" })],
        [
            "an array containing invalid entries",
            JSON.stringify([{ itemName: "검", category: "무기" }, null]),
        ],
    ])("returns an empty array for %s", (_case, value) => {
        expect(parseStoredFavorites(value)).toEqual([]);
    });

    it("preserves valid favorites", () => {
        const favorites = [
            { itemName: "검", category: "무기" },
            { itemName: "포션", category: "소모품" },
        ];
        expect(parseStoredFavorites(JSON.stringify(favorites))).toEqual(
            favorites
        );
    });
});

describe("AuctionControls", () => {
    function controls() {
        const setSearchTerm = jest.fn();
        const setActiveIndex = jest.fn();
        const setIsVisible = jest.fn();
        const suggestions = {
            suggestions: ["첫 번째", "두 번째"],
            activeIndex: 0,
            setActiveIndex,
            isVisible: true,
            setIsVisible,
            activeSuggestionRef: createRef<HTMLButtonElement>(),
        };
        render(
            <AuctionControls
                searchTerm="검색"
                setSearchTerm={setSearchTerm}
                suggestions={suggestions}
                selectedCategory={categories[0]}
                setSelectedCategory={jest.fn()}
                loading={false}
                onSearch={jest.fn()}
            />
        );
        return { setSearchTerm, setActiveIndex, setIsVisible };
    }

    it("supports keyboard navigation and accessible suggestion buttons", async () => {
        const user = userEvent.setup();
        const model = controls();
        const input = screen.getByPlaceholderText("아이템명");
        fireEvent.keyDown(input, { key: "ArrowDown" });
        const update = model.setActiveIndex.mock.calls[0][0];
        expect(update(0)).toBe(1);

        fireEvent.keyDown(input, { key: "Enter" });
        expect(model.setSearchTerm).toHaveBeenCalledWith("첫 번째");
        expect(model.setIsVisible).toHaveBeenCalledWith(false);

        await user.click(screen.getByRole("button", { name: "두 번째" }));
        expect(model.setSearchTerm).toHaveBeenCalledWith("두 번째");
    });

    it("renders category choices as keyboard-focusable buttons", async () => {
        const user = userEvent.setup();
        const setSelectedCategory = jest.fn();
        const suggestions = {
            suggestions: [],
            activeIndex: 0,
            setActiveIndex: jest.fn(),
            isVisible: false,
            setIsVisible: jest.fn(),
            activeSuggestionRef: createRef<HTMLButtonElement>(),
        };
        render(
            <AuctionControls
                searchTerm=""
                setSearchTerm={jest.fn()}
                suggestions={suggestions}
                selectedCategory={categories[0]}
                setSelectedCategory={setSelectedCategory}
                loading={false}
                onSearch={jest.fn()}
            />
        );
        await user.click(
            screen.getByRole("button", { name: categories[1], exact: true })
        );
        expect(setSelectedCategory).toHaveBeenCalledWith(categories[1]);
    });
});

describe("prepareAuctionResults", () => {
    it("calculates listing statistics without mutating the input", () => {
        const items = [
            item("비싼 아이템", 300, 3),
            item("싼 아이템", 100, 1),
            item("중간 아이템", 200, 2),
        ];
        const original = [...items];

        expect(prepareAuctionResults(items)).toEqual({
            items: [items[1], items[2], items[0]],
            summary: {
                lowestUnitPrice: 100,
                medianUnitPrice: 200,
                listingCount: 3,
                totalQuantity: 6,
            },
        });
        expect(items).toEqual(original);
    });

    it("averages the middle two prices without rounding", () => {
        expect(
            prepareAuctionResults([
                item("첫 아이템", 100),
                item("둘째 아이템", 101),
            ]).summary?.medianUnitPrice
        ).toBe(100.5);
    });

    it("removes invalid listings and returns an explicit empty summary", () => {
        const invalidItems = [
            item("가격 없음", 0),
            item("음수 가격", -1),
            item("잘못된 가격", Number.NaN),
            item("수량 없음", 100, 0),
            item("잘못된 수량", 100, Number.NaN),
        ];

        expect(
            prepareAuctionResults([...invalidItems, item("유효", 50, 2)])
        ).toEqual({
            items: [item("유효", 50, 2)],
            summary: {
                lowestUnitPrice: 50,
                medianUnitPrice: 50,
                listingCount: 1,
                totalQuantity: 2,
            },
        });
        expect(prepareAuctionResults(invalidItems)).toEqual({
            items: [],
            summary: null,
        });
    });
});

describe("useAuctionSearch", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        jest.useRealTimers();
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("rejects an empty default-category search without fetching", async () => {
        global.fetch = jest.fn();
        const { result } = renderHook(() => useAuctionSearch());
        await act(async () => result.current.search("", categories[0]));
        expect(fetch).not.toHaveBeenCalled();
        expect(result.current.errorMessage).toBe(
            "아이템명 또는 카테고리를 선택해주세요."
        );
        expect(result.current.loading).toBe(false);
    });

    it("preserves keyword and category requests", async () => {
        const fetchMock = jest.fn().mockResolvedValue(response([]));
        global.fetch = fetchMock;
        const { result } = renderHook(() => useAuctionSearch());
        await act(async () => result.current.search("검", categories[0]));
        expect(fetchMock.mock.calls[0][0]).toBe(
            "/api/auction/keyword-search?keyword=%EA%B2%80"
        );
        await act(async () => result.current.search("", categories[1]));
        expect(fetchMock.mock.calls[1][0]).toContain("auction_item_category=");
    });

    it("sorts loaded prices in both directions", async () => {
        global.fetch = jest
            .fn()
            .mockResolvedValue(
                response([item("비싼 아이템", 20), item("싼 아이템", 10)])
            );
        const { result } = renderHook(() => useAuctionSearch());
        await act(async () => result.current.search("아이템", categories[0]));
        expect(
            result.current.items.map(value => value.auction_price_per_unit)
        ).toEqual([10, 20]);

        act(() => result.current.sortByPrice());
        expect(
            result.current.items.map(value => value.auction_price_per_unit)
        ).toEqual([10, 20]);
        act(() => result.current.sortByPrice());
        expect(
            result.current.items.map(value => value.auction_price_per_unit)
        ).toEqual([20, 10]);
        act(() => result.current.sortByPrice());
        expect(
            result.current.items.map(value => value.auction_price_per_unit)
        ).toEqual([10, 20]);
    });

    it("updates summary metadata for each successful search", async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-08-19T01:00:00.000Z"));
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce(
                response(
                    [item("첫 아이템", 100, 2), item("둘째 아이템", 300, 4)],
                    true
                )
            )
            .mockResolvedValueOnce(response([item("최신 아이템", 500, 3)]));
        const { result } = renderHook(() => useAuctionSearch());

        await act(async () => result.current.search("첫 검색", categories[0]));
        expect(result.current.summary).toEqual({
            lowestUnitPrice: 100,
            medianUnitPrice: 200,
            listingCount: 2,
            totalQuantity: 6,
        });
        expect(result.current.hasMore).toBe(true);
        expect(result.current.refreshedAt).toBe("2026-08-19T01:00:00.000Z");

        jest.setSystemTime(new Date("2026-08-19T02:00:00.000Z"));
        await act(async () =>
            result.current.search("다음 검색", categories[0])
        );
        expect(result.current.summary).toEqual({
            lowestUnitPrice: 500,
            medianUnitPrice: 500,
            listingCount: 1,
            totalQuantity: 3,
        });
        expect(result.current.hasMore).toBe(false);
        expect(result.current.refreshedAt).toBe("2026-08-19T02:00:00.000Z");
    });

    it("clears prior summary metadata while a failing search is pending", async () => {
        const pendingRequest = deferred<Response>();
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce(response([item("이전 결과", 100)], true))
            .mockReturnValueOnce(pendingRequest.promise);
        const log = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const { result } = renderHook(() => useAuctionSearch());

        await act(async () => result.current.search("이전", categories[0]));
        expect(result.current.summary).not.toBeNull();

        let nextSearch!: Promise<void>;
        act(() => {
            nextSearch = result.current.search("실패", categories[0]);
        });
        expect(result.current.summary).toBeNull();
        expect(result.current.hasMore).toBe(false);
        expect(result.current.refreshedAt).toBeNull();

        await act(async () => {
            pendingRequest.resolve({ ok: false } as Response);
            await nextSearch;
        });
        expect(result.current.summary).toBeNull();
        expect(result.current.hasMore).toBe(false);
        expect(result.current.refreshedAt).toBeNull();
        expect(result.current.errorMessage).not.toBeNull();
        expect(log).toHaveBeenCalled();
    });

    it("aborts superseded requests and ignores their stale responses", async () => {
        const oldRequest = deferred<Response>();
        const newRequest = deferred<Response>();
        const fetchMock = jest
            .fn()
            .mockReturnValueOnce(oldRequest.promise)
            .mockReturnValueOnce(newRequest.promise);
        global.fetch = fetchMock;
        const { result } = renderHook(() => useAuctionSearch());

        let oldSearch!: Promise<void>;
        let newSearch!: Promise<void>;
        act(() => {
            oldSearch = result.current.search("이전", categories[0]);
        });
        const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
        act(() => {
            newSearch = result.current.search("최신", categories[0]);
        });
        expect(oldSignal.aborted).toBe(true);

        await act(async () => {
            newRequest.resolve(response([item("최신 결과", 20)], true));
            await newSearch;
        });
        expect(result.current.items[0].item_name).toBe("최신 결과");
        const latestSummary = result.current.summary;
        const latestRefreshedAt = result.current.refreshedAt;
        expect(result.current.hasMore).toBe(true);
        expect(result.current.loading).toBe(false);

        await act(async () => {
            oldRequest.resolve(response([item("이전 결과", 10)]));
            await oldSearch;
        });
        expect(result.current.items[0].item_name).toBe("최신 결과");
        expect(result.current.summary).toEqual(latestSummary);
        expect(result.current.hasMore).toBe(true);
        expect(result.current.refreshedAt).toBe(latestRefreshedAt);
        expect(result.current.loading).toBe(false);
    });

    it("aborts the active request on unmount", () => {
        global.fetch = jest.fn(() => new Promise(() => undefined));
        const { result, unmount } = renderHook(() => useAuctionSearch());
        act(() => void result.current.search("검", categories[0]));
        const signal = jest.mocked(fetch).mock.calls[0][1]?.signal;
        unmount();
        expect(signal?.aborted).toBe(true);
    });
});

describe("prepareRecentSales", () => {
    it.each([
        [0, null],
        [1, null],
        [2, null],
        [3, 200],
        [4, 250],
    ])(
        "applies the three-transaction median threshold to %i sales",
        (count, median) => {
            const sales = [100, 200, 300, 400]
                .slice(0, count)
                .map((price, index) => sale(`sale-${index}`, price, index + 1));
            expect(prepareRecentSales(sales).summary).toEqual({
                transactionCount: count,
                totalQuantity: sales.reduce(
                    (sum, transaction) => sum + transaction.item_count,
                    0
                ),
                medianUnitPrice: median,
            });
        }
    );

    it("filters invalid sales and orders valid sales newest first", () => {
        const newest = sale("newest", 300, 3, "2026-08-20T03:00:00Z");
        const sameTimeA = sale("a", 100, 1, "2026-08-20T02:00:00Z");
        const sameTimeB = sale("b", 200, 2, "2026-08-20T02:00:00Z");
        const valid = [sameTimeB, newest, sameTimeA];
        const invalid = [
            sale("zero-price", 0),
            sale("bad-price", Number.NaN),
            sale("zero-quantity", 100, 0),
            sale("bad-date", 100, 1, "not-a-date"),
            sale("", 100),
        ];
        const input = [...valid, ...invalid];

        expect(
            prepareRecentSales(input).sales.map(
                transaction => transaction.auction_buy_id
            )
        ).toEqual(["newest", "a", "b"]);
        expect(input).toEqual([...valid, ...invalid]);
    });
});

describe("useRecentSales", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        jest.useRealTimers();
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("requests the item name and records successful summary metadata", async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-08-20T04:00:00Z"));
        const fetchMock = jest
            .fn()
            .mockResolvedValue(
                historyResponse([
                    sale("one", 100, 1),
                    sale("two", 200, 2),
                    sale("three", 300, 3),
                ])
            );
        global.fetch = fetchMock;
        const { result } = renderHook(() => useRecentSales());

        await act(async () => result.current.search(" 한글+&雪 "));
        expect(fetchMock.mock.calls[0][0]).toBe(
            "/api/auction/history?item_name=%ED%95%9C%EA%B8%80%2B%26%E9%9B%AA"
        );
        expect(result.current.summary).toEqual({
            transactionCount: 3,
            totalQuantity: 6,
            medianUnitPrice: 200,
        });
        expect(result.current.refreshedAt).toBe("2026-08-20T04:00:00.000Z");
        expect(result.current.queriedItemName).toBe("한글+&雪");
        expect(result.current.loading).toBe(false);
    });

    it("clears recent sales without fetching for a blank item name", async () => {
        global.fetch = jest
            .fn()
            .mockResolvedValue(historyResponse([sale("old", 100)]));
        const { result } = renderHook(() => useRecentSales());
        await act(async () => result.current.search("old"));
        await act(async () => result.current.search("   "));
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(result.current.sales).toEqual([]);
        expect(result.current.summary).toBeNull();
        expect(result.current.queriedItemName).toBeNull();
        expect(result.current.refreshedAt).toBeNull();
    });

    it("aborts superseded requests and ignores stale responses", async () => {
        const oldRequest = deferred<Response>();
        const newRequest = deferred<Response>();
        const fetchMock = jest
            .fn()
            .mockReturnValueOnce(oldRequest.promise)
            .mockReturnValueOnce(newRequest.promise);
        global.fetch = fetchMock;
        const { result, unmount } = renderHook(() => useRecentSales());

        let oldSearch!: Promise<void>;
        let newSearch!: Promise<void>;
        act(() => {
            oldSearch = result.current.search("old");
        });
        const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
        act(() => {
            newSearch = result.current.search("new");
        });
        expect(oldSignal.aborted).toBe(true);
        await act(async () => {
            newRequest.resolve(historyResponse([sale("new", 300)]));
            await newSearch;
        });
        await act(async () => {
            oldRequest.resolve(historyResponse([sale("old", 100)]));
            await oldSearch;
        });
        expect(result.current.sales[0].auction_buy_id).toBe("new");
        const latestSignal = fetchMock.mock.calls[1][1].signal as AbortSignal;
        unmount();
        expect(latestSignal.aborted).toBe(false);
    });

    it("keeps failures in the recent-sales state", async () => {
        const log = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        global.fetch = jest.fn().mockResolvedValue({ ok: false } as Response);
        const { result } = renderHook(() => useRecentSales());
        await act(async () => result.current.search("failed"));
        expect(result.current.errorMessage).toBe(
            "최근 완료 거래를 불러오는 중 오류가 발생했습니다."
        );
        expect(result.current.summary).toBeNull();
        expect(log).toHaveBeenCalled();
    });

    it("aborts the active recent-sales request on unmount", () => {
        global.fetch = jest.fn(() => new Promise(() => undefined));
        const { result, unmount } = renderHook(() => useRecentSales());
        act(() => void result.current.search("active"));
        const signal = jest.mocked(fetch).mock.calls[0][1]?.signal;
        unmount();
        expect(signal?.aborted).toBe(true);
    });
});

describe("useAuctionSuggestions", () => {
    const originalFetch = global.fetch;

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        jest.useRealTimers();
        global.fetch = originalFetch;
    });

    it("aborts superseded suggestions and ignores stale results", async () => {
        const oldRequest = deferred<Response>();
        const newRequest = deferred<Response>();
        const fetchMock = jest
            .fn()
            .mockReturnValueOnce(oldRequest.promise)
            .mockReturnValueOnce(newRequest.promise);
        global.fetch = fetchMock;
        const { result, rerender, unmount } = renderHook(
            ({ term }) => useAuctionSuggestions(term),
            { initialProps: { term: "이전" } }
        );

        act(() => jest.advanceTimersByTime(300));
        const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
        rerender({ term: "최신" });
        expect(oldSignal.aborted).toBe(true);
        act(() => jest.advanceTimersByTime(300));

        await act(async () => {
            oldRequest.resolve(suggestionResponse(["이전 결과"]));
            newRequest.resolve(suggestionResponse(["최신 결과"]));
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current.suggestions).toEqual(["최신 결과"]);
        const newSignal = fetchMock.mock.calls[1][1].signal as AbortSignal;
        unmount();
        expect(newSignal.aborted).toBe(true);
    });

    it("does not request suggestions for a short search term", () => {
        global.fetch = jest.fn();
        const { result } = renderHook(() => useAuctionSuggestions("한"));
        act(() => jest.advanceTimersByTime(300));
        expect(fetch).not.toHaveBeenCalled();
        expect(result.current.suggestions).toEqual([]);
        expect(result.current.isVisible).toBe(false);
    });

    it("scrolls the active suggestion through its React ref", () => {
        global.fetch = jest.fn();
        const scrollIntoView = jest.fn();
        const button = document.createElement("button");
        button.scrollIntoView = scrollIntoView;
        const { result } = renderHook(() => useAuctionSuggestions(""));
        result.current.activeSuggestionRef.current = button;
        act(() => result.current.setActiveIndex(1));
        expect(scrollIntoView).toHaveBeenCalledWith({
            block: "nearest",
            behavior: "smooth",
        });
    });
});

describe("useFavorites", () => {
    afterEach(() => jest.restoreAllMocks());

    it("survives storage read and write failures", () => {
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full");
        });
        const { result } = renderHook(() => useFavorites());
        expect(result.current.favorites).toEqual([]);
        act(() => result.current.add("검", categories[0]));
        expect(result.current.favorites).toEqual([
            { itemName: "검", category: categories[0] },
        ]);
    });

    it("rejects an empty favorite without persisting it", () => {
        const alert = jest.spyOn(window, "alert").mockImplementation();
        const setItem = jest.spyOn(Storage.prototype, "setItem");
        const { result } = renderHook(() => useFavorites());
        act(() => result.current.add("", categories[0]));
        expect(alert).toHaveBeenCalledWith("아이템 이름을 입력해주세요.");
        expect(setItem).not.toHaveBeenCalled();
    });
});

describe("AuctionResults", () => {
    const baseProps = {
        currentPage: 1,
        sortDirection: null,
        summary: null,
        hasMore: false,
        refreshedAt: null,
        errorMessage: null,
        loading: false,
        onSort: jest.fn(),
        onItemClick: jest.fn(),
        setCurrentPage: jest.fn(),
    } as const;

    it("does not render or mutate pagination for empty results", () => {
        render(<AuctionResults {...baseProps} items={[]} />);
        expect(screen.getByText("결과가 없습니다.")).toBeInTheDocument();
        expect(
            screen.queryByRole("region", { name: "현재 검색 결과 요약" })
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText("다음 페이지")).not.toBeInTheDocument();
        expect(baseProps.setCurrentPage).not.toHaveBeenCalled();
    });

    it("renders complete market statistics and refresh metadata", () => {
        const refreshedAt = "2026-08-19T01:00:00.000Z";
        render(
            <AuctionResults
                {...baseProps}
                items={[item("아이템", 100, 6)]}
                summary={{
                    lowestUnitPrice: 100,
                    medianUnitPrice: 200,
                    listingCount: 3,
                    totalQuantity: 6,
                }}
                refreshedAt={refreshedAt}
            />
        );
        const summary = within(
            screen.getByRole("region", { name: "현재 검색 결과 요약" })
        );
        expect(summary.getByText("100 Gold")).toBeInTheDocument();
        expect(summary.getByText("200 Gold")).toBeInTheDocument();
        expect(summary.getByText("3개")).toBeInTheDocument();
        expect(summary.getByText("6개")).toBeInTheDocument();
        expect(summary.getByText(/조회 완료:/)).toBeInTheDocument();
        expect(
            summary.getByText(/조회 완료:/).querySelector("time")
        ).toHaveAttribute("datetime", refreshedAt);
        expect(
            summary.queryByText("현재 불러온 일부 매물만 반영한 요약입니다.")
        ).not.toBeInTheDocument();
    });

    it("renders empty and incomplete states without zero-valued statistics", () => {
        render(
            <AuctionResults
                {...baseProps}
                items={[]}
                hasMore={true}
                refreshedAt="2026-08-19T01:00:00.000Z"
            />
        );
        const summary = within(
            screen.getByRole("region", { name: "현재 검색 결과 요약" })
        );
        expect(
            summary.getByText("현재 검색 조건에 유효한 매물이 없습니다.")
        ).toBeInTheDocument();
        expect(
            summary.getByText("현재 불러온 일부 매물만 반영한 요약입니다.")
        ).toBeInTheDocument();
        expect(summary.queryByText(/0 Gold/)).not.toBeInTheDocument();
    });

    it("uses buttons for sorting, item options, and non-empty pagination", async () => {
        const user = userEvent.setup();
        const onSort = jest.fn();
        const onItemClick = jest.fn();
        const setCurrentPage = jest.fn();
        const items = Array.from({ length: 11 }, (_, index) =>
            item(`아이템 ${index}`, index)
        );
        render(
            <AuctionResults
                {...baseProps}
                items={items}
                onSort={onSort}
                onItemClick={onItemClick}
                setCurrentPage={setCurrentPage}
            />
        );
        await user.click(screen.getByRole("button", { name: "가격" }));
        expect(onSort).toHaveBeenCalled();
        await user.click(screen.getByRole("button", { name: "아이템 0" }));
        expect(onItemClick).toHaveBeenCalledWith(items[0]);
        await user.click(screen.getByLabelText("다음 페이지"));
        expect(setCurrentPage.mock.calls[0][0](1)).toBe(2);
    });
});

function FavoritesDialogHarness() {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    return (
        <>
            <FavoriteToolbar
                addButtonText="즐겨찾기 등록"
                onAdd={jest.fn()}
                onShow={() => setOpen(true)}
                showButtonRef={triggerRef}
            />
            {open && (
                <FavoritesDialog
                    favorites={[{ itemName: "검", category: "무기" }]}
                    onSelect={jest.fn()}
                    onRemove={jest.fn()}
                    onClose={() => setOpen(false)}
                    triggerRef={triggerRef}
                />
            )}
        </>
    );
}

function OptionsDialogHarness() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                옵션 열기
            </button>
            {open && (
                <ItemOptionsDialog
                    options={[]}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

describe("auction dialogs", () => {
    it("traps focus, closes on Escape, and restores the favorites trigger", async () => {
        const user = userEvent.setup();
        render(<FavoritesDialogHarness />);
        const trigger = screen.getByRole("button", { name: "즐겨찾기 보기" });
        await user.click(trigger);
        const dialog = screen.getByRole("dialog", { name: "즐겨찾기 목록" });
        expect(dialog).toHaveAttribute("aria-modal", "true");
        const favorite = screen.getByRole("button", { name: "검 (무기)" });
        const close = screen.getByRole("button", { name: "닫기" });
        expect(favorite).toHaveFocus();
        await user.tab({ shift: true });
        expect(close).toHaveFocus();
        await user.tab();
        expect(favorite).toHaveFocus();
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it("applies the same focus and Escape behavior to item options", async () => {
        const user = userEvent.setup();
        render(<OptionsDialogHarness />);
        const trigger = screen.getByRole("button", { name: "옵션 열기" });
        await user.click(trigger);
        expect(
            screen.getByRole("dialog", { name: "아이템 옵션" })
        ).toHaveAttribute("aria-modal", "true");
        expect(screen.getByRole("button", { name: "닫기" })).toHaveFocus();
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });
});
