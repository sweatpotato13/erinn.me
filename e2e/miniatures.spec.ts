import { expect, test, type Page } from "@playwright/test";

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
    await page.getByLabel("미니어처 검색", { exact: true }).fill(item(id).name);
    await row(page, id).getByRole("button", { name: "비교 추가" }).click();
}
async function details(page: Page) {
    await page
        .getByRole("button", { name: "상세 비교", exact: true })
        .first()
        .click();
    await expect(
        page.getByRole("heading", { name: "상세 비교", exact: true })
    ).toBeFocused();
}

test("navigation, installation, four candidates, explicit market, details and narrow layout", async ({
    page,
}, info) => {
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
    await page.route("**/api/item-image?**", route => route.abort());
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
    await page.getByRole("button", { name: "설치 목록 편집" }).click();
    const baseline = page.getByRole("region", { name: "설치 기준" });
    for (const id of [592, 739, 789, 485, 826, 770]) {
        await page.getByLabel("설치 목록 검색").fill(item(id).name);
        await baseline
            .getByRole("checkbox", {
                name: `${item(id).name} 설치 중`,
                exact: true,
            })
            .check();
    }
    await expect(baseline).toContainText("6개");
    await page.getByRole("button", { name: "편집 완료" }).click();
    await expect(
        page.getByRole("button", { name: "설치 목록 편집" })
    ).toBeFocused();
    const before = await page.evaluate(key => localStorage.getItem(key), key);
    await page.getByLabel("목표 능력치").selectOption("CriticalDamage");
    await expect(baseline).toContainText("크리티컬 대미지 7%");
    for (const id of [564, 790, 1207, 341]) await choose(page, id);
    await page
        .getByLabel("미니어처 검색", { exact: true })
        .fill(item(592).name);
    await row(page, 592).getByRole("button", { name: "비교 추가" }).click();
    await expect(page.getByRole("status")).toContainText("최대 4개");
    await row(page, 592).getByRole("button", { name: "미리보기" }).click();
    await expect(
        page.getByRole("region", { name: "구매 후 효과 미리보기" })
    ).toContainText(item(592).name);
    await page
        .getByLabel("미니어처 검색", { exact: true })
        .fill("아무결과도없는검색어");
    await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
    await expect(page.getByRole("region", { name: "함께 비교" })).toContainText(
        "4 / 4"
    );
    expect(prices).toEqual([]);
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(
        before
    );
    await details(page);
    const setCandidate = page.getByRole("article", {
        name: `${item(1207).name} 가격 비교`,
    });
    await expect(setCandidate.getByText("경매장 검색 미지원")).toBeVisible();
    await setCandidate.getByText("효과·설명", { exact: true }).click();
    await expect(
        setCandidate.getByText("세트 효과는 합계에서 제외합니다.")
    ).toBeVisible();
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
    await manual.fill("0");
    await page.getByRole("button", { name: "가격 조회", exact: true }).click();
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
    await page.getByRole("button", { name: "상세 비교 닫기" }).click();
    await expect(
        page.getByRole("button", { name: "상세 비교", exact: true }).first()
    ).toBeFocused();
    await page.reload();
    await expect(
        page.getByRole("heading", { name: /내 설치 현황/ })
    ).toContainText("6개");
});

test("shared baseline and history stay separate from saved installation and favorites", async ({
    page,
}) => {
    await page.route("**/api/item-image?**", route => route.abort());
    const prices: string[] = [];
    page.on("request", r => {
        if (r.url().includes("price-summary")) prices.push(r.url());
    });
    await page.goto(path);
    await page.evaluate(
        ({ key, value }) => {
            localStorage.setItem(key, JSON.stringify(value));
            localStorage.setItem("unrelated-favorites", "keep");
        },
        { key, value: stored([485, 826]) }
    );
    await page.reload();
    await expect(
        page.getByRole("heading", { name: /내 설치 현황/ })
    ).toContainText("2개");
    const config = {
        ...stored([789]),
        candidateIds: [564],
        targetStat: "AttackMax",
        manualPrices: { "54536": "123" },
    };
    const url = `${path}?${new URLSearchParams({ s: JSON.stringify(config) })}`;
    await page.evaluate(url => window.history.pushState(null, "", url), url);
    await expect(
        page.getByRole("heading", { name: /공유된 설치 기준/ })
    ).toContainText("1개");
    await row(page, 592).getByRole("checkbox").check();
    await expect(
        page.getByRole("heading", { name: /공유된 설치 기준/ })
    ).toContainText("2개");
    expect(
        await page.evaluate(
            key => JSON.parse(localStorage.getItem(key)!).installedIds,
            key
        )
    ).toEqual([485, 826]);
    await page.goBack();
    await expect(
        page.getByRole("heading", { name: /내 설치 현황/ })
    ).toContainText("2개");
    await page.goForward();
    await expect(
        page.getByRole("heading", { name: /공유된 설치 기준/ })
    ).toContainText("1개");
    await page
        .getByRole("button", { name: "내 설치 목록으로 돌아가기" })
        .click();
    await expect(
        page.getByRole("heading", { name: /내 설치 현황/ })
    ).toContainText("2개");
    await page.getByRole("button", { name: "공유", exact: true }).click();
    await expect(page.getByLabel("공유 링크")).toHaveValue(
        /\/tools\/miniatures\?s=/
    );
    await page.getByRole("button", { name: "설치 목록 편집" }).click();
    await page.getByRole("button", { name: "설치 목록 초기화" }).click();
    expect(
        await page.evaluate(() => localStorage.getItem("unrelated-favorites"))
    ).toBe("keep");
    expect(
        await page.evaluate(key => localStorage.getItem(key), key)
    ).toBeNull();
    expect(prices).toEqual([]);
});

test("crawler HTML, canonical, PNG and one sitemap URL", async ({
    request,
}) => {
    for (const suffix of ["", "?s=invalid"]) {
        const response = await request.get(`${path}${suffix}`);
        expect(response.ok()).toBe(true);
        const html = await response.text();
        for (const text of [
            "마비노기 미니어처 효과 비교·구매 도우미",
            "능력치마다 독립적으로",
            "세트 효과, 펫 하우스",
            "1788405829",
            'rel="canonical" href="https://erinn.me/tools/miniatures"',
            "/tools/miniatures/preview",
        ])
            expect(html).toContain(text);
    }
    const png = await request.get(`${path}/preview`);
    expect(png.headers()["content-type"]).toContain("image/png");
    const body = await png.body();
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(
        sitemap.match(/<loc>https:\/\/erinn.me\/tools\/miniatures<\/loc>/g)
    ).toHaveLength(1);
});
