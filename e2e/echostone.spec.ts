import { expect, test, type Page } from "@playwright/test";

import reference from "../src/data/echostone-reference.json";
import { defaultEchoConfig, echoConfigPath } from "../src/lib/echostone-url";

const base = "/simulators/echostone";
const title = "마비노기 에코스톤 각성·연마석 계산기";
const normalPrice = "에코스톤 각성제 1개 가격 (Gold)";
const costs = (page: Page) =>
    page.getByText("비용 설정과 예상 비용", { exact: true }).click();
const work = (page: Page) =>
    page.getByRole("group", { name: "에코스톤 작업", exact: true });
const upgrading = (page: Page) =>
    page.getByRole("region", { name: "에코스톤 승급", exact: true });

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

test("simple game controls use local icons, keep three agents and only the two official sources", async ({
    page,
}) => {
    const requests: string[] = [];
    page.on("request", r => {
        if (/prilus\.gitlab\.io/.test(r.url())) requests.push(r.url());
    });
    await page.goto(base);
    await expect(
        page.getByRole("button", { name: "각성", exact: true })
    ).toBeEnabled();
    await expect(
        page.getByRole("button", { name: "레벨 재부여", exact: true })
    ).toBeDisabled();
    await expect(page.getByLabel(normalPrice, { exact: true })).toBeHidden();
    await expect(
        page.getByRole("button", { name: "설정 링크 복사" })
    ).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(
        page.getByRole("combobox", { name: "등급", exact: true })
    ).toHaveCount(0);
    await expect(
        page
            .getByRole("combobox", { name: "각성제", exact: true })
            .locator("option")
    ).toHaveCount(3);
    const sources = page.getByRole("region", { name: "계산 규칙과 출처" });
    await expect(sources.getByRole("link")).toHaveText([
        "공식 2025-09-11 변경점",
        "공식 에코스톤 가이드",
    ]);
    await page
        .getByRole("button", { name: "블루 에코스톤", exact: true })
        .click();
    await expect(page.getByTestId("echo-current")).toContainText(
        "블루 에코스톤 30등급"
    );
    expect(
        await page
            .locator('img[src^="/images/echostone/"]')
            .evaluateAll(images =>
                images.every(
                    image =>
                        (image as HTMLImageElement).complete &&
                        (image as HTMLImageElement).naturalWidth > 0
                )
            )
    ).toBe(true);
    expect(requests).toHaveLength(0);
    await costs(page);
    await expect(page.getByLabel(/1개 가격 \(Gold\)/)).toHaveCount(3);
    await expect(
        page.getByLabel(/이용 수수료|기록 전체 예산|연마석.*가격/)
    ).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 720 });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
    await page.getByRole("button", { name: "각성", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("echo-totals")).toContainText("각성 1회");
});

test("target levels follow the selected option cap and normalize previous selections", async ({
    page,
}) => {
    const config = defaultEchoConfig(reference);
    config.target.level = 20;
    config.current = {
        id: reference.colors[0].options[0].id,
        level: 3,
        polishingUsed: false,
    };
    await page.goto(echoConfigPath(config, reference));
    const levels = page.getByRole("combobox", {
        name: "최소 목표 레벨",
        exact: true,
    });
    const target = page.getByRole("combobox", {
        name: "목표 옵션",
        exact: true,
    });
    await expect(levels.locator("option")).toHaveText([
        "1레벨",
        "2레벨",
        "3레벨",
    ]);
    await expect(levels).toHaveValue("3");
    const red = reference.colors[0];
    await target.selectOption(red.options.find(o => o.max === 20)!.name);
    await expect(levels.locator("option")).toHaveCount(20);
    await levels.selectOption("20");
    await target.selectOption(config.target.name);
    await expect(levels).toHaveValue("3");
    await expect(levels.locator("option")).toHaveCount(3);
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await expect(
        page.getByRole("status").filter({ hasText: "목표 달성" })
    ).toBeVisible();
    await expect(page.getByTestId("echo-totals")).toContainText("각성 0회");
    const singleLevel = red.options.find(o => o.max === 1)!;
    await target.selectOption(singleLevel.name);
    await expect(levels.locator("option")).toHaveText(["1레벨"]);
    await expect(levels).toHaveValue("1");
});

test("agent prices load automatically and one refresh button applies the latest price", async ({
    page,
}) => {
    const requests: string[] = [];
    page.on("request", r => {
        if (r.url().includes("price-summary")) requests.push(r.url());
    });
    await page.goto(base);
    await costs(page);
    for (const name of [
        normalPrice,
        "고급 에코스톤 각성제 1개 가격 (Gold)",
        "최고급 에코스톤 각성제 1개 가격 (Gold)",
    ]) {
        await expect(page.getByLabel(name, { exact: true })).toHaveValue("120");
    }
    // Development StrictMode can abort and retry the initial requests.
    expect(new Set(requests).size).toBe(3);
    const initialRequests = requests.length;
    const field = page
        .getByLabel(normalPrice, { exact: true })
        .locator("..")
        .locator("..");
    await page.getByLabel(normalPrice, { exact: true }).fill("10");
    await page
        .getByRole("button", { name: "시세 조회", exact: true })
        .first()
        .click();
    await expect(field.getByText(/조회 최저가 120 Gold/)).toContainText(
        "일부 매물만 조회"
    );
    await expect(
        page.getByRole("button", { name: "조회 가격 적용", exact: true })
    ).toHaveCount(0);
    await expect(
        field.getByRole("link", { name: "경매장 보기", exact: true })
    ).toBeVisible();
    await expect(page.getByLabel(normalPrice, { exact: true })).toHaveValue(
        "120"
    );
    expect(requests).toHaveLength(initialRequests + 1);
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page.getByRole("button", { name: "각성", exact: true }).click();
    await page
        .getByRole("button", { name: "레벨 재부여", exact: true })
        .click();
    await expect(page.getByTestId("echo-totals")).toHaveText(
        "각성 1회 · 연마 1회 · 25 AP · 각성제 120 Gold"
    );
    await expect(
        page.getByRole("button", { name: "레벨 재부여", exact: true })
    ).toBeDisabled();
    await expect(page.getByTestId("echo-current")).toContainText(
        "체력 (1/3 레벨)"
    );
});

test("late market results preserve manual zero and missing prices remain blank", async ({
    page,
}) => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
        release = resolve;
    });
    await page.route("**/api/auction/price-summary?*", async route => {
        const name = new URL(route.request().url()).searchParams.get(
            "item_name"
        );
        if (name === "에코스톤 각성제") {
            await gate;
            await route.fulfill({
                json: {
                    minPrice: 120,
                    averagePrice: 140,
                    availableQuantity: 2,
                    isComplete: true,
                },
            });
        } else if (name === "고급 에코스톤 각성제") {
            await route.fulfill({
                json: {
                    minPrice: 0,
                    averagePrice: 0,
                    availableQuantity: 0,
                    isComplete: true,
                },
            });
        } else {
            await route.fulfill({
                status: 503,
                json: { error: "unavailable" },
            });
        }
    });
    await page.goto(base);
    await costs(page);
    await page.getByLabel(normalPrice, { exact: true }).fill("0");
    release();
    await expect(page.getByText(/조회 최저가 120 Gold/)).toBeVisible();
    await expect(page.getByLabel(normalPrice, { exact: true })).toHaveValue(
        "0"
    );
    await expect(
        page.getByLabel("고급 에코스톤 각성제 1개 가격 (Gold)", { exact: true })
    ).toHaveValue("");
    await expect(
        page.getByText("매물 없음 또는 가격 확인 불가", { exact: false })
    ).toBeVisible();
    await expect(
        page.getByLabel("최고급 에코스톤 각성제 1개 가격 (Gold)", {
            exact: true,
        })
    ).toHaveValue("");
    await expect(
        page
            .getByRole("alert")
            .filter({ hasText: "시세를 불러오지 못했습니다" })
    ).toBeVisible();
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>(resolve => {
        releaseRefresh = resolve;
    });
    await page.route("**/api/auction/price-summary?*", async route => {
        await refreshGate;
        await route.fulfill({
            json: {
                minPrice: 240,
                averagePrice: 250,
                availableQuantity: 1,
                isComplete: true,
            },
        });
    });
    const field = page
        .getByLabel(normalPrice, { exact: true })
        .locator("..")
        .locator("..");
    await field.getByRole("button", { name: "시세 조회", exact: true }).click();
    await expect(
        field.getByRole("button", { name: "조회 중…", exact: true })
    ).toBeDisabled();
    await page.getByLabel(normalPrice, { exact: true }).fill("55");
    releaseRefresh();
    await expect(field.getByText(/조회 최저가 240 Gold/)).toBeVisible();
    await expect(page.getByLabel(normalPrice, { exact: true })).toHaveValue(
        "55"
    );
    await field.getByRole("button", { name: "시세 조회", exact: true }).click();
    await expect(page.getByLabel(normalPrice, { exact: true })).toHaveValue(
        "240"
    );
});

test("automatic awakening remains capped and cancellable and stops on polishing success", async ({
    page,
}) => {
    await page.goto(base);
    await costs(page);
    await page.getByLabel(normalPrice, { exact: true }).fill("100");
    await page.getByLabel("자동 실행 최대 행동 횟수").fill("1");
    await page
        .getByLabel("목표 옵션이 나오면 연마도 사용", { exact: true })
        .check();
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await expect(page.getByTestId("echo-totals")).toContainText(
        "각성 1회 · 연마 0회"
    );
    await page.evaluate(() => {
        Math.random = () => 0.99;
    });
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await expect(page.getByTestId("echo-totals")).toHaveText(
        "각성 1회 · 연마 1회 · 25 AP · 각성제 100 Gold"
    );
    await expect(
        page.getByRole("status").filter({ hasText: "목표 달성" })
    ).toBeVisible();
    await page
        .getByRole("button", { name: "기록 초기화", exact: true })
        .click();
    await page.getByLabel("자동 실행 최대 행동 횟수").fill("1000000");
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page
        .getByRole("button", { name: "목표까지 자동 실행", exact: true })
        .click();
    await page.getByRole("button", { name: "중지", exact: true }).click();
    await expect(
        page.getByRole("status").filter({ hasText: "취소됨" })
    ).toBeVisible();
});

test("upgrade and awakening keep independent colors, progress and fixed grade30 awakening", async ({
    page,
}) => {
    await page.goto(base);
    await page
        .getByRole("button", { name: "블루 에코스톤", exact: true })
        .click();
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await page.getByRole("button", { name: "각성", exact: true }).click();
    const ability = await page.getByTestId("echo-current").textContent();
    await work(page).getByRole("button", { name: "승급", exact: true }).click();
    await expect(page.getByTestId("echo-growth")).toContainText(
        "레드 에코스톤 1등급"
    );
    await expect(
        page.getByText("보유 스탯·등급 입력", { exact: true })
    ).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 720 });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
    await upgrading(page)
        .getByRole("button", { name: "승급", exact: true })
        .click();
    await expect(page.getByTestId("echo-growth")).toContainText("2등급");
    await expect(page.getByTestId("echo-growth")).toContainText("체력 2");
    await work(page)
        .getByRole("button", { name: "각성·연마", exact: true })
        .click();
    await expect(page.getByTestId("echo-current")).toHaveText(ability!);
    await expect(page.getByTestId("echo-totals")).toContainText("각성 1회");
    await work(page).getByRole("button", { name: "승급", exact: true }).click();
    await expect(page.getByTestId("echo-growth")).toContainText(
        "레드 에코스톤 2등급"
    );
    await expect(page.getByTestId("echo-upgrade-count")).toContainText("1회");
    await upgrading(page)
        .getByRole("button", { name: "연속 승급", exact: true })
        .click();
    await expect(page.getByTestId("echo-growth")).toContainText("30등급");
    await expect(page.getByTestId("echo-growth")).toContainText("체력 47");
    await expect(page.getByTestId("echo-upgrade-count")).toContainText("29회");
    await expect(
        upgrading(page).getByRole("button", { name: "승급", exact: true })
    ).toBeDisabled();
    await page
        .getByRole("button", { name: "새 에코스톤으로 시작", exact: true })
        .click();
    await expect(page.getByTestId("echo-growth")).toContainText("1등급");
    await expect(page.getByTestId("echo-upgrade-count")).toContainText("0회");
});

test("upgrade target stopping, failed stat retention, cancellation and black stat reset", async ({
    page,
}) => {
    await page.goto(base);
    await work(page).getByRole("button", { name: "승급", exact: true }).click();
    await page
        .getByRole("button", { name: "블랙 에코스톤", exact: true })
        .click();
    await page
        .getByRole("combobox", { name: "승급 목표 등급", exact: true })
        .selectOption("25");
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    await upgrading(page)
        .getByRole("button", { name: "연속 승급", exact: true })
        .click();
    await expect(page.getByTestId("echo-growth")).toContainText("25등급");
    for (const stat of ["생명력", "마나", "스태미나"])
        await expect(page.getByTestId("echo-growth")).toContainText(
            `${stat} 25`
        );
    const before = await page.getByTestId("echo-growth").textContent();
    await page.evaluate(() => {
        Math.random = () => 0.99;
    });
    await upgrading(page)
        .getByRole("button", { name: "승급", exact: true })
        .click();
    await expect(page.getByTestId("echo-growth")).toHaveText(before!);
    await expect(
        page.getByRole("status").filter({ hasText: "승급 실패" })
    ).toBeVisible();
    await page
        .getByRole("combobox", { name: "승급 목표 등급", exact: true })
        .selectOption("30");
    await upgrading(page)
        .getByRole("button", { name: "연속 승급", exact: true })
        .click();
    await page.getByRole("button", { name: "승급 중지", exact: true }).click();
    await expect(
        page.getByRole("status").filter({ hasText: "연속 승급 중지" })
    ).toBeVisible();
    await expect(page.getByTestId("echo-growth")).toHaveText(before!);
    await page
        .getByRole("button", { name: "실버 에코스톤", exact: true })
        .click();
    await expect(page.getByTestId("echo-growth")).toContainText(
        "실버 에코스톤 1등급"
    );
    await expect(page.getByTestId("echo-growth")).toContainText("의지 1");
    await expect(page.getByTestId("echo-upgrade-count")).toContainText("0회");
});

test("old URLs normalize highest agent and grade and ignore removed costs and budgets", async ({
    page,
}) => {
    const config = {
        ...defaultEchoConfig(reference),
        agent: 5000078 as const,
        grade: 1,
        fee: "999",
        budget: "0",
        current: { id: 1, level: 2, polishingUsed: true },
    };
    await page.goto(echoConfigPath(config, reference));
    await expect(
        page.getByRole("combobox", { name: "각성제", exact: true })
    ).toHaveValue("53942");
    await expect(page.getByTestId("echo-current")).toContainText("30등급");
    await expect(
        page.getByRole("button", { name: "레벨 재부여", exact: true })
    ).toBeDisabled();
    await page.getByRole("button", { name: "각성", exact: true }).click();
    await expect(page.getByTestId("echo-totals")).toContainText("각성 1회");
    await page.goto(base + "?s={bad");
    await expect(
        page.getByRole("button", { name: "각성", exact: true })
    ).toBeDisabled();
});

test("server HTML keeps metadata, official sources, image and base-only sitemap", async ({
    request,
}) => {
    const response = await request.get(base, {
        headers: { "User-Agent": "Twitterbot/1.0" },
    });
    const html = await response.text();
    expect(response.status()).toBe(200);
    expect(html).toContain(`<title>${title} | Erinn.me</title>`);
    expect(html).toContain(`rel="canonical" href="https://erinn.me${base}"`);
    expect(html).toContain(`content="https://erinn.me${base}/preview"`);
    expect(html).toContain("공식 2025-09-11 변경점");
    expect(html).not.toContain('href="https://prilus.gitlab.io/echostone"');
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
