import type { Metadata } from "next";

import reference from "@/data/ogham-reference.json";

import OghamSimulator from "./ogham-simulator";

const title = "마비노기 오검 효과 재설정 시뮬레이터";
const description =
    "오검의 현재 효과와 레벨을 설정하고 원하는 효과를 잠근 채 재설정해 보세요. 골드, 오검 파편과 재료의 누적 소모량을 확인할 수 있습니다.";
const path = "/simulators/ogham";
const image = {
    url: `${path}/preview`,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: title,
};
export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
        title,
        description,
        url: path,
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
export default function OghamPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold break-keep text-slate-900 sm:text-3xl">
                {title}
            </h1>
            <p className="mt-3 mb-6 text-slate-600">
                간직할 효과는 잠그고, 나머지 효과를 다시 뽑아 보세요. 현재 효과
                직접 설정은 무료입니다.
            </p>
            <OghamSimulator />
            <section
                aria-labelledby="ogham-rules"
                className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-700"
            >
                <h2 id="ogham-rules" className="text-lg font-semibold">
                    재설정 규칙과 출처
                </h2>
                <p>
                    일반 오검은 재능 효과{" "}
                    {
                        reference.effects.filter(effect => effect.generalPool)
                            .length
                    }
                    종, 특수 오검은 전체 {reference.effects.length}종에서 효과를
                    균등하게 뽑습니다. 효과를 뽑은 뒤 1~해당 효과 최대 레벨
                    사이에서 레벨을 균등하게 뽑습니다.
                </p>
                <p>
                    엘리트·에픽·마스터는 각각 1·2·3개의 효과를 가집니다. 동일
                    효과는 중복되지 않으며, 잠긴 효과와 앞에서 뽑은 효과를
                    제외하고 다음 효과를 결정합니다. 잠긴 효과의 종류와 레벨은
                    유지됩니다.
                </p>
                <p>
                    균등 확률과 중복·잠금 규칙은 공식 가이드와 Prilus를
                    따릅니다. 모든 등급의 최소 레벨 1은 사용자 확인을
                    반영했습니다.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a className="link" href={reference.rulesSource}>
                        공식 오검 가이드
                    </a>
                    <a className="link" href={reference.source}>
                        Prilus 오검 데이터
                    </a>
                </div>
                <p className="text-xs text-slate-500">
                    데이터 버전 {reference.sourceVersion} · 생성 시각{" "}
                    {new Date(reference.sourceVersion * 1000).toLocaleString(
                        "ko-KR",
                        { timeZone: "Asia/Seoul" }
                    )}{" "}
                    KST (게임 패치 일자와 다를 수 있습니다). 결과는 이 페이지를
                    닫으면 사라집니다.
                </p>
            </section>
        </div>
    );
}
