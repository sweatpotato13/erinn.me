import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

const font = readFile(join(process.cwd(), "public/fonts/auction-preview.otf"));
async function render(fontData?: Buffer) {
    const response = new ImageResponse(
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                background: "#373b33",
                color: "#f5f5ed",
                padding: 48,
                flexDirection: "column",
                justifyContent: "center",
                border: "8px solid #8a8d80",
            }}
        >
            <span style={{ fontSize: 28, color: "#e9d894" }}>ERINN.ME</span>
            <span style={{ fontSize: 58, marginTop: 32 }}>
                {fontData ? "마비노기 미니어처" : "MABINOGI MINIATURES"}
            </span>
            <span style={{ fontSize: 48, marginTop: 16 }}>
                {fontData ? "효과 비교·구매 도우미" : "COMPARE EFFECTS"}
            </span>
            <span style={{ fontSize: 26, marginTop: 48, color: "#e9d894" }}>
                {fontData
                    ? "설치 기준 · 최대 4개 후보 · 함께 설치할 때의 효과"
                    : "INSTALLATIONS / FOUR CANDIDATES / ADDED EFFECTS"}
            </span>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: fontData
                ? [{ name: "MiniaturePreview", data: fontData, weight: 400 }]
                : undefined,
            headers: { "Cache-Control": "public, max-age=86400" },
        }
    );
    return new Response(await response.arrayBuffer(), {
        headers: response.headers,
    });
}
export async function GET() {
    try {
        return await render(await font);
    } catch {
        return render();
    }
}
