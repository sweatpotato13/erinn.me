import { NextResponse } from "next/server";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const serverName = searchParams.get("server_name");
    // 실제 API 호출 (예시)
    const response = await fetch(
        `${NXOPEN_API_URL}/mabinogi/v1/horn-bugle-world/history?server_name=${serverName}`,
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
