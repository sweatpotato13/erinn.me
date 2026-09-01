import type { Metadata } from "next";
import { Suspense } from "react";

import AuctionCalculator from "@/app/calculator/auction-calculator";
import {
    calculateAuctionDistribution,
    formatGold,
} from "@/lib/auction-calculator";
import {
    AUCTION_CALCULATOR_PATH,
    getAuctionCalculatorPath,
    getAuctionCalculatorPreviewPath,
    parseAuctionCalculatorParams,
    searchParamsRecordToURLSearchParams,
} from "@/lib/auction-calculator-url";

interface CalculatorPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const GENERIC_TITLE = "마비노기 파티 분배 계산기";
const GENERIC_DESCRIPTION =
    "경매 수수료 할인 쿠폰 가격과 공통 비용을 비교해 파티 분배액을 계산하고 결과를 공유하세요.";

function genericMetadata(): Metadata {
    return {
        title: GENERIC_TITLE,
        description: GENERIC_DESCRIPTION,
        alternates: { canonical: AUCTION_CALCULATOR_PATH },
        openGraph: {
            title: GENERIC_TITLE,
            description: GENERIC_DESCRIPTION,
            url: AUCTION_CALCULATOR_PATH,
            images: [
                {
                    url: getAuctionCalculatorPreviewPath(new URLSearchParams()),
                    width: 1200,
                    height: 630,
                    type: "image/png",
                    alt: "마비노기 파티 분배 계산기",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: GENERIC_TITLE,
            description: GENERIC_DESCRIPTION,
            images: [getAuctionCalculatorPreviewPath(new URLSearchParams())],
        },
    };
}

export async function generateMetadata({
    searchParams,
}: CalculatorPageProps): Promise<Metadata> {
    const parsed = parseAuctionCalculatorParams(
        searchParamsRecordToURLSearchParams(await searchParams)
    );
    if (parsed.status !== "valid") return genericMetadata();

    const result = calculateAuctionDistribution(parsed.snapshot);
    const recommended = result.recommended;
    const title = `파티 분배 결과 · ${recommended.label}`;
    const description = `${formatGold(parsed.snapshot.salePrice)} Gold 판매 시 총비용 ${formatGold(recommended.totalCost)} Gold, 분배 가능 ${formatGold(recommended.distributable)} Gold, ${parsed.snapshot.memberCount}명 기준 1인당 ${formatGold(recommended.perMember)} Gold입니다.`;
    const url = getAuctionCalculatorPath(parsed.normalized);
    const image = getAuctionCalculatorPreviewPath(parsed.normalized);
    const imageAlt = "경매 수수료와 파티 분배 결과 요약";

    return {
        title,
        description,
        alternates: { canonical: AUCTION_CALCULATOR_PATH },
        openGraph: {
            title,
            description,
            url,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    type: "image/png",
                    alt: imageAlt,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [{ url: image, alt: imageAlt }],
        },
    };
}

export default async function AuctionCalculatorPage({
    searchParams,
}: CalculatorPageProps): Promise<React.JSX.Element> {
    const initialQuery = searchParamsRecordToURLSearchParams(
        await searchParams
    ).toString();
    return (
        <Suspense
            fallback={
                <p className="p-6 text-center" role="status">
                    파티 분배 계산기를 준비하고 있습니다.
                </p>
            }
        >
            <AuctionCalculator initialQuery={initialQuery} />
        </Suspense>
    );
}
