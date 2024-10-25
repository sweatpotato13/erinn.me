import { NextResponse } from "next/server";

const { BASE_URL, NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;

export async function GET(request: Request) {
    const allowedDomain = BASE_URL || "http://localhost:3000";

    const referer = request.headers.get("referer");

    if (!referer || !referer.startsWith(allowedDomain)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const auctionItemCategory = searchParams.get("auction_item_category");
    const itemName = searchParams.get("item_name");

    let url = `${NXOPEN_API_URL}/mabinogi/v1/auction/list?`;
    if (auctionItemCategory) {
        url += `auction_item_category=${auctionItemCategory}&`;
    }
    if (itemName) {
        url += `item_name=${encodeURIComponent(itemName)}`;
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
    return NextResponse.json(data);
}
