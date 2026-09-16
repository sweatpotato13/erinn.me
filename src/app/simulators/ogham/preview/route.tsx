import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

const font = readFile(join(process.cwd(), "public/fonts/auction-preview.otf"));
export const dynamic = "force-static";
export async function GET(): Promise<ImageResponse> {
    return new ImageResponse(
        <div
            tw="flex flex-col justify-center w-full h-full bg-[#0f172a] text-[#f8fafc] p-[70px]"
            // The embedded font is registered below, outside Satori's utility font set.
            style={{ fontFamily: "Preview" }}
        >
            <div tw="flex text-[28px] text-[#94a3b8] mb-9">
                ERINN.ME · 마비노기
            </div>
            <div tw="flex text-[56px]">오검 효과 재설정 시뮬레이터</div>
            <div tw="flex text-[44px] mt-5">현재 효과 설정 · 잠금 · 재설정</div>
            <div tw="flex text-[28px] text-[#cbd5e1] mt-[50px]">
                잠긴 효과는 간직하고 골드·재료 소모량을 확인하세요.
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
