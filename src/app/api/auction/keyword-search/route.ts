import { NextResponse } from "next/server";

const { BASE_URL, NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;

export async function GET(request: Request) {
    const allowedDomain = BASE_URL || "http://localhost:3000";

    const referer = request.headers.get("referer");

    if (!referer || !referer.startsWith(allowedDomain)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
        return NextResponse.json(
            { error: "keyword parameter is required" },
            { status: 400 }
        );
    }

    let allItems: any[] = [];
    let nextCursor: string | null = "";

    try {
        do {
            let url = `${NXOPEN_API_URL}/mabinogi/v1/auction/keyword-search?`;
            url += `keyword=${encodeURIComponent(keyword)}&`;
            if (nextCursor) {
                url += `cursor=${nextCursor}`;
            }

            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "x-nxopen-api-key": NXOPEN_API_KEY || "",
                },
            });

            if (!response.ok) {
                console.error(await response.json());
                return NextResponse.json(
                    { error: "Failed to fetch data" },
                    { status: 500 }
                );
            }

            const data = await response.json();

            // 결과 데이터 누적
            if (data.auction_item.length > 0) {
                allItems = [...allItems, ...data.auction_item];
            }

            // 다음 페이지를 위한 cursor 업데이트
            nextCursor = data.next_cursor;
        } while (nextCursor !== null);

        // 전체 데이터 반환
        return NextResponse.json({
            items: allItems,
        });
    } catch (error) {
        console.error("Error fetching keyword search data:", error);
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
