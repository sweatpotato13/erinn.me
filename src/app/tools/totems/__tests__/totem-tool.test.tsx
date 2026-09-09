import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";

import TotemTool from "@/app/tools/totems/totem-tool";
import reference from "@/data/totem-reference.json";
import fixtures from "@/lib/__tests__/fixtures/totem-listings.json";
import * as totemState from "@/lib/totems-state";
import {
    buildTotemShare,
    emptyTotemConfig,
    serializeTotemStorage,
    snapshotTotemListing,
    TOTEM_STORAGE_KEY,
} from "@/lib/totems-state";

jest.mock("@/lib/totems-state", () => {
    const actual =
        jest.requireActual<typeof import("@/lib/totems-state")>(
            "@/lib/totems-state"
        );
    return {
        ...actual,
        snapshotTotemListing: jest.fn(actual.snapshotTotemListing),
        candidateTotemRoll: jest.fn(actual.candidateTotemRoll),
    };
});

const painting = reference.totems.find(r => r.id === 5160004)!;
const handkerchief = reference.totems.find(r => r.id === 52289)!;
const raw = fixtures.find(r => r.item_name === painting.name)!;
const fetchMock = jest.fn();
let sequence = 0;
beforeEach(() => {
    sequence = 0;
    window.history.replaceState(null, "", "/tools/totems");
    localStorage.clear();
    global.fetch = fetchMock;
    fetchMock.mockReset();
    window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    });
    Object.defineProperty(crypto, "randomUUID", {
        configurable: true,
        value: () => `uuid-${++sequence}`,
    });
});
afterEach(() => jest.restoreAllMocks());
const mount = () => render(<TotemTool data={reference} />);
function pick(name: string) {
    fireEvent.change(
        screen.getByRole("searchbox", { name: "토템 이름·효과 검색" }),
        { target: { value: name } }
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));
}
const comparison = () =>
    within(screen.getByRole("region", { name: "후보 비교" }));
const button = (name: string) => screen.getByRole("button", { name });

test("search, explicit market loading, exact value/bundle price and local changes share one observation", async () => {
    fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
            Promise.resolve({
                items: [{ ...raw, auction_price_per_unit: 1200000 }],
                hasMore: true,
                nextCursor: "next",
            }),
    });
    mount();
    pick("물망초");
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox", { name: "목표 스탯" }), {
        target: { value: "bonusdamage" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(button("매물 조회"));
    await screen.findByText(/일부 매물만 불러왔습니다/);
    fireEvent.click(screen.getByRole("checkbox", { name: "비교에 추가" }));
    expect(
        comparison().getByRole("heading", { name: "후보 비교 · 1 / 4" })
    ).toBeInTheDocument();
    expect(comparison().getAllByText("0.4%").length).toBeGreaterThan(0);
    expect(comparison().getAllByText(/2,400,000 골드/).length).toBeGreaterThan(
        0
    );
    expect(
        comparison().getAllByText(/범위 내 위치 33.3% · 확률 아님/).length
    ).toBeGreaterThan(0);
    fireEvent.change(
        screen.getByRole("textbox", { name: "개당 예산 (골드, 선택)" }),
        { target: { value: "1000000" } }
    );
    fireEvent.click(
        screen.getByText("불러온 매물 필터", { selector: "summary" })
    );
    fireEvent.click(
        screen.getByRole("checkbox", { name: /개당 예산 초과 제외/ })
    );
    expect(
        screen.getByText("불러온 매물 중 조건에 맞는 결과가 없습니다.")
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "매물 정렬" }), {
        target: { value: "value" },
    });
    fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "콜튼" },
    });
    expect(
        comparison().getByRole("heading", { name: "후보 비교 · 1 / 4" })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("four candidates survive a fifth request; unknown prices and source assumptions remain distinct", () => {
    mount();
    pick("물망초");
    fireEvent.click(button("범위 비교에 추가"));
    fireEvent.click(button("최댓값으로 가정하여 추가"));
    for (const value of ["0.5", "0.6", "0.7"]) {
        fireEvent.click(button("옵션 직접 입력"));
        fireEvent.change(
            screen.getByRole("textbox", {
                name: "후보 옵션 보너스 대미지 (%)",
            }),
            { target: { value } }
        );
        fireEvent.click(button("직접 입력 후보 추가"));
        const input = screen.queryByRole("textbox", {
            name: "후보 옵션 보너스 대미지 (%)",
        });
        if (value === "0.7") expect(input).toHaveValue(value);
        else expect(input).toBeNull();
    }
    expect(
        comparison().getByRole("heading", { name: "후보 비교 · 4 / 4" })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("최대 4개");
    expect(
        comparison().getAllByText("최댓값 가정 · 실제 매물 아님").length
    ).toBeGreaterThan(0);
    expect(
        comparison().getAllByText("원본 범위 · 실제값 미입력").length
    ).toBeGreaterThan(0);
    expect(comparison().getAllByText("가격 미확인").length).toBeGreaterThan(0);
    fireEvent.click(
        comparison().getAllByRole("button", { name: /비교 제거/ })[0]
    );
    expect(
        comparison().getByRole("heading", { name: "후보 비교 · 3 / 4" })
    ).toBeInTheDocument();
    expect(document.activeElement).toBe(
        screen.getByRole("region", { name: "후보 비교" })
    );
    expect(fetchMock).not.toHaveBeenCalled();
});

test("allstat manual inputs show all five independent axes", () => {
    mount();
    pick("콜튼");
    fireEvent.click(button("옵션 직접 입력"));
    for (const [label, value] of [
        ["체력", "9"],
        ["솜씨", "13"],
        ["지력", "5"],
        ["의지", "13"],
        ["행운", "7"],
    ])
        fireEvent.change(
            screen.getByRole("textbox", {
                name: `후보 옵션 ${label}`,
            }),
            { target: { value } }
        );
    fireEvent.click(button("직접 입력 후보 추가"));
    for (const loss of ["9", "13", "5", "7"])
        expect(comparison().getAllByText(loss).length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
});

test("market failure leaves manual and empty-range exploration usable", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    mount();
    pick("물망초");
    fireEvent.click(button("매물 조회"));
    await screen.findByRole("alert");
    fireEvent.click(button("옵션 직접 입력"));
    fireEvent.change(
        screen.getByRole("textbox", { name: "후보 옵션 보너스 대미지 (%)" }),
        { target: { value: "0.4" } }
    );
    fireEvent.click(button("직접 입력 후보 추가"));
    expect(
        comparison().getByRole("heading", { name: "후보 비교 · 1 / 4" })
    ).toBeInTheDocument();
    pick("달콤한 요거트바");
    expect(
        within(
            screen.getByRole("region", { name: "선택한 토템" })
        ).getAllByText("옵션 범위 정보 없음").length
    ).toBeGreaterThan(0);
    expect(button("최댓값으로 가정하여 추가")).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("a received expired snapshot stays historical and does not replace saved baseline or fetch", async () => {
    const saved = serializeTotemStorage(
        { id: handkerchief.id, values: { strength: "10" } },
        reference
    );
    localStorage.setItem(TOTEM_STORAGE_KEY, saved);
    const config = {
        ...emptyTotemConfig(reference),
        baseline: { id: painting.id, values: { bonusdamage: "0.3" } },
        candidates: [
            snapshotTotemListing({
                kind: "listing",
                key: "old:1",
                observedAt: "2020-01-01T00:00:00Z",
                item: { ...raw, date_auction_expire: "2020-01-02T00:00:00Z" },
            }),
        ],
    };
    window.history.replaceState(null, "", buildTotemShare(config).path);
    mount();
    await waitFor(() =>
        expect(
            comparison().getByRole("heading", { name: "후보 비교 · 1 / 4" })
        ).toBeInTheDocument()
    );
    expect(
        comparison().getAllByText("등록 종료 시각이 지난 매물").length
    ).toBeGreaterThan(0);
    expect(comparison().getAllByText(/당시 등록 가격/).length).toBeGreaterThan(
        0
    );
    expect(localStorage.getItem(TOTEM_STORAGE_KEY)).toBe(saved);
    expect(
        screen.queryByText(/내 기준|내 옵션 입력 필요|증가당 가격/)
    ).toBeNull();
    expect(
        screen.queryByRole("button", { name: /공유|내 토템으로 설정/ })
    ).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
});

test("market derivations are reused while local controls still filter and sort correctly", async () => {
    const snapshot = jest.mocked(totemState.snapshotTotemListing).mockClear();
    const roll = jest.mocked(totemState.candidateTotemRoll).mockClear();
    fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
            Promise.resolve({
                items: Array.from({ length: 9 }, (_, i) => ({
                    ...raw,
                    auction_price_per_unit: 100 + i,
                })),
                hasMore: false,
                nextCursor: null,
            }),
    });
    mount();
    pick("물망초");
    fireEvent.click(button("매물 조회"));
    await waitFor(() => expect(snapshot).toHaveBeenCalledTimes(9));
    const market = within(screen.getByRole("region", { name: "실제 매물" }));
    expect(market.getAllByRole("article")).toHaveLength(8);
    fireEvent.click(button("다음 매물"));
    expect(market.getAllByRole("article")).toHaveLength(1);
    fireEvent.change(screen.getByRole("searchbox"), {
        target: { value: "콜튼" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "목표 스탯" }), {
        target: { value: "bonusdamage" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "매물 정렬" }), {
        target: { value: "value" },
    });
    fireEvent.change(
        screen.getByRole("textbox", { name: "목표 스탯 최소값" }),
        { target: { value: "0.5" } }
    );
    expect(market.queryAllByRole("article")).toHaveLength(0);
    fireEvent.change(
        screen.getByRole("textbox", { name: "목표 스탯 최소값" }),
        { target: { value: "0.4" } }
    );
    expect(market.getAllByRole("article")).toHaveLength(8);
    fireEvent.change(
        screen.getByRole("textbox", { name: "개당 예산 (골드, 선택)" }),
        { target: { value: "103" } }
    );
    fireEvent.click(
        screen.getByText("불러온 매물 필터", { selector: "summary" })
    );
    fireEvent.click(
        screen.getByRole("checkbox", { name: /개당 예산 초과 제외/ })
    );
    expect(market.getAllByRole("article")).toHaveLength(4);
    expect(snapshot).toHaveBeenCalledTimes(9);
    expect(roll).toHaveBeenCalledTimes(9);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("duplicate rejection preserves the manual draft", () => {
    Object.defineProperty(crypto, "randomUUID", {
        configurable: true,
        value: () => "00000000-0000-0000-0000-000000000001",
    });
    mount();
    pick("물망초");
    fireEvent.click(button("옵션 직접 입력"));
    fireEvent.change(
        screen.getByRole("textbox", { name: "후보 옵션 보너스 대미지 (%)" }),
        { target: { value: "0.4" } }
    );
    fireEvent.click(button("직접 입력 후보 추가"));
    expect(screen.queryByRole("region", { name: "후보 직접 입력" })).toBeNull();
    fireEvent.click(button("옵션 직접 입력"));
    const input = screen.getByRole("textbox", {
        name: "후보 옵션 보너스 대미지 (%)",
    });
    fireEvent.change(input, { target: { value: "0.5" } });
    fireEvent.click(button("직접 입력 후보 추가"));
    expect(input).toHaveValue("0.5");
    expect(screen.getByRole("status")).toHaveTextContent(
        "이미 비교에 담긴 후보"
    );
    expect(
        comparison().getByRole("heading", { name: "후보 비교 · 1 / 4" })
    ).toBeInTheDocument();
});
