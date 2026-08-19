import { expect, test } from "@playwright/test";

test("favorite click uses the selected favorite in its first request", async ({
    page,
}) => {
    const auctionRequests: URL[] = [];
    await page.addInitScript(() => {
        localStorage.setItem(
            "favorites",
            JSON.stringify([{ itemName: "테스트+검", category: "검" }])
        );
    });
    await page.route("**/api/auction?**", route => {
        auctionRequests.push(new URL(route.request().url()));
        return route.fulfill({
            json: { items: [], hasMore: false, nextCursor: null },
        });
    });

    await page.goto("/auction");
    await page.getByRole("button", { name: "즐겨찾기 보기" }).click();
    await page.getByRole("button", { name: "테스트+검 (검)" }).click();
    await expect.poll(() => auctionRequests.length).toBe(1);
    expect(auctionRequests[0].searchParams.get("item_name")).toBe("테스트+검");
    expect(auctionRequests[0].searchParams.get("auction_item_category")).toBe(
        "검"
    );
});

test("corrupt favorite storage does not crash auction", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", error => errors.push(error));
    await page.addInitScript(() =>
        localStorage.setItem("favorites", "{broken")
    );
    await page.goto("/auction");
    await page.getByRole("button", { name: "즐겨찾기 보기" }).click();
    await expect(page.getByText("저장된 즐겨찾기가 없습니다.")).toBeVisible();
    expect(errors).toEqual([]);
});

test("superseded suggestions cannot overwrite the latest results", async ({
    page,
}) => {
    let releaseOld: (() => void) | undefined;
    const oldRequestReleased = new Promise<void>(resolve => {
        releaseOld = resolve;
    });
    await page.route("**/api/suggest?**", async route => {
        const query = new URL(route.request().url()).searchParams.get("q");
        if (query === "오래된") {
            await oldRequestReleased;
            await route.fulfill({ json: { suggestions: ["오래된 결과"] } });
            return;
        }
        await route.fulfill({ json: { suggestions: ["최신 결과"] } });
    });

    await page.goto("/auction", { waitUntil: "networkidle" });
    const input = page.getByPlaceholder("아이템명");
    const oldRequest = page.waitForRequest(request => {
        const url = new URL(request.url());
        return (
            url.pathname === "/api/suggest" &&
            url.searchParams.get("q") === "오래된"
        );
    });
    await input.fill("오래된");
    await oldRequest;
    await input.fill("최신");
    await expect(page.getByText("최신 결과")).toBeVisible();
    releaseOld?.();
    await page.waitForTimeout(100);
    await expect(page.getByText("오래된 결과")).toHaveCount(0);
});

test("contact failure preserves the form and shows an error", async ({
    page,
}) => {
    await page.route("**/api/contact", route =>
        route.fulfill({ status: 429, json: { error: "Too many requests" } })
    );
    await page.goto("/contact", { waitUntil: "networkidle" });
    await page.getByLabel("닉네임").fill("테스터");
    await page.getByLabel("이메일").fill("user@example.com");
    await page.getByLabel("제목").fill("문의 제목");
    await page.getByLabel("메시지").fill("열 글자가 넘는 문의 메시지입니다.");
    await Promise.all([
        page.waitForResponse(
            response => new URL(response.url()).pathname === "/api/contact"
        ),
        page.getByRole("button", { name: "전송" }).click(),
    ]);
    await expect(page.getByText("Too many requests")).toBeVisible();
    await expect(page.getByLabel("닉네임")).toHaveValue("테스터");
});

test("contact success clears the form", async ({ page }) => {
    await page.route("**/api/contact", route =>
        route.fulfill({ status: 200, json: { message: "ok" } })
    );
    await page.goto("/contact", { waitUntil: "networkidle" });
    await page.getByLabel("닉네임").fill("테스터");
    await page.getByLabel("이메일").fill("user@example.com");
    await page.getByLabel("제목").fill("문의 제목");
    await page.getByLabel("메시지").fill("열 글자가 넘는 문의 메시지입니다.");
    await Promise.all([
        page.waitForResponse(
            response => new URL(response.url()).pathname === "/api/contact"
        ),
        page.getByRole("button", { name: "전송" }).click(),
    ]);
    await expect(
        page.getByText("문의가 성공적으로 전송되었습니다.")
    ).toBeVisible();
    await expect(page.getByLabel("닉네임")).toHaveValue("");
});

test("horn polling uses the latest server and keeps its label on one line", async ({
    page,
}) => {
    const hornRequests: URL[] = [];
    await page.clock.install();
    await page.route("**/api/horn?**", route => {
        hornRequests.push(new URL(route.request().url()));
        return route.fulfill({ json: { horn_bugle_world_history: [] } });
    });

    await page.goto("/horn");
    await page.locator(".dropdown").first().getByRole("button").click();
    await page.getByText("울프", { exact: true }).click();
    await page.clock.fastForward(60_000);
    await expect.poll(() => hornRequests.length).toBe(1);
    expect(hornRequests[0].searchParams.get("server_name")).toBe("울프");
    await expect(
        page.locator(".dropdown").first().getByRole("button")
    ).toHaveCSS("white-space", "nowrap");
});

test("npc shop validates and renders upstream images without page errors", async ({
    page,
}) => {
    const errors: Error[] = [];
    page.on("pageerror", error => errors.push(error));
    await page.route("**/_next/image?**", route =>
        route.fulfill({
            status: 200,
            contentType: "image/png",
            body: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
                "base64"
            ),
        })
    );
    await page.route("**/api/npc-shop?**", route =>
        route.fulfill({
            json: {
                shop: [
                    {
                        tab_name: "일반",
                        item: [
                            {
                                item_display_name: "테스트 아이템",
                                image_url:
                                    "https://open.api.nexon.com/static/mabinogi/img/2a6edef8ae26db199589dcc94e518766?q=4b455a545a465d4387464e515e544f555d8a50425e415c494e55844350525953494e4e8f4c434c424d4e4a558848494960524b5449",
                                price: [
                                    { price_type: "골드", price_value: 100 },
                                ],
                            },
                        ],
                    },
                ],
            },
        })
    );
    await page.goto("/npc-shop");
    await page.locator("#npc_name").selectOption("델");
    await page.locator("#server_name").selectOption("류트");
    await page.locator("#channel").fill("1");
    await page.getByRole("button", { name: "조회" }).click();
    await expect(page.getByText("테스트 아이템")).toBeVisible();
    const image = page.getByAltText("테스트 아이템");
    await expect(image).toHaveAttribute("width", "64");
    await expect(image).toHaveAttribute("height", "64");
    await expect(image).toHaveAttribute(
        "src",
        /_next\/image\?url=https%3A%2F%2Fopen\.api\.nexon\.com%2Fstatic%2Fmabinogi%2Fimg%2F/
    );
    expect(errors).toEqual([]);
});
