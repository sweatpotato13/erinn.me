import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";

import sitemap from "@/app/sitemap";
import { metadata } from "@/app/tools/murias-relics/simulator/page";
import Simulator from "@/app/tools/murias-relics/simulator/simulator";
import { FEATURE_LINKS } from "@/lib/feature-links";
import {
    emptyRelicCells,
    muriasReference,
    type RelicSnapshot,
} from "@/lib/murias-relics";

const snapshot = (): RelicSnapshot => ({
    referenceVersion: muriasReference.version,
    cells: emptyRelicCells().map(cell => ({
        ...cell,
        minUnitPrice: 20_000_000,
    })),
    fetchedAt: "2026-09-13T00:00:00Z",
    isComplete: true,
    pages: 1,
    nextCursor: null,
    receivedCount: 300,
    unclassifiedCount: 0,
    excludedCount: 0,
    rejected: [],
    relicError: null,
    ideaPrice: 10_000_000,
    ideaFetchedAt: "2026-09-13T00:00:00Z",
    ideaIsComplete: true,
    ideaError: null,
});
const fetchMock = jest.fn();
const clickRestore = () =>
    fireEvent.click(screen.getByRole("button", { name: "복원", exact: true }));
const summary = () => screen.getByRole("region", { name: "누적 손익" });
const edit = (label: string | RegExp, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock
        .mockReset()
        .mockResolvedValue({ ok: true, json: () => snapshot() });
    jest.spyOn(Math, "random").mockReturnValue(0);
});
afterEach(() => jest.restoreAllMocks());

test("ten clicks accumulate individual fees and costs without fetching, and reset clears ledger", async () => {
    render(<Simulator />);
    await waitFor(() =>
        expect(
            screen.getByRole("button", { name: "복원", exact: true })
        ).toBeEnabled()
    );
    expect(screen.getByText(/공식 확률 아님/)).toBeInTheDocument();
    for (let i = 0; i < 10; i++) clickRestore();
    expect(screen.getAllByRole("article")).toHaveLength(10);
    expect(summary()).toHaveTextContent("100,000,000 Gold");
    expect(summary()).toHaveTextContent("30,000,000 Gold");
    expect(summary()).toHaveTextContent("200,000,000 Gold");
    expect(summary()).toHaveTextContent("190,000,000 Gold");
    expect(summary()).toHaveTextContent("+60,000,000 Gold (이득)");
    expect(screen.getByRole("status")).toHaveTextContent("#10");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "세션 초기화" }));
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(summary()).toHaveTextContent("0회 복원");
    clickRestore();
    expect(screen.getByRole("article")).toHaveAccessibleName("1회 복원");
});

test("unknown Idea blocks opening; explicit zero and missing outputs remain valid, manually valued using original membership", async () => {
    fetchMock.mockResolvedValue({
        ok: true,
        json: () => ({
            ...snapshot(),
            ideaPrice: null,
            cells: emptyRelicCells(),
            relicError: "유물 조회 실패",
        }),
    });
    render(<Simulator />);
    await screen.findByText("유물 조회 실패");
    expect(
        screen.getByRole("button", { name: "복원", exact: true })
    ).toBeDisabled();
    edit("이데아 단가 (Gold)", "0");
    edit("복원비 (Gold · 수정 가능한 가정)", "0");
    fireEvent.click(screen.getByRole("checkbox"));
    clickRestore();
    expect(summary()).toHaveTextContent("평가 완료 0/1 · 전체 손익 미확정");
    expect(summary()).not.toHaveTextContent("(손해)");
    fireEvent.click(screen.getByRole("checkbox"));
    edit("1회 결과 평가액 (Gold)", "100");
    fireEvent.click(screen.getByRole("button", { name: "이 결과 평가 적용" }));
    expect(summary()).toHaveTextContent("+96 Gold (이득)");
    expect(screen.getByRole("article")).toHaveTextContent("멤버십 4%");
    expect(screen.getByRole("article")).toHaveTextContent("수동 입력");
    expect(screen.getByRole("status")).toHaveTextContent("#1");
});

test("late API responses preserve manual Idea and exact-cell overrides; editor selection does not filter rolls", async () => {
    let resolve!: (value: unknown) => void;
    fetchMock.mockReturnValue(
        new Promise(done => {
            resolve = done;
        })
    );
    render(<Simulator />);
    edit("이데아 단가 (Gold)", "500");
    fireEvent.click(screen.getByText("옵션·레벨별 예상 판매가 직접 설정"));
    edit("예상 판매가 (Gold)", "1000");
    fireEvent.click(
        screen.getByRole("button", { name: "선택한 조합 가격 적용" })
    );
    edit("유물 레벨", "10");
    edit("유물 옵션", String(muriasReference.effects.at(-1)!.id));
    await act(() => {
        resolve({ ok: true, json: () => snapshot() });
        return Promise.resolve();
    });
    expect(screen.getByLabelText("이데아 단가 (Gold)")).toHaveValue("500");
    clickRestore();
    const row = screen.getByRole("article");
    expect(row).toHaveTextContent("1레벨");
    expect(row).toHaveTextContent("이데아 500 Gold");
    expect(row).toHaveTextContent("예상 판매가 1,000 Gold");
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("price refresh and costs only affect future openings, and failed refresh retains snapshot", async () => {
    render(<Simulator />);
    await waitFor(() =>
        expect(
            screen.getByRole("button", { name: "복원", exact: true })
        ).toBeEnabled()
    );
    clickRestore();
    edit("복원비 (Gold · 수정 가능한 가정)", "0");
    fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => ({
            ...snapshot(),
            ideaPrice: 100,
            cells: emptyRelicCells().map(cell => ({
                ...cell,
                minUnitPrice: 200,
            })),
        }),
    });
    fireEvent.click(screen.getByRole("button", { name: "가격 새로고침" }));
    await waitFor(() =>
        expect(screen.getByLabelText("이데아 단가 (Gold)")).toHaveValue("100")
    );
    clickRestore();
    expect(screen.getByRole("article", { name: "1회 복원" })).toHaveTextContent(
        "+6,000,000 Gold (이득)"
    );
    expect(screen.getByRole("article", { name: "2회 복원" })).toHaveTextContent(
        "+90 Gold (이득)"
    );
    expect(fetchMock.mock.calls[1][1].method).toBe("POST");
    fetchMock.mockResolvedValueOnce({ ok: false });
    fireEvent.click(screen.getByRole("button", { name: "가격 새로고침" }));
    await screen.findByText(/가격 조회 실패/);
    clickRestore();
    expect(screen.getByRole("article", { name: "3회 복원" })).toHaveTextContent(
        "+90 Gold (이득)"
    );
});

test("initial network failure allows manual costs and never substitutes another level price", async () => {
    fetchMock.mockRejectedValueOnce(new Error("네트워크 실패"));
    render(<Simulator />);
    await screen.findByText("네트워크 실패");
    edit("이데아 단가 (Gold)", "10000000");
    clickRestore();
    expect(summary()).toHaveTextContent("13,000,000 Gold");
    expect(summary()).toHaveTextContent("전체 손익 미확정");
    edit("1회 결과 평가액 (Gold)", "0");
    fireEvent.click(screen.getByRole("button", { name: "이 결과 평가 적용" }));
    expect(summary()).toHaveTextContent("-13,000,000 Gold (손해)");
    expect(
        within(screen.getByRole("article")).queryByRole("textbox")
    ).not.toBeInTheDocument();
});

test("route metadata, feature navigation and sitemap are registered", () => {
    const url = "/tools/murias-relics/simulator";
    expect(FEATURE_LINKS).toContainEqual(
        expect.objectContaining({ url, searchVisible: true })
    );
    expect(sitemap()).toContainEqual({ url: `https://erinn.me${url}` });
    expect(metadata.alternates?.canonical).toBe(url);
    expect(metadata.title).toBe("무리아스의 유물 복원 시뮬레이터");
});
