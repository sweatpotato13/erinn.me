import { NextResponse } from "next/server";

const { NXOPEN_API_URL } = process.env;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const auctionItemCategory = searchParams.get("auction_item_category");
    const itemName = searchParams.get("item_name");

    let url = `${NXOPEN_API_URL}/mabinogi/v1/auction/list?`;
    if (auctionItemCategory) {
        url += `auction_item_category=${auctionItemCategory}&`;
    }
    if (itemName) {
        url += `item_name=${itemName}`;
    }

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "x-nxopen-api-key": process.env.NXOPEN_API_KEY || "",
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
