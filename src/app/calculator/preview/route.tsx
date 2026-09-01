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

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                padding: "24px 28px",
                border: "2px solid #334155",
                borderRadius: 20,
                backgroundColor: "#111827",
            }}
        >
            <span style={{ color: "#94a3b8", fontSize: 22 }}>{label}</span>
            <span style={{ marginTop: 12, color: "#f8fafc", fontSize: 34 }}>
                {value}
            </span>
        </div>
    );
}

function CalculatorPreview({ copy }: { copy: CalculatorPreviewCopy }) {
    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                padding: "40px 46px 34px",
                backgroundColor: "#07111f",
                color: "#f8fafc",
                fontFamily: "AuctionPreview",
            }}
        >
            <span style={{ color: "#67e8f9", fontSize: 24 }}>
                ERINN.ME · 파티 분배 계산기
            </span>
            <span
                style={{
                    display: "flex",
                    height: 78,
                    alignItems: "center",
                    overflow: "hidden",
                    fontSize: 44,
                    lineHeight: 1.1,
                }}
            >
                {copy.heading}
            </span>
            <div style={{ display: "flex", gap: 18 }}>
                <Metric
                    label="판매가"
                    value={copy.salePrice.replace("판매가 ", "")}
                />
                <Metric
                    label="추천 선택지"
                    value={copy.recommendation.replace("추천 ", "")}
                />
            </div>
            <div style={{ display: "flex", marginTop: 18, gap: 18 }}>
                <Metric
                    label="총비용"
                    value={copy.totalCost.replace("총비용 ", "")}
                />
                <Metric
                    label="분배 가능 금액"
                    value={copy.distributable.replace("분배 가능 ", "")}
                />
                <Metric label="파티 분배" value={copy.split} />
            </div>
            <span style={{ marginTop: 18, color: "#94a3b8", fontSize: 18 }}>
                Data based on Nexon Open API · 가격 및 수익 보장 아님
            </span>
        </div>
    );
}

function GenericPreview() {
    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#07111f",
                color: "#f8fafc",
                fontFamily: "AuctionPreview",
            }}
        >
            <span style={{ color: "#67e8f9", fontSize: 28 }}>ERINN.ME</span>
            <span style={{ marginTop: 24, fontSize: 50 }}>
                파티 분배 계산기
            </span>
        </div>
    );
}

function AsciiFallback() {
    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#07111f",
                color: "#f8fafc",
                fontSize: 52,
            }}
        >
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
