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
                물물교환 준비 계산기
            </span>
            <span style={{ fontSize: 32, marginTop: 30 }}>
                교역소별 필요 재료와 부족 수량을 한눈에
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
                보유 재료 차감 · 주간 한도 · 시즌 교역품
            </div>
            <span style={{ fontSize: 24, marginTop: 34, color: "#d0d3c8" }}>
                재료 가치와 추가 구매 예상액을 구분합니다
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
