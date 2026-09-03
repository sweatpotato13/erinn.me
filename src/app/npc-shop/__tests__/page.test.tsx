import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NPCShopPage from "@/app/npc-shop/page";
import { getAuctionSearchPath } from "@/lib/auction-url";

const PREFERENCES_KEY = "npcShopPreferences";
const NPC_NAMES = [
    "델",
    "델렌",
    "상인 라누",
    "상인 피루",
    "모락",
    "상인 아루",
    "리나",
    "상인 누누",
    "상인 메루",
    "켄",
    "귀넥",
    "얼리",
    "데위",
    "테일로",
    "상인 세누",
    "상인 베루",
    "상인 에루",
    "상인 네루",
    "카디",
    "인장 상인",
    "피오나트",
];

function shopResponse(
    firstItemName = "광폭한 토끼 인형 (빨강)",
    dateInquire = "2026-09-02T00:00:00Z"
) {
    return {
        shop_tab_count: 2,
        shop: [
            {
                tab_name: "일반 상품",
                item: [
                    {
                        item_display_name: firstItemName,
                        item_count: 2,
                        item_option: [
                            {
                                option_type: "아이템 색상",
                                option_value: "255,255,255",
                            },
                        ],
                        image_url:
                            "https://open.api.nexon.com/static/mabinogi/img/item.png",
                        price: [
                            { price_type: "Gold", price_value: 1200 },
                            { price_type: "인장", price_value: "3" },
                        ],
                        limit_type: "주간",
                        limit_value: 5,
                    },
                    {
                        item_display_name: "Café 포션",
                        image_url:
                            "https://open.api.nexon.com/static/mabinogi/img/potion.png",
                        price: [{ price_type: "Gold", price_value: 500 }],
                    },
                ],
            },
            {
                tab_name: "교환 상품",
                item: [
                    {
                        item_display_name: "대형 포션",
                        image_url:
                            "https://open.api.nexon.com/static/mabinogi/img/large.png",
                        price: [{ price_type: "Gold", price_value: 800 }],
                    },
                ],
            },
        ],
        date_inquire: dateInquire,
        date_shop_next_update: "2026-09-02T00:36:00Z",
    };
}

function response(payload: unknown, ok = true) {
    return {
        ok,
        json: () => Promise.resolve(payload),
    } as Response;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(promiseResolve => {
        resolve = promiseResolve;
    });
    return { promise, resolve };
}

async function fillForm(
    user: ReturnType<typeof userEvent.setup>,
    npc = "델",
    server = "류트",
    channel = "1"
) {
    await user.selectOptions(screen.getByLabelText("NPC 이름"), npc);
    await user.selectOptions(screen.getByLabelText("서버 이름"), server);
    await user.clear(screen.getByLabelText("채널 번호"));
    await user.type(screen.getByLabelText("채널 번호"), channel);
}

describe("NPCShopPage", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        localStorage.clear();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("renders official NPC order and shared server choices without fetching", async () => {
        render(<NPCShopPage />);

        const npcOptions = within(
            screen.getByLabelText("NPC 이름")
        ).getAllByRole("option");
        expect(npcOptions.slice(1).map(option => option.textContent)).toEqual(
            NPC_NAMES
        );
        const serverOptions = within(
            screen.getByLabelText("서버 이름")
        ).getAllByRole("option");
        expect(
            serverOptions.slice(1).map(option => option.textContent)
        ).toEqual(["류트", "울프", "하프", "만돌린"]);
        await waitFor(() =>
            expect(screen.getByLabelText("서버 이름")).toHaveValue("")
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    it("restores valid device preferences without restoring NPC or fetching", async () => {
        localStorage.setItem(
            PREFERENCES_KEY,
            JSON.stringify({ serverName: "울프", channel: 12 })
        );

        render(<NPCShopPage />);

        await waitFor(() =>
            expect(screen.getByLabelText("서버 이름")).toHaveValue("울프")
        );
        expect(screen.getByLabelText("채널 번호")).toHaveValue(12);
        expect(screen.getByLabelText("NPC 이름")).toHaveValue("");
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([
        ["malformed JSON", "{broken"],
        ["missing field", JSON.stringify({ serverName: "류트" })],
        [
            "obsolete field",
            JSON.stringify({
                serverName: "류트",
                channel: 1,
                npcName: "델",
            }),
        ],
        [
            "unsupported server",
            JSON.stringify({ serverName: "없는 서버", channel: 1 }),
        ],
        [
            "string channel",
            JSON.stringify({ serverName: "류트", channel: "1" }),
        ],
        [
            "boolean channel",
            JSON.stringify({ serverName: "류트", channel: true }),
        ],
        [
            "fractional channel",
            JSON.stringify({ serverName: "류트", channel: 1.5 }),
        ],
        [
            "out-of-range channel",
            JSON.stringify({ serverName: "류트", channel: 43 }),
        ],
    ])("ignores %s preferences", async (_name, stored) => {
        localStorage.setItem(PREFERENCES_KEY, stored);

        render(<NPCShopPage />);

        await waitFor(() =>
            expect(screen.getByLabelText("서버 이름")).toHaveValue("")
        );
        expect(screen.getByLabelText("채널 번호")).toHaveValue(null);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("saves a valid pair without NPC and restores it after remount", async () => {
        const user = userEvent.setup();
        const first = render(<NPCShopPage />);
        await fillForm(user, "델렌", "만돌린", "7");

        await waitFor(() =>
            expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY)!)).toEqual({
                serverName: "만돌린",
                channel: 7,
            })
        );

        first.unmount();
        render(<NPCShopPage />);
        await waitFor(() =>
            expect(screen.getByLabelText("서버 이름")).toHaveValue("만돌린")
        );
        expect(screen.getByLabelText("채널 번호")).toHaveValue(7);
        expect(screen.getByLabelText("NPC 이름")).toHaveValue("");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("stays usable in memory when storage reads and writes fail", async () => {
        const user = userEvent.setup();
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full");
        });
        jest.mocked(fetch).mockResolvedValue(response(shopResponse()));

        render(<NPCShopPage />);
        await fillForm(user);
        await user.click(screen.getByRole("button", { name: "조회" }));

        expect(
            await screen.findByText("광폭한 토끼 인형 (빨강)")
        ).toBeVisible();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("reports and focuses every invalid field without fetching", async () => {
        const user = userEvent.setup();
        render(<NPCShopPage />);

        await user.click(screen.getByRole("button", { name: "조회" }));
        expect(screen.getByRole("alert")).toHaveTextContent(
            "NPC를 선택해주세요."
        );
        expect(screen.getByLabelText("NPC 이름")).toHaveFocus();

        await user.selectOptions(screen.getByLabelText("NPC 이름"), "델");
        await user.click(screen.getByRole("button", { name: "조회" }));
        expect(screen.getByRole("alert")).toHaveTextContent(
            "서버를 선택해주세요."
        );
        expect(screen.getByLabelText("서버 이름")).toHaveFocus();

        await user.selectOptions(screen.getByLabelText("서버 이름"), "류트");
        await user.click(screen.getByRole("button", { name: "조회" }));
        expect(screen.getByRole("alert")).toHaveTextContent(
            "채널 번호를 입력해주세요."
        );
        expect(screen.getByLabelText("채널 번호")).toHaveFocus();

        fireEvent.change(screen.getByLabelText("채널 번호"), {
            target: { value: "1.5" },
        });
        await user.click(screen.getByRole("button", { name: "조회" }));
        expect(screen.getByRole("alert")).toHaveTextContent(
            "1부터 42 사이의 정수"
        );
        expect(screen.getByLabelText("채널 번호")).toHaveFocus();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("makes one encoded request and renders complete accessible results", async () => {
        const user = userEvent.setup();
        const pending = deferred<Response>();
        jest.mocked(fetch).mockReturnValue(pending.promise);
        render(<NPCShopPage />);
        await fillForm(user, "상인 라누", "만돌린", "12");

        await user.click(screen.getByRole("button", { name: "조회" }));

        expect(screen.getByRole("status")).toHaveTextContent(
            "상점 정보를 불러오는 중입니다."
        );
        expect(
            screen
                .getByRole("button", { name: "조회 중…" })
                .querySelector(".loading-spinner")
        ).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledTimes(1);
        const [requestUrl, init] = jest.mocked(fetch).mock.calls[0];
        const url = new URL(requestUrl as string, "http://localhost");
        expect(url.searchParams.get("npc_name")).toBe("상인 라누");
        expect(url.searchParams.get("server_name")).toBe("만돌린");
        expect(url.searchParams.get("channel")).toBe("12");
        expect(init?.signal).toBeInstanceOf(AbortSignal);

        await act(async () => {
            pending.resolve(response(shopResponse()));
            await pending.promise;
        });

        expect(await screen.findByText("상점 탭 2개")).toBeVisible();
        expect(
            screen.getByRole("heading", { name: "일반 상품" })
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: "교환 상품" })
        ).toBeVisible();
        expect(screen.getByText("수량: 2개")).toBeVisible();
        const prices = screen.getByRole("list", {
            name: "광폭한 토끼 인형 (빨강) 가격",
        });
        expect(prices).toHaveTextContent("가격: 1,200 (Gold)");
        expect(prices).toHaveTextContent("가격: 3 (인장)");
        expect(screen.getByText("구매 제한: 주간 5개")).toBeVisible();
        expect(
            screen.getByRole("img", {
                name: "광폭한 토끼 인형 (빨강)",
            })
        ).toBeVisible();
        const times = document.querySelectorAll("time");
        expect(times[0]).toHaveAttribute("datetime", "2026-09-02T00:00:00Z");
        expect(times[1]).toHaveAttribute("datetime", "2026-09-02T00:36:00Z");
        const koreanTime = new Intl.DateTimeFormat("ko-KR", {
            dateStyle: "medium",
            timeStyle: "medium",
            timeZone: "Asia/Seoul",
        });
        expect(times[0]).toHaveTextContent(
            koreanTime.format(new Date("2026-09-02T00:00:00Z"))
        );
        expect(times[1]).toHaveTextContent(
            koreanTime.format(new Date("2026-09-02T00:36:00Z"))
        );
        expect(screen.getByText(/평균 약 10분/)).toHaveTextContent(
            "36분 주기로 갱신"
        );
    });

    it("links every shop item to its exact auction search", async () => {
        const user = userEvent.setup();
        const payload = shopResponse("한글 + & (雪)!");
        jest.mocked(fetch).mockResolvedValue(response(payload));
        render(<NPCShopPage />);
        await fillForm(user);

        await user.click(screen.getByRole("button", { name: "조회" }));

        const links = await screen.findAllByRole("link", {
            name: / 경매장 시세 보기$/,
        });
        const itemNames = payload.shop.flatMap(tab =>
            tab.item.map(item => item.item_display_name)
        );
        expect(links).toHaveLength(itemNames.length);
        links.forEach((link, index) => {
            const itemName = itemNames[index];
            expect(link).toHaveAccessibleName(`${itemName} 경매장 시세 보기`);
            expect(link).toHaveAttribute(
                "href",
                getAuctionSearchPath(itemName)
            );
            const target = new URL(
                link.getAttribute("href")!,
                "https://erinn.me"
            );
            expect(target.pathname).toBe("/auction");
            expect(target.searchParams.get("q")).toBe(itemName);
        });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("rejects malformed successful responses before rendering", async () => {
        const user = userEvent.setup();
        jest.mocked(fetch).mockResolvedValue(response({ shop: [] }));
        render(<NPCShopPage />);
        await fillForm(user);

        await user.click(screen.getByRole("button", { name: "조회" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "데이터를 가져오는 데 실패했습니다."
        );
        expect(
            screen.queryByRole("heading", { name: "상점 정보" })
        ).not.toBeInTheDocument();
    });

    it("shows empty and failure states and allows an explicit retry", async () => {
        const user = userEvent.setup();
        jest.mocked(fetch)
            .mockResolvedValueOnce(response({}, false))
            .mockResolvedValueOnce(
                response({
                    ...shopResponse(),
                    shop_tab_count: 0,
                    shop: [],
                })
            );
        render(<NPCShopPage />);
        await fillForm(user);

        await user.click(screen.getByRole("button", { name: "조회" }));
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "데이터를 가져오는 데 실패했습니다."
        );

        await user.click(screen.getByRole("button", { name: "조회" }));
        expect(await screen.findByRole("status")).toHaveTextContent(
            "판매 중인 아이템이 없습니다."
        );
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("aborts and ignores a superseded response including its cleanup", async () => {
        const user = userEvent.setup();
        const oldRequest = deferred<Response>();
        const newRequest = deferred<Response>();
        jest.mocked(fetch)
            .mockReturnValueOnce(oldRequest.promise)
            .mockReturnValueOnce(newRequest.promise);
        render(<NPCShopPage />);
        await fillForm(user);

        await user.click(screen.getByRole("button", { name: "조회" }));
        const oldSignal = jest.mocked(fetch).mock.calls[0][1]?.signal;
        await user.click(screen.getByRole("button", { name: "조회 중…" }));
        expect(oldSignal?.aborted).toBe(true);

        await act(async () => {
            newRequest.resolve(
                response(shopResponse("최신 아이템", "2026-09-02T01:00:00Z"))
            );
            await newRequest.promise;
        });
        expect(await screen.findByText("최신 아이템")).toBeVisible();

        await act(async () => {
            oldRequest.resolve(
                response(shopResponse("이전 아이템", "2026-09-02T00:00:00Z"))
            );
            await oldRequest.promise;
        });
        expect(screen.queryByText("이전 아이템")).not.toBeInTheDocument();
        expect(document.querySelector("time")).toHaveAttribute(
            "datetime",
            "2026-09-02T01:00:00Z"
        );
        expect(screen.getByRole("button", { name: "조회" })).toBeVisible();
    });

    it("aborts a pending response when a lookup control changes", async () => {
        const user = userEvent.setup();
        const pending = deferred<Response>();
        jest.mocked(fetch).mockReturnValue(pending.promise);
        render(<NPCShopPage />);
        await fillForm(user);
        await user.click(screen.getByRole("button", { name: "조회" }));
        const signal = jest.mocked(fetch).mock.calls[0][1]?.signal;

        await user.selectOptions(screen.getByLabelText("서버 이름"), "울프");
        expect(signal?.aborted).toBe(true);
        expect(
            screen.queryByText("상점 정보를 불러오는 중입니다.")
        ).not.toBeInTheDocument();

        await act(async () => {
            pending.resolve(response(shopResponse("무시할 아이템")));
            await pending.promise;
        });
        expect(screen.queryByText("무시할 아이템")).not.toBeInTheDocument();
    });

    it("filters committed tabs locally with normalized text and resets", async () => {
        const user = userEvent.setup();
        jest.mocked(fetch)
            .mockResolvedValueOnce(response(shopResponse()))
            .mockResolvedValueOnce(response(shopResponse("새 조회 아이템")));
        render(<NPCShopPage />);
        await fillForm(user);
        await user.click(screen.getByRole("button", { name: "조회" }));
        const filter = await screen.findByLabelText("아이템 이름 필터");

        await user.type(filter, "  포션  ");
        expect(screen.getByText("일치하는 아이템 2개")).toBeVisible();
        expect(
            screen.getByRole("heading", { name: "일반 상품" })
        ).toBeVisible();
        expect(
            screen.getByRole("heading", { name: "교환 상품" })
        ).toBeVisible();
        expect(
            screen.queryByText("광폭한 토끼 인형 (빨강)")
        ).not.toBeInTheDocument();
        expect(fetch).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", { name: "필터 지우기" }));
        await user.type(filter, "CAFE\u0301");
        expect(screen.getByText("Café 포션")).toBeVisible();
        expect(screen.getByText("일치하는 아이템 1개")).toBeVisible();

        await user.clear(filter);
        await user.type(filter, "없는 아이템");
        expect(screen.getByRole("status")).toHaveTextContent(
            "필터와 일치하는 아이템이 없습니다."
        );
        await user.click(screen.getByRole("button", { name: "필터 지우기" }));
        expect(screen.getByText("일치하는 아이템 3개")).toBeVisible();

        await user.type(filter, "포션");
        await user.selectOptions(screen.getByLabelText("NPC 이름"), "델렌");
        expect(
            screen.queryByLabelText("아이템 이름 필터")
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "조회" }));
        expect(await screen.findByText("새 조회 아이템")).toBeVisible();
        expect(screen.getByLabelText("아이템 이름 필터")).toHaveValue("");
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
