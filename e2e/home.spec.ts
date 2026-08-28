import { expect, test } from "@playwright/test";

const publicPages = [
    {
        path: "/",
        title: "마비노기 경매장·뿔피리·NPC 상점 조회 | Erinn.me",
        description:
            "마비노기 한국 서버의 경매장 시세, 거대한 외침의 뿔피리 내역, NPC 상점 재고를 한곳에서 조회하세요.",
        canonical: "https://erinn.me",
        heading: "에린 생활 정보, 한곳에서",
        summary:
            "경매장 시세, 거대한 외침의 뿔피리 내역, NPC 상점 재고를 한곳에서 조회하세요.",
    },
    {
        path: "/auction",
        title: "마비노기 경매장 시세·옵션 검색 | Erinn.me",
        description:
            "마비노기 경매장 아이템의 현재 매물과 최근 거래가를 검색하고, 카테고리·세부 옵션·비교 기능으로 시세를 확인하세요.",
        canonical: "https://erinn.me/auction",
        heading: "마비노기 경매장 시세 조회",
        summary:
            "아이템명·카테고리·세부 옵션으로 현재 매물을 검색하고 최근 거래가와 비교하세요.",
    },
    {
        path: "/horn",
        title: "마비노기 뿔피리 조회·키워드 알림 | Erinn.me",
        description:
            "마비노기 서버별 거대한 외침의 뿔피리 내역을 닉네임과 내용으로 검색하고, 저장한 키워드의 새 메시지 알림을 설정하세요.",
        canonical: "https://erinn.me/horn",
        heading: "마비노기 뿔피리 조회",
        summary:
            "서버별 뿔피리 내역을 닉네임과 내용으로 검색하고, 원하면 저장한 키워드의 새 메시지 알림을 설정하세요.",
    },
    {
        path: "/npc-shop",
        title: "마비노기 NPC 상점 재고 조회 | Erinn.me",
        description:
            "마비노기 서버·채널·NPC를 선택해 NPC 상점의 판매 아이템과 가격 정보를 조회하세요.",
        canonical: "https://erinn.me/npc-shop",
        heading: "NPC 상점 조회",
        summary:
            "서버·채널·NPC를 선택해 상점 탭별 판매 아이템과 가격 정보를 확인하세요.",
    },
    {
        path: "/changelog",
        title: "업데이트 내역 | Erinn.me",
        description:
            "Erinn.me의 경매장, 뿔피리, NPC 상점 기능 변경 및 업데이트 내역을 확인하세요.",
        canonical: "https://erinn.me/changelog",
        heading: "업데이트 내역",
        summary: null,
    },
];

test.describe("Homepage Tests", () => {
    test("Homepage loads correctly", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/Erinn/);
        await expect(page.locator("main")).toBeVisible();
    });

    test("Public pages expose distinct search metadata and context", async ({
        page,
    }) => {
        for (const route of publicPages) {
            await test.step(route.path, async () => {
                const response = await page.goto(route.path);

                expect(response?.status()).toBe(200);
                await expect(page).toHaveTitle(route.title);
                await expect(
                    page.locator('meta[name="description"]')
                ).toHaveAttribute("content", route.description);
                await expect(
                    page.locator('link[rel="canonical"]')
                ).toHaveAttribute("href", route.canonical);

                const heading = page.getByRole("heading", {
                    level: 1,
                    name: route.heading,
                });
                await expect(heading).toHaveCount(1);
                await expect(heading).toBeVisible();
                if (route.summary)
                    await expect(page.getByText(route.summary)).toBeVisible();
            });
        }
    });

    test("Contact page is excluded from indexing", async ({ page }) => {
        const response = await page.goto("/contact");

        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle("문의하기 | Erinn.me");
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
            "content",
            /noindex/
        );
    });

    test("robots.txt exposes the crawler policy", async ({ request }) => {
        const response = await request.get("/robots.txt");
        const body = await response.text();

        expect(response.status()).toBe(200);
        for (const directive of [
            "Allow: /",
            "Disallow: /api/",
            "Disallow: /_offline",
            "Sitemap: https://erinn.me/sitemap.xml",
            "Host: https://erinn.me",
        ])
            expect(body).toContain(directive);
    });

    test("sitemap.xml contains only the five public pages", async ({
        request,
    }) => {
        const response = await request.get("/sitemap.xml");
        const body = await response.text();
        const locations = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map(
            match => match[1]
        );

        expect(response.status()).toBe(200);
        expect(locations).toEqual(
            publicPages.map(route =>
                new URL(route.path, "https://erinn.me").toString()
            )
        );
        for (const excluded of [
            "/api/",
            "/_offline",
            "/contact",
            "/dungeon",
            "/crafting",
        ])
            expect(body).not.toContain(`https://erinn.me${excluded}`);
        expect(body).not.toContain("<lastmod>");
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
        test(`${path} returns the standard not-found page`, async ({
            page,
        }) => {
            const response = await page.goto(path);

            expect(response?.status()).toBe(404);
            await expect(
                page.getByRole("heading", { name: "404" })
            ).toBeVisible();
        });
    }
});
