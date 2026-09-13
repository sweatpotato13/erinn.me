import {
    act,
    fireEvent,
    render,
    renderHook,
    screen,
    waitFor,
    within,
} from "@testing-library/react";

import sitemap from "@/app/sitemap";
import { metadata } from "@/app/tools/murias-relics/page";
import RelicTool from "@/app/tools/murias-relics/relic-tool";
import { useRelicSnapshot } from "@/app/tools/murias-relics/simulator/use-relic-snapshot";
import { FEATURE_LINKS } from "@/lib/feature-links";
import {
    aggregateRelicListings,
    muriasReference,
    type RelicSnapshot,
} from "@/lib/murias-relics";

const snapshot = (): RelicSnapshot => ({
    referenceVersion: muriasReference.version,
    ...aggregateRelicListings([
        {
            item_name: "무리아스의 유물",
            item_display_name: "무리아스의 유물",
            item_count: 2,
            auction_price_per_unit: 1234567,
            date_auction_expire: "2026-09-15T00:00:00Z",
            item_option: [
                {
                    option_type: "무리아스 유물",
                    option_value:
                        "데바스테이션 캐논 대미지 80% 증가 (최대 400%)",
                },
            ],
        },
    ]),
    fetchedAt: "2026-09-13T00:00:00Z",
    pages: 2,
    nextCursor: null,
    isComplete: true,
    relicError: null,
    ideaPrice: 100,
    ideaFetchedAt: "2026-09-12T00:00:00Z",
    ideaIsComplete: true,
    ideaError: null,
});
const fetchMock = jest.fn();
beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock
        .mockReset()
        .mockResolvedValue({ ok: true, json: () => snapshot() });
});

test("shows ten columns, 30 effects, prices, details and filters without refetch", async () => {
    render(<RelicTool />);
    expect(screen.getByRole("status")).toHaveTextContent("조회하는 중");
    await screen.findByText("1,234,567 Gold");
    expect(screen.getAllByRole("columnheader")).toHaveLength(110);
    expect(screen.getAllByRole("rowheader")).toHaveLength(30);
    expect(screen.getAllByRole("table")).toHaveLength(10);
    expect(screen.queryByText("가격·데이터 안내")).not.toBeInTheDocument();
    expect(screen.getByText(/마지막 페이지까지 조회/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "데바스테이션" },
    });
    expect(screen.getAllByRole("rowheader")).toHaveLength(1);
    fireEvent.click(
        screen.getByRole("button", {
            name: "데바스테이션 캐논 대미지 2레벨 상세",
        })
    );
    const detail = screen.getByRole("region", { name: "선택한 유물 매물" });
    expect(
        within(detail).getByRole("heading", { name: /80% 증가/ })
    ).toBeInTheDocument();
    expect(within(detail).getByRole("link")).toHaveAttribute(
        "href",
        `/auction?q=${encodeURIComponent("무리아스의 유물")}`
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "없는효과" },
    });
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
});

test("refresh failure preserves independent prices, timestamps and coverage", async () => {
    render(<RelicTool />);
    await screen.findByText("1,234,567 Gold");
    const failed = {
        ...snapshot(),
        ...aggregateRelicListings([]),
        fetchedAt: null,
        relicError: "유물 실패",
        ideaPrice: null,
        ideaFetchedAt: null,
        ideaError: "이데아 실패",
    };
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => failed });
    fireEvent.click(screen.getByRole("button", { name: "가격 새로고침" }));
    await screen.findByText(/유물 실패/);
    expect(screen.getByText("1,234,567 Gold")).toBeInTheDocument();
    expect(screen.getByText(/이데아: 100 Gold/)).toHaveTextContent(
        "2026. 9. 12."
    );
    expect(screen.getByText(/유물 조회:/)).toHaveTextContent("2026. 9. 13.");
    expect(fetchMock.mock.calls[1][1].method).toBe("POST");
    expect(
        screen.queryByRole("button", { name: "더 불러오기" })
    ).not.toBeInTheDocument();
    fetchMock.mockResolvedValueOnce({ ok: false });
    fireEvent.click(screen.getByRole("button", { name: "가격 새로고침" }));
    await screen.findByText(/가격을 불러오지 못했습니다/);
    expect(screen.getByText("1,234,567 Gold")).toBeInTheDocument();
});

test("empty and initial failure remain unavailable, and route is discoverable", async () => {
    fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => ({
            ...snapshot(),
            ...aggregateRelicListings([]),
            fetchedAt: null,
            relicError: "유물 실패",
            ideaPrice: null,
        }),
    });
    render(<RelicTool />);
    await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
    );
    expect(screen.getByRole("alert")).toHaveTextContent("유물 실패");
    expect(screen.getAllByText("—")).toHaveLength(300);
    expect(FEATURE_LINKS).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                url: "/tools/murias-relics",
                searchVisible: true,
            }),
        ])
    );
    expect(sitemap()).toContainEqual({
        url: "https://erinn.me/tools/murias-relics",
    });
    expect(metadata.alternates?.canonical).toBe("/tools/murias-relics");
});

test("a server fallback replaces an initial empty failure and retains its original timestamp", async () => {
    fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => ({
            ...snapshot(),
            ...aggregateRelicListings([]),
            fetchedAt: null,
            relicError: "초기 조회 실패",
        }),
    });
    render(<RelicTool />);
    await screen.findByText("초기 조회 실패");
    fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => ({
            ...snapshot(),
            relicError: "전체 조회 실패",
        }),
    });
    fireEvent.click(screen.getByRole("button", { name: "가격 새로고침" }));
    await screen.findByText("1,234,567 Gold");
    expect(screen.getByText(/유물 조회:/)).toHaveTextContent("2026. 9. 13.");
    expect(screen.getByText(/전체 조회 실패/)).toHaveTextContent(
        "이전 유물 조회 결과"
    );
});

test("shared snapshot hook retains complete relic metadata independently of Idea refresh", async () => {
    const previous = {
        ...snapshot(),
        pages: 7,
        receivedCount: 12,
        excludedCount: 3,
        unclassifiedCount: 2,
        rejected: [
            {
                reason: "excluded",
                item: snapshot().cells.flatMap(cell => cell.listings)[0],
            },
        ],
    };
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => previous });
    const { result } = renderHook(() => useRelicSnapshot());
    await waitFor(() => expect(result.current.snapshot).toEqual(previous));
    const failed = {
        ...snapshot(),
        ...aggregateRelicListings([]),
        pages: 0,
        fetchedAt: null,
        isComplete: false,
        relicError: "failed",
        ideaPrice: 999,
    };
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => failed });
    await act(() => result.current.load(true));
    expect(result.current.snapshot).toEqual({
        ...previous,
        relicError: "failed",
        ideaPrice: 999,
    });
    const newer = { ...failed, fetchedAt: "2026-09-14T00:00:00Z" };
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => newer });
    await act(() => result.current.load(true));
    expect(result.current.snapshot).toEqual(newer);
});

test("shared snapshot hook aborts superseded/unmounted loads and rejects version mismatches", async () => {
    let finish!: (response: unknown) => void;
    fetchMock.mockReturnValueOnce(
        new Promise(resolve => {
            finish = resolve;
        })
    );
    const { result, unmount } = renderHook(() => useRelicSnapshot());
    const firstSignal = fetchMock.mock.calls[0][1].signal;
    await act(() => result.current.load(true));
    expect(firstSignal.aborted).toBe(true);
    await act(() => {
        finish({ ok: true, json: () => ({ ...snapshot(), ideaPrice: 1 }) });
        return Promise.resolve();
    });
    expect(result.current.snapshot?.ideaPrice).toBe(100);
    fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => ({ ...snapshot(), referenceVersion: "obsolete" }),
    });
    await act(() => result.current.load(true));
    expect(result.current.marketError).toMatch(/참조 데이터/);
    expect(result.current.snapshot?.ideaPrice).toBe(100);
    const lastSignal = fetchMock.mock.calls.at(-1)[1].signal;
    unmount();
    expect(lastSignal.aborted).toBe(true);
});
