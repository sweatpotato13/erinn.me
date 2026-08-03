import { NextResponse } from "next/server";

import { HornResponseSchema } from "@/lib/schemas/nexon";
import { checkOrigin } from "@/lib/utils/check-origin";

const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;

export async function GET(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);
    const serverName = searchParams.get("server_name");

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

    const raw = await response.json();
    const parsed = HornResponseSchema.safeParse(raw);

    if (!parsed.success) {
        console.error("NEXON horn response validation failed:", parsed.error);
        return NextResponse.json(
            { error: "Upstream data format error" },
            { status: 502 }
        );
    }

    return NextResponse.json(parsed.data);
}
