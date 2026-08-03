import { NextRequest, NextResponse } from "next/server";

import { checkOrigin } from "@/lib/utils/check-origin";

export async function GET(request: NextRequest) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("id");

    if (!itemId) {
        return new NextResponse("Missing item ID", { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(itemId)) {
        return new NextResponse("Invalid item ID", { status: 400 });
    }

    try {
        const imageUrl = `https://mabires2.pril.cc/invimage/kr/${itemId}/${itemId}.png`;
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            return new NextResponse("Image not found", { status: 404 });
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=86400",
                "X-Frame-Options": "DENY",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error("Error fetching image:", error);
        return new NextResponse("Error fetching image", { status: 500 });
    }
}
