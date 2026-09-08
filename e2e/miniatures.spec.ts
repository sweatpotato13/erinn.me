import { expect, type Page, test } from "@playwright/test";

import data from "../src/data/miniature-reference.json";

const path = "/tools/miniatures";
const key = "erinn-miniatures-v1";
const item = (id: number) => data.miniatures.find(row => row.id === id)!;
const row = (page: Page, id: number) =>
    page.getByRole("article", { name: item(id).name, exact: true });
const stored = (installedIds: number[]) => ({
    formatVersion: 1,
    snapshotVersion: data.version,
    installedIds,
});
async function choose(page: Page, id: number) {
    await page
        .getByLabel("목표 능력치")
        .selectOption(Object.keys(item(id).effects)[0]);
    await page.getByLabel("미니어처 검색", { exact: true }).fill(item(id).name);
    await row(page, id).getByRole("button", { name: "비교 추가" }).click();
}
test.beforeEach(async ({ page }) => {
    await page.route("**/api/item-image?**", route => route.abort());
});

async function mockMarket(page: Page) {
    const prices: string[] = [];
    const forbidden: string[] = [];
    page.on("request", request => {
        if (
            /prilus\.gitlab|(?:MiniatureList|StringTable|ItemList)\.json/.test(
                request.url()
            )
        )
            forbidden.push(request.url());
    });
    await page.route("**/api/auction/price-summary?**", async route => {
        prices.push(
            new URL(route.request().url()).searchParams.get("item_name")!
        );
        await route.fulfill({
            json: {
                minPrice: 300,
                averagePrice: 400,
                availableQuantity: 2,
                isComplete: false,
                fetchedAt: "2026-09-08T00:00:00Z",
            },
        });
    });
    return { prices, forbidden };
}

async function installCollection(page: Page) {
    for (const id of [592, 739, 789, 485, 826, 770]) {
        await page
            .getByLabel("미니어처 검색", { exact: true })
            .fill(item(id).name);
        await row(page, id)
            .getByRole("checkbox", {
                name: `${item(id).name} 설치 중`,
                exact: true,
            })
            .check();
    }
}

test("home and menu navigation", async ({ page }) => {
    await page.goto("/");
    await page
        .locator("main")
        .getByRole("link", { name: /미니어처 비교/ })
        .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    const menu = page.getByRole("button", { name: "전체 메뉴", exact: true });
    if (await menu.isVisible()) {
        await menu.click();
        await expect(
            page
                .getByRole("dialog")
                .getByRole("link", { name: "미니어처 비교" })
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
    } else {
        const group = page
            .getByRole("navigation", { name: "카테고리 탐색" })
            .getByText("아이템 비교", { exact: true });
        await group.click();
        await expect(
            page
                .getByRole("navigation", { name: "카테고리 탐색" })
                .getByRole("link", { name: "미니어처 비교" })
        ).toBeVisible();
        await group.press("Escape");
        await expect(group).toBeFocused();
    }
});

test("installed collection survives comparison and reload", async ({
    page,
}) => {
    await mockMarket(page);
    await page.goto(path);
    await installCollection(page);
    const baseline = page.getByRole("region", { name: "설치 기준" });
    await expect(baseline).toContainText("6개");
    const before = await page.evaluate(key => localStorage.getItem(key), key);
    await page.getByLabel("목표 능력치").selectOption("CriticalDamage");
    await expect(baseline).toContainText("크리티컬 대미지");
    for (const id of [564, 790, 1207, 341]) await choose(page, id);
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(
        before
    );
    await page.reload();
    await expect(
        page.getByRole("heading", { name: /내 설치 현황/ })
    ).toContainText("6개");
});

test("four-candidate limit and selection survive filtering", async ({
    page,
}) => {
    await mockMarket(page);
    await page.goto(path);
    const before = await page.evaluate(key => localStorage.getItem(key), key);
    for (const id of [564, 790, 1207, 341]) await choose(page, id);
    await page.getByLabel("목표 능력치").selectOption("all");
    await page
        .getByLabel("미니어처 검색", { exact: true })
        .fill(item(592).name);
    await row(page, 592).getByRole("button", { name: "비교 추가" }).click();
    await expect(page.getByText(/비교 후보는 최대 4개/)).toBeVisible();
    await page
        .getByLabel("미니어처 검색", { exact: true })
        .fill("아무결과도없는검색어");
    await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
    await expect(
        page.getByRole("region", { name: "구매 후보 비교" })
    ).toContainText("4 / 4");
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(
        before
    );
});

test("set bonuses and unsupported auction searches stay explicit", async ({
    page,
}) => {
    await page.goto(path);
    await choose(page, 1207);
    const setCandidate = page.getByRole("article", {
        name: `${item(1207).name} 가격 비교`,
    });
    await expect(setCandidate.getByText("경매장 검색 미지원")).toBeVisible();
    await setCandidate.getByText("효과·설명", { exact: true }).click();
    await expect(
        setCandidate.getByText("세트 효과는 합계에서 제외합니다.")
    ).toBeVisible();
});

test("automatic market prices, overrides and narrow layout", async ({
    page,
}, info) => {
    const { prices, forbidden } = await mockMarket(page);
    await page.goto(path);
    await installCollection(page);
    for (const id of [564, 790, 1207, 341]) await choose(page, id);
    const mismatch = page.getByRole("article", {
        name: `${item(341).name} 가격 비교`,
    });
    const href = await mismatch
        .getByRole("link", { name: "경매장 검색" })
        .getAttribute("href");
    expect(decodeURIComponent(href!)).toContain(
        item(341).itemName.replace(/ /g, "+")
    );
    const manual = mismatch.getByRole("textbox");
    await expect(manual).toHaveValue("300");
    await manual.fill("0");

    await expect(mismatch.getByText(/수량 2/)).toBeVisible();
    await expect(manual).toHaveValue("0");
    expect(prices.sort()).toEqual(
        [564, 790, 341].map(id => item(id).itemName).sort()
    );
    expect(forbidden).toEqual([]);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true);
    await page.screenshot({
        path: info.outputPath("comparison.png"),
        fullPage: true,
    });
});

test("local installation recovery, scoped reset and absent sharing", async ({
    page,
}) => {
    await page.goto(path);
    await page.evaluate(
        ({ key, value }) => {
            localStorage.setItem(key, JSON.stringify(value));
            localStorage.setItem("unrelated-favorites", "keep");
        },
        { key, value: stored([485, 826]) }
    );
    await page.goto(`${path}?s=obsolete`);
    await expect(
        page.getByRole("heading", { name: /내 설치 현황/ })
    ).toContainText("2개");
    await expect(
        page.getByRole("button", { name: "공유", exact: true })
    ).toHaveCount(0);
    await page.getByLabel("미니어처 검색", { exact: true }).fill("사이브");
    await row(page, 912).getByRole("checkbox").check();
    await page.reload();
    await expect(
        page.getByRole("heading", { name: /내 설치 현황/ })
    ).toContainText("3개");
    await expect(page.getByRole("region", { name: "설치 기준" })).toContainText(
        item(912).name
    );
    await page.getByRole("button", { name: "설치 목록 초기화" }).click();
    expect(
        await page.evaluate(key => localStorage.getItem(key), key)
    ).toBeNull();
    expect(
        await page.evaluate(() => localStorage.getItem("unrelated-favorites"))
    ).toBe("keep");
});

test("music search excludes zero effects for a specific stat", async ({
    page,
}) => {
    await page.goto(path);
    await page
        .getByLabel("미니어처 검색", { exact: true })
        .fill("사이브 음악 버프");
    await expect(row(page, 912)).toBeVisible();
    await page.getByLabel("목표 능력치").selectOption("AttackMax");
    await expect(row(page, 912)).toHaveCount(0);
    await page.getByLabel("목표 능력치").selectOption("MusicSkill");
    await expect(row(page, 912)).toContainText("음악 버프 스킬 효과 3");
    await expect(row(page, 912)).not.toContainText("최대 대미지 0");
});

test("crawler HTML, canonical and one sitemap URL", async ({ request }) => {
    for (const suffix of ["", "?s=invalid"]) {
        const response = await request.get(`${path}${suffix}`);
        expect(response.ok()).toBe(true);
        const html = await response.text();
        for (const text of [
            "마비노기 미니어처 효과 비교·구매 도우미",
            "능력치마다 독립적으로",
            "세트 효과, 펫 하우스",
            'rel="canonical" href="https://erinn.me/tools/miniatures"',
        ])
            expect(html).toContain(text);
    }
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(
        sitemap.match(/<loc>https:\/\/erinn.me\/tools\/miniatures<\/loc>/g)
    ).toHaveLength(1);
});
