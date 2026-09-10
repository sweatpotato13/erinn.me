import { expect, test } from "@playwright/test";

import barterReference from "../src/data/barter-reference.json";
import reference from "../src/data/crafting-reference.json";
import { type BarterReference, emptyBarterRow } from "../src/lib/barter";
import {
    BARTER_STORAGE_KEY,
    emptyBarterPlan,
    serializeBarterStorage,
    updateBarterRow,
} from "../src/lib/barter-state";
import {
    type CraftingReference,
    selectCraftingRecipe,
} from "../src/lib/crafting";
import {
    buildCraftingShare,
    emptyCraftingPlan,
} from "../src/lib/crafting-state";

const material = reference.items.find(item => item.id === 67200)!;

test("crafting selection, visible material costs and finished auction minima", async ({
    page,
}, testInfo) => {
    let marketRequests = 0;
    const requestedNames: string[] = [];
    const forbidden: string[] = [];
    page.on("request", request => {
        if (/prilus|StringTable\.json|ItemList\.json/.test(request.url()))
            forbidden.push(request.url());
    });
    await page.route("**/api/auction/price-summary?*", async route => {
        marketRequests++;
        requestedNames.push(
            new URL(route.request().url()).searchParams.get("item_name")!
        );
        await route.fulfill({
            json: {
                minPrice: decodeURIComponent(route.request().url()).includes(
                    "실리엔"
                )
                    ? 300
                    : 100,
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
    await expect(
        target.getByLabel("실리엔 보유 수량", { exact: true })
    ).toHaveCount(0);
    await expect(
        target.getByLabel("실리엔 제작법", { exact: true })
    ).toHaveCount(0);
    await expect(
        target.getByRole("button", { name: "구매", exact: true })
    ).toHaveCount(0);
    await expect(
        target.getByText("아래 항목은 모두 필요한 재료입니다.", {
            exact: false,
        })
    ).toBeVisible();
    await expect(target).toContainText("입력한 제작 조건 기준");
    await expect(target).not.toContainText("추가 비용·제작법 정보");
    await expect(target.getByLabel(/완성 1회당 부가 비용/)).toHaveCount(0);
    await target
        .getByLabel("실리엔 성공한 제작 1회당 완성 수량", { exact: true })
        .fill("3");
    await expect(
        target.getByLabel("실리엔 완성 1회까지 공정 횟수", { exact: true })
    ).toHaveCount(0);
    await target.getByLabel("재료 1", { exact: true }).selectOption("67200");
    await expect(target).toContainText("제작 2회 · 완성 6개 · 남음 1개");
    const shopping = page.getByRole("region", {
        name: "제작 재료 및 원가",
        exact: true,
    });
    const row = shopping.getByRole("article", {
        name: `${material.name} 재료`,
        exact: true,
    });
    await expect(page.getByLabel(/보유 수량/)).toHaveCount(0);
    await row.getByText("가격 출처·사용처", { exact: true }).click();
    await expect(row).toContainText("실리엔에서 10개 필요");
    await expect(row).not.toContainText("제작품 #");
    await expect(
        row.getByLabel(`${material.name} 단가 (Gold)`, { exact: true })
    ).toBeVisible();
    await row
        .getByLabel(`${material.name} 단가 (Gold)`, { exact: true })
        .fill("100");
    await expect(shopping.getByText("추가 비용", { exact: true })).toHaveCount(
        0
    );
    await expect(shopping.locator("dl").first()).toContainText("1,000 Gold");
    expect(marketRequests).toBe(0);
    await row
        .getByRole("button", {
            name: `${material.name} 시세 조회`,
            exact: true,
        })
        .click();
    await expect.poll(() => marketRequests).toBe(1);
    expect(requestedNames[0]).toContain(material.name);
    await expect(
        row.getByRole("button", {
            name: `${material.name} 시세 조회`,
            exact: true,
        })
    ).toBeEnabled();
    await expect(shopping.locator("dl").first()).toContainText(
        "시세 조회 필요"
    );

    await page
        .getByRole("button", { name: "전체 항목 시세 조회", exact: true })
        .click();
    await expect.poll(() => marketRequests).toBe(3);
    await expect(
        row.getByLabel(`${material.name} 단가 (Gold)`, { exact: true })
    ).toHaveValue("100");
    await expect(
        shopping.getByText("완제품 경매장 최저가", { exact: true })
    ).toBeVisible();
    await expect(shopping.getByLabel(/동일 조건|비교 조건/)).toHaveCount(0);
    await expect(shopping.locator("dl").first()).toContainText("1,500 Gold");
    await expect(shopping).toContainText("구매보다 적게 필요 500 Gold");
    await expect(page.getByLabel(/준비 완료/)).toHaveCount(0);
    await expect(
        page.getByRole("button", {
            name: /^(목록 복사|다운로드|공유 링크 복사)$/,
        })
    ).toHaveCount(0);
    await page.reload();
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
    ).toHaveCount(0);
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
        "만들 물품을 고르면, 필요한 재료와 구매·제작 비용을 비교할 수",
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
    expect(html).not.toContain("계산 기준과 지원 범위");
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
    const firstTarget = page.getByRole("article", {
        name: "마력탄 제작 목표",
        exact: true,
    });
    const secondTarget = page.getByRole("article", {
        name: `${data.items.find(item => item.id === 67209)!.name} 제작 목표`,
        exact: true,
    });
    const firstIntermediate = firstTarget.getByRole("article", {
        name: "실리엔 중간재",
        exact: true,
    });
    const secondIntermediate = secondTarget.getByRole("article", {
        name: "실리엔 중간재",
        exact: true,
    });
    await expect(firstIntermediate).toBeVisible();
    await expect(secondIntermediate).toBeVisible();
    await expect(
        page.getByText(/설정을 함께 적용합니다|공통 설정|전체 제작품 합산 필요/)
    ).toHaveCount(0);
    await expect(firstIntermediate).toContainText("필요 수량 1개");
    await expect(secondIntermediate).toContainText("필요 수량 1개");
    await expect(firstIntermediate).toContainText("제작 1회");
    await expect(
        page.getByText("필요한 재료 보기 · 전체 계획에서 합산")
    ).toHaveCount(0);
    await firstIntermediate
        .getByLabel("실리엔 성공한 제작 1회당 완성 수량", { exact: true })
        .fill("3");
    await expect(
        secondIntermediate.getByLabel("실리엔 성공한 제작 1회당 완성 수량", {
            exact: true,
        })
    ).toHaveValue("3");
    await firstIntermediate
        .getByLabel("실리엔 성공한 제작 1회당 완성 수량", { exact: true })
        .fill("2");
    const increase = page.getByRole("button", {
        name: "마력탄 만들 수량 늘리기",
        exact: true,
    });
    await increase.focus();
    await page.keyboard.press("Enter");
    await expect(
        page.getByLabel("마력탄 만들 수량", { exact: true })
    ).toHaveValue("2");
    await expect(firstIntermediate).toContainText("필요 수량 2개");
    await expect(secondIntermediate).toContainText("필요 수량 1개");
    await expect(firstIntermediate).toContainText("제작 1회");
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
            .getByRole("link", { name: /필요 재료 · .*확인하기/ })
            .click();
        await expect(
            page.getByRole("heading", {
                name: "제작 재료 및 원가",
                exact: true,
            })
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

test("only tailoring and blacksmithing ask for passes; multiple recipes still need selection", async ({
    page,
}) => {
    await page.goto("/tools/crafting");
    for (const type of [65537, 65538]) {
        const recipe = reference.recipes.find(
            recipe =>
                recipe.type === type &&
                !recipe.issues.length &&
                reference.recipes.filter(
                    candidate => candidate.itemId === recipe.itemId
                ).length === 1
        )!;
        const name = reference.items.find(
            item => item.id === recipe.itemId
        )!.name;
        await page
            .getByLabel("아이템 검색", { exact: true })
            .fill(String(recipe.itemId));
        await page
            .getByRole("button", {
                name: new RegExp(`#${recipe.itemId}.*담기`),
            })
            .click();
        const target = page.getByRole("article", {
            name: `${name} 제작 목표`,
            exact: true,
        });
        await expect(
            target.getByLabel(`${name} 제작법`, { exact: true })
        ).toHaveCount(0);
        await expect(
            target.getByRole("button", { name: "구매", exact: true })
        ).toHaveCount(0);
        await expect(
            target.getByLabel(`${name} 완성 1회까지 공정 횟수`, { exact: true })
        ).toBeVisible();
        await target
            .getByLabel(`${name} 완성 1회까지 공정 횟수`, { exact: true })
            .fill("3");
    }
    await page.getByLabel("아이템 검색", { exact: true }).fill("64009");
    await page.getByRole("button", { name: /미스릴괴 #64009.*담기/ }).click();
    await expect(
        page.getByLabel("미스릴괴 제작법", { exact: true })
    ).toHaveValue("");
});

test("a non-auction duplicate does not hide thick thread lookup or its price", async ({
    page,
}) => {
    const data = reference as CraftingReference;
    const recipe = data.recipes.find(recipe => recipe.itemId === 81116)!;
    const plan = emptyCraftingPlan(data);
    plan.targets = [{ itemId: recipe.itemId, count: "1" }];
    plan.choices[recipe.itemId] = {
        ...selectCraftingRecipe(recipe),
        yield: "1",
        passes: "1",
        processChoices: recipe.process.map(group =>
            group.itemIds.includes(60050) ? 60050 : group.itemIds[0]
        ),
    };
    const requests: string[] = [];
    await page.route("**/api/auction/price-summary?*", async route => {
        requests.push(
            new URL(route.request().url()).searchParams.get("item_name")!
        );
        await route.fulfill({
            json: {
                minPrice: 123,
                averagePrice: 150,
                availableQuantity: 999,
                isComplete: true,
                fetchedAt: "2026-09-10T00:00:00Z",
            },
        });
    });
    await page.goto(buildCraftingShare(plan));
    const row = page.getByRole("article", {
        name: "질긴 실 재료",
        exact: true,
    });
    await row
        .getByRole("button", { name: "질긴 실 시세 조회", exact: true })
        .click();
    await expect(
        row.getByLabel("질긴 실 단가 (Gold)", { exact: true })
    ).toHaveValue("123");
    expect(requests).toEqual(["질긴 실"]);
    await expect(row).not.toContainText("재료 비용: 단가·수량 확인 필요");
});
