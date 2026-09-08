import type { Metadata } from "next";

import reference from "@/data/miniature-reference.json";
import { MINIATURE_PATH } from "@/lib/miniatures-state";

import MiniatureTool from "./miniature-tool";

const title = "마비노기 미니어처 효과 비교·구매 도우미";
const description =
    "설치 중인 미니어처를 기준으로 일반·엑스트라 효과와 구매 후 증가량을 비교하세요. 최대 네 후보의 개별 효과, 함께 설치할 때의 효과와 가격을 확인할 수 있습니다.";
export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: MINIATURE_PATH },
};
export default function MiniaturePage() {
    return (
        <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
            <h1 className="text-2xl font-bold break-keep text-slate-900 sm:text-3xl">
                {title}
            </h1>
            <p className="my-4 text-slate-700">{description}</p>
            <MiniatureTool data={reference} />
            <section
                className="mt-8 space-y-3 border-t border-slate-300 pt-6 text-sm text-slate-700"
                aria-labelledby="miniature-rules"
            >
                <h2 id="miniature-rules" className="text-lg font-bold">
                    계산 안내
                </h2>
                <p>
                    능력치마다 독립적으로 설치 중인 일반 미니어처의 최댓값 +
                    엑스트라 미니어처의 최댓값을 합산합니다. 보유하거나 비교에
                    담기만 한 미니어처는 설치 효과를 활성화하지 않습니다. 후보를
                    함께 설치할 때는 전체 목록의 최댓값을 다시 계산합니다.
                </p>
                <p>
                    세트 효과, 펫 하우스와 다른 낭만농장·낭만섬 시스템은
                    계산에서 제외합니다. 알려지지 않은 효과는 원래 키와 값을
                    표시하고 합계에서 제외합니다. 전체 캐릭터 능력치를 계산하는
                    도구가 아닙니다.
                </p>
                <p>
                    비교에 추가한 경매장 검색 가능 후보의 가격을 자동으로
                    조회합니다. 가격은 수정하거나 다시 조회할 수 있습니다. 최저
                    개당 가격과 수량은 조회 시점의 참고 정보이며 가격·재고를
                    보장하지 않습니다.
                </p>
            </section>
        </div>
    );
}
