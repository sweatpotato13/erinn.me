import { expect, test } from "@playwright/test";

test.describe("Homepage Tests", () => {
    test("Homepage loads correctly", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/Erinn/);
        await expect(page.locator("main")).toBeVisible();
    });

    test("Navigation works correctly", async ({ page }) => {
        await page.goto("/");

        await expect(page.locator("header.navbar")).toBeVisible();
        for (const path of [
            "/auction",
            "/npc-shop",
            "/horn",
            "/changelog",
            "/contact",
        ]) {
            await expect(page.locator(`main a[href="${path}"]`)).toBeVisible();
        }

        await page.locator("header.navbar button").click();
        await expect(page.locator('a[href="/dungeon"]')).toHaveCount(0);
        await expect(page.locator('a[href="/crafting"]')).toHaveCount(0);
        for (const path of ["/auction", "/npc-shop", "/horn", "/changelog"]) {
            await expect(
                page.locator(`header a[href="${path}"]`)
            ).toBeVisible();
        }

        await page.locator('main a[href="/auction"]').click();
        await expect(page).toHaveURL(/auction/);
    });

    for (const path of ["/dungeon", "/crafting"]) {
        test(`${path} returns the standard not-found page`, async ({ page }) => {
            const response = await page.goto(path);

            expect(response?.status()).toBe(404);
            await expect(
                page.getByRole("heading", { name: "404" })
            ).toBeVisible();
        });
    }
});
