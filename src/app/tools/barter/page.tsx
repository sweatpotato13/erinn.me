import type { Metadata } from "next";

import reference from "@/data/barter-reference.json";
import type { BarterReference } from "@/lib/barter";
import { BARTER_PATH } from "@/lib/barter-state";

import BarterTool from "./barter-tool";
import s from "./barter-tool.module.css";

const TITLE = "마비노기 물물교환 준비 계산기";
const DESCRIPTION =
    "교환할 물품을 고르면 주간 한도에 맞춰 준비 목록을 만듭니다. 6티어 시즌 재료, 보유 수량과 부족한 재료의 구매 예상액을 한눈에 확인하세요.";
const PREVIEW = `${BARTER_PATH}/preview`;
export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: BARTER_PATH },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: BARTER_PATH,
        images: [
            {
                url: PREVIEW,
                width: 1200,
                height: 630,
                type: "image/png",
                alt: TITLE,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
        images: [{ url: PREVIEW, alt: TITLE }],
    },
};
export default function BarterPage() {
    return (
        <div className={s.page}>
            <h1 className="text-2xl font-bold sm:text-3xl">
                마비노기 물물교환 준비 계산기
            </h1>
            <p className="my-4">
                교환할 물품을 고르면, 이번 주에 준비할 재료를 한 번에 확인할 수
                있습니다.
            </p>
            <BarterTool data={reference as BarterReference} />
        </div>
    );
}
