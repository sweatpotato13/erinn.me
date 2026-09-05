import {
    getReforgeModel,
    searchReforgeEquipment,
} from "@/lib/reforge-reference";

export function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    if (
        params.toString().length > 500 ||
        Array.from(params.keys()).some(k => params.getAll(k).length > 1)
    )
        return Response.json(
            { error: "요청이 올바르지 않습니다." },
            { status: 400 }
        );
    if (params.has("q")) {
        const q = params.get("q")!;
        if (q.length > 100)
            return Response.json(
                { error: "검색어는 100자 이내로 입력하세요." },
                { status: 400 }
            );
        return Response.json({ equipment: searchReforgeEquipment(q) });
    }
    const e = params.get("e") ?? "",
        t = params.get("t") ?? "";
    if (
        ![e, t].every(
            v => /^[1-9]\d{0,14}$/.test(v) && Number.isSafeInteger(Number(v))
        )
    )
        return Response.json(
            { error: "장비와 도구 ID를 확인하세요." },
            { status: 400 }
        );
    const model = getReforgeModel(Number(e), Number(t));
    if (!model)
        return Response.json(
            {
                error: "삭제되었거나 지원하지 않는 장비/도구입니다. 다시 선택하세요.",
            },
            { status: 404 }
        );
    return Response.json(model);
}
