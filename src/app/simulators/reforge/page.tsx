import type { Metadata } from "next";
import { Suspense } from "react";

import { reforgeTools, reforgeVersion } from "@/lib/reforge-reference";
import { REFORGE_PATH } from "@/lib/reforge-url";

import ReforgeCalculator from "./reforge-calculator";

const title = "마비노기 세공 시뮬레이터·확률·비용 계산기";
const description =
    "장비를 고르고 세공을 돌려보세요. 원하는 옵션에서 자동으로 멈추고, 성공 확률과 예상 비용을 확인할 수 있습니다.";
const image = {
    url: `${REFORGE_PATH}/preview`,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: title,
};
export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: REFORGE_PATH },
    openGraph: {
        title,
        description,
        url: REFORGE_PATH,
        type: "website",
        locale: "ko_KR",
        images: [image],
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image.url],
    },
};
export default function ReforgePage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl break-keep font-bold text-slate-900 sm:text-3xl">
                세공 시뮬레이터
            </h1>
            <p className="mt-3 mb-6 text-slate-600">
                장비를 고르고, 세공 도구를 눌러보세요.
            </p>
            <Suspense fallback={<p>계산기 설정 불러오는 중…</p>}>
                <ReforgeCalculator
                    version={reforgeVersion}
                    tools={reforgeTools}
                />
            </Suspense>
            <details className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-700">
                <summary className="cursor-pointer font-semibold">
                    계산 가정과 출처
                </summary>
                <p>
                    같은 시도에서 옵션은 중복되지 않습니다. 장비의 착용
                    종족·장비 타입·도구 조건을 만족하는 N개 중 L개를 균등하게
                    선택합니다. 공용 장비는 모든 착용 가능 종족의 옵션을
                    포함합니다.
                </p>
                <p>
                    모두 만족할 k개 목표의 확률은 C(N−k,L−k) / C(N,L) × 각
                    목표의 조건부 레벨 확률의 곱입니다. 하나 이상 만족은
                    포함·배제로 계산합니다. 일반 레벨과 한계 돌파 레벨의 확률
                    질량을 따로 배분하고 각 구간 안에서는 균등 분포를
                    사용합니다.
                </p>
                <p>
                    기대 횟수는 1/p, n회 안에 성공할 확률은 1−(1−p)ⁿ입니다. 기대
                    비용은 입력한 1회 가격 × 기대 횟수입니다. 과거 시도의 실패는
                    다음 시도의 확률을 바꾸지 않으며 기댓값은 성공이나 지출의
                    보장이 아닙니다.
                </p>
                <p>
                    한손 검·한손 둔기·레이피어·셰프의 거친 손길과 액세서리는
                    해당 장비용 최대 레벨을 적용합니다. 도구 최소 레벨은 반올림,
                    최대 레벨은 내림 보정합니다. 초심자의 세공 도구는 획득이
                    중단된 레거시 도구로 표시합니다. 세공 랭크 상승·줄 확장·보상
                    재투자는 모델에 포함하지 않습니다.
                </p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                    <li>
                        <a
                            className="link"
                            href="https://mabinogi.nexon.com/page/archive/guide_view.asp?id=4892522&num=69"
                        >
                            공식 세공 가이드
                        </a>
                    </li>
                    <li>
                        <a
                            className="link"
                            href="https://mabinogi.nexon.com/page/news/notice_view.asp?id=4889246"
                        >
                            종족·장비 예외 규칙
                        </a>
                    </li>
                    <li>
                        <a
                            className="link"
                            href="https://m.mabinogi.nexon.com/m/news/notice_view.asp?id=4893385"
                        >
                            중복 없는 옵션 선택 안내
                        </a>
                    </li>
                    <li>
                        <a
                            className="link"
                            href="https://mabinogi.nexon.com/m/news/notice_view.asp?id=4892875"
                        >
                            2025년 세공 개편
                        </a>
                    </li>
                </ul>
            </details>
        </div>
    );
}
