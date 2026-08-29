import { expect, test } from "@playwright/test";

import auctionCatalog from "../src/data/auction-item-catalog.json";

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

    test("sitemap.xml contains the public pages and reviewed auction items", async ({
        request,
    }) => {
        const response = await request.get("/sitemap.xml");
        const body = await response.text();
        const locations = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map(
            match => match[1]
        );

        expect(response.status()).toBe(200);
        expect(locations).toEqual([
            ...publicPages.map(route =>
                new URL(route.path, "https://erinn.me").toString()
            ),
            "https://erinn.me/auction/items",
            ...auctionCatalog.items.map(
                item => `https://erinn.me/auction/items/${item.id}`
            ),
        ]);
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

    test("reviewed auction item pages stay discoverable without live API data", async ({
        page,
        request,
    }) => {
        const item = auctionCatalog.items[0];
        const previewUrl = `https://erinn.me/auction/items/${item.id}/preview`;
        const imageAlt = `${item.name} 경매장 현재 매물 및 최근 1시간 완료 거래 요약`;
        const response = await page.goto(`/auction/items/${item.id}`);

        expect(response?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            `${item.name} 경매장 시세`
        );
        await expect(page).toHaveTitle(`${item.name} 경매장 시세 | Erinn.me`);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            "href",
            `https://erinn.me/auction/items/${item.id}`
        );
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
            "content",
            previewUrl
        );
        await expect(
            page.locator('meta[property="og:image:width"]')
        ).toHaveAttribute("content", "1200");
        await expect(
            page.locator('meta[property="og:image:height"]')
        ).toHaveAttribute("content", "630");
        await expect(
            page.locator('meta[property="og:image:type"]')
        ).toHaveAttribute("content", "image/png");
        await expect(
            page.locator('meta[property="og:image:alt"]')
        ).toHaveAttribute("content", imageAlt);
        await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
            "content",
            "summary_large_image"
        );
        await expect(
            page.locator('meta[name="twitter:image"]')
        ).toHaveAttribute("content", previewUrl);
        await expect(
            page.locator('meta[name="twitter:image:alt"]')
        ).toHaveAttribute("content", imageAlt);
        await expect(
            page.getByRole("link", {
                name: "경매장에서 상세 매물·옵션 보기",
            })
        ).toHaveAttribute(
            "href",
            `/auction?${new URLSearchParams({ q: item.name })}`
        );

        const indexResponse = await request.get("/auction/items");
        const indexBody = await indexResponse.text();
        expect(indexResponse.status()).toBe(200);
        expect(indexBody).toContain(`/auction/items/${item.id}`);
        expect(
            (await request.get("/auction/items/UNKNOWN_SAFE_ID")).status()
        ).toBe(404);
    });

    test("link crawlers receive complete auction item metadata in the initial head", async ({
        request,
    }) => {
        const item = auctionCatalog.items[0];
        const previewUrl = `https://erinn.me/auction/items/${item.id}/preview`;

        for (const userAgent of [
            "kakaotalk-scrap/1.0",
            "AdsBot-Google (+http://www.google.com/adsbot.html)",
            "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
            "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
            "Discordbot/2.0",
            "Twitterbot/1.0",
        ]) {
            const response = await request.get(`/auction/items/${item.id}`, {
                headers: { "user-agent": userAgent },
            });
            const body = await response.text();
            const head = body.slice(0, body.indexOf("</head>"));

            expect(response.status()).toBe(200);
            expect(head).toContain('property="og:image"');
            expect(head).toContain('name="twitter:card"');
            expect(head).toContain(previewUrl);
        }
    });

    test("auction item preview routes return public PNG responses", async ({
        request,
    }) => {
        const item = auctionCatalog.items[0];
        const longestItem = auctionCatalog.items.reduce((longest, candidate) =>
            [...candidate.name].length > [...longest.name].length
                ? candidate
                : longest
        );
        const plusItem = auctionCatalog.items.find(candidate =>
            candidate.name.includes("+")
        )!;
        for (const itemId of [
            item.id,
            longestItem.id,
            plusItem.id,
            "UNKNOWN_SAFE_ID",
        ]) {
            const response = await request.get(
                `/auction/items/${itemId}/preview`
            );

            expect(response.status()).toBe(200);
            expect(response.headers()["content-type"]).toContain("image/png");
            expect(response.headers()["cache-control"]).toBe(
                "public, max-age=600, s-maxage=600, stale-while-revalidate=60"
            );
            expect([
                ...new Uint8Array(await response.body()).slice(0, 8),
            ]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
        }
    });

    test("auction searches keep generic social metadata", async ({
        request,
    }) => {
        const item = auctionCatalog.items[0];
        const paths = [
            `/auction?q=${encodeURIComponent(item.name)}`,
            `/auction?q=${encodeURIComponent(item.name.slice(0, 2))}`,
            `/auction?category=${encodeURIComponent("검")}`,
            `/auction?q=${encodeURIComponent(item.name)}&option_erg=present`,
            `/auction?q=${encodeURIComponent("카탈로그에 없는 아이템")}`,
        ];

        for (const path of paths) {
            const response = await request.get(path);
            const body = await response.text();
            const head = body.slice(0, body.indexOf("</head>"));

            expect(response.status()).toBe(200);
            expect(head).not.toContain("/auction/items/");
            expect(head).not.toContain("/preview");
        }
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
