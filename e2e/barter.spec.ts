import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const path = "/tools/barter";
const key = "erinn-barter-v1";
test.use({ timezoneId: "America/Los_Angeles" });
test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-09-10T08:00:00+09:00"));
});

test("preparation quantities, explicit market lookup, export and shared import", async ({
    page,
}) => {
    const requests: string[] = [];
    const unexpected: string[] = [];
    page.on("request", request => {
        if (
            /labanyu|prilus|StringTable\.json|ItemList\.json|barter-material-index/.test(
                request.url()
            )
        )
            unexpected.push(request.url());
    });
    await page.route("**/api/auction/price-summary?**", async route => {
        requests.push(route.request().url());
        await route.fulfill({
            json: {
                minPrice: 100,
                averagePrice: 150,
                availableQuantity: 2,
                isComplete: false,
                fetchedAt: "2026-09-10T00:00:00Z",
            },
        });
    });
    await page.goto(path);
    await page
        .getByRole("textbox", { name: "우드 테이블 준비할 횟수", exact: true })
        .fill("3");
    await page
        .getByRole("textbox", { name: "새우 조련 미끼 보유 수량", exact: true })
        .fill("5");
    await page
        .getByRole("textbox", { name: "실리엔 보유 수량", exact: true })
        .fill("2");
    const shrimp = page.getByRole("article", { name: "새우 조련 미끼 재료" });
    await expect(shrimp).toContainText("필요 12 · 보유분 사용 5 · 부족 7");
    await page
        .getByRole("checkbox", {
            name: "새우 조련 미끼 준비 완료",
            exact: true,
        })
        .check();
    expect(requests).toHaveLength(0);
    await page
        .getByRole("button", { name: "부족한 재료 시세 조회", exact: true })
        .click();
    await expect(shrimp).toContainText("부분 조회");
    await expect(shrimp).toContainText("관측 수량 부족");
    expect(requests).toHaveLength(2);
    await page
        .getByRole("article", { name: "실리엔 재료", exact: true })
        .getByText(/^가격·필요한 교역품 보기/)
        .click();
    await page
        .getByRole("textbox", { name: "실리엔 단가 (Gold)", exact: true })
        .fill("200");
    await expect(page.getByLabel("준비 비용")).toContainText("1,500 Gold");
    const downloading = page.waitForEvent("download");
    await page
        .getByRole("button", { name: "텍스트 다운로드", exact: true })
        .click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe("barter-preparation.txt");
    expect(await readFile((await download.path())!, "utf8")).toContain(
        "부족 7"
    );
    await page
        .getByRole("button", { name: "공유 링크 복사", exact: true })
        .click();
    const link = await page
        .getByRole("textbox", { name: "복사·공유할 텍스트" })
        .inputValue();
    expect(link).toContain("/tools/barter?s=");
    const before = await page.evaluate(
        storageKey => localStorage.getItem(storageKey),
        key
    );
    await page.goto(link);
    await expect(
        page.getByText("공유 링크는 임시 계획입니다.", { exact: false })
    ).toBeVisible();
    await page
        .getByRole("textbox", { name: "우드 테이블 준비할 횟수", exact: true })
        .fill("4");
    expect(
        await page.evaluate(storageKey => localStorage.getItem(storageKey), key)
    ).toBe(before);
    await page
        .getByRole("button", { name: "내 계획으로 가져오기", exact: true })
        .click();
    await page
        .getByRole("button", { name: "준비 목록 복사", exact: true })
        .click();
    await expect(
        page.getByRole("textbox", { name: "복사·공유할 텍스트" })
    ).toContainText("서울");
    expect(unexpected).toEqual([]);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
});

test("weekly selection exposes four sixth-tier goods and uses the shared site style", async ({
    page,
}) => {
    await page.goto(path);
    const seasonal = page.getByRole("region", { name: "이달의 6티어" });
    for (const [name, limit] of [
        ["나무 조각 퍼즐", "3"],
        ["유적 탐사 개론", "2"],
        ["대형 해먹", "2"],
        ["불의 수정구", "2"],
    ]) {
        await seasonal
            .getByRole("checkbox", { name: `${name} 주간분 담기` })
            .check();
        await expect(
            seasonal.getByRole("textbox", { name: `${name} 준비할 횟수` })
        ).toHaveValue(limit);
    }
    await expect(page.getByRole("article", { name: /재료$/ })).toHaveCount(9);
    await expect(
        page.getByRole("button", { name: "시즌 교역품 직접 입력" })
    ).toHaveCount(0);
    await expect(
        page.getByText("계산 방법·데이터 출처", { exact: true })
    ).toHaveCount(0);
    const fonts = await page.evaluate(() => [
        getComputedStyle(document.querySelector("h1")!).fontFamily,
        getComputedStyle(document.documentElement).fontFamily,
    ]);
    expect(fonts[0]).toBe(fonts[1]);
    await expect(
        page.getByRole("button", { name: "이번 주 전체 담기" })
    ).toHaveClass(/btn-primary/);
    await page
        .getByRole("checkbox", { name: "우드 테이블 주간분 담기" })
        .check();
    await expect(
        page.getByRole("textbox", { name: "우드 테이블 준비할 횟수" })
    ).toHaveValue("25");
    await expect(
        page.getByRole("textbox", { name: "우드 테이블 이미 교환한 횟수" })
    ).toBeHidden();
    await page
        .getByText("이미 교환했다면 · 교환 횟수 조정", { exact: true })
        .click();
    await page
        .getByRole("textbox", { name: "우드 테이블 이미 교환한 횟수" })
        .fill("5");
    await expect(
        page.getByRole("article", { name: "우드 테이블 교역품" })
    ).toContainText("주간 한도 25회");
    await page
        .getByRole("checkbox", { name: "우드 테이블 주간분 담기" })
        .uncheck();
    await page
        .getByRole("checkbox", { name: "우드 테이블 주간분 담기" })
        .check();
    await expect(
        page.getByRole("textbox", { name: "우드 테이블 준비할 횟수" })
    ).toHaveValue("20");
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true);
});

test("weekly rollover and monthly expiry are independent and keep owned stock", async ({
    page,
}) => {
    await page.goto(path);
    await page
        .getByRole("textbox", { name: "우드 테이블 준비할 횟수", exact: true })
        .fill("1");
    await page
        .getByText("이미 교환했다면 · 교환 횟수 조정", { exact: true })
        .click();
    await page
        .getByRole("textbox", {
            name: "우드 테이블 이미 교환한 횟수",
            exact: true,
        })
        .fill("10");
    await page
        .getByRole("textbox", { name: "실리엔 보유 수량", exact: true })
        .fill("1");
    await page.clock.setFixedTime(new Date("2026-09-17T08:00:00+09:00"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page
        .getByRole("button", { name: "이번 주로 전환", exact: true })
        .click();
    await expect(
        page.getByRole("textbox", {
            name: "우드 테이블 이미 교환한 횟수",
            exact: true,
        })
    ).toHaveValue("0");
    await expect(
        page.getByRole("textbox", { name: "실리엔 보유 수량", exact: true })
    ).toHaveValue("1");
    await expect(
        page.getByRole("textbox", {
            name: "나무 조각 퍼즐 준비할 횟수",
            exact: true,
        })
    ).toBeEnabled();
    await page.clock.setFixedTime(new Date("2026-10-01T08:00:00+09:00"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page
        .getByRole("button", { name: "이번 주로 전환", exact: true })
        .click();
    await expect(
        page.getByRole("textbox", {
            name: "나무 조각 퍼즐 준비할 횟수",
            exact: true,
        })
    ).toBeDisabled();
    await expect(
        page.getByRole("textbox", {
            name: "우드 테이블 준비할 횟수",
            exact: true,
        })
    ).toBeEnabled();
    await expect(
        page.getByRole("textbox", { name: "실리엔 보유 수량", exact: true })
    ).toHaveValue("1");
});

test("released navigation, SSR metadata, base sitemap and Korean preview", async ({
    page,
    request,
}) => {
    await page.goto("/");
    await page.locator('main a[href="/tools/barter"]').click();
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "마비노기 물물교환 준비 계산기",
        })
    ).toBeVisible();
    await expect
        .poll(() =>
            page.locator('link[rel="canonical"]').evaluateAll(links =>
                links.map(link => link.getAttribute("href"))
            )
        )
        .toEqual(["https://erinn.me/tools/barter"]);
    const html = (
        await (await request.get(`${path}?week=old&season=old`)).text()
    ).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    expect(html).toContain("이달의 6티어");
    expect(html).toContain("교환할 물품을 고르면");
    expect(html).not.toContain("계산 방법·데이터 출처");
    expect(html).toContain('content="summary_large_image"');
    expect(html).toContain("https://erinn.me/tools/barter/preview");
    expect(html).toContain('href="https://erinn.me/tools/barter"');
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect([
        ...sitemap.matchAll(/<loc>https:\/\/erinn.me\/tools\/barter<\/loc>/g),
    ]).toHaveLength(1);
    expect(sitemap).not.toContain("barter/preview");
    const preview = await request.get(`${path}/preview`);
    expect(preview.status()).toBe(200);
    expect(preview.headers()["content-type"]).toContain("image/png");
    const png = await preview.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    await expect(page.locator('a[href="/tools/crafting"]')).toHaveCount(0);
    const menu = page.getByRole("button", { name: "전체 메뉴", exact: true });
    if (await menu.isVisible()) {
        await menu.click();
        await expect(
            page.getByRole("dialog").getByRole("link", {
                name: "물물교환 준비 계산기",
                exact: true,
            })
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
    } else {
        const nav = page.getByRole("navigation", { name: "카테고리 탐색" });
        const group = nav.getByText("생활·파티 계산", { exact: true });
        await group.click();
        await expect(
            nav.getByRole("link", { name: "물물교환 준비 계산기", exact: true })
        ).toBeVisible();
        await group.press("Escape");
        await expect(group).toBeFocused();
    }
});

test("saved plans wait for hydration before accepting changes", async ({
    page,
}) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    let release!: () => void;
    const ready = new Promise<void>(resolve => {
        release = resolve;
    });
    await page.route("**/_next/static/chunks/**", async route => {
        if (route.request().resourceType() === "script") await ready;
        await route.continue();
    });
    await page.goto(path, { waitUntil: "commit" });
    try {
        await expect(
            page.getByRole("button", {
                name: "이번 주 전체 담기",
                exact: true,
            })
        ).toBeDisabled();
    } finally {
        release();
    }
    await expect(
        page.getByRole("button", { name: "이번 주 전체 담기", exact: true })
    ).toBeEnabled();
    expect(errors).toEqual([]);
});
