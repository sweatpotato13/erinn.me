import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import evidence from "@/data/echostone-polishing-evidence.json";
import reference from "@/data/echostone-reference.json";
import { ECHOSTONE_PATH } from "@/lib/echostone-url";

import EchostoneCalculator from "./echostone-calculator";

const title = "마비노기 에코스톤 각성·연마석 계산기";
const description =
    "에코스톤 색상·등급·각성제별 목표 확률과 기대 비용을 계산하세요. 각성과 1회 연마를 시뮬레이션하고 현재 옵션에서 연마할지 다시 각성할지 비교할 수 있습니다.";
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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold break-keep text-slate-900 sm:text-3xl">
                {title}
            </h1>
            <p className="mt-3 mb-6 text-slate-600">
                원하는 각성 옵션과 레벨을 고르고 각성제별 확률·기대 재료를
                비교하세요. 보유한 옵션을 입력하면 한 번뿐인 연마 기회도 확인할
                수 있습니다.
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
                <p>
                    각성 옵션은 색상별 가중치로 선택됩니다. 옵션이 뽑힌 뒤
                    각성제의 하한을 초과하고 등급별 상한 이하인 레벨의 가중치를
                    다시 합산합니다. 옵션 확률과 조건부 레벨 확률을 곱한 값이
                    목표 확률입니다. 같은 이름의 항목은 각각 계산해 더합니다.
                </p>
                <p>
                    각성은 현재 옵션을 교체하고 연마 기회를 다시 부여합니다.
                    연마는 새 각성마다 단 1회, 최대 레벨 미만에서만 가능합니다.
                    낮은 레벨이 뽑혀도 현재 레벨을 유지하며 연마석과 1회 기회는
                    소모됩니다. 연마에는 각성제나 AP가 추가로 들지 않습니다.
                </p>
                <p>
                    AP는 던전 클리어 없이 고대의 오르골을 바로 이용하는 기준으로
                    각성 1회당 25입니다. Gold 이용 수수료는 사용자가 입력하는
                    가정입니다. 평균 비용이나 90% 횟수는 성공 보장이 아닙니다.
                    연마가 섞인 전략에는 고정 비용의 예산 성공률 공식을 적용하지
                    않습니다.
                </p>
                <p>
                    연마는 Prilus 게임 데이터의 일반 에코스톤 각성제(53940) 레벨
                    가중치와 현재 등급 상한을 적용합니다. 이전에 사용한
                    고급·최고급 각성제의 보정은 이어지지 않습니다. 각성 가능한
                    레벨 상한에 도달했더라도 옵션 자체의 최대 레벨 미만이면
                    연마할 수 있으나, 개선 확률이 0일 수 있습니다.
                </p>
                <p>
                    한국어 데이터 버전: <code>{reference.version}</code> · 규칙
                    확인: {evidence.checkedAt}. 참조 데이터는 로컬 스냅샷을
                    사용하며 시세와 게임 업데이트에 따라 결과가 달라질 수
                    있습니다.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a
                        className="link"
                        href="https://prilus.gitlab.io/echostone"
                    >
                        Prilus 각성 확률 자료
                    </a>
                    <a className="link" href={evidence.sources[0]}>
                        공식 2025-09-11 변경점
                    </a>
                    <a className="link" href={evidence.sources[1]}>
                        공식 에코스톤 가이드
                    </a>
                    <Link className="link" href="/simulators/reforge">
                        세공 시뮬레이터
                    </Link>
                    <Link className="link" href="/calculator">
                        파티 분배 계산기
                    </Link>
                </div>
            </section>
        </div>
    );
}
