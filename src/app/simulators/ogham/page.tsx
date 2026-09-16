import type { Metadata } from "next";

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
        </div>
    );
}
