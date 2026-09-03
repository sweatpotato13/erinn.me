import { expect, test } from "@playwright/test";

const shopResponse = {
    shop_tab_count: 2,
    shop: [
        {
            tab_name: "일반 상품",
            item: [
                {
                    item_display_name: "광폭한 토끼 인형 (빨강)",
                    item_count: 2,
                    item_option: [],
                    image_url: "/logo.png",
                    price: [
                        { price_type: "Gold", price_value: 1200 },
                        { price_type: "인장", price_value: "3" },
                    ],
                    limit_type: "주간",
                    limit_value: 5,
                },
                {
                    item_display_name: "회복 포션",
                    image_url: "/logo.png",
                    price: [{ price_type: "Gold", price_value: 500 }],
                },
            ],
        },
        {
            tab_name: "교환 상품",
            item: [
                {
                    item_display_name: "대형 포션",
                    image_url: "/logo.png",
                    price: [{ price_type: "Gold", price_value: 800 }],
                },
            ],
        },
    ],
    date_inquire: "2026-09-02T00:00:00Z",
    date_shop_next_update: "2026-09-02T00:36:00Z",
};

test("submits, filters, and opens an NPC shop item from the keyboard", async ({
    browserName,
    page,
}) => {
    let npcRequestCount = 0;
    const auctionRequests: URL[] = [];
    await page.route("**/api/npc-shop?**", route => {
        npcRequestCount += 1;
        return route.fulfill({ json: shopResponse });
    });
    await page.route("**/api/suggest?**", route =>
        route.fulfill({ json: { suggestions: [] } })
    );
    await page.route("**/api/auction/**", route => {
        const url = new URL(route.request().url());
        auctionRequests.push(url);
        const history = url.pathname.endsWith("/history");
        return route.fulfill({
            json: history
                ? {
                      sales: [],
                      hasMore: false,
                      fetchedAt: "2026-09-02T00:00:00Z",
                  }
                : { items: [], hasMore: false, nextCursor: null },
        });
    });
    await page.goto("/npc-shop");

    const npc = page.getByLabel("NPC 이름");
    await npc.selectOption("델");
    await expect(npc).toHaveValue("델");

    const server = page.getByLabel("서버 이름");
    await server.selectOption("류트");
    await expect(server).toHaveValue("류트");

    const channel = page.getByLabel("채널 번호");
    await channel.focus();
    await page.keyboard.type("1");
    await page.keyboard.press("Enter");

    await expect(
        page.getByRole("heading", { name: "상점 정보" })
    ).toBeVisible();
    expect(npcRequestCount).toBe(1);
    await expect(page.getByText("상점 탭 2개")).toBeVisible();
    await expect(page.getByText("수량: 2개")).toBeVisible();
    await expect(page.getByText("구매 제한: 주간 5개")).toBeVisible();
    await expect(page.locator("time")).toHaveCount(2);
    await expect(page.getByText(/평균 약 10분/)).toContainText("36분");

    const filter = page.getByLabel("아이템 이름 필터");
    await filter.fill("포션");
    await expect(page.getByText("일치하는 아이템 2개")).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "일반 상품" })
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "교환 상품" })
    ).toBeVisible();
    expect(npcRequestCount).toBe(1);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1
        )
    ).toBe(true);

    await page.getByRole("button", { name: "필터 지우기" }).click();
    expect(auctionRequests).toHaveLength(0);
    await expect(
        page.getByRole("link", { name: / 경매장 시세 보기$/ })
    ).toHaveCount(3);
    const auctionLink = page.getByRole("link", {
        name: "광폭한 토끼 인형 (빨강) 경매장 시세 보기",
    });
    await expect(auctionLink).toHaveAttribute(
        "href",
        "/auction?q=%EA%B4%91%ED%8F%AD%ED%95%9C+%ED%86%A0%EB%81%BC+%EC%9D%B8%ED%98%95+%28%EB%B9%A8%EA%B0%95%29"
    );
    await filter.focus();
    await expect(filter).toBeFocused();
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(auctionLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => new URL(page.url()).pathname).toBe("/auction");
    await expect
        .poll(() => new URL(page.url()).searchParams.get("q"))
        .toBe("광폭한 토끼 인형 (빨강)");
    await expect(page.getByPlaceholder("아이템명")).toHaveValue(
        "광폭한 토끼 인형 (빨강)"
    );
    await expect.poll(() => auctionRequests.length).toBe(2);
    const marketRequest = auctionRequests.find(url =>
        url.pathname.endsWith("/keyword-search")
    );
    const historyRequest = auctionRequests.find(url =>
        url.pathname.endsWith("/history")
    );
    expect(marketRequest?.searchParams.get("keyword")).toBe(
        "광폭한 토끼 인형 (빨강)"
    );
    expect(historyRequest?.searchParams.get("item_name")).toBe(
        "광폭한 토끼 인형 (빨강)"
    );
    await expect(
        page.getByText("현재 검색 조건에 유효한 매물이 없습니다.")
    ).toBeVisible();
});
