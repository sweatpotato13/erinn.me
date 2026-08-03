import { NextResponse } from "next/server";

import { AuctionListResponseSchema } from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
const MAX_PAGES = 10;
const FETCH_TIMEOUT_MS = 5_000;

interface AuctionItem {
    auction_price_per_unit: number;
    item_count: number;
}

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);
    const itemName = searchParams.get("item_name");

    if (!itemName) {
        return NextResponse.json(
            { error: "item_name parameter is required" },
            { status: 400 }
        );
    }

    const allItems: AuctionItem[] = [];
    let nextCursor: string | null = "";
    let pageCount = 0;
    let prevMinPrice: number | null = null;
    let runningMin = Infinity;
    let stableCount = 0;

    try {
        do {
            let url = `${NXOPEN_API_URL}/mabinogi/v1/auction/list?`;
            url += `item_name=${encodeURIComponent(itemName)}&`;
            if (nextCursor) {
                url += `cursor=${encodeURIComponent(nextCursor)}`;
            }

            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "x-nxopen-api-key": NXOPEN_API_KEY || "",
                },
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });

            if (!response.ok) {
                return NextResponse.json(
                    { error: "Failed to fetch upstream data" },
                    { status: 502 }
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
            for (const item of data.auction_item) {
                const mapped: AuctionItem = {
                    auction_price_per_unit: item.auction_price_per_unit,
                    item_count: item.item_count,
                };
                allItems.push(mapped);
                if (mapped.auction_price_per_unit < runningMin) {
                    runningMin = mapped.auction_price_per_unit;
                }
            }

            nextCursor = data.next_cursor ?? null;
            pageCount++;

            if (runningMin !== Infinity && runningMin === prevMinPrice) {
                stableCount++;
                if (stableCount >= 2) break;
            } else {
                stableCount = 0;
            }
            prevMinPrice = runningMin;
        } while (nextCursor && pageCount < MAX_PAGES);

        if (allItems.length === 0) {
            return NextResponse.json({
                minPrice: 0,
                averagePrice: 0,
                availableQuantity: 0,
                isComplete: true,
            });
        }

        const minPrice = runningMin;
        const averagePrice =
            allItems.reduce((sum, i) => sum + i.auction_price_per_unit, 0) /
            allItems.length;
        const availableQuantity = allItems.reduce(
            (sum, i) => sum + i.item_count,
            0
        );
        const isComplete = !nextCursor || stableCount >= 2;

        return NextResponse.json({
            minPrice,
            averagePrice: Math.round(averagePrice),
            availableQuantity,
            isComplete,
        });
    } catch (error) {
        console.error("Error fetching price summary:", error);
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
