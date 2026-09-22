import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CashPackageTool from "@/app/tools/cash-packages/cash-package-tool";
import catalogData from "@/data/cash-packages.json";
import {
    type CashPackageCatalog,
    cashPackageMarketItems,
} from "@/lib/cash-packages";

const catalog = catalogData as CashPackageCatalog;
const marketItems = cashPackageMarketItems(catalog);
const fetchMock = jest.fn();

function response(itemId: string, price = 100) {
    return {
        ok: true,
        status: 200,
        json: () =>
            Promise.resolve({
                itemId,
                status: "available",
                marketUnitGold: price,
                fetchedAt: "2026-09-22T00:00:00.000Z",
                isComplete: true,
                availableQuantity: 10,
                cause: null,
            }),
    } as Response;
}

function renderTool() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <CashPackageTool catalog={catalog} />
        </QueryClientProvider>
    );
}

beforeEach(() => {
    fetchMock.mockReset().mockImplementation((url: string) => {
        const itemId = new URL(url, "http://localhost").searchParams.get(
            "item_id"
        )!;
        return Promise.resolve(
            response(
                itemId,
                itemId.includes("red")
                    ? 200
                    : itemId.includes("blue")
                      ? 100
                      : 100
            )
        );
    });
    global.fetch = fetchMock;
});

test("starts with a blank rate and fixed three-package comparison", async () => {
    renderTool();
    expect(
        screen.getByRole("heading", { name: "캐시 패키지 비교" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("10,000 캐시 환산 골드")).toHaveValue("");
    const cards = screen
        .getAllByRole("button", { name: /예상 손익/ })
        .filter(button => button.hasAttribute("aria-pressed"));
    expect(cards.map(card => card.textContent)).toEqual([
        expect.stringContaining("소담한"),
        expect.stringContaining("달고운"),
        expect.stringContaining("온누리"),
    ]);
    expect(cards[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledTimes(marketItems.length)
    );
});

test("selects a package, edits a price, preserves it on refresh and restores automatic price", async () => {
    const user = userEvent.setup();
    renderTool();
    await user.click(screen.getByRole("button", { name: /달고운.*예상 손익/ }));
    const price = await screen.findByLabelText("찬란한 세공 도구 단가");
    await user.clear(price);
    await user.type(price, "0");
    expect(price).toHaveValue("0");
    expect(
        screen.getByRole("button", { name: "찬란한 세공 도구 자동 가격 복원" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "시세 새로고침" }));
    await waitFor(() =>
        expect(
            screen.getByRole("button", { name: "시세 새로고침" })
        ).toBeEnabled()
    );
    expect(price).toHaveValue("0");
    await user.click(
        screen.getByRole("button", { name: "찬란한 세공 도구 자동 가격 복원" })
    );
    await waitFor(() => expect(price).toHaveValue("100"));
});

test("shows per-sale quantities and consumes coupons by sale", async () => {
    const user = userEvent.setup();
    renderTool();
    await user.click(screen.getByRole("button", { name: /달고운.*예상 손익/ }));
    await user.click(screen.getByText("판매 건수와 쿠폰 사용"));
    const count = screen.getByLabelText("찬란한 세공 도구 판매 건수");
    fireEvent.change(count, { target: { value: "2" } });
    expect(screen.getByText("20개 × 2건")).toBeInTheDocument();

    const coupons = screen.getByLabelText("찬란한 세공 도구 쿠폰 적용 건수");
    fireEvent.change(coupons, { target: { value: "1" } });
    expect(
        screen.getByLabelText("경매장 수수료 100% 할인 쿠폰 판매 수량")
    ).toHaveValue(0);
});

test("shows isolated lookup failure and manual zero resolves its warning", async () => {
    fetchMock.mockImplementation((url: string) => {
        const itemId = new URL(url, "http://localhost").searchParams.get(
            "item_id"
        )!;
        return Promise.resolve(
            itemId === "memory-gem"
                ? ({ ok: false, status: 503 } as Response)
                : response(itemId)
        );
    });
    const user = userEvent.setup();
    renderTool();
    await user.click(screen.getByRole("button", { name: /달고운.*예상 손익/ }));
    const warning = await screen.findByRole("button", {
        name: "기억의 보석 시세 상태 확인",
    });
    await user.click(warning);
    expect(screen.getByRole("status")).toHaveTextContent("503");
    expect(
        screen.getByRole("button", { name: "다시 조회" })
    ).toBeInTheDocument();

    const price = screen.getByLabelText("기억의 보석 단가");
    await user.clear(price);
    await user.type(price, "0");
    expect(
        screen.queryByRole("button", { name: "기억의 보석 시세 상태 확인" })
    ).not.toBeInTheDocument();
    expect(
        screen.getByRole("button", { name: "기억의 보석 자동 가격 복원" })
    ).toBeInTheDocument();
});

test("allocates selection boxes to the higher known price and keeps the choice after refresh", async () => {
    const user = userEvent.setup();
    renderTool();
    await user.click(screen.getByRole("button", { name: /달고운.*예상 손익/ }));
    const choice = await screen.findByText("보호의 6단계 개조석 선택 상자");
    const group = choice.parentElement!;
    await waitFor(() =>
        expect(
            within(group).getByLabelText("보호의 6단계 붉은 개조석 단가")
        ).toHaveValue("200")
    );
    await waitFor(() =>
        expect(
            within(group).getByLabelText("보호의 6단계 붉은 개조석 판매 수량")
        ).toHaveValue(2)
    );
    expect(
        within(group).getByLabelText("보호의 6단계 푸른 개조석 판매 수량")
    ).toHaveValue(0);

    fetchMock.mockImplementation((url: string) => {
        const itemId = new URL(url, "http://localhost").searchParams.get(
            "item_id"
        )!;
        return Promise.resolve(
            response(itemId, itemId.includes("blue") ? 300 : 100)
        );
    });
    await user.click(screen.getByRole("button", { name: "시세 새로고침" }));
    await waitFor(() =>
        expect(
            screen.getByRole("button", { name: "시세 새로고침" })
        ).toBeEnabled()
    );
    expect(
        within(group).getByLabelText("보호의 6단계 붉은 개조석 판매 수량")
    ).toHaveValue(2);
});
