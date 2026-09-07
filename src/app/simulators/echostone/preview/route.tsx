import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

const font = readFile(join(process.cwd(), "public/fonts/auction-preview.otf"));
export const dynamic = "force-static";
export async function GET(): Promise<ImageResponse> {
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
                승급 · 고유 스탯 · 각성 · 레벨 재부여
            </div>
            <div
                style={{
                    display: "flex",
                    fontSize: 28,
                    color: "#cbd5e1",
                    marginTop: 50,
                }}
            >
                에코스톤을 키우고 원하는 각성 능력을 만나보세요.
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
