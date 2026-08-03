import { NextResponse } from "next/server";

import { AuctionListResponseSchema } from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const MAX_PAGES = 5;

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);
    const auctionItemCategory = searchParams.get("auction_item_category");
    const itemName = searchParams.get("item_name");
    const cursor = searchParams.get("cursor");

    let allItems: Record<string, unknown>[] = [];
    let nextCursor: string | null = cursor || "";
    let pageCount = 0;

    try {
        do {
            let url = `${NXOPEN_API_URL}/mabinogi/v1/auction/list?`;
            if (auctionItemCategory) {
                url += `auction_item_category=${auctionItemCategory}&`;
            }
            if (itemName) {
                url += `item_name=${encodeURIComponent(itemName)}&`;
            }
            if (nextCursor) {
                url += `cursor=${encodeURIComponent(nextCursor)}`;
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

            const raw = await response.json();
            const parsed = AuctionListResponseSchema.safeParse(raw);

            if (!parsed.success) {
                console.error(
                    "NEXON response validation failed:",
                    parsed.error
                );
                return NextResponse.json(
                    { error: "Upstream data format error" },
                    { status: 502 }
                );
            }

            const data = parsed.data;
            if (data.auction_item.length > 0) {
                allItems = [...allItems, ...data.auction_item];
            }

            nextCursor = data.next_cursor ?? null;
            pageCount++;
        } while (nextCursor && pageCount < MAX_PAGES);

        return NextResponse.json({
            items: allItems,
            hasMore: !!nextCursor,
            nextCursor: nextCursor,
        });
    } catch (error) {
        console.error("Error fetching auction data:", error);
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
