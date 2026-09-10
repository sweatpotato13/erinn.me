import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
    // The calculator font is a limited subset. Reuse the full local Korean font.
    const font = await readFile(
        join(process.cwd(), "public/fonts/mabinogi-classic.otf")
    );
    return new ImageResponse(
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                background: "#313330",
                color: "#f5f5ef",
                padding: 64,
                fontFamily: "Mabinogi",
            }}
        >
            <span style={{ fontSize: 28, color: "#fff0aa" }}>
                ERINN.ME · 마비노기
            </span>
            <span style={{ fontSize: 64, marginTop: 48 }}>
                제작 원가 계산기
            </span>
            <span style={{ fontSize: 32, marginTop: 30 }}>
                만들 물품의 재료와 원가를 한눈에
            </span>
            <div
                style={{
                    display: "flex",
                    marginTop: 58,
                    border: "2px solid #85897b",
                    padding: 24,
                    color: "#fff0aa",
                    fontSize: 28,
                }}
            >
                필요 재료 합산 · 제작 원가 계산
            </div>
            <span style={{ fontSize: 24, marginTop: 34, color: "#d0d3c8" }}>
                완제품 경매장 최저가와 제작 원가를 비교하세요
            </span>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: [{ name: "Mabinogi", data: font, weight: 400 }],
            headers: {
                "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
        }
    );
}
