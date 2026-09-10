import reference from "@/data/barter-reference.json";
import type { BarterReference } from "@/lib/barter";

import BarterTool from "./barter-tool";

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
        </div>
    );
}
