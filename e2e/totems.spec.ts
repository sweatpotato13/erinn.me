import { expect, type Page, test } from "@playwright/test";

import data from "../src/data/totem-reference.json";
import fixtures from "../src/lib/__tests__/fixtures/totem-listings.json";

const path = "/tools/totems";
const storageKey = "erinn-totems-v1";
const item = (id: number) => data.totems.find(row => row.id === id)!;
const painting = item(5160004);
const handkerchief = item(52289);
const listing = (id: number) => ({
    ...fixtures.find(row => row.item_name === item(id).name)!,
    auction_price_per_unit: 1200000,
    item_count: 2,
});
const comparison = (page: Page) =>
    page.getByRole("region", { name: "후보 비교", exact: true });
const market = (page: Page) =>
    page.getByRole("region", { name: "실제 매물", exact: true });
const search = (page: Page) =>
    page.getByRole("searchbox", { name: "토템 이름·효과 검색" });
const config = () => ({
    formatVersion: 1,
    snapshotVersion: data.version,
    baseline: { id: painting.id, values: { bonusdamage: "0.3" } },
    targetStat: "bonusdamage",
    budget: "1500000",
    candidates: [] as object[],
});
const shared = (value: object) =>
    `${path}?${new URLSearchParams({ s: JSON.stringify(value) })}`;
async function pick(page: Page, name: string) {
    await search(page).fill(name);
    await page
        .locator("button[aria-pressed]")
        .filter({ hasText: name })
        .click();
}
async function manual(page: Page, value: string) {
    await page
        .getByRole("button", { name: "옵션 직접 입력", exact: true })
        .click();
    await page
        .getByRole("textbox", {
            name: "후보 옵션 보너스 대미지 (%)",
            exact: true,
        })
        .fill(value);
    await page
        .getByRole("button", { name: "직접 입력 후보 추가", exact: true })
        .click();
}
async function observe(page: Page) {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on("request", request => {
        if (
            /\/api\/auction|prilus\.gitlab|(?:ItemExtendTotemList|StringTable|ItemList)\.json/.test(
                request.url()
            )
        )
            requests.push(request.url());
    });
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/item-image?**", route => route.abort());
    return { requests, errors };
}

test("inputs wait for hydration before accepting edits", async ({ page }) => {
    await observe(page);
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
            page.getByRole("heading", { name: "비교·데이터 안내", exact: true })
        ).toBeVisible();
        await expect(search(page)).toBeDisabled();
        await expect(
            page.getByRole("combobox", { name: "종류", exact: true })
        ).toBeDisabled();
        await expect(
            page.locator("button[aria-pressed]").first()
        ).toBeDisabled();
    } finally {
        release();
    }
    await pick(page, "물망초");
    await expect(search(page)).toHaveValue("물망초");
    await expect(
        page.getByRole("region", { name: "선택한 토템" })
    ).toContainText(painting.name);
});

test("home and shared desktop/mobile menu reach the released page", async ({
    page,
}) => {
    await observe(page);
    await page.goto("/");
    await page
        .locator("main")
        .getByRole("link", { name: /토템 비교/ })
        .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "마비노기 토템 옵션 비교·매물 평가"
    );
    const menu = page.getByRole("button", { name: "전체 메뉴", exact: true });
    if (await menu.isVisible()) {
        await menu.click();
        await expect(
            page
                .getByRole("dialog")
                .getByRole("link", { name: "토템 비교", exact: true })
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
    } else {
        const nav = page.getByRole("navigation", { name: "카테고리 탐색" });
        const group = nav.getByText("아이템 비교", { exact: true });
        await group.click();
        await expect(
            nav.getByRole("link", { name: "토템 비교", exact: true })
        ).toBeVisible();
        await group.press("Escape");
        await expect(group).toBeFocused();
    }
});

test("explicit 500-row partial observation connects rolls, quantity and local filters", async ({
    page,
}, info) => {
    const { requests, errors } = await observe(page);
    await page.route("**/api/auction?**", route =>
        route.fulfill({
            json: {
                items: Array.from({ length: 500 }, () => listing(painting.id)),
                hasMore: true,
                nextCursor: "remaining-page",
            },
        })
    );
    await page.goto(path);
    await pick(page, "물망초");
    await page
        .getByRole("combobox", { name: "목표 스탯", exact: true })
        .selectOption("bonusdamage");
    expect(requests).toEqual([]);
    await page.getByRole("button", { name: "매물 조회", exact: true }).click();
    await expect(market(page)).toContainText("정확한 이름 500개");
    await expect(
        market(page).getByText(/일부 매물만 불러왔습니다/)
    ).toBeVisible();
    await expect(market(page).getByRole("article")).toHaveCount(8);
    const first = market(page).getByRole("article").first();
    for (const text of [
        "최대까지 0.6%p",
        "범위 내 위치 33.3% · 확률 아님",
        "2,400,000 골드",
    ])
        await expect(first).toContainText(text);
    // Equal values/prices are separate observations, not a deduplication key.
    await first.getByRole("checkbox").check();
    await market(page)
        .getByRole("article")
        .nth(1)
        .getByRole("checkbox")
        .check();
    await page.getByRole("link", { name: /후보 비교 보기/ }).press("Enter");
    await expect(
        comparison(page).getByRole("heading", { level: 2 })
    ).toHaveText("후보 비교 · 2 / 4");
    await page
        .getByRole("textbox", { name: "개당 예산 (골드, 선택)", exact: true })
        .fill("1000000");
    await market(page)
        .locator("summary")
        .filter({ hasText: "불러온 매물 필터" })
        .click();
    await page.getByRole("checkbox", { name: /개당 예산 초과 제외/ }).check();
    await expect(
        market(page).getByText("불러온 매물 중 조건에 맞는 결과가 없습니다.")
    ).toBeVisible();
    await page
        .getByRole("combobox", { name: "매물 정렬", exact: true })
        .selectOption("value");
    await search(page).fill("찾을수없는토템");
    await expect(comparison(page)).toContainText("후보 비교 · 2 / 4");
    expect(requests).toHaveLength(1);
    const request = new URL(requests[0]);
    expect(request.searchParams.get("auction_item_category")).toBe("토템");
    expect(request.searchParams.get("item_name")).toBe(painting.name);
    expect(errors).toEqual([]);
    await comparison(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("partial-comparison.png") });
});

test("four candidates, fifth rejection, empty-range exploration and keyboard removal", async ({
    page,
}) => {
    const { requests } = await observe(page);
    await page.goto(path);
    await pick(page, "물망초");
    await page
        .getByRole("button", { name: "범위 비교에 추가", exact: true })
        .click();
    await page
        .getByRole("button", { name: "최댓값으로 가정하여 추가", exact: true })
        .click();
    for (const value of ["0.4", "0.6", "1.2"]) await manual(page, value);
    await expect(
        page.getByRole("status").filter({ hasText: "최대 4개" })
    ).toBeVisible();
    await expect(comparison(page)).toContainText("후보 비교 · 4 / 4");
    await pick(page, "달콤한 요거트바");
    await expect(
        page.getByRole("region", { name: "선택한 토템" })
    ).toContainText("옵션 범위 정보 없음");
    await expect(
        page.getByRole("button", {
            name: "최댓값으로 가정하여 추가",
            exact: true,
        })
    ).toBeDisabled();
    await expect(comparison(page)).toContainText(
        "최댓값 가정 · 실제 매물 아님"
    );
    await expect(comparison(page)).toContainText("원본 범위 · 실제값 미입력");
    await comparison(page)
        .getByRole("button", { name: /비교 제거/ })
        .first()
        .press("Enter");
    await expect(comparison(page)).toBeFocused();
    await expect(comparison(page)).toContainText("후보 비교 · 3 / 4");
    await comparison(page)
        .getByRole("button", { name: "후보 전체 해제" })
        .press("Enter");
    await expect(comparison(page)).toContainText("후보 비교 · 0 / 4");
    expect(requests).toEqual([]);
});

test("manual allstat comparison exposes five independent rolls without a baseline", async ({
    page,
}, info) => {
    const { requests } = await observe(page);
    await page.goto(path);
    await pick(page, "콜튼");
    const values = [
        ["체력", "9"],
        ["솜씨", "13"],
        ["지력", "5"],
        ["의지", "13"],
        ["행운", "7"],
    ];
    await page
        .getByRole("button", { name: "옵션 직접 입력", exact: true })
        .click();
    for (const [label, value] of values)
        await page
            .getByRole("textbox", { name: `후보 옵션 ${label}`, exact: true })
            .fill(value);
    await page
        .getByRole("button", { name: "직접 입력 후보 추가", exact: true })
        .click();
    for (const text of ["체력", "솜씨", "지력", "의지", "행운"])
        await expect(
            comparison(page)
                .getByText(new RegExp(text.replace("+", "\\+")))
                .filter({ visible: true })
                .first()
        ).toBeVisible();
    expect(requests).toEqual([]);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true);
    await comparison(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("allstat-losses.png") });
});

test("empty, failed and stale market observations preserve manual candidates", async ({
    page,
}) => {
    const { requests } = await observe(page);
    let response = 0;
    await page.route("**/api/auction?**", route => {
        response++;
        return response === 3
            ? route.fulfill({ status: 503, json: { error: "Unavailable" } })
            : route.fulfill({
                  json: {
                      items: response === 1 ? [] : [listing(painting.id)],
                      hasMore: false,
                      nextCursor: null,
                  },
              });
    });
    await page.goto(path);
    await pick(page, "물망초");
    await page.getByRole("button", { name: "매물 조회", exact: true }).click();
    await expect(market(page)).toContainText(
        "조회한 범위에서 매물이 없습니다."
    );
    await manual(page, "1.2");
    await expect(
        comparison(page)
            .getByText("기준 범위와 다른 값입니다")
            .filter({ visible: true })
            .first()
    ).toBeVisible();
    await page
        .getByRole("button", { name: "매물 다시 조회", exact: true })
        .click();
    await expect(market(page).getByRole("article")).toHaveCount(1);
    await page
        .getByRole("button", { name: "매물 다시 조회", exact: true })
        .click();
    await expect(market(page).getByRole("alert")).toContainText(
        "이전 조회 결과"
    );
    await expect(market(page).getByRole("article")).toHaveCount(1);
    await expect(comparison(page)).toContainText("후보 비교 · 1 / 4");
    await pick(page, "콜튼");
    await expect(market(page).getByRole("article")).toHaveCount(0);
    expect(requests).toHaveLength(3);
});

test("legacy links keep historical candidates and ignore saved baselines", async ({
    page,
}, info) => {
    const { requests, errors } = await observe(page);
    const saved = JSON.stringify({
        formatVersion: 1,
        snapshotVersion: data.version,
        baseline: { id: handkerchief.id, values: { strength: "10" } },
    });
    await page.addInitScript(
        ({ storageKey, saved }) => {
            localStorage.setItem(storageKey, saved);
            Object.defineProperty(navigator, "clipboard", {
                configurable: true,
                value: { writeText: () => Promise.reject(new Error("Denied")) },
            });
        },
        { storageKey, saved }
    );
    const state = config();
    state.candidates = [
        {
            kind: "listing",
            key: "past:1",
            observedAt: "2020-01-01T00:00:00Z",
            item: {
                ...listing(painting.id),
                date_auction_expire: "2020-01-02T00:00:00Z",
            },
        },
    ];
    await page.goto(shared(state));
    await expect(comparison(page)).toContainText("후보 비교 · 1 / 4");
    await expect(
        comparison(page)
            .getByText("등록 종료 시각이 지난 매물")
            .filter({ visible: true })
            .first()
    ).toBeVisible();
    await expect(comparison(page)).toContainText("당시 등록 가격");
    expect(
        await page.evaluate(key => localStorage.getItem(key), storageKey)
    ).toBe(saved);
    const budget = page.getByRole("textbox", {
        name: "개당 예산 (골드, 선택)",
        exact: true,
    });
    await budget.fill("1400000");
    await expect(budget).toHaveValue("1400000");
    await expect(
        page.getByRole("button", {
            name: /비교 링크 공유|설정만 공유|내 토템으로 설정/,
        })
    ).toHaveCount(0);
    expect(
        await page.evaluate(key => localStorage.getItem(key), storageKey)
    ).toBe(saved);
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    await comparison(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("historical-share.png") });
});

test("invalid URLs and unavailable storage recover without requests", async ({
    page,
}) => {
    const { requests } = await observe(page);
    await page.addInitScript(() => {
        Object.defineProperty(Storage.prototype, "getItem", {
            configurable: true,
            value: () => {
                throw new Error("Denied");
            },
        });
        Object.defineProperty(Storage.prototype, "setItem", {
            configurable: true,
            value: () => {
                throw new Error("Denied");
            },
        });
    });
    await page.goto(`${path}?s=invalid&s=duplicate`);
    await expect(comparison(page)).toContainText("후보 비교 · 0 / 4");
    await pick(page, "물망초");
    await manual(page, "0.4");
    await expect(comparison(page)).toContainText("후보 비교 · 1 / 4");
    expect(requests).toEqual([]);
});

test("SSR explanations, base canonical, unique sitemap and PNG preview", async ({
    request,
}) => {
    for (const suffix of ["", "?s=invalid"]) {
        const response = await request.get(`${path}${suffix}`);
        expect(response.ok()).toBe(true);
        const html = (await response.text()).replace(
            /<script\b[^>]*>[\s\S]*?<\/script>/gi,
            ""
        );
        for (const text of [
            "마비노기 토템 옵션 비교·매물 평가",
            "획득 확률이나 상위 백분위",
            "옵션 범위 정보가 없습니다",
            String(data.sourceVersion),
            'href="/auction"',
            'href="/tools/miniatures"',
            'rel="canonical" href="https://erinn.me/tools/totems"',
            'content="https://erinn.me/tools/totems/preview"',
            'content="summary_large_image"',
        ])
            expect(html).toContain(text);
    }
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(
        sitemap.match(/<loc>https:\/\/erinn.me\/tools\/totems[^<]*<\/loc>/g)
    ).toEqual(["<loc>https://erinn.me/tools/totems</loc>"]);
    const preview = await request.get(`${path}/preview`);
    expect(preview.headers()["content-type"]).toBe("image/png");
    const bytes = await preview.body();
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([
        1200, 630,
    ]);
});

test("fixed, ambiguous and unknown evidence stays visible", async ({
    page,
}, info) => {
    const { requests } = await observe(page);
    const state = config();
    state.candidates = [
        {
            kind: "manual",
            key: "fixed:1",
            id: 5160373,
            values: { bonusdamage: "1" },
            price: "",
        },
        {
            kind: "listing",
            key: "ambiguous:1",
            observedAt: "2020-01-01T00:00:00Z",
            item: listing(52188),
        },
        {
            kind: "listing",
            key: "unknown:1",
            observedAt: "2020-01-01T00:00:00Z",
            item: {
                ...listing(painting.id),
                auction_price_per_unit: 0,
                item_option: [
                    {
                        option_type: "토템 효과",
                        option_sub_type: "미확인 효과",
                        option_value: "<img src=x onerror=alert(1)>",
                        option_value2: null,
                        option_desc: "설명의 숫자 99는 옵션값이 아닙니다",
                    },
                ],
            },
        },
        {
            kind: "manual",
            key: "pet:1",
            id: 52495,
            values: { strength: "10" },
            price: "1000",
        },
    ];
    await page.goto(shared(state));
    await expect(comparison(page)).toContainText("후보 비교 · 4 / 4");
    for (const text of [
        "고정 수치",
        "동명이인 · 범위 확정 불가",
        "미확인 효과",
        "가격 미확인",
        "수치 평가 제외",
    ])
        await expect(
            comparison(page)
                .getByText(text, { exact: false })
                .filter({ visible: true })
                .first()
        ).toBeVisible();
    expect(await comparison(page).locator("img").count()).toBe(0);
    await comparison(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("evidence-states.png") });
    await pick(page, "노랑 꽃송편");
    await expect(
        page.getByRole("region", { name: "선택한 토템" })
    ).toContainText("경매장 검색 미지원");
    await page.goto(
        shared({
            ...config(),
            baseline: {
                id: 5160005,
                values: { mindamage: "10", maxdamage: "10" },
            },
            candidates: [
                {
                    kind: "manual",
                    key: "royal:1",
                    id: 5160100,
                    values: { intelligence: "5", magicattack: "5" },
                    price: "1000",
                },
            ],
        })
    );
    for (const text of ["지력", "마법 공격력"]) {
        await expect(
            comparison(page)
                .getByText(text, { exact: false })
                .filter({ visible: true })
                .first()
        ).toBeVisible();
    }
    await comparison(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("composite-losses.png") });
    expect(requests).toEqual([]);
});
