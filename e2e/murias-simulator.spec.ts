import { expect, test } from "@playwright/test";

import reference from "../src/data/murias-reference.json";

const path = "/tools/murias-relics/simulator";
const snapshot = {
    referenceVersion: reference.version,
    fetchedAt: "2026-09-13T00:00:00Z",
    isComplete: true,
    pages: 1,
    nextCursor: null,
    cells: reference.effects.flatMap(effect =>
        effect.values.map((_, i) => ({
            effectId: effect.id,
            level: i + 1,
            minUnitPrice: 20_000_000,
            listingCount: 1,
            listings: [],
        }))
    ),
    receivedCount: 300,
    unclassifiedCount: 0,
    excludedCount: 0,
    rejected: [],
    relicError: null,
    ideaPrice: 10_000_000,
    ideaFetchedAt: "2026-09-13T00:00:00Z",
    ideaIsComplete: true,
    ideaError: null,
};

test("ten restorations by keyboard, reduced motion, frozen ledger and no per-opening fetch", async ({
    page,
}) => {
    let requests = 0;
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/murias-relics", route => {
        requests++;
        return route.fulfill({ json: snapshot });
    });
    await page.goto(path);
    const restore = page.getByRole("button", { name: "복원", exact: true });
    await expect(restore).toBeEnabled();
    await expect(page.getByText(/공식 확률 아님/)).toBeVisible();
    const before = requests;
    await restore.focus();
    for (let i = 0; i < 10; i++) await restore.press("Enter");
    const total = page.getByRole("region", { name: "누적 손익" });
    await expect(total).toContainText("+90,000,000 Gold (이득)");
    await expect(total).toContainText("평가 완료 10/10");
    await expect(page.getByRole("article")).toHaveCount(10);
    const history = page.getByRole("region", { name: "복원 기록" });
    await expect(history.locator("article details[open]")).toHaveCount(0);
    expect(
        (await history.locator("article summary").first().boundingBox())!.height
    ).toBeLessThan(50);
    if (page.viewportSize()!.width > 760) {
        expect((await history.boundingBox())!.x).toBeGreaterThan(
            (await total.boundingBox())!.x
        );
    }
    expect((await total.boundingBox())!.y).toBeLessThan(
        (await restore.boundingBox())!.y
    );
    await history.locator("article summary").first().click();
    await expect(history.locator("article details[open]")).toHaveCount(1);
    await history.locator("article summary").first().click();

    await expect(page.getByRole("status")).toContainText("#10");
    expect(requests).toBe(before);
    await expect(
        page.getByRole("img", { name: "무리아스의 유물", exact: true })
    ).toBeVisible();
    await expect(
        page.getByRole("checkbox", { name: "은행 직거래" })
    ).toHaveCount(0);
    await page.getByRole("button", { name: "취소", exact: true }).click();
    await expect(restore).toBeHidden();
    await expect(total).toContainText("평가 완료 10/10");
    await page
        .locator("summary")
        .filter({ hasText: "무리아스의 유물 복원" })
        .click();
    await expect(restore).toBeVisible();
    await expect(restore).toHaveCSS("transition-duration", "0s");
    await page.getByLabel("이데아 단가 (Gold)").fill("0");
    await expect(total).toContainText("+90,000,000 Gold (이득)");
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true);
    await page.getByRole("button", { name: "세션 초기화" }).click();
    await expect(page.getByRole("article")).toHaveCount(0);
    expect(errors).toEqual([]);
});

test("home, canonical and desktop/mobile menu link to simulator with one active page", async ({
    page,
}) => {
    await page.route("**/api/murias-relics", route =>
        route.fulfill({ json: snapshot })
    );
    await page.goto("/");
    await page
        .getByRole("link", {
            name: /무리아스 유물 복원 시뮬레이터.*유물을 복원/,
        })
        .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://erinn.me${path}`
    );
    const menu = page.getByRole("button", { name: "전체 메뉴", exact: true });
    if (await menu.isVisible()) {
        await menu.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.locator('[aria-current="page"]')).toHaveCount(1);
        await expect(
            dialog.getByRole("link", {
                name: "무리아스 유물 복원 시뮬레이터",
                exact: true,
            })
        ).toHaveAttribute("aria-current", "page");
    } else {
        const nav = page.getByRole("navigation", { name: "카테고리 탐색" });
        await nav
            .locator("summary")
            .filter({ hasText: "강화 시뮬레이터" })
            .click();
        await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
        await expect(
            nav.getByRole("link", {
                name: "무리아스 유물 복원 시뮬레이터",
                exact: true,
            })
        ).toBeVisible();
    }
});
