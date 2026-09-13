import { expect, test } from "@playwright/test";

import reference from "../src/data/murias-reference.json";

const path = "/tools/murias-relics";
const snapshot = {
    referenceVersion: reference.version,
    fetchedAt: "2026-09-13T00:00:00Z",
    isComplete: false,
    pages: 2,
    nextCursor: "next",
    cells: reference.effects.flatMap(effect =>
        effect.values.map((_, index) => ({
            effectId: effect.id,
            level: index + 1,
            minUnitPrice: null,
            listingCount: 0,
            listings: [],
        }))
    ),
    receivedCount: 0,
    unclassifiedCount: 0,
    excludedCount: 0,
    rejected: [],
    relicError: null,
    ideaPrice: 100,
    ideaFetchedAt: "2026-09-13T00:00:00Z",
    ideaIsComplete: true,
    ideaError: null,
};

test("matrix scroll, keyboard detail, local search and failed refresh", async ({
    page,
}) => {
    let requests = 0;
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/murias-relics?**", async route => {
        requests++;
        await route.fulfill(
            route.request().method() === "POST"
                ? { status: 503, body: "failed" }
                : { json: snapshot }
        );
    });
    await page.goto(path);
    await expect(page.getByText(/일부 매물만 조회/)).toBeVisible();
    await expect(page.getByRole("columnheader")).toHaveCount(11);
    await expect(page.getByRole("rowheader")).toHaveCount(30);
    const region = page.getByRole("region", {
        name: "유물 효과별 레벨 가격표",
    });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true);
    const overflow = await region.evaluate(
        element => element.scrollWidth > element.clientWidth
    );
    if (page.viewportSize()!.width < 700) expect(overflow).toBe(true);
    if (overflow) {
        await region.evaluate(element => {
            element.scrollLeft = element.scrollWidth;
        });
        expect(
            await region.evaluate(element => element.scrollLeft)
        ).toBeGreaterThan(0);
        await expect(
            page.getByRole("columnheader", { name: "10레벨", exact: true })
        ).toBeInViewport();
    }
    const initialRequests = requests; // Next dev Strict Mode remounts effects.
    await page.getByRole("searchbox").fill("데바스테이션");
    await expect(page.getByRole("rowheader")).toHaveCount(1);
    const button = page.getByRole("button", {
        name: "데바스테이션 캐논 대미지 2레벨 상세",
    });
    await button.focus();
    await button.press("Enter");
    const detail = page.getByRole("region", { name: "선택한 유물 매물" });
    await expect(detail).toBeFocused();
    await expect(detail.getByRole("heading")).toContainText("80% 증가");
    expect(requests).toBe(initialRequests);
    await page.getByRole("button", { name: "가격 새로고침" }).click();
    await expect(
        page.getByRole("alert").filter({ hasText: "이전 조회 결과" })
    ).toBeVisible();
    await expect(page.getByText(/유물 조회:/)).toContainText("2026. 9. 13.");
    expect(errors).toEqual([]);
});

test("home and desktop/mobile menu expose canonical tool route", async ({
    page,
}) => {
    await page.route("**/api/murias-relics?**", route =>
        route.fulfill({ json: snapshot })
    );
    await page.goto("/");
    const homeLink = page.getByRole("link", {
        name: /무리아스의 유물 가격.*아르카나별/,
    });
    await homeLink.click();
    await expect(page).toHaveURL(new RegExp(path));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://erinn.me${path}`
    );
    const menu = page.getByRole("button", { name: "전체 메뉴", exact: true });
    if (await menu.isVisible()) {
        await menu.click();
        await expect(
            page.getByRole("dialog").getByRole("link", {
                name: "무리아스의 유물 가격",
                exact: true,
            })
        ).toBeVisible();
    } else {
        const nav = page.getByRole("navigation", { name: "카테고리 탐색" });
        await nav.locator("summary").filter({ hasText: "아이템 비교" }).click();
        await expect(
            nav.getByRole("link", { name: "무리아스의 유물 가격", exact: true })
        ).toBeVisible();
    }
});
