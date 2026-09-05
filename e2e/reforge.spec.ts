import { expect, test } from "@playwright/test";

const base = "/simulators/reforge";
const title = "마비노기 세공 시뮬레이터·확률·비용 계산기";
const settings = `${base}?v=1788405829&e=40878&t=1&goals=1:7&mode=and&cap=1000`;

test.beforeEach(async ({ page }) => {
    await page.route(/prilus\.gitlab\.io/, route => route.abort());
});

test("local equipment discovery, targets, exact spending and share reload", async ({
    page,
}) => {
    await page.goto(base);
    await page.getByLabel("장비 이름 검색").fill("켈틱 드루이드 스태프");
    await page.getByRole("button", { name: "장비 검색", exact: true }).click();
    await page
        .getByRole("button", { name: /켈틱 드루이드 스태프 #40878/ })
        .click();
    await expect(
        page.getByRole("heading", { name: "2. 목표 설정" })
    ).toBeVisible();
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page.getByLabel("1회 가격 (Gold)", { exact: true }).fill("3");
    await page.getByLabel("이번 실행 예산").fill("6");
    await page.getByRole("button", { name: "1회 돌리기", exact: true }).click();
    await expect(page.getByTestId("session-attempts")).toHaveText("1회");
    await expect(page.getByTestId("session-spend")).toHaveText("3 Gold");
    await page.getByLabel("1회 가격 (Gold)", { exact: true }).fill("0");
    await page
        .getByRole("button", { name: "목표까지 돌리기", exact: true })
        .click();
    await expect(page.getByTestId("session-attempts")).toHaveText("2회");
    await expect(page.getByTestId("session-spend")).toHaveText("3 Gold");
    await expect(
        page.getByRole("status").filter({ hasText: "목표 달성" })
    ).toBeVisible();
    await page
        .getByRole("combobox", { name: "목표 옵션 1", exact: true })
        .selectOption("15");
    await page
        .getByRole("combobox", { name: "최소 레벨 1", exact: true })
        .selectOption("20");
    await expect(page.getByTestId("session-attempts")).toHaveText("0회");
    await expect(
        page.getByRole("link", { name: "이 목표로 경매장 검색" })
    ).toHaveAttribute("href", /option_reforge=/);
    await page.getByRole("button", { name: "목표 추가", exact: true }).click();
    await expect(
        page.getByText("경매장은 세공 조건 1개만 지원", { exact: false })
    ).toBeVisible();
    await page
        .getByRole("combobox", { name: "목표 조건", exact: true })
        .selectOption("or");
    await page
        .getByRole("button", { name: "설정 링크 복사", exact: true })
        .click();
    const shared = await page.getByLabel("공유 설정 URL").inputValue();
    expect(shared).toContain("mode=or");
    expect(shared).toContain("price=0");
    await page.reload();
    await expect(
        page.getByRole("combobox", { name: "목표 옵션 1", exact: true })
    ).toHaveValue("15");
    await expect(
        page.getByRole("combobox", { name: "목표 조건", exact: true })
    ).toHaveValue("or");
    await expect(
        page.getByLabel("1회 가격 (Gold)", { exact: true })
    ).toHaveValue("0");
    await expect(page.getByTestId("session-attempts")).toHaveText("0회");
    await page
        .getByRole("combobox", { name: "세공 도구", exact: true })
        .selectOption("5");
    await expect(page.getByText(/서로 다른 1개/)).toBeVisible();
    await page.goBack();
    await expect(
        page.getByRole("combobox", { name: "세공 도구", exact: true })
    ).toHaveValue("1");
    await expect(
        page.getByRole("combobox", { name: "목표 옵션 1", exact: true })
    ).toHaveValue("15");
    await page.goForward();
    await expect(
        page.getByRole("combobox", { name: "세공 도구", exact: true })
    ).toHaveValue("5");
});

test("bounded runs remain cancellable, budget equality, impossible and changed settings", async ({
    page,
}) => {
    await page.goto(
        settings.replace("goals=1:7", "goals=1:25") + "&price=3&budget=6"
    );
    await expect(page.getByTestId("target-probability")).toBeVisible();
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page
        .getByRole("button", { name: "목표까지 돌리기", exact: true })
        .click();
    await expect(page.getByTestId("session-attempts")).toHaveText("2회");
    await expect(page.getByTestId("session-spend")).toHaveText("6 Gold");
    await page.getByLabel("이번 실행 예산").fill("");
    await page.getByLabel("최대 시도 횟수", { exact: true }).fill("1000000");
    await page
        .getByRole("button", { name: "목표까지 돌리기", exact: true })
        .click();
    await expect(
        page.getByRole("button", { name: "중지", exact: true })
    ).toBeEnabled();
    await expect
        .poll(async () =>
            Number(
                (
                    await page.getByTestId("session-attempts").innerText()
                ).replace(/\D/g, "")
            )
        )
        .toBeGreaterThan(102);
    await page.getByRole("button", { name: "중지", exact: true }).click();
    await expect(
        page.getByRole("status").filter({ hasText: "취소됨" })
    ).toBeVisible();
    await page.getByText("최근 기록 (100/100)", { exact: true }).click();
    await expect(
        page.getByRole("button", { name: "중지", exact: true })
    ).toBeDisabled();
    await page.goto(settings.replace("goals=1:7", "goals=1:26"));
    await expect(
        page.getByRole("alert").filter({ hasText: "달성 불가능" })
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "목표까지 돌리기", exact: true })
    ).toBeDisabled();
    await page.goto(settings.replace("1788405829", "1"));
    await expect(
        page.getByText(/공유 데이터 버전 1과 현재 버전/)
    ).toBeVisible();
    await page.goto(settings.replace("e=40878", "e=999999999"));
    await expect(
        page.getByRole("alert").filter({ hasText: "지원하지 않는 장비" })
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
    await expect(page.getByText(/최대 30개 표시/)).toBeVisible();
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
        page.getByRole("heading", { name: "3. 이론 확률과 비용" })
    ).toBeVisible();
    await expect(
        page.locator("dl").filter({ hasText: "기대 비용" })
    ).toContainText(/약 .*e\+/);
    await page.getByRole("button", { name: "1회 돌리기", exact: true }).click();
    await expect(page.getByTestId("session-spend")).toHaveText(
        "9,007,199,254,740,993 Gold"
    );
    await expect(
        page
            .getByRole("combobox", { name: "최소 레벨 1", exact: true })
            .locator("option")
            .last()
    ).toHaveValue("25");
});
