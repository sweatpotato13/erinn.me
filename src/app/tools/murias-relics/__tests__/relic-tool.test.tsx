import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";

import sitemap from "@/app/sitemap";
import { metadata } from "@/app/tools/murias-relics/page";
import RelicTool from "@/app/tools/murias-relics/relic-tool";
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
