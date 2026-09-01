import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import {
    type AvailableAuctionOption,
    calculateAuctionDistribution,
    formatGold,
} from "@/lib/auction-calculator";
import { parseAuctionCalculatorParams } from "@/lib/auction-calculator-url";

const WIDTH = 1200;
const HEIGHT = 630;
const CACHE_CONTROL =
    "public, max-age=600, s-maxage=600, stale-while-revalidate=60";
const previewFont = readFile(
    join(process.cwd(), "public/fonts/auction-preview.otf")
);

export interface CalculatorPreviewCopy {
    heading: string;
    salePrice: string;
    recommendation: string;
    totalCost: string;
    distributable: string;
    split: string;
}

interface MetricProps {
    label: string;
    value: string;
    offset?: boolean;
}

export function createCalculatorPreviewCopy(
    memberCount: number,
    recommended: AvailableAuctionOption,
    salePrice: number
): CalculatorPreviewCopy {
    return {
        heading: "파티 분배 결과",
        salePrice: `판매가 ${formatGold(salePrice)} Gold`,
        recommendation: `추천 ${recommended.label}`,
        totalCost: `총비용 ${formatGold(recommended.totalCost)} Gold`,
        distributable: `분배 가능 ${formatGold(recommended.distributable)} Gold`,
        split: `${formatGold(memberCount)}명 · 1인당 ${formatGold(recommended.perMember)} Gold`,
    };
}

function Metric({ label, value, offset = false }: MetricProps) {
    return (
        <div
            tw={`flex flex-1 flex-col rounded-2xl border-2 border-[#334155] bg-[#111827] px-7 py-6${offset ? " ml-4" : ""}`}
        >
            <span tw="text-[22px] text-[#94a3b8]">{label}</span>
            <span tw="mt-3 text-[34px] text-[#f8fafc]">{value}</span>
        </div>
    );
}

function PreviewMetrics({ copy }: { copy: CalculatorPreviewCopy }) {
    return (
        <div tw="flex w-full flex-col">
            <div tw="flex w-full">
                <Metric
                    label="판매가"
                    value={copy.salePrice.replace("판매가 ", "")}
                />
                <Metric
                    label="추천 선택지"
                    value={copy.recommendation.replace("추천 ", "")}
                    offset
                />
            </div>
            <div tw="mt-4 flex w-full">
                <Metric
                    label="총비용"
                    value={copy.totalCost.replace("총비용 ", "")}
                />
                <Metric
                    label="분배 가능 금액"
                    value={copy.distributable.replace("분배 가능 ", "")}
                    offset
                />
                <Metric label="파티 분배" value={copy.split} offset />
            </div>
        </div>
    );
}

function CalculatorPreview({ copy }: { copy: CalculatorPreviewCopy }) {
    return (
        <div tw="flex h-full w-full flex-col bg-[#07111f] px-12 pt-10 pb-8 text-[#f8fafc]">
            <span tw="text-[24px] text-[#67e8f9]">
                ERINN.ME · 파티 분배 계산기
            </span>
            <span tw="flex h-20 items-center overflow-hidden text-[44px] leading-tight">
                {copy.heading}
            </span>
            <PreviewMetrics copy={copy} />
            <span tw="mt-4 text-[18px] text-[#94a3b8]">
                Data based on Nexon Open API · 가격 및 수익 보장 아님
            </span>
        </div>
    );
}

function GenericPreview() {
    return (
        <div tw="flex h-full w-full flex-col items-center justify-center bg-[#07111f] text-[#f8fafc]">
            <span tw="text-[28px] text-[#67e8f9]">ERINN.ME</span>
            <span tw="mt-6 text-[50px]">파티 분배 계산기</span>
        </div>
    );
}

function AsciiFallback() {
    return (
        <div tw="flex h-full w-full items-center justify-center bg-[#07111f] text-[52px] text-[#f8fafc]">
            ERINN.ME AUCTION CALCULATOR
        </div>
    );
}

async function renderPng(
    element: React.ReactElement,
    font?: ArrayBuffer | Buffer
): Promise<Response> {
    const image = new ImageResponse(element, {
        width: WIDTH,
        height: HEIGHT,
        headers: { "Cache-Control": CACHE_CONTROL },
        fonts: font
            ? [{ name: "AuctionPreview", data: font, weight: 400 }]
            : undefined,
    });
    const body = await image.arrayBuffer();
    return new Response(body, { status: image.status, headers: image.headers });
}

export async function GET(request: Request): Promise<Response> {
    try {
        const parsed = parseAuctionCalculatorParams(
            new URL(request.url).searchParams
        );
        const font = await previewFont;
        if (parsed.status !== "valid") {
            return await renderPng(<GenericPreview />, font);
        }
        const result = calculateAuctionDistribution(parsed.snapshot);
        const copy = createCalculatorPreviewCopy(
            parsed.snapshot.memberCount,
            result.recommended,
            parsed.snapshot.salePrice
        );
        return await renderPng(<CalculatorPreview copy={copy} />, font);
    } catch {
        return renderPng(<AsciiFallback />);
    }
}
