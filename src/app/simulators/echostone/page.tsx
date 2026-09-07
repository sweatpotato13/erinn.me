import type { Metadata } from "next";
import { Suspense } from "react";

import evidence from "@/data/echostone-polishing-evidence.json";
import reference from "@/data/echostone-reference.json";
import { ECHOSTONE_PATH } from "@/lib/echostone-url";

import EchostoneCalculator from "./echostone-calculator";

const title = "마비노기 에코스톤 각성·연마석 계산기";
const description =
    "에코스톤 승급과 고유 스탯 성장을 시뮬레이션하세요. 각성·연마는 별도의 30등급 에코스톤으로 시도하고 사용한 각성제와 예상 비용을 확인할 수 있습니다.";
const image = {
    url: `${ECHOSTONE_PATH}/preview`,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: title,
};
export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: ECHOSTONE_PATH },
    openGraph: {
        title,
        description,
        url: ECHOSTONE_PATH,
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
export default function EchostonePage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold break-keep text-slate-900 sm:text-3xl">
                {title}
            </h1>
            <p className="mt-3 mb-6 text-slate-600">
                승급으로 고유 스탯을 키워 보세요.
            </p>
            <Suspense fallback={<p>계산기 설정 불러오는 중…</p>}>
                <EchostoneCalculator data={reference} />
            </Suspense>
            <section
                aria-labelledby="echo-rules"
                className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-700"
            >
                <h2 id="echo-rules" className="text-lg font-semibold">
                    계산 규칙과 출처
                </h2>
                <div className="flex flex-wrap gap-4">
                    <a className="link" href={evidence.sources[0]}>
                        공식 2025-09-11 변경점
                    </a>
                    <a className="link" href={evidence.sources[1]}>
                        공식 에코스톤 가이드
                    </a>
                </div>
            </section>
        </div>
    );
}
