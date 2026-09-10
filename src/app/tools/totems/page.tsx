import type { Metadata } from "next";

import s from "@/components/tools/preparation.module.css";
import reference from "@/data/totem-reference.json";
import { TOTEM_PATH } from "@/lib/totems-state";

import TotemTool from "./totem-tool";

const TITLE = "마비노기 토템 옵션 비교·매물 평가";
const DESCRIPTION =
    "토템의 가능한 옵션 범위를 찾아보고, 경매 매물의 실제 옵션·개당 가격을 비교하세요. 일반·엑스트라·펫 구분과 미확인 정보도 함께 확인할 수 있습니다.";
const PREVIEW = `${TOTEM_PATH}/preview`;
export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: TOTEM_PATH },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: TOTEM_PATH,
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

export default function TotemPage() {
    return (
        <div className={s.page}>
            <h1 className="text-2xl font-bold break-keep sm:text-3xl">
                {TITLE}
            </h1>
            <p className="my-4">
                토템을 찾고, 가능한 옵션 범위와 매물의 실제 옵션·등록 가격을
                비교하세요.
            </p>
            <TotemTool data={reference} />
            <section className={s.guide} aria-labelledby="totem-guide">
                <h2 id="totem-guide" className="text-lg font-bold">
                    비교·데이터 안내
                </h2>
                <p>
                    범위 내 위치는 (실제값 − 최솟값) / (최댓값 − 최솟값)으로
                    계산한 구간상의 위치입니다. 획득 확률이나 상위 백분위가
                    아닙니다. 최솟값과 최댓값이 같으면 고정 수치로 표시합니다.
                </p>
                <p>
                    예를 들어 보너스 대미지 0.1~1.0% 범위의 0.4%는 범위 내 위치
                    33.3%입니다. 올 스탯의 다섯 능력치는 각각의 실제 수치로
                    비교합니다.
                </p>
                <p>
                    매물 조회 버튼을 누를 때만 경매장에 요청합니다. 일부 결과만
                    받은 경우 모든 개수와 가격 비교는 불러온 매물 기준입니다.
                    가격은 조회 당시 등록 가격이며 적정 시세나 판매 완료 가격을
                    뜻하지 않습니다. 공유 매물은 현재 판매 여부를 보장하지
                    않습니다.
                </p>
                <p>
                    데이터 기준:{" "}
                    {new Intl.DateTimeFormat("ko-KR", {
                        dateStyle: "long",
                        timeStyle: "short",
                        timeZone: "Asia/Seoul",
                    }).format(new Date(reference.sourceVersion * 1000))}{" "}
                    (원본 버전 {reference.sourceVersion}). 수록 토템{" "}
                    {reference.totems.length}개 중{" "}
                    {reference.totems.filter(r => !r.bonuses.length).length}개는
                    옵션 범위 정보가 없습니다. 장식 토템과 범위가 없는 효과도
                    탐색할 수 있지만 확률·희귀도·재설정 비용을 추정하지
                    않습니다.
                </p>
                {!!reference.coverage.length && (
                    <p>
                        단위 미검증 원본 효과: {reference.coverage.join(", ")}
                    </p>
                )}
                <p>
                    원본에 없는 이름, 동명 변형, 기준 범위 밖의 값은 근거
                    부족이나 데이터 버전 차이일 수 있습니다. 실제 옵션과 설명을
                    확인해 주세요.
                </p>
            </section>
        </div>
    );
}
