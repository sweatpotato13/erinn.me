import type { Metadata } from "next";
import Link from "next/link";

import s from "@/components/tools/preparation.module.css";
import reference from "@/data/crafting-reference.json";
import { CRAFTING_PATH } from "@/lib/crafting-state";

import CraftingTool from "./crafting-tool";
import c from "./crafting-tool.module.css";

const title = "마비노기 제작 원가 계산기";
const description =
    "만들 물품의 재료와 보유 수량을 합산하고, 추가 구매 비용과 보유 재료 가치를 완제품 구매 가격과 비교하세요.";
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
            <details className={c.source}>
                <summary>계산 기준과 지원 범위</summary>
                <p>
                    여러 제작품의 재료를 먼저 합산하고 보유분은 한 번만
                    배정합니다. 공정 재료는 입력한 횟수만큼, 선택한 마감 재료는
                    완성 배치마다 한 번 사용합니다. 중간재 구매와 직접 제작을
                    선택할 수 있습니다.
                </p>
                <p>
                    산출량·공정 횟수는 직접 입력한 제작 조건 기준입니다. 성공
                    확률, 부분 손실·회수와 추가 생산을 자동으로 예측하지
                    않습니다. 조건이나 가격이 없으면 확인된 소계만 보여줍니다.
                    실제 시세는 등록 호가이며 체결 가격이나 동일 품질을 보장하지
                    않습니다.
                </p>
                <p>
                    추가 구매 비용은 부족 재료와 부가 비용이며, 보유 재료 사용
                    가치를 더하면 재료 가치 기준 원가가 됩니다. 이미 가진
                    완제품으로 충당한 수량은 구매·제작 비교 양쪽에서 제외합니다.
                </p>
                <p>
                    출처:{" "}
                    <a href="https://prilus.gitlab.io/production">
                        Prilus 제작 자료
                    </a>
                    의 커밋된 한국어 참조. 자료 버전 {reference.sourceVersion},
                    규칙 {reference.ruleVersion}, 수집 시각{" "}
                    {reference.collectedAt}. 재사용 도구와 시설은 자동 소비
                    재료로 계산하지 않습니다.
                </p>
                <p>
                    <Link href="/tools/barter">물물교환 준비 계산기</Link> ·{" "}
                    <Link href="/auction">경매장 시세</Link> ·{" "}
                    <Link href="/calculator">파티 분배 계산기</Link>
                </p>
            </details>
        </div>
    );
}
