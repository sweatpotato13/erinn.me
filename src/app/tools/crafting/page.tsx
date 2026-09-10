import type { Metadata } from "next";

import s from "@/components/tools/preparation.module.css";
import reference from "@/data/crafting-reference.json";
import { CRAFTING_PATH } from "@/lib/crafting-state";

import CraftingTool from "./crafting-tool";

const title = "마비노기 제작 원가 계산기";
const description =
    "만들 물품에 필요한 전체 재료와 제작 원가를 계산하고, 완제품 구매 가격과 비교하세요.";
export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: CRAFTING_PATH },
    openGraph: {
        title,
        description,
        url: CRAFTING_PATH,
        images: [
            {
                url: `${CRAFTING_PATH}/preview`,
                width: 1200,
                height: 630,
                type: "image/png",
                alt: title,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [{ url: `${CRAFTING_PATH}/preview`, alt: title }],
    },
};
export default function CraftingPage() {
    return (
        <div className={s.page}>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="my-4">
                만들 물품을 고르면, 필요한 재료와 구매·제작 비용을 비교할 수
                있어요.
            </p>
            <CraftingTool data={reference} />
        </div>
    );
}
