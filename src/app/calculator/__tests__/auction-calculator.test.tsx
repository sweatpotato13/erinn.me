import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";

import AuctionCalculator from "@/app/calculator/auction-calculator";
import {
    type CouponPriceSummaries,
    fetchCouponPriceSummaries,
    type PriceSummaryResponse,
} from "@/lib/api/auction";
import {
    AUCTION_COUPONS,
    createEmptyCouponPrices,
} from "@/lib/auction-calculator";
import {
    type AuctionCalculatorSnapshot,
    serializeAuctionCalculatorSnapshot,
} from "@/lib/auction-calculator-url";

jest.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(window.location.search),
}));

jest.mock("@/lib/api/auction", () => ({
    fetchCouponPriceSummaries: jest.fn(),
}));

const mockedFetch = jest.mocked(fetchCouponPriceSummaries);

function couponSummaries(
    overrides: Partial<CouponPriceSummaries> = {}
): CouponPriceSummaries {
    const available = {
        minPrice: 10_000_000,
        averagePrice: 10_000_000,
        availableQuantity: 1,
        isComplete: true,
    };
    return {
        10: available,
        20: available,
        30: available,
        50: available,
        100: available,
        ...overrides,
    };
}

function snapshot(
    overrides: Partial<AuctionCalculatorSnapshot> = {}
): AuctionCalculatorSnapshot {
    return {
        salePrice: 100_000_000,
        memberCount: 4,
        hasMembership: true,
        additionalCost: 0,
        couponPrices: createEmptyCouponPrices(),
        incompleteCoupons: [],
        snapshotAt: 1_788_226_000,
        ...overrides,
    };
}

function renderSnapshot(value: AuctionCalculatorSnapshot) {
    const query = serializeAuctionCalculatorSnapshot(value).toString();
    window.history.replaceState(null, "", `/calculator?${query}`);
    return render(<AuctionCalculator initialQuery={query} />);
}

describe("auction calculator page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.history.replaceState(null, "", "/calculator");
    });

    it("restores frozen coupon prices without a live request", () => {
        const couponPrices = createEmptyCouponPrices();
        couponPrices[10] = 240_000;
        renderSnapshot(snapshot({ couponPrices }));

        expect(mockedFetch).not.toHaveBeenCalled();
        expect(
            screen.getByRole("article", { name: "10% 할인 쿠폰 · BEST" })
        ).toHaveClass("border-primary");
        expect(screen.getByText("BEST")).toBeInTheDocument();
        expect(
            screen.getByRole("img", {
                name: "경매장 수수료 10% 할인 쿠폰",
            })
        ).toHaveAttribute("src", expect.stringContaining("/api/item-image?"));
        expect(screen.getAllByText("96,160,000 Gold").length).toBeGreaterThan(
            0
        );
        expect(screen.getAllByText("공유 스냅샷")).toHaveLength(2);
    });

    it("loads one coupon batch and does not refetch on form edits", async () => {
        mockedFetch.mockResolvedValue(couponSummaries());
        const user = userEvent.setup();
        render(
            <StrictMode>
                <AuctionCalculator initialQuery="" />
            </StrictMode>
        );

        await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));
        await user.type(screen.getByLabelText("판매 금액 (Gold)"), "95200000");
        expect(screen.getByText("(95,200,000 | 9520만)")).toBeInTheDocument();
        expect(
            screen.queryByLabelText("판매 아이템명 (선택)")
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/무리아스/)).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText("추가 비용 설명 (선택)")
        ).not.toBeInTheDocument();
        expect(
            await screen.findByRole("article", { name: "쿠폰 없음 · BEST" })
        ).toBeInTheDocument();
        await user.clear(screen.getByLabelText("분배 인원"));
        await user.type(screen.getByLabelText("분배 인원"), "2");
        expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it("keeps incomplete and failed lookups manual while distinguishing zero", async () => {
        mockedFetch.mockResolvedValue(
            couponSummaries({
                10: {
                    minPrice: 240_000,
                    averagePrice: 240_000,
                    availableQuantity: 1,
                    isComplete: false,
                },
                20: null,
                30: {
                    minPrice: 0,
                    averagePrice: 0,
                    availableQuantity: 0,
                    isComplete: true,
                },
                50: {
                    minPrice: 0,
                    averagePrice: 0,
                    availableQuantity: 0,
                    isComplete: true,
                },
                100: {
                    minPrice: 0,
                    averagePrice: 0,
                    availableQuantity: 0,
                    isComplete: true,
                },
            })
        );
        const user = userEvent.setup();
        render(<AuctionCalculator initialQuery="" />);
        await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));
        await user.type(screen.getByLabelText("판매 금액 (Gold)"), "100000000");

        expect(await screen.findAllByText("일부 데이터 최저가")).toHaveLength(
            2
        );
        expect(screen.getAllByText("조회 실패 · 직접 입력 가능")).toHaveLength(
            2
        );
        await user.type(screen.getByLabelText("100% 할인 쿠폰 (Gold)"), "0");
        expect(
            screen.getByRole("article", { name: "100% 할인 쿠폰 · BEST" })
        ).toBeInTheDocument();
        expect(screen.getAllByText("직접 입력 · 보유 쿠폰")).toHaveLength(2);
    });

    it("shows validation and preserves explicit negative proceeds", async () => {
        const user = userEvent.setup();
        renderSnapshot(
            snapshot({
                salePrice: 1,
                additionalCost: 2,
            })
        );
        expect(screen.getByRole("alert")).toHaveTextContent(
            "입력한 총비용이 판매가를 초과"
        );

        const coupon = screen.getByLabelText("10% 할인 쿠폰 (Gold)");
        await user.type(coupon, "-1");
        expect(screen.getByText(/0 이상의 정수 가격/)).toBeInTheDocument();
        expect(coupon).toHaveAttribute("aria-invalid", "true");
    });

    it("aborts an older refresh and commits only the newer snapshot", async () => {
        const never = new Promise<never>(() => undefined);
        mockedFetch.mockImplementation(() =>
            mockedFetch.mock.calls.length <= 1
                ? never
                : Promise.resolve(
                      couponSummaries(
                          Object.fromEntries(
                              AUCTION_COUPONS.map(({ discount }) => [
                                  discount,
                                  {
                                      minPrice: 0,
                                      averagePrice: 0,
                                      availableQuantity: 1,
                                      isComplete: true,
                                  },
                              ])
                          )
                      )
                  )
        );
        const user = userEvent.setup();
        renderSnapshot(snapshot());

        await user.click(
            screen.getByRole("button", { name: "현재 시세로 다시 계산" })
        );
        await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));
        await user.click(
            screen.getByRole("button", { name: "조회 중 · 다시 시작" })
        );
        await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
        await screen.findByText("쿠폰 시세를 갱신했습니다.");

        expect(window.location.search).toContain("v=1");
        expect(window.location.search).not.toContain("c10=");
        expect(screen.getAllByText("사용 가능한 매물 없음")).toHaveLength(10);
    });

    it("keeps a manual edit when the canceled initial lookup resolves late", async () => {
        const resolvers: Array<(value: CouponPriceSummaries) => void> = [];
        mockedFetch.mockImplementation(
            () =>
                new Promise(resolve => {
                    resolvers.push(resolve);
                })
        );
        const user = userEvent.setup();
        render(<AuctionCalculator initialQuery="" />);

        await waitFor(() => expect(resolvers).toHaveLength(1));
        await user.type(screen.getByLabelText("판매 금액 (Gold)"), "100000000");
        await user.type(screen.getByLabelText("10% 할인 쿠폰 (Gold)"), "0");
        expect(
            screen.getByRole("article", { name: "10% 할인 쿠폰 · BEST" })
        ).toBeInTheDocument();
        expect(screen.getAllByText("조회 실패 · 직접 입력 가능")).toHaveLength(
            8
        );

        act(() => {
            resolvers.forEach(resolve =>
                resolve(
                    couponSummaries(
                        Object.fromEntries(
                            AUCTION_COUPONS.map(({ discount }) => [
                                discount,
                                {
                                    minPrice: 1,
                                    averagePrice: 1,
                                    availableQuantity: 1,
                                    isComplete: true,
                                } satisfies PriceSummaryResponse,
                            ])
                        )
                    )
                )
            );
        });
        await waitFor(() =>
            expect(screen.getByLabelText("10% 할인 쿠폰 (Gold)")).toHaveValue(0)
        );
        expect(window.location.search).toContain("c10=0");
        expect(window.location.search).not.toContain("c20=");
    });

    it("shares the exact frozen URL through the clipboard fallback", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        const user = userEvent.setup();
        Object.defineProperty(navigator, "share", {
            configurable: true,
            value: undefined,
        });
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        });
        renderSnapshot(snapshot());

        await user.click(
            screen.getByRole("button", { name: "계산 링크 공유" })
        );
        await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
        expect(writeText.mock.calls[0][0]).toBe(window.location.href);
        expect(
            screen.getByText("계산 링크를 복사했습니다.")
        ).toBeInTheDocument();
    });

    it("restores changed queries across back and forward navigation", async () => {
        const first = snapshot({ salePrice: 100 });
        const second = snapshot({ salePrice: 200 });
        const view = renderSnapshot(first);
        const firstQuery = serializeAuctionCalculatorSnapshot(first).toString();
        const secondQuery =
            serializeAuctionCalculatorSnapshot(second).toString();

        act(() => {
            window.history.pushState(null, "", `?${secondQuery}`);
        });
        view.rerender(
            <AuctionCalculator
                initialQuery={serializeAuctionCalculatorSnapshot(
                    first
                ).toString()}
            />
        );

        await waitFor(() =>
            expect(screen.getByLabelText("판매 금액 (Gold)")).toHaveValue(200)
        );

        act(() => window.history.back());
        await waitFor(() =>
            expect(window.location.search).toBe(`?${firstQuery}`)
        );
        view.rerender(<AuctionCalculator initialQuery={firstQuery} />);
        await waitFor(() =>
            expect(screen.getByLabelText("판매 금액 (Gold)")).toHaveValue(100)
        );

        act(() => window.history.forward());
        await waitFor(() =>
            expect(window.location.search).toBe(`?${secondQuery}`)
        );
        view.rerender(<AuctionCalculator initialQuery={firstQuery} />);
        await waitFor(() =>
            expect(screen.getByLabelText("판매 금액 (Gold)")).toHaveValue(200)
        );
        expect(mockedFetch).not.toHaveBeenCalled();
    });
});
