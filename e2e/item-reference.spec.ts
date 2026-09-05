import { expect, test } from "@playwright/test";

test("selects a real snapshot suggestion and preserves its exact auction query", async ({
    page,
}) => {
    const name = "가을빛 포도나무 의자(2인)";
    const marketRequests: URL[] = [];
    await page.route("**/api/auction/**", route => {
        const url = new URL(route.request().url());
        marketRequests.push(url);
        return route.fulfill({
            json: url.pathname.endsWith("/history")
                ? {
                      sales: [],
                      hasMore: false,
                      fetchedAt: new Date().toISOString(),
                  }
                : { items: [], hasMore: false, nextCursor: null },
        });
    });
    await page.goto("/auction", { waitUntil: "networkidle" });
    const input = page.getByPlaceholder("아이템명");
    await input.fill("가을빛 포도나무");
    const suggestion = page.getByRole("button", { name, exact: true });
    await expect(suggestion).toHaveCount(1);
    await suggestion.click();
    await expect(input).toHaveValue(name);
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await expect
        .poll(() => new URL(page.url()).searchParams.get("q"))
        .toBe(name);
    await expect.poll(() => marketRequests.length).toBe(2);
    expect(
        marketRequests
            .find(url => url.pathname.endsWith("/keyword-search"))
            ?.searchParams.get("keyword")
    ).toBe(name);
    expect(
        marketRequests
            .find(url => url.pathname.endsWith("/history"))
            ?.searchParams.get("item_name")
    ).toBe(name);
});
