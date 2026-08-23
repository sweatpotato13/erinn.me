import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
    defaultHornPreferences,
    HORN_PREFERENCES_KEY,
    parseHornPreferences,
} from "@/app/horn/horn-preferences";
import HornPage from "@/app/horn/page";

const mockPlay = jest.fn();

jest.mock("use-sound", () => ({
    __esModule: true,
    default: () => [mockPlay],
}));

function message(
    character: string,
    text: string,
    date = new Date().toISOString()
) {
    return { character_name: character, message: text, date_send: date };
}

function hornResponse(messages = [message("테스터", "테스트 메시지")]) {
    return {
        ok: true,
        json: () => Promise.resolve({ horn_bugle_world_history: messages }),
    } as Response;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(promiseResolve => {
        resolve = promiseResolve;
    });
    return { promise, resolve };
}

function savedPreferences() {
    return {
        selectedServer: "울프" as const,
        alertKeywords: ["거래"],
        soundEnabled: false,
    };
}

describe("horn preferences", () => {
    it("parses valid preferences and rejects malformed values", () => {
        expect(
            parseHornPreferences(JSON.stringify(savedPreferences()))
        ).toEqual(savedPreferences());
        expect(parseHornPreferences("{broken")).toEqual(
            defaultHornPreferences()
        );
        expect(
            parseHornPreferences(
                JSON.stringify({
                    ...savedPreferences(),
                    selectedServer: "없는 서버",
                })
            )
        ).toEqual(defaultHornPreferences());
    });
});

describe("HornPage", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        localStorage.clear();
        mockPlay.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("restores preferences before loading and keeps filters working", async () => {
        const user = userEvent.setup();
        localStorage.setItem(
            HORN_PREFERENCES_KEY,
            JSON.stringify(savedPreferences())
        );
        global.fetch = jest
            .fn()
            .mockResolvedValue(
                hornResponse([
                    message("앨리스", "거래 메시지"),
                    message("밥", "다른 내용"),
                ])
            );

        render(<HornPage />);

        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(
            jest
                .mocked(fetch)
                .mock.calls.every(([url]) =>
                    typeof url === "string"
                        ? url.includes(
                              `server_name=${encodeURIComponent("울프")}`
                          )
                        : false
                )
        ).toBe(true);
        await user.type(screen.getByPlaceholderText("닉네임"), "앨리스");
        expect(screen.getByText("거래 메시지")).toBeVisible();
        expect(screen.queryByText("다른 내용")).not.toBeInTheDocument();
        await user.clear(screen.getByPlaceholderText("닉네임"));
        await user.type(screen.getByPlaceholderText("키워드"), "다른");
        expect(screen.getByText("다른 내용")).toBeVisible();
        expect(screen.queryByText("거래 메시지")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "알림" }));
        expect(screen.getByText("거래", { exact: true })).toBeVisible();
        expect(
            screen.getByRole("checkbox", { name: "소리 알림 사용" })
        ).not.toBeChecked();
    });

    it("persists server, keyword, removal, and sound changes", async () => {
        const user = userEvent.setup();
        global.fetch = jest.fn().mockResolvedValue(hornResponse([]));
        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());

        await user.click(screen.getByRole("button", { name: "류트" }));
        await user.click(screen.getByText("울프", { selector: "a" }));
        await user.click(screen.getByRole("button", { name: "알림" }));
        await user.type(screen.getByPlaceholderText("알림 키워드"), "거래");
        await user.click(screen.getByRole("button", { name: "추가" }));
        await user.click(
            screen.getByRole("checkbox", { name: "소리 알림 사용" })
        );

        await waitFor(() =>
            expect(
                JSON.parse(localStorage.getItem(HORN_PREFERENCES_KEY)!)
            ).toEqual(savedPreferences())
        );
        await user.click(screen.getByRole("button", { name: "삭제" }));
        await waitFor(() =>
            expect(
                JSON.parse(localStorage.getItem(HORN_PREFERENCES_KEY)!)
                    .alertKeywords
            ).toEqual([])
        );
    });

    it("ignores stale responses after an immediate server refresh", async () => {
        const user = userEvent.setup();
        const oldRequest = deferred<Response>();
        const newRequest = deferred<Response>();
        global.fetch = jest
            .fn()
            .mockReturnValueOnce(oldRequest.promise)
            .mockReturnValueOnce(newRequest.promise);
        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        await user.click(screen.getByRole("button", { name: "류트" }));
        await user.click(screen.getByText("울프", { selector: "a" }));
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        await act(async () => {
            newRequest.resolve(hornResponse([message("최신", "새 서버")]));
            await newRequest.promise;
        });
        expect(await screen.findByText("새 서버")).toBeVisible();
        await act(async () => {
            oldRequest.resolve(hornResponse([message("이전", "이전 서버")]));
            await oldRequest.promise;
        });

        expect(screen.getByText("새 서버")).toBeVisible();
        expect(screen.queryByText("이전 서버")).not.toBeInTheDocument();
        expect(screen.queryByText("로딩 중...")).not.toBeInTheDocument();
    });

    it("honors sound preferences without replaying existing messages", async () => {
        const user = userEvent.setup();
        localStorage.setItem(
            HORN_PREFERENCES_KEY,
            JSON.stringify(savedPreferences())
        );
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce(
                hornResponse([
                    message("테스터", "거래", "2999-01-01T00:00:00Z"),
                ])
            )
            .mockResolvedValueOnce(
                hornResponse([
                    message("테스터", "거래", "2000-01-01T00:00:00Z"),
                ])
            );
        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        expect(mockPlay).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "알림" }));
        await user.click(
            screen.getByRole("checkbox", { name: "소리 알림 사용" })
        );
        await user.click(screen.getByRole("button", { name: "검색" }));
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(mockPlay).not.toHaveBeenCalled();
    });

    it("resets the alert cutoff before changing servers", async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-08-23T00:00:00Z"));
        const user = userEvent.setup({
            advanceTimers: milliseconds =>
                jest.advanceTimersByTime(milliseconds),
        });
        localStorage.setItem(
            HORN_PREFERENCES_KEY,
            JSON.stringify({
                selectedServer: "류트",
                alertKeywords: ["거래"],
                soundEnabled: true,
            })
        );
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce(hornResponse([]))
            .mockResolvedValueOnce(
                hornResponse([
                    message("테스터", "거래", "2026-08-23T00:01:00Z"),
                ])
            );
        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        jest.setSystemTime(new Date("2026-08-23T00:05:00Z"));
        await user.click(screen.getByRole("button", { name: "류트" }));
        await user.click(screen.getByText("울프", { selector: "a" }));
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

        expect(mockPlay).not.toHaveBeenCalled();
    });

    it("stays usable when storage reads and writes fail", async () => {
        const user = userEvent.setup();
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full");
        });
        global.fetch = jest.fn().mockResolvedValue(hornResponse([]));

        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await user.click(screen.getByRole("button", { name: "알림" }));
        await user.type(screen.getByPlaceholderText("알림 키워드"), "거래");
        await user.click(screen.getByRole("button", { name: "추가" }));

        expect(screen.getByText("거래", { exact: true })).toBeVisible();
    });
});
