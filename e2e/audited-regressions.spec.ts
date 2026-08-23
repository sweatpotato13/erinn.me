import { expect, type Page, test } from "@playwright/test";

const marketOptions = [
    [
        { option_type: "공격", option_value: "10", option_value2: "20" },
        { option_type: "밸런스", option_value: "30" },
        {
            option_type: "인챈트",
            option_sub_type: "접두",
            option_value: "여명",
            option_desc: "최대 대미지 10 증가, 수리비 5% 증가",
        },
    ],
    [
        {
            option_type: "인챈트",
            option_sub_type: "접두",
            option_value: "여명",
            option_desc: "수리비 7% 증가, 최대 대미지 15 증가",
        },
        { option_type: "공격", option_value: "12", option_value2: "20" },
    ],
    [
        { option_type: "에르그", option_sub_type: "A", option_value: "10" },
        { option_type: "공격", option_value: "9", option_value2: "20" },
    ],
    [{ option_type: "공격", option_value: "14", option_value2: "22" }],
];
const marketItems = Array.from({ length: 11 }, (_, index) => ({
    item_name: `아이템 ${index + 1}`,
    item_display_name: `아이템 ${index + 1}`,
    item_count: index + 1,
    auction_price_per_unit: (index + 1) * 100,
    date_auction_expire: "2026-08-20T00:00:00Z",
    item_option: marketOptions[index] ?? [],
}));
const marketSales = [
    {
        item_name: "아이템",
        item_display_name: "두 번째 거래",
        item_count: 2,
        auction_price_per_unit: 200,
        date_auction_buy: "2026-08-20T02:00:00Z",
        auction_buy_id: "second",
        item_option: [],
    },
    {
        item_name: "아이템",
        item_display_name: "가장 최근 거래",
        item_count: 3,
        auction_price_per_unit: 300,
        date_auction_buy: "2026-08-20T03:00:00Z",
        auction_buy_id: "latest",
        item_option: [],
    },
    {
        item_name: "아이템",
        item_display_name: "첫 번째 거래",
        item_count: 1,
        auction_price_per_unit: 100,
        date_auction_buy: "2026-08-20T01:00:00Z",
        auction_buy_id: "first",
        item_option: [],
    },
];

async function setupMarketRoutes(page: Page) {
    const counts = { auction: 0, history: 0 };
    await page.route("**/api/suggest?**", route =>
        route.fulfill({ json: { suggestions: [] } })
    );
    await page.route("**/api/auction/keyword-search?**", route => {
        counts.auction += 1;
        return route.fulfill({
            json: { items: marketItems, hasMore: true, nextCursor: "next" },
        });
    });
    await page.route("**/api/auction/history?**", route => {
        counts.history += 1;
        return route.fulfill({
            json: { sales: marketSales, hasMore: false },
        });
    });
    return counts;
}

async function openMarket(page: Page) {
    const counts = await setupMarketRoutes(page);
    await page.goto("/auction", { waitUntil: "networkidle" });
    return counts;
}

async function searchMarket(page: Page, itemName = "아이템") {
    await page.getByPlaceholder("아이템명").fill(itemName);
    await Promise.all([
        page.waitForResponse(
            response =>
                new URL(response.url()).pathname ===
                    "/api/auction/keyword-search" && response.ok()
        ),
        page.waitForResponse(
            response =>
                new URL(response.url()).pathname === "/api/auction/history" &&
                response.ok()
        ),
        page.getByRole("button", { name: "검색" }).click(),
    ]);
}

function recentSalesButton(page: Page) {
    return page.getByRole("button", {
        name: "최근 1시간 완료 거래 3건 보기",
    });
}

function recentSalesDialog(page: Page) {
    return page.getByRole("dialog", { name: "최근 1시간 완료 거래" });
}

function comparisonCheckbox(page: Page, itemNumber: number) {
    return page.getByRole("checkbox", {
        name: new RegExp(`^아이템 ${itemNumber}, .*비교 선택$`),
    });
}

async function selectComparisonItems(page: Page, itemNumbers: number[]) {
    for (const itemNumber of itemNumbers) {
        const checkbox = comparisonCheckbox(page, itemNumber);
        await checkbox.click();
        await expect(checkbox).toBeChecked();
    }
}

async function verifyMobileComparisonScroll(page: Page) {
    if ((page.viewportSize()?.width ?? 1000) >= 640) return;
    const scroll = page.getByTestId("auction-comparison-scroll");
    await expect
        .poll(() =>
            scroll.evaluate(node => node.scrollWidth > node.clientWidth)
        )
        .toBe(true);
    await scroll.evaluate(node => {
        node.scrollLeft = node.scrollWidth;
    });
    await expect(
        page.getByRole("columnheader", { name: /매물 4/ })
    ).toBeInViewport();
}

test("auction search renders the incomplete market snapshot", async ({
    page,
}) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    const snapshot = page.getByRole("region", { name: "경매 시장 현황" });
    await expect(
        snapshot.getByText(
            "현재 매물은 판매자의 제시 가격이며, 최근 거래는 최근 1시간 동안 실제 완료된 가격입니다."
        )
    ).toBeVisible();
    const listings = page.getByRole("region", { name: "현재 등록 매물" });
    const metrics = listings.locator("dl");
    await expect(metrics.getByText("100 Gold")).toBeVisible();
    await expect(metrics.getByText("600 Gold")).toBeVisible();
    await expect(metrics.getByText("11개")).toBeVisible();
    await expect(metrics.getByText("66개")).toBeVisible();
    await expect(listings.getByText(/조회 완료:/)).toBeVisible();
    await expect(
        listings.getByText("현재 불러온 일부 매물만 반영한 요약입니다.")
    ).toBeVisible();
    await expect(recentSalesButton(page)).toBeVisible();
    await expect(recentSalesDialog(page)).not.toBeVisible();
    await expect.poll(() => counts.auction).toBe(1);
    await expect.poll(() => counts.history).toBe(1);
});

test("auction comparison limits and clears selected listings", async ({
    page,
}) => {
    await openMarket(page);
    await searchMarket(page);
    await selectComparisonItems(page, [1, 2, 3, 4]);
    const selection = page.getByRole("region", { name: "비교할 매물" });

    await expect(selection.getByText("(4/4)", { exact: false })).toBeVisible();
    await comparisonCheckbox(page, 5).click();
    await expect(selection.getByRole("alert")).toHaveText(
        "최대 4개까지 비교할 수 있습니다."
    );
    await expect(comparisonCheckbox(page, 5)).not.toBeChecked();
    await selection
        .getByRole("button", { name: /아이템 1 비교에서 제거/ })
        .click();
    await expect(selection.getByText("(3/4)", { exact: false })).toBeVisible();
    await selection.getByRole("button", { name: "전체 해제" }).click();
    await expect(selection).not.toBeVisible();
});

test("auction comparison aligns options in an accessible dialog", async ({
    page,
}) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    await selectComparisonItems(page, [1, 2, 3, 4]);
    const selection = page.getByRole("region", { name: "비교할 매물" });
    await selection.getByText("아이템 1 옵션 보기").click();
    await expect(selection.getByText("공격 10~20")).toBeVisible();
    const trigger = page.getByRole("button", { name: "선택한 매물 비교" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "장비 매물 비교" });

    await expect(
        dialog.getByRole("columnheader", { name: /매물 1/ })
    ).toContainText("100 Gold");
    await expect(dialog.getByRole("row", { name: /공격/ })).toContainText(
        "수치 차이 있음"
    );
    await expect(
        dialog.getByRole("row", { name: /밸런스/ }).getByText("—")
    ).toHaveCount(3);
    await expect(
        dialog.getByRole("row", { name: /최대 대미지 증가/ })
    ).toContainText("최대 대미지 10 증가");
    await verifyMobileComparisonScroll(page);
    await dialog.getByRole("button", { name: "닫기" }).click();
    await expect(trigger).toBeFocused();
    expect(counts).toEqual({ auction: 1, history: 1 });
});

test("inexact item names show recent-sales guidance", async ({ page }) => {
    await openMarket(page);
    await page.unroute("**/api/auction/history?**");
    await page.route("**/api/auction/history?**", route =>
        route.fulfill({
            status: 422,
            json: { error: "Exact item name required" },
        })
    );

    await page.getByPlaceholder("아이템명").fill("부분 이름");
    await Promise.all([
        page.waitForResponse(
            response =>
                new URL(response.url()).pathname ===
                    "/api/auction/keyword-search" && response.ok()
        ),
        page.waitForResponse(
            response =>
                new URL(response.url()).pathname === "/api/auction/history" &&
                response.status() === 422
        ),
        page.getByRole("button", { name: "검색" }).click(),
    ]);
    await expect(
        page.getByText(
            "최근 완료 거래는 정확한 아이템명으로만 조회할 수 있습니다. 검색 제안에서 아이템을 선택해 주세요.",
            { exact: true }
        )
    ).toHaveAttribute("role", "status");
    const listings = page.getByRole("region", { name: "현재 등록 매물" });
    await expect(listings.getByRole("alert")).not.toBeVisible();
});

test("auction comparison survives pagination and resets on search", async ({
    page,
}) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    await comparisonCheckbox(page, 1).click();
    await page.getByLabel("다음 페이지").click();
    await comparisonCheckbox(page, 11).click();
    await expect(
        page
            .getByRole("region", { name: "비교할 매물" })
            .getByText("아이템 1", { exact: true })
    ).toBeVisible();

    await searchMarket(page, "새 아이템");
    await expect(
        page.getByRole("region", { name: "비교할 매물" })
    ).not.toBeVisible();
    await expect(comparisonCheckbox(page, 1)).not.toBeChecked();
    expect(counts).toEqual({ auction: 2, history: 2 });
});

test("recent-sales modal preserves search context without requests", async ({
    page,
}) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    const trigger = recentSalesButton(page);
    await trigger.click();
    const dialog = recentSalesDialog(page);
    await expect(dialog.locator("tbody tr td:nth-child(2)")).toHaveText([
        "가장 최근 거래",
        "두 번째 거래",
        "첫 번째 거래",
    ]);
    await dialog.getByRole("button", { name: "닫기" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await page.getByRole("button", { name: "아이템 1", exact: true }).click();
    await expect(
        page.getByRole("dialog", { name: "아이템 옵션" })
    ).toBeVisible();
    await page.getByRole("button", { name: "닫기" }).click();
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("아이템");
    await expect(
        page.getByRole("button", { name: "모든 카테고리", exact: true })
    ).toBeVisible();
    expect(counts).toEqual({ auction: 1, history: 1 });
});

test("auction pagination survives the recent-sales modal", async ({ page }) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    await page.getByLabel("다음 페이지").click();
    await expect(page.getByRole("button", { name: "아이템 11" })).toBeVisible();
    await recentSalesButton(page).click();
    await recentSalesDialog(page).getByRole("button", { name: "닫기" }).click();
    await expect(page.getByRole("button", { name: "아이템 11" })).toBeVisible();
    expect(counts).toEqual({ auction: 1, history: 1 });
});

test("a new auction search resets pagination after closing the modal", async ({
    page,
}) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    await page.getByLabel("다음 페이지").click();
    await recentSalesButton(page).click();
    await page.keyboard.press("Escape");
    await searchMarket(page, "새 아이템");
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("새 아이템");
    await expect(
        page.getByRole("button", { name: "아이템 1", exact: true })
    ).toBeVisible();
    await expect(recentSalesDialog(page)).not.toBeVisible();
    await expect(recentSalesButton(page)).toBeVisible();
    expect(counts).toEqual({ auction: 2, history: 2 });
});

test("favorite click uses the selected favorite in its first request", async ({
    page,
}) => {
    const auctionRequests: URL[] = [];
    const historyRequests: URL[] = [];
    await page.addInitScript(() => {
        localStorage.setItem(
            "favorites",
            JSON.stringify([{ itemName: "테스트+검", category: "검" }])
        );
    });
    await page.route("**/api/auction?**", route => {
        auctionRequests.push(new URL(route.request().url()));
        return route.fulfill({
            json: { items: [], hasMore: false, nextCursor: null },
        });
    });
    await page.route("**/api/auction/history?**", route => {
        historyRequests.push(new URL(route.request().url()));
        return route.fulfill({ json: { sales: [], hasMore: false } });
    });

    await page.goto("/auction");
    await page.getByRole("button", { name: "즐겨찾기 보기" }).click();
    await page.getByRole("button", { name: "테스트+검 (검)" }).click();
    await expect.poll(() => auctionRequests.length).toBe(1);
    await expect.poll(() => historyRequests.length).toBe(1);
    expect(auctionRequests[0].searchParams.get("item_name")).toBe("테스트+검");
    expect(auctionRequests[0].searchParams.get("auction_item_category")).toBe(
        "검"
    );
    expect(historyRequests[0].searchParams.get("item_name")).toBe("테스트+검");
});

test("corrupt favorite storage does not crash auction", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", error => errors.push(error));
    await page.addInitScript(() =>
        localStorage.setItem("favorites", "{broken")
    );
    await page.goto("/auction");
    await page.getByRole("button", { name: "즐겨찾기 보기" }).click();
    await expect(page.getByText("저장된 즐겨찾기가 없습니다.")).toBeVisible();
    expect(errors).toEqual([]);
});

test("superseded suggestions cannot overwrite the latest results", async ({
    page,
}) => {
    let releaseOld: (() => void) | undefined;
    const oldRequestReleased = new Promise<void>(resolve => {
        releaseOld = resolve;
    });
    await page.route("**/api/suggest?**", async route => {
        const query = new URL(route.request().url()).searchParams.get("q");
        if (query === "오래된") {
            await oldRequestReleased;
            await route.fulfill({ json: { suggestions: ["오래된 결과"] } });
            return;
        }
        await route.fulfill({ json: { suggestions: ["최신 결과"] } });
    });

    await page.goto("/auction", { waitUntil: "networkidle" });
    const input = page.getByPlaceholder("아이템명");
    const oldRequest = page.waitForRequest(request => {
        const url = new URL(request.url());
        return (
            url.pathname === "/api/suggest" &&
            url.searchParams.get("q") === "오래된"
        );
    });
    await input.fill("오래된");
    await oldRequest;
    await input.fill("최신");
    await expect(page.getByText("최신 결과")).toBeVisible();
    releaseOld?.();
    await page.waitForTimeout(100);
    await expect(page.getByText("오래된 결과")).toHaveCount(0);
});

test("contact failure preserves the form and shows an error", async ({
    page,
}) => {
    await page.route("**/api/contact", route =>
        route.fulfill({ status: 429, json: { error: "Too many requests" } })
    );
    await page.goto("/contact", { waitUntil: "networkidle" });
    await page.getByLabel("닉네임").fill("테스터");
    await page.getByLabel("이메일").fill("user@example.com");
    await page.getByLabel("제목").fill("문의 제목");
    await page.getByLabel("메시지").fill("열 글자가 넘는 문의 메시지입니다.");
    await Promise.all([
        page.waitForResponse(
            response => new URL(response.url()).pathname === "/api/contact"
        ),
        page.getByRole("button", { name: "전송" }).click(),
    ]);
    await expect(page.getByText("Too many requests")).toBeVisible();
    await expect(page.getByLabel("닉네임")).toHaveValue("테스터");
});

test("contact success clears the form", async ({ page }) => {
    await page.route("**/api/contact", route =>
        route.fulfill({ status: 200, json: { message: "ok" } })
    );
    await page.goto("/contact", { waitUntil: "networkidle" });
    await page.getByLabel("닉네임").fill("테스터");
    await page.getByLabel("이메일").fill("user@example.com");
    await page.getByLabel("제목").fill("문의 제목");
    await page.getByLabel("메시지").fill("열 글자가 넘는 문의 메시지입니다.");
    await Promise.all([
        page.waitForResponse(
            response => new URL(response.url()).pathname === "/api/contact"
        ),
        page.getByRole("button", { name: "전송" }).click(),
    ]);
    await expect(
        page.getByText("문의가 성공적으로 전송되었습니다.")
    ).toBeVisible();
    await expect(page.getByLabel("닉네임")).toHaveValue("");
});

test("horn preferences restore before automatic refresh and polling", async ({
    page,
}) => {
    const hornRequests: URL[] = [];
    await page.clock.install();
    await page.addInitScript(() => {
        if (!localStorage.getItem("hornPreferences")) {
            localStorage.setItem(
                "hornPreferences",
                JSON.stringify({
                    selectedServer: "울프",
                    alertKeywords: ["거래"],
                    soundEnabled: false,
                })
            );
        }
    });
    await page.route("**/api/horn?**", route => {
        hornRequests.push(new URL(route.request().url()));
        return route.fulfill({
            json: {
                horn_bugle_world_history: [
                    {
                        character_name: "테스터",
                        message: "거래 메시지",
                        date_send: "2026-08-23T00:00:00Z",
                    },
                ],
            },
        });
    });

    await page.goto("/horn");
    await expect.poll(() => hornRequests.length).toBeGreaterThan(0);
    expect(
        hornRequests.every(
            request => request.searchParams.get("server_name") === "울프"
        )
    ).toBe(true);
    await expect(page.getByText("거래 메시지")).toBeVisible();
    const requestCount = hornRequests.length;
    await page.locator(".dropdown").first().getByRole("button").click();
    await page.getByText("류트", { exact: true }).click();
    await expect.poll(() => hornRequests.length).toBeGreaterThan(requestCount);
    expect(hornRequests.at(-1)?.searchParams.get("server_name")).toBe("류트");
    const changedServerRequestCount = hornRequests.length;
    await page.clock.fastForward(60_000);
    await expect
        .poll(() => hornRequests.length)
        .toBeGreaterThan(changedServerRequestCount);
    expect(hornRequests.at(-1)?.searchParams.get("server_name")).toBe("류트");
    await expect(
        page.locator(".dropdown").first().getByRole("button")
    ).toHaveCSS("white-space", "nowrap");

    await page.reload();
    await expect(
        page.locator(".dropdown").first().getByRole("button")
    ).toHaveText("류트");
    await page.getByRole("button", { name: "알림" }).click();
    await expect(page.getByText("거래", { exact: true })).toBeVisible();
    await expect(
        page.getByRole("checkbox", { name: "소리 알림 사용" })
    ).not.toBeChecked();
});

test("npc shop validates and renders upstream images without page errors", async ({
    page,
}) => {
    const errors: Error[] = [];
    page.on("pageerror", error => errors.push(error));
    await page.route("**/_next/image?**", route =>
        route.fulfill({
            status: 200,
            contentType: "image/png",
            body: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
                "base64"
            ),
        })
    );
    await page.route("**/api/npc-shop?**", route =>
        route.fulfill({
            json: {
                shop: [
                    {
                        tab_name: "일반",
                        item: [
                            {
                                item_display_name: "테스트 아이템",
                                image_url:
                                    "https://open.api.nexon.com/static/mabinogi/img/2a6edef8ae26db199589dcc94e518766?q=4b455a545a465d4387464e515e544f555d8a50425e415c494e55844350525953494e4e8f4c434c424d4e4a558848494960524b5449",
                                price: [
                                    { price_type: "골드", price_value: 100 },
                                ],
                            },
                        ],
                    },
                ],
            },
        })
    );
    await page.goto("/npc-shop");
    await page.locator("#npc_name").selectOption("델");
    await page.locator("#server_name").selectOption("류트");
    await page.locator("#channel").fill("1");
    await page.getByRole("button", { name: "조회" }).click();
    await expect(page.getByText("테스트 아이템")).toBeVisible();
    const image = page.getByAltText("테스트 아이템");
    await expect(image).toHaveAttribute("width", "64");
    await expect(image).toHaveAttribute("height", "64");
    await expect(image).toHaveAttribute(
        "src",
        /_next\/image\?url=https%3A%2F%2Fopen\.api\.nexon\.com%2Fstatic%2Fmabinogi%2Fimg%2F/
    );
    expect(errors).toEqual([]);
});
