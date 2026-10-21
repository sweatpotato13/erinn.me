import { act, fireEvent, render, screen } from "@testing-library/react";

import AuctionCalculator from "@/app/calculator/auction-calculator";
import { createEmptyCouponPrices } from "@/lib/auction-calculator";
import {
    type AuctionCalculatorSnapshot,
    serializeAuctionCalculatorSnapshot,
} from "@/lib/auction-calculator-url";

let routerSearch = "";

jest.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(routerSearch),
}));

jest.mock("@/lib/api/auction", () => ({
    fetchCouponPriceSummaries: jest.fn(),
}));

function snapshot(salePrice: number): AuctionCalculatorSnapshot {
    return {
        salePrice,
        memberCount: 4,
        hasMembership: true,
        additionalCost: 0,
        couponPrices: createEmptyCouponPrices(),
        incompleteCoupons: [],
        snapshotAt: 1_788_226_000,
    };
}

function queryFor(salePrice: number): string {
    return serializeAuctionCalculatorSnapshot(snapshot(salePrice)).toString();
}

describe("calculator history navigation with undelivered URL echoes", () => {
    it("restores a queued query on Back instead of treating it as an echo", () => {
        const initial = queryFor(100);
        routerSearch = initial;
        window.history.replaceState(null, "", `/calculator?${initial}`);
        const view = render(<AuctionCalculator initialQuery={initial} />);
        const sale = screen.getByLabelText("판매 금액 (Gold)");

        // Writes for B and C are queued; the router has not echoed either yet.
        fireEvent.change(sale, { target: { value: "200" } });
        fireEvent.change(sale, { target: { value: "300" } });
        expect(window.location.search).toBe(`?${queryFor(300)}`);
        expect(sale).toHaveValue(300);

        // Back navigation to B arrives before the echo of B.
        act(() => {
            window.dispatchEvent(new PopStateEvent("popstate"));
        });
        routerSearch = queryFor(200);
        view.rerender(<AuctionCalculator initialQuery={initial} />);

        expect(screen.getByLabelText("판매 금액 (Gold)")).toHaveValue(200);
    });

    it("still ignores a stale echo of an older write when no navigation happened", () => {
        const initial = queryFor(100);
        routerSearch = initial;
        window.history.replaceState(null, "", `/calculator?${initial}`);
        const view = render(<AuctionCalculator initialQuery={initial} />);
        const sale = screen.getByLabelText("판매 금액 (Gold)");

        fireEvent.change(sale, { target: { value: "200" } });
        fireEvent.change(sale, { target: { value: "300" } });
        routerSearch = queryFor(200);
        view.rerender(<AuctionCalculator initialQuery={initial} />);

        expect(screen.getByLabelText("판매 금액 (Gold)")).toHaveValue(300);
    });
});
