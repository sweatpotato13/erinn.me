import { expect, test } from "@playwright/test";

const base = "/simulators/reforge";
const title = "마비노기 세공 시뮬레이터·확률·비용 계산기";
const settings = `${base}?v=1788405829&e=40878&t=1&goals=1:7&mode=and&cap=1000`;

test.beforeEach(async ({ page }) => {
    await page.route(/prilus\.gitlab\.io/, route => route.abort());
    await page.route("**/api/auction/price-summary?*", route =>
        route.fulfill({
            json: {
                minPrice: 0,
                averagePrice: 0,
                availableQuantity: 0,
                isComplete: true,
            },
        })
    );
});

test("equipment search waits for hydration before accepting input", async ({
    page,
}) => {
    let releaseScripts!: () => void;
    const scriptsReady = new Promise<void>(resolve => {
        releaseScripts = resolve;
    });
    await page.route("**/_next/static/chunks/**", async route => {
        if (route.request().resourceType() === "script") await scriptsReady;
        await route.continue();
    });
    await page.goto(base, { waitUntil: "commit" });
    try {
        await expect(page.locator("footer")).toBeVisible();
        await expect(
            page.getByLabel("장비 이름 검색").and(page.locator(":enabled"))
        ).toHaveCount(0);
    } finally {
        releaseScripts();
    }
    await page.getByLabel("장비 이름 검색").fill("켈틱 드루이드 스태프");
    const searchResponse = page.waitForResponse(response => {
        const url = new URL(response.url());
        return (
            url.pathname === "/api/reforge" &&
            url.searchParams.get("q") === "켈틱 드루이드 스태프"
        );
    });
    await page.getByRole("button", { name: "장비 검색", exact: true }).click();
    expect((await searchResponse).status()).toBe(200);
    await expect(
        page.getByRole("button", { name: /^켈틱 드루이드 스태프/ }).first()
    ).toBeVisible();
});

test("tool buttons run the chosen count, preserve tool totals and stop on targets", async ({
    page,
}) => {
    await page.goto(base);
    await page.getByLabel("장비 이름 검색").fill("켈틱 드루이드 스태프");
    await page.getByRole("button", { name: "장비 검색", exact: true }).click();
    await page
        .getByRole("button", { name: /^켈틱 드루이드 스태프/ })
        .first()
        .click();
    await expect(page.getByRole("region", { name: "세공 결과" })).toContainText(
        "1 랭크"
    );
    await expect(page.getByLabel("반복 횟수", { exact: true })).toHaveValue(
        "1"
    );
    await expect(page.getByTestId("target-probability")).toHaveCount(0);
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page
        .getByLabel("정교한 세공 도구 1회 가격 (Gold)", { exact: true })
        .fill("3");
    await page.getByLabel("반복 횟수", { exact: true }).fill("3");
    await page
        .getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("session-attempts")).toHaveText("3회");
    await expect(page.getByTestId("tool-count-1")).toHaveText("3회");
    await expect(page.getByTestId("session-spend")).toHaveText("9 Gold");
    await expect(
        page.getByRole("region", { name: "세공 결과" }).locator("li")
    ).toHaveCount(3);
    await page
        .getByLabel("영롱한 세공 도구 1회 가격 (Gold)", { exact: true })
        .fill("5");
    await page
        .getByRole("button", { name: "영롱한 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("session-attempts")).toHaveText("6회");
    await expect(page.getByTestId("tool-count-4")).toHaveText("3회");
    await expect(page.getByTestId("tool-count-1")).toHaveText("3회");
    await expect(page.getByTestId("session-spend")).toHaveText("24 Gold");
    await page
        .getByLabel("자동 멈춤 옵션 1", { exact: true })
        .selectOption("1");
    await page.getByLabel("최소 레벨 1", { exact: true }).selectOption("7");
    await page.getByLabel("반복 횟수", { exact: true }).fill("1000");
    await page
        .getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("session-attempts")).toHaveText("7회");
    await expect(page.getByTestId("session-spend")).toHaveText("27 Gold");
    await expect(
        page.getByRole("status").filter({ hasText: "목표 달성" })
    ).toBeVisible();
    await expect(page.getByTestId("target-probability")).toBeVisible();
    await page
        .getByLabel("자동 멈춤 옵션 2", { exact: true })
        .selectOption("15");
    await page.getByLabel("자동 멈춤 조건", { exact: true }).selectOption("or");
    await expect(page.getByTestId("session-attempts")).toHaveText("7회");
    await page.getByLabel("확률 기준 도구").selectOption("6");
    await expect(page.getByTestId("session-attempts")).toHaveText("7회");
    await page
        .getByRole("button", { name: "횟수 초기화", exact: true })
        .click();
    await expect(page.getByTestId("session-attempts")).toHaveText("0회");
    await expect(page.getByTestId("tool-count-1")).toHaveText("0회");
    await expect(page.getByTestId("tool-count-4")).toHaveText("0회");
    await expect(page.getByRole("region", { name: "세공 결과" })).toContainText(
        "세공 도구를 눌러 시작하세요."
    );
    await page.getByLabel("자동 멈춤 옵션 1", { exact: true }).selectOption("");
    await page.getByLabel("자동 멈춤 옵션 1", { exact: true }).selectOption("");
    await page.getByText("다른 세공 도구", { exact: true }).click();
    await page.getByLabel("반복 횟수", { exact: true }).fill("1");
    await page
        .getByRole("button", { name: "초심자의 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("tool-count-5")).toHaveText("1회");
    await expect(
        page.getByRole("region", { name: "세공 결과" }).locator("li")
    ).toHaveCount(1);
    await expect(page.getByTestId("session-spend")).toContainText(
        "가격 미입력 1회"
    );
    await page.getByLabel("장비 이름 검색").fill("장갑");
    await page.getByRole("button", { name: "장비 검색", exact: true }).click();
    await page.getByRole("button", { name: /장갑/ }).first().click();
    await expect(page.getByTestId("session-attempts")).toHaveText("0회");
    for (const removed of [
        "설정 링크 복사",
        "등장 옵션과 효과 보기",
        "공유 링크는 장비",
        "이 옵션은 넥슨",
        "Prilus 데이터 출처",
    ]) {
        await expect(page.getByRole("main")).not.toContainText(removed);
    }
    await expect(
        page.getByRole("navigation", { name: "관련 도구" })
    ).toHaveCount(0);
});

test("auction defaults preserve manual prices through delayed responses and equipment changes", async ({
    page,
}) => {
    let releasePrice!: () => void;
    const delayedPrice = new Promise<void>(resolve => {
        releasePrice = resolve;
    });
    await page.route("**/api/auction/price-summary?*", async route => {
        const name = new URL(route.request().url()).searchParams.get(
            "item_name"
        );
        if (name === "정교한 세공 도구") await delayedPrice;
        if (name === "찬란한 세공 도구")
            return route.fulfill({
                status: 503,
                json: { error: "unavailable" },
            });
        const minPrice = name === "초심자의 세공 도구" ? 0 : 1000000;
        await route.fulfill({
            json: {
                minPrice,
                averagePrice: 1500000,
                availableQuantity: minPrice ? 5 : 0,
                isComplete: name !== "수수한 세공 도구",
            },
        });
    });
    await page.goto(settings.replace("cap=1000", "cap=1"));
    const regular = page.getByLabel("정교한 세공 도구 1회 가격 (Gold)", {
        exact: true,
    });
    const fine = page.getByLabel("영롱한 세공 도구 1회 가격 (Gold)", {
        exact: true,
    });
    await expect(fine).toHaveValue("1000000");
    await expect(regular).toHaveAttribute("aria-busy", "true");
    await regular.fill("123");
    releasePrice();
    await expect(regular).toHaveAttribute("aria-busy", "false");
    await expect(regular).toHaveValue("123");
    await page
        .getByRole("button", { name: "영롱한 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("session-spend")).toHaveText(
        "1,000,000 Gold"
    );
    await page
        .getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("session-spend")).toHaveText(
        "1,000,123 Gold"
    );
    await expect(
        page.getByText("가격 조회 실패", { exact: true })
    ).toBeVisible();
    await page.getByText("다른 세공 도구", { exact: true }).click();
    await expect(
        page.getByLabel("수수한 세공 도구 1회 가격 (Gold)")
    ).toHaveValue("1000000");
    await expect(
        page.getByText("조회된 매물 최저가", { exact: true })
    ).toBeVisible();
    await expect(
        page.getByLabel("초심자의 세공 도구 1회 가격 (Gold)")
    ).toHaveValue("");
    await page.getByLabel("장비 이름 검색").fill("장갑");
    await page.getByRole("button", { name: "장비 검색", exact: true }).click();
    await page.getByRole("button", { name: /장갑/ }).first().click();
    await expect(regular).toHaveValue("123");
    await page.goto(settings.replace("cap=1000", "cap=1") + "&price=0");
    await expect(regular).toHaveAttribute("aria-busy", "false");
    await expect(regular).toHaveValue("0");
    await expect(page.getByRole("main")).not.toContainText(
        "한국 서버 로컬 스냅샷"
    );
    await expect(page.getByRole("main")).not.toContainText("원본 기준일");
});

test("runs stay cancellable and invalid settings cannot execute", async ({
    page,
}) => {
    await page.goto(settings.replace("goals=1:7", "goals=1:25") + "&price=0");
    await expect(page.getByTestId("target-probability")).toBeVisible();
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page.getByLabel("반복 횟수", { exact: true }).fill("1000000");
    await page
        .getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
        .click();
    await expect
        .poll(async () =>
            Number(
                (
                    await page.getByTestId("session-attempts").innerText()
                ).replace(/\D/g, "")
            )
        )
        .toBeGreaterThan(100);
    await page.getByRole("button", { name: "중지", exact: true }).click();
    await expect(
        page.getByRole("status").filter({ hasText: "중지했습니다" })
    ).toBeVisible();
    const stopped = await page.getByTestId("session-attempts").innerText();
    await expect(
        page.getByRole("button", { name: "중지", exact: true })
    ).toHaveCount(0);
    await expect(page.getByTestId("session-attempts")).toHaveText(stopped);
    await page.getByLabel("반복 횟수", { exact: true }).fill("0");
    await expect(
        page.getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
    ).toBeDisabled();
    await page.getByLabel("반복 횟수", { exact: true }).fill("1");
    await page
        .getByLabel("정교한 세공 도구 1회 가격 (Gold)", { exact: true })
        .fill("-1");
    await expect(
        page.getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
    ).toBeDisabled();
    await page.goto(settings.replace("goals=1:7", "goals=1:26"));
    await expect(
        page.getByRole("alert").filter({ hasText: "달성 불가능" })
    ).toBeVisible();
    await page
        .getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("session-attempts")).toHaveText("0회");
    await page.goto(settings.replace("1788405829", "1"));
    await expect(
        page.getByText("데이터가 업데이트되어 현재 기준으로 계산합니다.")
    ).toBeVisible();
    await page.goto(settings.replace("e=40878", "e=999999999"));
    await expect(
        page.getByRole("alert").filter({ hasText: "지원하지 않는 장비" })
    ).toBeVisible();
    await page.goto(settings.replace("t=1", "t=3"));
    await expect(
        page.getByRole("alert").filter({ hasText: "지원하지 않는 세공 도구" })
    ).toBeVisible();
    await page.goto(settings + "&t=5");
    await expect(
        page.getByRole("alert").filter({ hasText: "공유 설정이 올바르지" })
    ).toBeVisible();
});

test("released groups, mobile modal keyboard access, long names and reduced motion", async ({
    page,
    browserName,
}) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(settings);
    await expect(page.getByTestId("target-probability")).toBeVisible();
    const trigger = page.getByRole("button", {
        name: "전체 메뉴",
        exact: true,
    });
    await trigger.click();
    const menu = page.getByRole("dialog", { name: "전체 메뉴" });
    await expect(menu).toBeVisible();
    await expect(
        menu.getByRole("link", { name: "세공 시뮬레이터", exact: true })
    ).toHaveAttribute("aria-current", "page");
    for (const path of ["/auction", "/horn", "/npc-shop", "/calculator", base])
        await expect(menu.locator(`a[href="${path}"]`)).toBeVisible();
    await menu.getByRole("button", { name: "메뉴 닫기" }).focus();
    // WebKit follows the platform convention: Option-Tab includes links.
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(
        menu.getByRole("link", { name: "경매장", exact: true })
    ).toBeFocused();
    await page
        .getByLabel("장비 이름 검색")
        .evaluate(el => (el as HTMLElement).focus());
    await expect(
        menu.getByRole("link", { name: "경매장", exact: true })
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await page.getByLabel("장비 이름 검색").fill("스페셜");
    await page.getByRole("button", { name: "장비 검색", exact: true }).click();
    await expect(
        page.getByRole("button", { name: /스페셜/ }).first()
    ).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    const nav = page.getByRole("navigation", { name: "카테고리 탐색" });
    await expect(nav).toBeVisible();
    await nav.locator("summary", { hasText: "강화 시뮬레이터" }).click();
    await expect(
        nav.getByRole("link", { name: "세공 시뮬레이터" })
    ).toBeVisible();
    await nav.getByRole("link", { name: "세공 시뮬레이터" }).focus();
    await page.keyboard.press("Escape");
    await expect(
        nav.locator("summary", { hasText: "강화 시뮬레이터" })
    ).toBeFocused();
    await page.goto("/");
    await expect(
        page
            .getByRole("main")
            .getByRole("heading", { name: "강화 시뮬레이터", exact: true })
    ).toBeVisible();
    await expect(
        page
            .getByRole("main")
            .getByRole("heading", { name: "아이템 비교", exact: true })
    ).toHaveCount(0);
});

test("help navigation is grouped once and desktop menus close outside", async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator('main a[href="/contact"]')).toHaveCount(0);
    await expect(page.locator('footer a[href="/contact"]')).toHaveCount(1);
    await page.goto(base);
    const nav = page.getByRole("navigation", { name: "카테고리 탐색" });
    await nav.locator("summary", { hasText: "거래·조회" }).click();
    await nav.locator("summary", { hasText: "도움" }).click();
    await expect(nav.locator("details[open]")).toHaveCount(2);
    await expect(nav.getByRole("link", { name: "문의하기" })).toBeVisible();
    await page
        .getByRole("heading", { name: "세공 시뮬레이터", exact: true })
        .click();
    await expect(nav.locator("details[open]")).toHaveCount(0);
    await nav.locator("summary", { hasText: "도움" }).click();
    await nav.getByRole("link", { name: "문의하기" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(nav.locator("details[open]")).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "전체 메뉴", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "전체 메뉴" });
    await expect(
        menu.getByRole("heading", { name: "도움", exact: true })
    ).toHaveCount(1);
    await expect(menu.getByRole("link", { name: "문의하기" })).toHaveCount(1);
    await menu.getByRole("link", { name: "문의하기" }).click();
    await expect(menu).not.toBeVisible();
});

test("server HTML, social metadata, real image and base-only sitemap", async ({
    request,
}) => {
    for (const userAgent of ["Mozilla/5.0", "Twitterbot/1.0"]) {
        const response = await request.get(settings, {
            headers: { "User-Agent": userAgent },
        });
        expect(response.status()).toBe(200);
        const html = await response.text();
        expect(html).toContain(`<title>${title} | Erinn.me</title>`);
        expect(html).toContain(
            `rel="canonical" href="https://erinn.me${base}"`
        );
        expect(html).toContain(`content="https://erinn.me${base}/preview"`);
        expect(html).toContain(
            'name="twitter:card" content="summary_large_image"'
        );
        expect(html).toContain("계산 가정과 출처");
        expect(html).toContain("1788405829");
        expect(html).not.toContain("EquipFilterMap");
    }
    const image = await request.get(`${base}/preview`);
    expect(image.headers()["content-type"]).toContain("image/png");
    const png = await image.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(
        sitemap.match(new RegExp(`<loc>https://erinn.me${base}</loc>`, "g"))
    ).toHaveLength(1);
    expect(sitemap).not.toMatch(/\/preview|\?v=|simulators\/echostone/);
    expect(sitemap).toContain("/auction/items/");
});

test("large Gold assumptions stay approximate while session spending stays exact", async ({
    page,
}) => {
    await page.goto(settings + "&price=9007199254740993");
    await expect(
        page.getByRole("heading", { name: "이론 확률과 비용" })
    ).toBeVisible();
    await expect(
        page.locator("dl").filter({ hasText: "기대 비용" })
    ).toContainText(/약 .*e\+/);
    await page.getByLabel("반복 횟수", { exact: true }).fill("1");
    await page
        .getByRole("button", { name: "정교한 세공 도구 사용", exact: true })
        .click();
    await expect(page.getByTestId("session-spend")).toHaveText(
        "9,007,199,254,740,993 Gold"
    );
    await expect(
        page
            .getByRole("combobox", { name: "최소 레벨 1", exact: true })
            .locator("option")
            .last()
    ).toHaveAttribute("value", "25");
});
