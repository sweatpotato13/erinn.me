import { expect, type Locator, type Page, test } from "@playwright/test";

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
    item_name: index < 4 ? "공통 아이템" : "기타 아이템",
    item_display_name: `아이템 ${index + 1}`,
    item_count: index + 1,
    auction_price_per_unit: (index + 1) * 100,
    date_auction_expire: "2026-08-20T00:00:00Z",
    item_option: marketOptions[index] ?? [],
}));
const marketFetchedAt = "2026-08-20T04:00:00.000Z";
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

type MarketRouteOptions = {
    currentHasMore?: boolean;
    recentHasMore?: boolean;
};

async function setupMarketRoutes(
    page: Page,
    { currentHasMore = true, recentHasMore = false }: MarketRouteOptions = {}
) {
    const counts = { auction: 0, history: 0 };
    const auctionResponse = (url: string) => {
        const filtered = Array.from(new URL(url).searchParams.keys()).some(
            key => key.startsWith("option_")
        );
        return filtered
            ? {
                  items: marketItems,
                  hasMore: false,
                  nextCursor: null,
                  evaluation: {
                      scannedCount: marketItems.length,
                      unevaluableCount: 1,
                  },
              }
            : {
                  items: marketItems,
                  hasMore: currentHasMore,
                  nextCursor: currentHasMore ? "next" : null,
              };
    };
    await page.route("**/api/suggest?**", route =>
        route.fulfill({ json: { suggestions: [] } })
    );
    await page.route("**/api/auction/keyword-search?**", route => {
        counts.auction += 1;
        return route.fulfill({ json: auctionResponse(route.request().url()) });
    });
    await page.route("**/api/auction?**", route => {
        counts.auction += 1;
        return route.fulfill({ json: auctionResponse(route.request().url()) });
    });
    await page.route("**/api/auction/history?**", route => {
        counts.history += 1;
        return route.fulfill({
            json: {
                sales: marketSales,
                hasMore: recentHasMore,
                fetchedAt: marketFetchedAt,
            },
        });
    });
    return counts;
}

async function openMarket(page: Page, options?: MarketRouteOptions) {
    const counts = await setupMarketRoutes(page, options);
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
        page.getByRole("button", { name: "검색", exact: true }).click(),
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

async function expectRecentSalesChart(dialog: Locator) {
    const chart = dialog.getByRole("img", {
        name: "최근 1시간 완료 거래 단가 추이",
    });
    await expect(chart).toBeVisible();
    await expect(
        dialog.getByText("최근 1시간 완료 거래 단가 추이")
    ).toBeVisible();
    await expect(chart.getByText("완료 단가 (Gold)")).toBeVisible();
    await expect(chart.getByText("거래 시각", { exact: true })).toBeVisible();
    await expect(dialog.locator("tbody tr")).toHaveCount(3);
    await expect(chart.locator("circle")).toHaveCount(3);
    expect(
        await chart.evaluate(svg => {
            const figure = svg.closest("figure");
            return (
                figure?.previousElementSibling?.tagName === "DL" &&
                figure.nextElementSibling?.querySelector("table") !== null
            );
        })
    ).toBe(true);
    const chartBox = await chart.boundingBox();
    const contentBox = await chart.locator("..").boundingBox();
    expect(chartBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(chartBox!.width).toBeLessThanOrEqual(contentBox!.width + 1);
}

async function closeRecentSalesChart(
    page: Page,
    dialog: Locator,
    trigger: Locator,
    listings: Locator
) {
    await dialog.getByRole("button", { name: "닫기" }).click();
    await expect(trigger).toBeFocused();
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("아이템");
    await expect(listings.getByRole("table")).toBeVisible();
}

function comparisonCheckbox(page: Page, itemNumber: number) {
    return page.getByRole("checkbox", {
        name: new RegExp(`^아이템 ${itemNumber}, .*비교 선택$`),
    });
}

function resultFilterDialog(page: Page) {
    return page.getByRole("dialog", { name: "결과 필터" });
}

async function applyAuctionResultFilters(
    page: Page,
    filters: { exactItemName?: string; min?: string; max?: string }
) {
    await page.getByRole("button", { name: /^결과 필터(?:,|$)/ }).click();
    const dialog = resultFilterDialog(page);
    if (filters.exactItemName) {
        await dialog
            .getByLabel("정확한 아이템")
            .selectOption(filters.exactItemName);
    }
    if (filters.min) await dialog.getByLabel("최소 단가").fill(filters.min);
    if (filters.max) await dialog.getByLabel("최대 단가").fill(filters.max);
    await dialog.getByRole("button", { name: "적용" }).click();
}

async function expectResponsiveResultFilterDialog(
    page: Page,
    table: Locator,
    trigger: Locator
) {
    await trigger.scrollIntoViewIfNeeded();
    const tableBefore = await table.boundingBox();
    const triggerBox = await trigger.boundingBox();
    await trigger.click();
    const dialog = resultFilterDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "닫기" })).toBeFocused();
    const dialogBox = await dialog.boundingBox();
    const viewport = page.viewportSize()!;
    expect(tableBefore).not.toBeNull();
    await expect.poll(() => table.boundingBox()).toEqual(tableBefore);
    expect(triggerBox).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    if (viewport.width < 640) {
        expect(
            await dialog.evaluate(node => getComputedStyle(node).position)
        ).toBe("fixed");
        expect(
            await dialog.evaluate(node => getComputedStyle(node).bottom)
        ).toBe("0px");
        expect(dialogBox!.width).toBeGreaterThanOrEqual(viewport.width - 32);
        expect(dialogBox!.width).toBeLessThanOrEqual(viewport.width);
        expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
        expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(
            viewport.height
        );
    } else {
        expect(dialogBox!.width).toBeLessThan(400);
        expect(dialogBox!.y).toBeGreaterThanOrEqual(triggerBox!.y);
        expect(
            Math.abs(
                dialogBox!.x +
                    dialogBox!.width -
                    (triggerBox!.x + triggerBox!.width)
            )
        ).toBeLessThanOrEqual(2);
    }
    return dialog;
}

async function expectFilteredAuctionResults(page: Page, listings: Locator) {
    await expect(
        page.getByRole("button", { name: "결과 필터, 2개 적용" })
    ).toBeVisible();
    await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
    await expect(listings.locator("tbody tr")).toHaveCount(4);
    for (const itemNumber of [1, 2, 3, 4]) {
        await expect(
            page.getByRole("button", { name: `아이템 ${itemNumber}` })
        ).toBeVisible();
    }
    const metrics = listings.locator("dl");
    await expect(metrics.getByText("100 Gold")).toBeVisible();
    await expect(metrics.getByText("250 Gold")).toBeVisible();
    await expect(metrics.getByText("4개")).toBeVisible();
    await expect(metrics.getByText("10개")).toBeVisible();
    await expect(listings.getByText(/최근 1시간 거래 중앙값 대비/)).toHaveCount(
        0
    );
    await expect(
        listings.getByText(
            "필터 선택지와 요약은 현재 불러온 일부 매물만 반영합니다."
        )
    ).toBeVisible();
}

async function verifyMobileListingScroll(page: Page, listings: Locator) {
    if ((page.viewportSize()?.width ?? 1000) >= 640) return;
    const scroll = listings.getByRole("table").locator("..");
    await scroll.scrollIntoViewIfNeeded();
    await expect
        .poll(() =>
            scroll.evaluate(node => node.scrollWidth > node.clientWidth)
        )
        .toBe(true);
    await scroll.evaluate(node => {
        node.scrollLeft = node.scrollWidth;
    });
    await expect(
        listings.getByRole("columnheader", { name: /비교/ })
    ).toBeInViewport();
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

const filteredAuctionPreset = {
    name: "주력 장비",
    itemName: "아이템",
    category: "검",
    optionFilters: {
        enchantName: "여명",
        reforge: { optionName: "볼트 대미지", minLevel: 10 },
        erg: { grade: "S", minLevel: 40 },
    },
};

function auctionPresetDialog(page: Page) {
    return page.getByRole("dialog", { name: "검색 프리셋" });
}

function auctionPresetRow(dialog: Locator, name: string) {
    return dialog.getByRole("heading", { name }).locator("..");
}

async function storedAuctionPresets(page: Page): Promise<unknown[]> {
    const presets: unknown = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("auctionOptionPresets")!)
    );
    if (!Array.isArray(presets)) {
        throw new Error("Stored auction presets must be an array");
    }
    return presets;
}

async function seedAuctionPreset(page: Page) {
    await page.addInitScript(preset => {
        localStorage.setItem("auctionOptionPresets", JSON.stringify([preset]));
    }, filteredAuctionPreset);
}

async function saveFilteredAuctionPreset(page: Page) {
    const counts = await setupMarketRoutes(page);
    await page.goto("/auction", { waitUntil: "networkidle" });
    await page.getByPlaceholder("아이템명").fill("아이템");
    await page.getByRole("button", { name: "모든 카테고리" }).click();
    await page.getByRole("button", { name: "검", exact: true }).click();
    await page.locator("summary").filter({ hasText: "장비 옵션 필터" }).click();
    await page.getByLabel("인챈트 이름").fill("여명");
    await page.getByLabel("세공 옵션 이름").fill("볼트 대미지");
    await page.getByLabel("세공 최소 레벨").fill("10");
    await page.getByRole("checkbox", { name: "에르그 있음" }).check();
    await page.getByLabel("에르그 등급").selectOption("S");
    await page.getByLabel("에르그 최소 레벨").fill("40");
    await page.getByRole("button", { name: "조건 적용" }).click();
    await expect.poll(() => counts.auction).toBe(1);
    await page.getByPlaceholder("아이템명").fill("저장하면 안 되는 초안");
    await page.getByRole("button", { name: "검색 프리셋" }).click();
    const dialog = auctionPresetDialog(page);
    await expect(
        dialog.getByText(/다른 기기와 동기화되지 않습니다/)
    ).toBeVisible();
    await dialog.getByLabel("프리셋 이름").fill(filteredAuctionPreset.name);
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog.getByRole("status")).toHaveText(
        "프리셋을 저장했습니다."
    );
    return { counts, dialog };
}

async function installHornNotificationFake(page: Page) {
    await page.addInitScript(() => {
        const notifications: Array<{
            title: string;
            options?: NotificationOptions;
        }> = [];
        class FakeNotification {
            static permission: NotificationPermission = "default";
            static requestPermission() {
                FakeNotification.permission = "granted";
                return Promise.resolve(FakeNotification.permission);
            }
            onclick: (() => void) | null = null;

            constructor(
                public title: string,
                public options?: NotificationOptions
            ) {
                notifications.push({ title, options });
            }

            close() {}
        }
        Object.defineProperty(window, "Notification", {
            configurable: true,
            value: FakeNotification,
        });
        Object.assign(window, { __hornNotifications: notifications });
        localStorage.setItem(
            "hornPreferences",
            JSON.stringify({
                selectedServer: "울프",
                alertKeywords: ["거래", "메시지"],
                soundEnabled: false,
                browserNotificationsEnabled: false,
            })
        );
    });
}

async function capturedHornNotifications(page: Page) {
    return page.evaluate(
        () =>
            (
                window as typeof window & {
                    __hornNotifications: Array<{
                        title: string;
                        options?: NotificationOptions;
                    }>;
                }
            ).__hornNotifications
    );
}

test("auction URL restores on open and refresh", async ({ page }) => {
    const counts = await setupMarketRoutes(page);
    await page.goto(
        "/auction?q=한글+검&category=검&option_enchant=여명&option_erg=present&option_erg_grade=S",
        { waitUntil: "networkidle" }
    );

    await expect(page.getByPlaceholder("아이템명")).toHaveValue("한글 검");
    await expect(
        page.getByRole("button", { name: "검", exact: true })
    ).toBeVisible();
    await expect(page.getByText("인챈트: 여명")).toBeVisible();
    await expect(page.getByText("에르그: 있음, S등급")).toBeVisible();
    await expect.poll(() => counts).toEqual({ auction: 1, history: 1 });

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("한글 검");
    await expect(page.getByText("인챈트: 여명")).toBeVisible();
    await expect.poll(() => counts).toEqual({ auction: 2, history: 2 });
});

test("auction option filters validate, apply, remove, clear, and follow history", async ({
    page,
}) => {
    const counts = await setupMarketRoutes(page);
    await page.goto("/auction", { waitUntil: "networkidle" });
    await page.getByPlaceholder("아이템명").fill("아이템");
    await page.locator("summary").filter({ hasText: "장비 옵션 필터" }).click();
    await page.getByLabel("세공 옵션 이름").fill("볼트 대미지");
    await page.getByRole("button", { name: "조건 적용" }).click();
    await expect(
        page.getByRole("alert").filter({
            hasText: "세공 옵션 이름과 최소 레벨을 함께 입력해주세요.",
        })
    ).toBeVisible();
    expect(counts).toEqual({ auction: 0, history: 0 });
    expect(new URL(page.url()).searchParams.has("q")).toBe(false);

    await page.getByLabel("인챈트 이름").fill("여명");
    await page.getByLabel("세공 최소 레벨").fill("10");
    await page.getByRole("checkbox", { name: "에르그 있음" }).check();
    await page.getByLabel("에르그 등급").selectOption("S");
    await page.getByLabel("에르그 최소 레벨").fill("40");
    await page.getByRole("button", { name: "조건 적용" }).click();

    await expect.poll(() => counts.auction).toBe(1);
    await expect.poll(() => counts.history).toBe(1);
    const appliedUrl = new URL(page.url());
    expect(appliedUrl.searchParams.get("q")).toBe("아이템");
    expect(appliedUrl.searchParams.get("option_enchant")).toBe("여명");
    expect(appliedUrl.searchParams.get("option_reforge")).toBe("볼트 대미지");
    expect(appliedUrl.searchParams.get("option_reforge_min_level")).toBe("10");
    expect(appliedUrl.searchParams.get("option_erg_grade")).toBe("S");
    expect(appliedUrl.searchParams.get("option_erg_min_level")).toBe("40");

    const active = page.getByRole("region", {
        name: "활성 장비 옵션 조건",
    });
    await expect(active.getByText("인챈트: 여명")).toBeVisible();
    await expect(active.getByText(/모든 활성 조건을 만족/)).toContainText(
        "최근 완료 거래에는 적용되지 않습니다."
    );
    await expect(
        page.getByText(/장비 옵션 조건으로 전체 11개 매물을 확인했습니다/)
    ).toContainText("판정할 수 없는 1개 매물은 결과에서 제외했습니다.");
    await expect(page.getByText(/최근 1시간 거래 중앙값 대비/)).toHaveCount(0);

    const details = page.locator("details").filter({
        hasText: "장비 옵션 필터",
    });
    await details.locator("summary").click();
    await expect(details).not.toHaveAttribute("open", "");
    await expect(active.getByText("인챈트: 여명")).toBeVisible();

    await page.getByPlaceholder("아이템명").fill("미제출 검색어");
    await active
        .getByRole("button", {
            name: "세공: 볼트 대미지 10레벨 이상 조건 제거",
        })
        .click();
    await expect.poll(() => counts.auction).toBe(2);
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("아이템");
    expect(new URL(page.url()).searchParams.get("q")).toBe("아이템");
    expect(new URL(page.url()).searchParams.has("option_reforge")).toBe(false);

    await active
        .getByRole("button", { name: "장비 옵션 조건 전체 해제" })
        .click();
    await expect.poll(() => counts.auction).toBe(3);
    expect(
        Array.from(new URL(page.url()).searchParams.keys()).some(key =>
            key.startsWith("option_")
        )
    ).toBe(false);
    await expect(active).not.toBeVisible();

    await page.goBack();
    await expect(page.getByText("인챈트: 여명")).toBeVisible();
    await expect.poll(() => counts.auction).toBe(4);
    await page.goForward();
    await expect(page.getByText("인챈트: 여명")).not.toBeVisible();
    await expect.poll(() => counts.auction).toBe(5);

    if ((page.viewportSize()?.width ?? 1000) < 640) {
        await expect
            .poll(() =>
                page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        document.documentElement.clientWidth
                )
            )
            .toBe(true);
    }
});

test("auction presets persist and restore the committed search", async ({
    page,
}) => {
    const { counts, dialog } = await saveFilteredAuctionPreset(page);
    expect(await storedAuctionPresets(page)).toEqual([filteredAuctionPreset]);
    await dialog.getByRole("button", { name: "닫기" }).click();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "검색 프리셋" }).click();
    const beforeLoad = counts.auction;
    await auctionPresetRow(auctionPresetDialog(page), "주력 장비")
        .getByRole("button", { name: "불러오기" })
        .click();
    await expect.poll(() => counts.auction).toBe(beforeLoad + 1);
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("아이템");
    await expect(page.getByText("인챈트: 여명")).toBeVisible();
    await expect(page.getByText("세공: 볼트 대미지 10레벨 이상")).toBeVisible();
    await expect(
        page.getByText("에르그: 있음, S등급, 40레벨 이상")
    ).toBeVisible();
});

test("auction presets can be renamed", async ({ page }) => {
    await seedAuctionPreset(page);
    await openMarket(page);
    await page.getByRole("button", { name: "검색 프리셋" }).click();
    const dialog = auctionPresetDialog(page);
    const row = auctionPresetRow(dialog, "주력 장비");
    await row.getByRole("button", { name: "이름 변경" }).click();
    await row.getByLabel("주력 장비 새 이름").fill("에르그 장비");
    await row.getByRole("button", { name: "확인" }).click();
    await expect(
        dialog.getByRole("heading", { name: "에르그 장비" })
    ).toBeVisible();
    expect(await storedAuctionPresets(page)).toEqual([
        { ...filteredAuctionPreset, name: "에르그 장비" },
    ]);
});

test("auction presets can be deleted", async ({ page }) => {
    await seedAuctionPreset(page);
    await openMarket(page);
    await page.getByRole("button", { name: "검색 프리셋" }).click();
    const dialog = auctionPresetDialog(page);
    const row = auctionPresetRow(dialog, "주력 장비");
    await row.getByRole("button", { name: "삭제" }).click();
    await expect(
        dialog.getByText("저장된 검색 프리셋이 없습니다.")
    ).toBeVisible();
    expect(await storedAuctionPresets(page)).toEqual([]);
});

test("auction preset duplicate names and the 20-item limit show feedback", async ({
    page,
}) => {
    await page.addInitScript(() => {
        localStorage.setItem(
            "auctionOptionPresets",
            JSON.stringify(
                Array.from({ length: 20 }, (_, index) => ({
                    name: `프리셋 ${index}`,
                    itemName: "아이템",
                    category: "모든 카테고리",
                    optionFilters: {},
                }))
            )
        );
    });
    await openMarket(page);
    await searchMarket(page);
    await page.getByRole("button", { name: "검색 프리셋" }).click();
    const dialog = page.getByRole("dialog", { name: "검색 프리셋" });
    const name = dialog.getByLabel("프리셋 이름");

    await name.fill(" 프리셋   0 ");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
        "같은 이름의 프리셋이 이미 있습니다."
    );
    await name.fill("추가 프리셋");
    await dialog.getByRole("button", { name: "저장" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
        "프리셋은 최대 20개까지 저장할 수 있습니다."
    );
    await expect(dialog.getByText("저장된 프리셋 (20/20)")).toBeVisible();
});

test("auction presets recover from corrupt storage and preview obsolete filters", async ({
    page,
}) => {
    const counts = await setupMarketRoutes(page);
    await page.addInitScript(() => {
        if (sessionStorage.getItem("auctionPresetSeeded")) return;
        sessionStorage.setItem("auctionPresetSeeded", "true");
        localStorage.setItem("auctionOptionPresets", "{broken");
    });
    await page.goto("/auction", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "검색 프리셋" }).click();
    let dialog = page.getByRole("dialog", { name: "검색 프리셋" });
    await expect(dialog.getByRole("status")).toHaveText(
        "읽을 수 없는 저장 프리셋 1개를 제외했습니다."
    );
    await expect(
        dialog.getByText("저장된 검색 프리셋이 없습니다.")
    ).toBeVisible();
    await dialog.getByRole("button", { name: "닫기" }).click();
    await searchMarket(page);

    await page.evaluate(() => {
        localStorage.setItem(
            "auctionOptionPresets",
            JSON.stringify([
                {
                    name: "구형 프리셋",
                    itemName: "복구 검",
                    category: "모든 카테고리",
                    optionFilters: {
                        enchantName: "여명",
                        removedFilter: true,
                    },
                },
            ])
        );
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "검색 프리셋" }).click();
    dialog = page.getByRole("dialog", { name: "검색 프리셋" });
    const row = dialog
        .getByRole("heading", { name: "구형 프리셋" })
        .locator("..");
    const beforeLoad = counts.auction;
    await row.getByRole("button", { name: "불러오기" }).click();
    const warning = dialog.getByRole("alert");
    await expect(warning.getByText(/removedFilter/)).toBeVisible();
    await expect(warning.getByText(/인챈트: 여명/)).toBeVisible();
    expect(counts.auction).toBe(beforeLoad);

    await warning
        .getByRole("button", { name: "지원되는 조건으로 검색" })
        .click();
    await expect.poll(() => counts.auction).toBe(beforeLoad + 1);
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("복구 검");
    await expect(page.getByText("인챈트: 여명")).toBeVisible();
    expect(new URL(page.url()).searchParams.get("option_enchant")).toBe("여명");
    expect(new URL(page.url()).searchParams.has("option_removedFilter")).toBe(
        false
    );
});

test("auction URL removes invalid option filters with visible feedback", async ({
    page,
}) => {
    const counts = await setupMarketRoutes(page);
    await page.goto("/auction?q=한글+검&option_reforge=볼트", {
        waitUntil: "networkidle",
    });

    await expect(page.getByPlaceholder("아이템명")).toHaveValue("한글 검");
    await expect(
        page.getByRole("alert").filter({
            hasText: "세공 옵션 이름과 최소 레벨을 함께 입력해주세요.",
        })
    ).toBeVisible();
    expect(new URL(page.url()).searchParams.has("option_reforge")).toBe(false);
    expect(counts).toEqual({ auction: 1, history: 1 });
});

test("auction history follows committed searches without duplicate entries", async ({
    page,
}) => {
    const counts = await setupMarketRoutes(page);
    await page.goto("/auction?view=compact", { waitUntil: "networkidle" });

    await searchMarket(page, "첫 검색");
    expect(new URL(page.url()).searchParams.get("view")).toBe("compact");
    expect(new URL(page.url()).searchParams.get("q")).toBe("첫 검색");
    await searchMarket(page, "첫 검색");
    await searchMarket(page, "두 번째 검색");
    expect(counts).toEqual({ auction: 3, history: 3 });

    await page.goBack();
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("첫 검색");
    await expect.poll(() => counts.auction).toBe(4);
    await page.goBack();
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("");
    expect(new URL(page.url()).searchParams.get("view")).toBe("compact");
    expect(new URL(page.url()).searchParams.has("q")).toBe(false);

    await page.goForward();
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("첫 검색");
    await expect.poll(() => counts.auction).toBe(5);
    await page.goForward();
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("두 번째 검색");
    await expect.poll(() => counts.auction).toBe(6);
});

test("auction URL replaces obsolete values with visible feedback", async ({
    page,
}) => {
    const counts = await setupMarketRoutes(page);
    await page.goto("/auction?view=compact&q=한글+검&category=폐기된카테고리", {
        waitUntil: "networkidle",
    });

    const url = new URL(page.url());
    expect(url.searchParams.get("view")).toBe("compact");
    expect(url.searchParams.get("q")).toBe("한글 검");
    expect(url.searchParams.has("category")).toBe(false);
    await expect(
        page.getByRole("alert").filter({
            hasText:
                "유효하지 않은 검색 링크의 일부 조건을 기본값으로 복원했습니다.",
        })
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "모든 카테고리", exact: true })
    ).toBeVisible();
    expect(counts).toEqual({ auction: 1, history: 1 });
});

test("auction search uses native sharing without listing data", async ({
    page,
}) => {
    const prohibitedParams = [
        "cursor",
        "listingId",
        "price",
        "item_count",
        "item_option",
        "date_auction_expire",
    ];
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", {
            configurable: true,
            value: (data: ShareData) => {
                Object.assign(window, { __auctionShare: data });
                return Promise.resolve();
            },
        });
    });
    await setupMarketRoutes(page);
    const query = new URLSearchParams({ view: "compact", q: "한글 검" });
    query.set("option_enchant", "여명");
    prohibitedParams.forEach(key => query.set(key, "stale"));
    await page.goto(`/auction?${query}`, {
        waitUntil: "networkidle",
    });
    for (const key of prohibitedParams) {
        await expect
            .poll(() => new URL(page.url()).searchParams.has(key))
            .toBe(false);
    }
    await page.getByRole("button", { name: "검색 공유" }).click();

    await expect(page.getByText("검색 링크를 공유했습니다.")).toBeVisible();
    const shared = await page.evaluate(
        () =>
            (
                window as typeof window & {
                    __auctionShare: ShareData;
                }
            ).__auctionShare
    );
    expect(shared.title).toBe("Erinn.me 경매장 검색");
    const sharedUrl = new URL(shared.url ?? "");
    expect(sharedUrl.searchParams.get("q")).toBe("한글 검");
    expect(sharedUrl.searchParams.get("option_enchant")).toBe("여명");
    expect(sharedUrl.searchParams.get("view")).toBe("compact");
    for (const key of prohibitedParams) {
        expect(sharedUrl.searchParams.has(key)).toBe(false);
    }
});

test("auction search copies the URL when native sharing is unavailable", async ({
    page,
}) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", {
            configurable: true,
            value: undefined,
        });
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
                writeText: (url: string) => {
                    Object.assign(window, { __auctionCopy: url });
                    return Promise.resolve();
                },
            },
        });
    });
    await setupMarketRoutes(page);
    await page.goto("/auction?q=복사+검색", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "검색 공유" }).click();

    await expect(page.getByText("검색 링크를 복사했습니다.")).toBeVisible();
    const copied = await page.evaluate(
        () =>
            (
                window as typeof window & {
                    __auctionCopy: string;
                }
            ).__auctionCopy
    );
    expect(new URL(copied).searchParams.get("q")).toBe("복사 검색");
});

test("auction search reports a copy failure", async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", {
            configurable: true,
            value: undefined,
        });
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
                writeText: () => Promise.reject(new Error("denied")),
            },
        });
    });
    await setupMarketRoutes(page);
    await page.goto("/auction?q=실패+검색", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "검색 공유" }).click();

    await expect(
        page.getByRole("alert").filter({
            hasText: "검색 링크를 공유하거나 복사하지 못했습니다.",
        })
    ).toBeVisible();
});

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
        listings.getByText(
            "필터 선택지와 요약은 현재 불러온 일부 매물만 반영합니다."
        )
    ).toBeVisible();
    await expect(listings.getByText(/최근 1시간 거래 중앙값 대비/)).toHaveCount(
        0
    );
    await expect(recentSalesButton(page)).toBeVisible();
    await expect(recentSalesDialog(page)).not.toBeVisible();
    await expect.poll(() => counts.auction).toBe(1);
    await expect.poll(() => counts.history).toBe(1);
});

test("auction result filter dialog stays responsive", async ({ page }) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    const listings = page.getByRole("region", { name: "현재 등록 매물" });
    const table = listings.getByRole("table");
    const trigger = page.getByRole("button", { name: "결과 필터" });
    const dialog = await expectResponsiveResultFilterDialog(
        page,
        table,
        trigger
    );
    expect(counts).toEqual({ auction: 1, history: 1 });
    const initialViewport = page.viewportSize()!;
    const alternateViewport = {
        ...initialViewport,
        width: initialViewport.width < 640 ? 800 : 390,
    };
    const expectScrollLock = (locked: boolean) =>
        expect
            .poll(() =>
                page.evaluate(() => [
                    document.documentElement.style.overflow,
                    document.body.style.overflow,
                ])
            )
            .toEqual(locked ? ["hidden", "hidden"] : ["", ""]);
    await expectScrollLock(initialViewport.width < 640);
    await page.setViewportSize(alternateViewport);
    await expectScrollLock(alternateViewport.width < 640);
    await expect(dialog).toBeVisible();
    await page.setViewportSize(initialViewport);
    await expectScrollLock(initialViewport.width < 640);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expectScrollLock(false);
    await page.setViewportSize({ ...initialViewport, width: 800 });
    await page.setViewportSize({ ...initialViewport, width: 390 });
    await expectScrollLock(false);
    await expect(trigger).toBeFocused();
});

test("auction result filters apply and clear without fetching", async ({
    page,
}) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    const listings = page.getByRole("region", { name: "현재 등록 매물" });
    await comparisonCheckbox(page, 5).click();
    await page.getByLabel("다음 페이지").click();
    await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
    await applyAuctionResultFilters(page, {
        exactItemName: "공통 아이템",
        min: "100",
        max: "400",
    });
    await expectFilteredAuctionResults(page, listings);
    expect(counts).toEqual({ auction: 1, history: 1 });
    const sort = page.getByRole("button", { name: /^가격 기준 정렬/ });
    await sort.click();
    await sort.click();
    await expect(listings.locator("tbody tr").first()).toContainText(
        "아이템 4"
    );
    await page.getByRole("button", { name: "결과 필터 전체 해제" }).click();
    await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
    await expect(listings.locator("tbody tr")).toHaveCount(10);
    await expect(comparisonCheckbox(page, 5)).toBeChecked();
    await expect(listings.locator("tbody tr").last()).toContainText("아이템 2");
    const lastRow = listings.locator("tbody tr").last();
    await expect(lastRow.locator("td").nth(2)).toHaveText("200 Gold");
    await expect(lastRow.locator("td").nth(3)).toHaveText("2");
    expect(counts).toEqual({ auction: 1, history: 1 });
    await verifyMobileListingScroll(page, listings);
});

test("auction navigation clears result filters", async ({ page }) => {
    const counts = await openMarket(page);
    await searchMarket(page);
    await applyAuctionResultFilters(page, { min: "300" });
    await expect(
        page.getByRole("button", { name: "결과 필터, 1개 적용" })
    ).toBeVisible();
    await searchMarket(page, "새 아이템");
    await expect(page.getByRole("button", { name: "결과 필터" })).toBeVisible();
    await expect(
        page.getByRole("button", { name: "결과 필터 전체 해제" })
    ).toHaveCount(0);
    await page.goBack({ waitUntil: "networkidle" });
    await expect(page.getByPlaceholder("아이템명")).toHaveValue("아이템");
    await expect(page.getByRole("button", { name: "결과 필터" })).toBeVisible();
    await expect(
        page.getByRole("button", { name: "결과 필터 전체 해제" })
    ).toHaveCount(0);
    await expect.poll(() => counts.auction).toBe(3);
    await expect.poll(() => counts.history).toBe(3);
});

test("compact recent-sale context stays inline and on demand", async ({
    page,
}) => {
    const counts = await openMarket(page, { currentHasMore: false });
    await searchMarket(page);
    const listings = page.getByRole("region", { name: "현재 등록 매물" });
    const lowestMetric = listings.getByText("최저 단가").locator("..");
    const trigger = recentSalesButton(page);

    await expect(lowestMetric.locator("dd")).toContainText("100 Gold");
    await expect(lowestMetric.locator("dd")).toContainText(
        "최근 1시간 거래 중앙값 대비 50% 낮음"
    );
    await expect(
        page.getByRole("img", { name: "최근 1시간 완료 거래 단가 추이" })
    ).toHaveCount(0);
    await expect(listings.getByRole("table")).toBeVisible();

    await trigger.click();
    const dialog = recentSalesDialog(page);
    await expectRecentSalesChart(dialog);
    await closeRecentSalesChart(page, dialog, trigger, listings);
    expect(counts).toEqual({ auction: 1, history: 1 });
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
        page.getByRole("button", { name: "검색", exact: true }).click(),
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
    const firstItem = comparisonCheckbox(page, 1);
    await firstItem.click();
    await expect(firstItem).toBeChecked();
    await page.getByLabel("다음 페이지").click();
    await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
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

test("long item options keep the dialog close control visible", async ({
    page,
}) => {
    await openMarket(page);
    await page.unroute("**/api/auction/keyword-search?**");
    await page.route("**/api/auction/keyword-search?**", route =>
        route.fulfill({
            json: {
                items: marketItems.map((item, index) =>
                    index === 0
                        ? {
                              ...item,
                              item_option: Array.from(
                                  { length: 60 },
                                  (_, optionIndex) => ({
                                      option_type: "세공 옵션",
                                      option_sub_type: `긴 옵션 ${optionIndex + 1}`,
                                      option_value: String(optionIndex + 1),
                                  })
                              ),
                          }
                        : item
                ),
                hasMore: false,
                nextCursor: null,
            },
        })
    );
    await searchMarket(page);
    await page.getByRole("button", { name: "아이템 1", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "아이템 옵션" });
    const close = dialog.getByRole("button", { name: "닫기" });
    const scroll = dialog.getByTestId("item-options-scroll");
    await expect(scroll.getByText("• 60", { exact: true })).toBeVisible();
    const viewport = page.viewportSize()!;
    const dialogBox = (await dialog.boundingBox())!;
    const closeBoxBefore = (await close.boundingBox())!;
    expect(dialogBox.y).toBeGreaterThanOrEqual(0);
    expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height);
    expect(closeBoxBefore.y + closeBoxBefore.height).toBeLessThanOrEqual(
        viewport.height
    );
    await expect
        .poll(() =>
            scroll.evaluate(node => node.scrollHeight > node.clientHeight)
        )
        .toBe(true);
    await scroll.evaluate(node => {
        node.scrollTop = node.scrollHeight;
    });
    expect(await close.boundingBox()).toEqual(closeBoxBefore);
    await close.click();
    await expect(dialog).not.toBeVisible();
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
        return route.fulfill({
            json: { sales: [], hasMore: false, fetchedAt: marketFetchedAt },
        });
    });

    await page.goto("/auction", { waitUntil: "networkidle" });
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
    await page.goto("/auction", { waitUntil: "networkidle" });
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

test("horn browser notifications require consent and avoid duplicate alerts", async ({
    page,
}) => {
    const routeState = { includeNew: false };
    await installHornNotificationFake(page);
    await page.route("**/api/horn?**", route =>
        route.fulfill({
            json: {
                horn_bugle_world_history: routeState.includeNew
                    ? [
                          {
                              character_name: "신규",
                              message: "거래 메시지",
                              date_send: "2026-08-23T00:01:00Z",
                          },
                      ]
                    : [],
            },
        })
    );
    await page.goto("/horn");
    await page.getByRole("button", { name: "알림" }).click();
    await expect(
        page.getByText(/Erinn.me가 열려 있을 때만 최선을 다해 전달/)
    ).toBeVisible();
    await page.getByRole("button", { name: "브라우저 알림 켜기" }).click();
    await expect(
        page.getByText("브라우저 알림이 켜져 있습니다.")
    ).toBeVisible();
    await page.getByRole("button", { name: "닫기" }).click();

    routeState.includeNew = true;
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await expect
        .poll(async () => (await capturedHornNotifications(page)).length)
        .toBe(1);
    expect(await capturedHornNotifications(page)).toEqual([
        { title: "울프 · 신규", options: { body: "거래 메시지" } },
    ]);
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await expect
        .poll(async () => (await capturedHornNotifications(page)).length)
        .toBe(1);
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
                shop_tab_count: 1,
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
                date_inquire: "2026-09-02T00:00:00Z",
                date_shop_next_update: "2026-09-02T00:36:00Z",
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
