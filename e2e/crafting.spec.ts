import { expect, test } from "@playwright/test";

import reference from "../src/data/crafting-reference.json";

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
