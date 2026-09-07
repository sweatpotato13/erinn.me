import { expect, test } from "@playwright/test";

import reference from "../src/data/echostone-reference.json";
import { defaultEchoConfig, echoConfigPath } from "../src/lib/echostone-url";

const base = "/simulators/echostone";
const title = "마비노기 에코스톤 각성·연마석 계산기";
const normalPrice = "에코스톤 각성제 1개 가격 (Gold)";

test.beforeEach(async ({ page }) => {
    await page.route(/prilus\.gitlab\.io/, route => route.abort());
    await page.route("**/api/auction/price-summary?*", route =>
        route.fulfill({
            json: {
                minPrice: 120,
                averagePrice: 140,
                availableQuantity: 2,
                isComplete: false,
                fetchedAt: "2026-09-07T00:00:00Z",
            },
        })
    );
});

test("weighted comparison, manual market requests, separate nontradeable prices and unknown costs", async ({
    page,
}) => {
    const requests: string[] = [];
    const externalReferences: string[] = [];
    page.on("request", r => {
        if (r.url().includes("price-summary")) requests.push(r.url());
        if (r.url().includes("prilus.gitlab.io"))
            externalReferences.push(r.url());
    });
    await page.goto(base);
    await expect(
        page.getByRole("combobox", { name: "색상", exact: true })
    ).toBeEnabled();
    await expect(page.getByTestId("echo-probability")).toHaveText(
        "선택 각성제의 목표 확률: 0.012143%"
    );
    expect(requests).toHaveLength(0);
    await page.getByLabel(normalPrice, { exact: true }).fill("10");
    await page
        .getByRole("button", { name: "시세 조회", exact: true })
        .first()
        .click();
    await expect(page.getByText(/조회 최저가 120 Gold/)).toContainText(
        "일부 매물만 조회"
    );
    await expect(page.getByText(/조회 최저가 120 Gold/)).not.toContainText(
        "수집 시각 확인 불가"
    );
    await expect(page.getByLabel(normalPrice, { exact: true })).toHaveValue(
        "10"
    );
    await page
        .getByRole("button", { name: "조회 가격 적용", exact: true })
        .click();
    await expect(page.getByLabel(normalPrice, { exact: true })).toHaveValue(
        "120"
    );
    expect(requests).toHaveLength(1);
    expect(externalReferences).toHaveLength(0);
    await page
        .getByLabel("최고급 에코스톤 각성제 (거래 불가) 1개 가격 (Gold)", {
            exact: true,
        })
        .fill("0");
    await expect(
        page.getByLabel("최고급 에코스톤 각성제 1개 가격 (Gold)", {
            exact: true,
        })
    ).toHaveValue("");
    await page
        .getByRole("combobox", { name: "각성제", exact: true })
        .selectOption("53941");
    await page.getByRole("button", { name: "각성 1회", exact: true }).click();
    await expect(page.getByTestId("echo-totals")).toContainText(
        "가격 미입력 1행동"
    );
    await page
        .getByRole("combobox", { name: "등급", exact: true })
        .selectOption("1");
    await expect(
        page.getByRole("alert").filter({ hasText: "유효 레벨" })
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "각성 1회", exact: true })
    ).toBeDisabled();
});

test("bounded runs stop before overspending, on the first hit, and can be cancelled", async ({
    page,
}) => {
    await page.goto(base);
    await page.getByLabel(normalPrice, { exact: true }).fill("10");
    await page.getByLabel("기록 전체 예산", { exact: false }).fill("30");
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await expect(page.getByTestId("echo-totals")).toHaveText(
        "각성 3회 · 연마 0회 · 75 AP · 30 Gold"
    );
    await expect(
        page.getByRole("status").filter({ hasText: "예산 한도 도달" })
    ).toBeVisible();
    await page.getByRole("button", { name: "각성 1회", exact: true }).click();
    await expect(page.getByTestId("echo-totals")).toContainText("각성 3회");
    await page
        .getByRole("button", { name: "기록 초기화", exact: true })
        .click();
    await page
        .getByRole("combobox", { name: "최소 목표 레벨", exact: true })
        .selectOption("1");
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await expect(page.getByTestId("echo-totals")).toContainText("각성 1회");
    await expect(
        page.getByRole("status").filter({ hasText: "목표 달성" })
    ).toBeVisible();
    await page
        .getByRole("button", { name: "기록 초기화", exact: true })
        .click();
    await page
        .getByRole("combobox", { name: "최소 목표 레벨", exact: true })
        .selectOption("3");
    await page.getByLabel(normalPrice, { exact: true }).fill("0");
    await page.getByLabel("자동 실행 최대 행동 횟수").fill("205");
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await expect(page.getByTestId("echo-totals")).toContainText("각성 205회");
    await page.getByText("최근 시뮬레이션 기록", { exact: true }).click();
    await expect(page.locator("ol li")).toHaveCount(100);
    await page.getByLabel("자동 실행 최대 행동 횟수").fill("1000000");
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await page.getByRole("button", { name: "중지", exact: true }).click();
    await expect(
        page.getByRole("status").filter({ hasText: "취소됨" })
    ).toBeVisible();
});

test("current state, maximum and used eligibility survive sharing without automatic work", async ({
    page,
}) => {
    await page.goto(base);
    await page
        .getByRole("combobox", { name: "현재 옵션", exact: true })
        .selectOption("1");
    await page
        .getByRole("combobox", { name: "현재 레벨", exact: true })
        .selectOption("2");
    await expect(page.getByTestId("echo-current")).toContainText(
        "연마 조건 충족"
    );
    await expect(
        page.getByRole("button", { name: "연마 1회", exact: true })
    ).toBeDisabled();
    await expect(
        page.getByText(/연마석의 등급별 레벨 범위/).first()
    ).toBeVisible();
    await page.getByLabel("이미 연마 사용", { exact: true }).check();
    await page.getByLabel(normalPrice, { exact: true }).fill("0");
    await page
        .getByRole("button", { name: "설정 링크 복사", exact: true })
        .click();
    const shared = await page
        .getByLabel("공유 링크", { exact: true })
        .inputValue();
    await page.goto(shared);
    await expect(
        page.getByLabel("이미 연마 사용", { exact: true })
    ).toBeChecked();
    await expect(
        page.getByRole("combobox", { name: "현재 레벨", exact: true })
    ).toHaveValue("2");
    await expect(page.getByLabel(normalPrice, { exact: true })).toHaveValue(
        "0"
    );
    await expect(page.getByTestId("echo-totals")).toContainText("각성 0회");
    await page.reload();
    await expect(
        page.getByRole("combobox", { name: "현재 레벨", exact: true })
    ).toHaveValue("2");
    await page.getByLabel("이미 연마 사용", { exact: true }).uncheck();
    await page
        .getByRole("combobox", { name: "현재 레벨", exact: true })
        .selectOption("3");
    await expect(page.getByTestId("echo-current")).toContainText(
        "최대 레벨: 연마 불가"
    );
    await page.goto(base);
    await page.goBack();
    await expect(
        page.getByLabel("이미 연마 사용", { exact: true })
    ).toBeChecked();
});

test("invalid settings and version mismatch are visible, mobile layout and menus remain accessible", async ({
    page,
}) => {
    await page.goto(base + "?s={bad");
    await expect(
        page.getByRole("alert").filter({ hasText: "공유 설정" })
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "각성 1회", exact: true })
    ).toBeDisabled();
    const old = { ...defaultEchoConfig(reference), version: "1" };
    await page.goto(echoConfigPath(old, reference));
    await expect(
        page.getByRole("status").filter({ hasText: "공유한 데이터 버전" })
    ).toBeVisible();
    await page.setViewportSize({ width: 320, height: 720 });
    await page.getByRole("button", { name: "전체 메뉴", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "전체 메뉴" });
    await expect(
        menu.getByRole("link", { name: "에코스톤 계산기", exact: true })
    ).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await page.getByRole("combobox", { name: "색상", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(
        page.getByRole("combobox", { name: "등급", exact: true })
    ).toBeFocused();
    await page.getByText("등장 옵션·레벨·효과 보기", { exact: true }).click();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    const nav = page.getByRole("navigation", { name: "카테고리 탐색" });
    await nav.locator("summary", { hasText: "강화 시뮬레이터" }).click();
    await expect(
        nav.getByRole("link", { name: "에코스톤 계산기", exact: true })
    ).toBeVisible();
    await page.goto("/");
    await expect(page.locator(`main a[href="${base}"]`)).toBeVisible();
});

test("server HTML has rules and social metadata; image and sitemap use published base URL", async ({
    request,
}) => {
    const response = await request.get(base + "?s={bad", {
        headers: { "User-Agent": "Twitterbot/1.0" },
    });
    const html = await response.text();
    expect(response.status()).toBe(200);
    expect(html).toContain(`<title>${title} | Erinn.me</title>`);
    expect(html).toContain(`rel="canonical" href="https://erinn.me${base}"`);
    expect(html).toContain(`content="https://erinn.me${base}/preview"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain("계산 규칙과 출처");
    expect(html).toContain(reference.version);
    expect(html).not.toContain("EquipFilterMap");
    expect(html).not.toContain("ConvertFixedRewards");
    const image = await request.get(base + "/preview");
    expect(image.headers()["content-type"]).toContain("image/png");
    const png = await image.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(
        sitemap.match(new RegExp(`<loc>https://erinn.me${base}</loc>`, "g"))
    ).toHaveLength(1);
    expect(sitemap).not.toMatch(/\/preview|\?s=/);
});
