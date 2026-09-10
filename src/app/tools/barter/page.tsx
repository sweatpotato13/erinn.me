import type { Metadata } from "next";

import reference from "@/data/barter-reference.json";
import type { BarterReference } from "@/lib/barter";
import { BARTER_PATH } from "@/lib/barter-state";

import BarterTool from "./barter-tool";

const TITLE = "마비노기 물물교환 준비 계산기";
const DESCRIPTION =
    "교역소별 추가 교환 횟수와 보유 재료를 입력해 통합 준비 목록, 부족 수량과 추가 구매 예상액을 계산하세요. 고정·시즌 교역품과 주간 한도를 함께 확인합니다.";
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
const date = (time: number | string) =>
    new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Seoul",
    }).format(new Date(time));

export default function BarterPage() {
    return (
        <div className="mx-auto max-w-5xl space-y-5 px-3 py-6 sm:px-6">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                마비노기 물물교환 준비 계산기
            </h1>
            <p className="text-slate-700">
                교역소와 추가 교환 횟수를 선택하고, 보유 재료를 차감한 통합 준비
                목록과 구매 예상액을 확인하세요.
            </p>
            <BarterTool data={reference as BarterReference} />
            <section
                className="space-y-3 border-t border-slate-300 pt-6 text-sm leading-6 text-slate-700"
                aria-labelledby="barter-guide"
            >
                <h2 id="barter-guide" className="text-lg font-bold">
                    지원 범위·데이터 안내
                </h2>
                <p>
                    고정 교역품은 스카하 해변과 이리아 1~5단계입니다. 수록된{" "}
                    {reference.goods.filter(g => g.source === "fixed").length}
                    개를 현재 시즌 전체 목록으로 간주하지 않습니다. 계정의 실제
                    교환 사용량이나 재고를 자동으로 조회하지 않습니다. 직접
                    교환할 재료는 캐릭터 인벤토리에 준비해 주세요.
                </p>
                <p>
                    고정 자료 출처:{" "}
                    <a
                        className="underline"
                        href="https://prilus.gitlab.io/barter"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Prilus
                    </a>{" "}
                    · 원본 버전 {reference.sourceVersion} (
                    {date(reference.sourceVersion * 1000)}) · 수집{" "}
                    {date(reference.collectedAt)}.
                </p>
                {reference.season && (
                    <p>
                        시즌 자료 출처:{" "}
                        <a
                            className="underline"
                            href={reference.season.source}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Labanyu
                        </a>{" "}
                        · 시즌 {reference.season.seasonId}, 버전{" "}
                        {reference.season.seasonVersion} · 수집{" "}
                        {date(reference.season.collectedAt)}. 수록 기간은{" "}
                        {date(reference.season.period.startAt)}부터{" "}
                        {date(reference.season.period.endAt)} 전까지 (서울
                        시각)이며 카루 숲·오아시스·칼리다·페라의 6단계 각
                        1개입니다. 스카하 6단계는 이 월간 자료에 포함하지
                        않습니다.
                    </p>
                )}
                <p>
                    시즌 자료는 기간 만료 후 다시 확인해야 합니다. 현재 자료가
                    없으면 시즌 교역품 직접 입력을 사용하세요. 직접 입력과 수집
                    자료는 출처를 구별하며 같은 교역품을 중복 합산하지 않습니다.
                    주간 사용량 초기화와 월간 재료 회전은 서로 독립적입니다.
                </p>
                <p>
                    전체 재료 가치는 보유분을 포함한 필요량의 가치이며, 추가
                    구매 예상액은 부족량만 평가합니다. 미입력 가격은 무료가
                    아닙니다. 시세 버튼을 누를 때만 조회하고 등록 최저 단가를
                    사용하므로 부분 조회·매물 수량·묶음 판매에 따라 실제 구매
                    금액이 달라질 수 있습니다.
                </p>
                <p>
                    준비 완료 체크와 재계산은 보유 수량을 소모하지 않습니다.
                    공유 링크는 임시 계획으로 열리며 가져오기를 선택해야 이
                    기기에 저장됩니다. 제작 재료의 재귀 확장과 교역 경로·판매
                    이익 최적화는 이 계산의 범위에 포함하지 않습니다.
                </p>
            </section>
        </div>
    );
}
