import { expect, type Page, test } from "@playwright/test";

const couponNames = [10, 20, 30, 50, 100].map(
    discount => `경매장 수수료 ${discount}% 할인 쿠폰`
);
const initialPrices = [240_000, 2_000_000, 2_000_000, 3_000_000, 5_000_000];
let requests: string[];

async function mockCouponPrices(page: Page) {
    await page.route("**/api/auction/price-summary?**", route => {
        const itemName = new URL(route.request().url()).searchParams.get(
            "item_name"
        );
        const index = couponNames.indexOf(itemName ?? "");
        const requestIndex = requests.push(itemName ?? "") - 1;
        const batchIndex = Math.floor(requestIndex / couponNames.length);
        return route.fulfill({
            json: {
                minPrice:
                    batchIndex === 1 && index === 0
                        ? 500_000
                        : initialPrices[index],
                averagePrice: initialPrices[index],
                availableQuantity: 1,
                isComplete: true,
            },
        });
    });
}

async function fillCalculation(page: Page) {
    await page.getByLabel("판매 금액 (Gold)").fill("100000000");
    await page.getByLabel("분배 인원").fill("4");
    await page.getByLabel("멤버십 수수료 4%").check();
}

async function expectRemovedFields(page: Page) {
    await expect(page.getByLabel("판매 아이템명 (선택)")).toHaveCount(0);
    await expect(page.getByLabel(/무리아스/)).toHaveCount(0);
    await expect(page.getByLabel("추가 비용 설명 (선택)")).toHaveCount(0);
}

async function expectCompactLayout(page: Page) {
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1
        )
    ).toBe(true);
    const controls = await page
        .getByTestId("calculator-controls")
        .boundingBox();
    expect(controls?.height).toBeLessThan(
        (page.viewportSize()?.width ?? 0) >= 640 ? 320 : 560
    );
    const heading = await page
        .getByRole("heading", { name: "파티 분배 계산기" })
        .boundingBox();
    const shareButton = await page
        .getByRole("button", { name: "계산 링크 공유" })
        .boundingBox();
    expect(Math.abs((heading?.y ?? 0) - (shareButton?.y ?? 0))).toBeLessThan(
        20
    );
}

test.beforeEach(async ({ page }) => {
    requests = [];
    await mockCouponPrices(page);
    await page.goto("/calculator");
    await expect(page.getByText("쿠폰 시세를 갱신했습니다.")).toBeVisible();
    expect(requests).toHaveLength(couponNames.length);
    expect(new Set(requests)).toEqual(new Set(couponNames));
});

test("calculates, freezes, restores, and refreshes a shared result", async ({
    page,
}) => {
    await page.getByLabel("판매 금액 (Gold)").fill("95200000");
    await expect(page.getByText("(95,200,000 | 9520만)")).toBeVisible();
    await fillCalculation(page);
    await expectRemovedFields(page);
    await expect(
        page.getByRole("article", { name: "10% 할인 쿠폰 · BEST" })
    ).toBeVisible();
    await expect(
        page.getByRole("img", { name: "경매장 수수료 10% 할인 쿠폰" })
    ).toBeVisible();
    await expect(
        page.getByText("24,040,000 Gold", { exact: true }).first()
    ).toBeVisible();
    await expect
        .poll(() => new URL(page.url()).searchParams.get("c10"))
        .toBe("240000");
    const firstSnapshotUrl = page.url();

    await page.getByRole("button", { name: "현재 시세로 다시 계산" }).click();
    await expect.poll(() => requests.length).toBe(10);
    await expect
        .poll(() => new URL(page.url()).searchParams.get("c10"))
        .toBe("500000");
    await page.goBack();
    await expect(page).toHaveURL(firstSnapshotUrl);
    await expect(page.getByLabel("10% 할인 쿠폰 (Gold)")).toHaveValue("240000");
    expect(requests).toHaveLength(10);
});

test("restores owned coupons and keeps the comparison prominent", async ({
    page,
}) => {
    await fillCalculation(page);
    await page.getByLabel("100% 할인 쿠폰 (Gold)").fill("0");
    await expect(
        page.getByRole("article", { name: "100% 할인 쿠폰 · BEST" })
    ).toBeVisible();
    await expect(page.getByText("직접 입력 · 보유 쿠폰").first()).toBeVisible();
    await expect
        .poll(() => new URL(page.url()).searchParams.get("c100"))
        .toBe("0");

    await page.reload();
    await expect(page).toHaveTitle(
        "파티 분배 결과 · 100% 할인 쿠폰 | Erinn.me"
    );
    await expect(page.getByText("공유 스냅샷").first()).toBeVisible();
    expect(requests).toHaveLength(5);
    const comparison = page.getByRole("region", { name: "선택지 비교" });
    await expect(comparison.getByRole("article")).toHaveCount(6);
    await expect(
        comparison.getByRole("article", { name: "100% 할인 쿠폰 · BEST" })
    ).toHaveClass(/border-primary/);
    await expectCompactLayout(page);
});

test("refreshes from the keyboard without losing focus", async ({ page }) => {
    const refresh = page.getByRole("button", {
        name: "현재 시세로 다시 계산",
    });
    await refresh.focus();
    await expect(refresh).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => requests.length).toBe(10);
    await expect(page.getByText("쿠폰 시세를 갱신했습니다.")).toBeVisible();
    await expect(refresh).toBeFocused();
});
