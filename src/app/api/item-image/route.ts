import { NextRequest, NextResponse } from "next/server";

const { BASE_URL } = process.env;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("id");
    const allowedDomain = BASE_URL || "http://localhost:3000";

    const referer = request.headers.get("referer");

    if (!referer || !referer.startsWith(allowedDomain)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!itemId) {
        return new NextResponse("Missing item ID", { status: 400 });
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
