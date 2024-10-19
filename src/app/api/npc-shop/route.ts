import { NextResponse } from "next/server";

const { BASE_URL, NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;

export async function GET(request: Request) {
    const allowedDomain = BASE_URL || "http://localhost:3000";

    const referer = request.headers.get("referer");

    if (!referer || !referer.startsWith(allowedDomain)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const npcName = searchParams.get("npc_name");
    const serverName = searchParams.get("server_name");
    const channel = searchParams.get("channel");

    const response = await fetch(
        `${NXOPEN_API_URL}/mabinogi/v1/npcshop/list?npc_name=${npcName}&server_name=${serverName}&channel=${parseInt(channel || "1")}`,
        {
            headers: {
                "Content-Type": "application/json",
                "x-nxopen-api-key": NXOPEN_API_KEY || "",
            },
        }
    );

    if (!response.ok) {
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
}
