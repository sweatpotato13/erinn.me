import reference from "@/data/totem-reference.json";

import TotemTool from "./totem-tool";

export default function TotemPage() {
    return (
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
            <h1 className="text-2xl font-bold break-keep text-slate-900 sm:text-3xl">
                마비노기 토템 옵션 비교·매물 평가
            </h1>
            <p className="my-3 text-slate-700">
                토템을 찾고, 내 실제 옵션과 매물의 증가량·감소량·등록 가격을
                비교하세요.
            </p>
            <TotemTool data={reference} />
        </div>
    );
}
