import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

const font = readFile(join(process.cwd(), "public/fonts/auction-preview.otf"));
export const dynamic = "force-static";
export async function GET() {
    return new ImageResponse(
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                background: "#0f172a",
                color: "#f8fafc",
                padding: 70,
                fontFamily: "Preview",
            }}
        >
            <div
                style={{
                    display: "flex",
                    fontSize: 28,
                    color: "#94a3b8",
                    marginBottom: 36,
                }}
            >
                ERINN.ME · 마비노기
            </div>
            <div style={{ display: "flex", fontSize: 56 }}>
                에코스톤 각성·연마석 계산기
            </div>
            <div style={{ display: "flex", fontSize: 44, marginTop: 20 }}>
                색상별 목표 확률 · 기대 비용 · 각성 시뮬레이션
            </div>
            <div
                style={{
                    display: "flex",
                    fontSize: 28,
                    color: "#cbd5e1",
                    marginTop: 50,
                }}
            >
                각성제별 확률과 재료, 한 번뿐인 연마 조건을 확인하세요.
            </div>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: "Preview",
                    data: await font,
                    style: "normal",
                    weight: 400,
                },
            ],
        }
    );
}
