import { expect, test } from "@playwright/test";

import reference from "../src/data/crafting-reference.json";
import {
    type CraftingReference,
    selectCraftingRecipe,
} from "../src/lib/crafting";
import {
    buildCraftingShare,
    emptyCraftingPlan,
} from "../src/lib/crafting-state";
import {
    BARTER_STORAGE_KEY,
    emptyBarterPlan,
    serializeBarterStorage,
    updateBarterRow,
} from "../src/lib/barter-state";
import { type BarterReference, emptyBarterRow } from "../src/lib/barter";
import barterReference from "../src/data/barter-reference.json";

const recipe = reference.recipes.find(recipe => recipe.itemId === 67201)!;
const material = reference.items.find(item => item.id === 67200)!;

test("crafting selection, batch stock, explicit prices and sharing use the preparation layout", async ({
    page,
}, testInfo) => {
    let marketRequests = 0;
    const forbidden: string[] = [];
    page.on("request", request => {
        if (/prilus|StringTable\.json|ItemList\.json/.test(request.url()))
            forbidden.push(request.url());
    });
    await page.route("**/api/auction/price-summary?*", async route => {
        marketRequests++;
        await route.fulfill({
            json: {
                minPrice: 100,
                averagePrice: 100,
                availableQuantity: 999,
                isComplete: true,
                fetchedAt: "2026-09-10T00:00:00Z",
            },
        });
    });
    await page.goto("/tools/crafting");
    await expect(page.getByLabel("아이템 검색", { exact: true })).toBeEnabled();
    await page.getByLabel("아이템 검색", { exact: true }).fill("67201");
    await page
        .getByRole("button", {
            name: "실리엔 #67201 · 제작법 1개 담기",
            exact: true,
        })
        .click();
    const target = page.getByRole("article", {
        name: "실리엔 제작 목표",
        exact: true,
    });
    await target.getByLabel("실리엔 만들 수량", { exact: true }).fill("5");
    await target.getByLabel("실리엔 보유 수량", { exact: true }).fill("1");
    await target
        .getByLabel("실리엔 제작법", { exact: true })
        .selectOption(recipe.fingerprint);
    await expect(target).toContainText("입력한 제작 조건 기준");
    await target
        .getByLabel("실리엔 성공한 제작 1회당 완성 수량", { exact: true })
        .fill("3");
    await target
        .getByLabel("실리엔 완성 1회까지 공정 횟수", { exact: true })
        .fill("1");
    await target
        .getByLabel("공정 재료 1", { exact: true })
        .selectOption("67200");
    await expect(target).toContainText("제작 2회 · 완성 6개 · 남음 2개");
    const shopping = page.getByRole("region", {
        name: "나의 준비 목록",
        exact: true,
    });
    const row = shopping.getByRole("article", {
        name: `${material.name} 재료`,
        exact: true,
    });
    await row
        .getByLabel(`${material.name} 보유 수량`, { exact: true })
        .fill("4");
    await row.locator("summary").click();
    await row
        .getByLabel(`${material.name} 단가 (Gold)`, { exact: true })
        .fill("100");
    await shopping
        .getByText("추가 비용·보유 재료 가치", { exact: true })
        .click();
    await shopping
        .getByLabel("계획 전체 일회성 비용 (Gold)", { exact: true })
        .fill("50");
    await expect(shopping.locator("dl").first()).toContainText("650 Gold");
    await expect(shopping.locator("dl").first()).toContainText("400 Gold");
    await expect(shopping.locator("dl").first()).toContainText("1,050 Gold");
    expect(marketRequests).toBe(0);
    await page
        .getByRole("button", { name: "선택한 항목 시세 조회", exact: true })
        .click();
    await expect.poll(() => marketRequests).toBe(2);
    await expect(
        row.getByLabel(`${material.name} 단가 (Gold)`, { exact: true })
    ).toHaveValue("100");
    await shopping.getByText("완제품 구매와 비교", { exact: true }).click();
    await shopping
        .getByLabel("실리엔 동일 조건 완제품 단가 (Gold)", { exact: true })
        .fill("300");
    await shopping.getByLabel("제작 결과와 동일한 조건의 가격이에요").check();
    await expect(shopping).toContainText("구매보다 적게 필요 550 Gold");
    await expect(shopping).toContainText("구매보다 적게 필요 150 Gold");
    const before = await page.evaluate(
        () => JSON.parse(localStorage.getItem("erinn-crafting-v1")!).owned
    );
    await row.getByLabel(`${material.name} 준비 완료`, { exact: true }).check();
    expect(
        await page.evaluate(
            () => JSON.parse(localStorage.getItem("erinn-crafting-v1")!).owned
        )
    ).toEqual(before);
    await page.getByRole("button", { name: "목록 복사", exact: true }).click();
    await expect(page.getByLabel("내보낸 계획")).toContainText(
        "보유 재료 사용 가치: 400 Gold"
    );
    await page
        .getByRole("button", { name: "공유 링크 복사", exact: true })
        .click();
    const share = await page.getByLabel("내보낸 계획").inputValue();
    await page.goto(share);
    await expect(
        page.getByText("공유·가져온 계획을 임시로 열었습니다.", {
            exact: false,
        })
    ).toBeVisible();
    await expect(
        page.getByLabel("실리엔 만들 수량", { exact: true })
    ).toHaveValue("5");
    const font = await page
        .locator("h1")
        .evaluate(el => getComputedStyle(el).fontFamily);
    expect(font).toBe(
        await page
            .locator("html")
            .evaluate(el => getComputedStyle(el).fontFamily)
    );
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true);
    expect(forbidden).toEqual([]);
    await page.screenshot({
        path: testInfo.outputPath("crafting-plan.png"),
        fullPage: true,
    });
});

test("barter passes net deficits without merging the saved crafting inventory", async ({
    page,
}) => {
    const data = barterReference as BarterReference;
    const now = Date.parse("2026-09-10T08:00:00+09:00");
    const good = data.goods.find(good => good.key === "fixed:201:20101")!;
    const plan = updateBarterRow(emptyBarterPlan(data, now), {
        ...emptyBarterRow(good),
        q: "5",
    });
    plan.owned[67201] = "4";
    await page.clock.install({ time: now });
    await page.goto("/tools/barter");
    await page.evaluate(
        ({ key, value }) => {
            localStorage.setItem(key, value);
            localStorage.setItem(
                "erinn-crafting-v1",
                "previous crafting plan with original stock"
            );
        },
        { key: BARTER_STORAGE_KEY, value: serializeBarterStorage(plan) }
    );
    await page.reload();
    await page
        .getByRole("button", { name: "부족 재료 제작 준비", exact: true })
        .click();
    await expect(page).toHaveURL(/\/tools\/crafting\?b=/);
    await expect(
        page.getByText("물물교환에서 부족한 재료를 가져왔어요.", {
            exact: false,
        })
    ).toBeVisible();
    await expect(
        page.getByLabel("실리엔 만들 수량", { exact: true })
    ).toHaveValue("6");
    await expect(
        page.getByLabel("실리엔 물물교환 배정 후 남은 보유 수량", {
            exact: true,
        })
    ).toHaveValue("0");
    expect(
        await page.evaluate(() => localStorage.getItem("erinn-crafting-v1"))
    ).toBe("previous crafting plan with original stock");
});

test("released navigation, server context, base canonical and Korean preview", async ({
    page,
    request,
}) => {
    await page.goto("/");
    await page.locator('main a[href="/tools/crafting"]').click();
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "마비노기 제작 원가 계산기",
        })
    ).toBeVisible();
    const response = await request.get("/tools/crafting?s=invalid", {
        headers: { "User-Agent": "Twitterbot" },
    });
    const html = (await response.text()).replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        ""
    );
    for (const text of [
        "마비노기 제작 원가 계산기",
        "계산 기준과 지원 범위",
        "보유분은 한 번만",
        String(reference.sourceVersion),
        reference.ruleVersion,
        "https://erinn.me/tools/crafting/preview",
        'href="https://erinn.me/tools/crafting"',
        'content="summary_large_image"',
    ])
        expect(html).toContain(text);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect([
        ...sitemap.matchAll(/<loc>https:\/\/erinn.me\/tools\/crafting<\/loc>/g),
    ]).toHaveLength(1);
    expect(sitemap).not.toContain("crafting/preview");
    expect(sitemap).not.toContain("?s=");
    const preview = await request.get("/tools/crafting/preview");
    expect(preview.ok()).toBe(true);
    expect(preview.headers()["content-type"]).toContain("image/png");
    const image = await preview.body();
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
    const menu = page.getByRole("button", { name: "전체 메뉴", exact: true });
    if (await menu.isVisible()) {
        await menu.click();
        await expect(
            page
                .getByRole("dialog")
                .getByRole("link", { name: "제작 원가 계산기", exact: true })
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
    }
});

test("shared intermediate settings, keyboard controls and narrow themed layouts", async ({
    page,
}, testInfo) => {
    const data = reference as CraftingReference;
    const plan = emptyCraftingPlan(data);
    plan.targets = [
        { itemId: 45037, count: "1" },
        { itemId: 67209, count: "1" },
    ];
    for (const id of [45037, 67209, 67201]) {
        const recipe = data.recipes.find(
            recipe =>
                recipe.itemId === id &&
                (id !== 67209 ||
                    recipe.process.some(group => group.itemIds.includes(67201)))
        )!;
        plan.choices[id] = {
            ...selectCraftingRecipe(recipe),
            yield: id === 67201 ? "2" : "1",
            passes: "1",
            processChoices: recipe.process.map(group => group.itemIds[0]),
        };
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(buildCraftingShare(plan));
    const summary = page.getByText("실리엔 · 전체 필요 2개 · 직접 제작", {
        exact: true,
    });
    await expect(summary).toBeVisible();
    await summary.click();
    await expect(
        page.getByLabel("실리엔 성공한 제작 1회당 완성 수량", { exact: true })
    ).toHaveCount(1);
    await expect(page.locator("#craft-node-67201")).toContainText("제작 1회");
    const increase = page.getByRole("button", {
        name: "마력탄 만들 수량 늘리기",
        exact: true,
    });
    await increase.focus();
    await page.keyboard.press("Enter");
    await expect(
        page.getByLabel("마력탄 만들 수량", { exact: true })
    ).toHaveValue("2");
    await expect(page.locator("#craft-node-67201")).toContainText(
        "전체 필요 3개"
    );
    await expect(page.locator("#craft-node-67201")).toContainText("제작 2회");
    for (const theme of ["light", "dark"]) {
        await page
            .locator("html")
            .evaluate(
                (el, theme) => el.setAttribute("data-theme", theme),
                theme
            );
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
            )
        ).toBe(true);
        await page
            .getByRole("link", { name: /준비 목록 · .*확인하기/ })
            .click();
        await expect(
            page.getByRole("heading", { name: "나의 준비 목록", exact: true })
        ).toBeInViewport();
        await page.screenshot({
            path: testInfo.outputPath(`crafting-320-${theme}.png`),
            fullPage: true,
        });
    }
    // A 640px window at 200% exercises the supported 320px content width.
    await page.setViewportSize({ width: 640, height: 900 });
    await page.locator("html").evaluate(el => {
        el.style.zoom = "2";
    });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true);
});
