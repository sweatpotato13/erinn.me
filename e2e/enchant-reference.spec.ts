import { expect, test } from "@playwright/test";

test("equipment and scrolls use local references and annotate only variable rolls", async ({
    page,
}) => {
    const referenceRequests: string[] = [];
    await page.route(
        /https:\/\/(?:[^/]+\.)?pril\.cc\/|https:\/\/prilus\.gitlab\.io\//,
        route => {
            referenceRequests.push(route.request().url());
            return route.abort();
        }
    );
    const items = [
        {
            item_display_name: "굴레 대형 낫",
            item_option: [
                {
                    option_type: "인챈트",
                    option_value: "굴레",
                    option_sub_type: "접미",
                    option_desc:
                        "피어싱 레벨 2 증가,마법 공격력 50 증가,지력 30 증가,수리비 200% 증가",
                },
            ],
        },
        {
            item_display_name: "어스름한 인챈트 스크롤",
            item_option: [
                {
                    option_type: "인챈트 종류",
                    option_value: "어스름한",
                    option_sub_type: "접두",
                },
            ],
        },
    ].map((item, index) => ({
        ...item,
        item_name: item.item_display_name,
        item_count: 1,
        auction_price_per_unit: 100 + index,
        date_auction_expire: "2026-09-30T00:00:00Z",
    }));
    await page.route("**/api/auction/**", route =>
        route.fulfill({
            json: new URL(route.request().url()).pathname.endsWith("/history")
                ? {
                      sales: [],
                      hasMore: false,
                      fetchedAt: "2026-09-05T00:00:00Z",
                  }
                : { items, hasMore: false, nextCursor: null },
        })
    );
    await page.route("**/api/suggest?**", route =>
        route.fulfill({ json: { suggestions: [] } })
    );
    await page.goto("/auction", { waitUntil: "networkidle" });
    await page.getByPlaceholder("아이템명").fill("인챈트");
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await page.getByText("굴레 대형 낫", { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "아이템 옵션" });
    await expect(dialog.getByText(/• 마법 공격력 50 증가/)).toContainText(
        "최대치 -5"
    );
    await expect(dialog.getByText(/• 피어싱 레벨 2 증가/)).toContainText(
        "최대치 -1"
    );
    await expect(dialog.getByText(/• 지력 30 증가/)).not.toContainText(
        "최대치"
    );
    await expect(dialog.getByText(/• 수리비 200% 증가/)).not.toContainText(
        "최대치"
    );
    await dialog.locator("summary").click();
    await expect(
        dialog.getByText(
            "스핀 스퍼트 랭크 3단 이상일 때 마법 공격력 40~55 증가"
        )
    ).toBeVisible();
    await dialog.getByRole("button", { name: "닫기" }).click();
    await page.getByText("어스름한 인챈트 스크롤", { exact: true }).click();
    await expect(dialog.getByText("접두 · 6 랭크")).toBeVisible();
    await expect(
        dialog.getByText("아이스볼트 랭크 3단 이상일 때 마법 공격력 50~65 증가")
    ).toBeVisible();
    await expect(dialog.getByText("[수리비 200% 증가]")).toBeVisible();
    expect(referenceRequests).toEqual([]);
});
