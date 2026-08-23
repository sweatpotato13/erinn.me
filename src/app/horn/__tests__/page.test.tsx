import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
    defaultHornPreferences,
    HORN_PREFERENCES_KEY,
    parseHornPreferences,
} from "@/app/horn/horn-preferences";
import HornPage from "@/app/horn/page";

const mockPlay = jest.fn();
const originalNotificationDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "Notification"
);

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

function savedPreferences(
    overrides: Partial<ReturnType<typeof defaultHornPreferences>> = {}
) {
    return {
        selectedServer: "울프" as const,
        alertKeywords: ["거래"],
        soundEnabled: false,
        browserNotificationsEnabled: false,
        ...overrides,
    };
}

function installNotification(
    initialPermission: NotificationPermission,
    requestedPermission = initialPermission,
    constructorFails = false
) {
    const instances: Array<{
        title: string;
        options?: NotificationOptions;
        onclick: (() => void) | null;
        close: jest.Mock;
    }> = [];
    let permission = initialPermission;
    const requestPermission = jest.fn(() => {
        permission = requestedPermission;
        return Promise.resolve(permission);
    });

    class FakeNotification {
        static get permission() {
            return permission;
        }

        static requestPermission = requestPermission;
        onclick: (() => void) | null = null;
        close = jest.fn();

        constructor(
            public title: string,
            public options?: NotificationOptions
        ) {
            if (constructorFails) throw new TypeError("unsupported");
            instances.push(this);
        }
    }

    Object.defineProperty(globalThis, "Notification", {
        configurable: true,
        value: FakeNotification,
    });
    return {
        instances,
        requestPermission,
        setPermission: (nextPermission: NotificationPermission) => {
            permission = nextPermission;
        },
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
        expect(
            parseHornPreferences(
                JSON.stringify({
                    ...savedPreferences(),
                    browserNotificationsEnabled: "yes",
                })
            )
        ).toEqual(defaultHornPreferences());
    });

    it("migrates preferences saved before browser notifications", () => {
        const legacyPreferences = {
            selectedServer: "울프",
            alertKeywords: ["거래"],
            soundEnabled: false,
        };

        expect(parseHornPreferences(JSON.stringify(legacyPreferences))).toEqual(
            savedPreferences()
        );
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
        window.history.replaceState(null, "", "/");
        if (originalNotificationDescriptor) {
            Object.defineProperty(
                globalThis,
                "Notification",
                originalNotificationDescriptor
            );
        } else {
            Reflect.deleteProperty(globalThis, "Notification");
        }
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

    it("requests notification permission only from the enable action", async () => {
        const user = userEvent.setup();
        const { requestPermission } = installNotification("default", "granted");
        global.fetch = jest
            .fn()
            .mockResolvedValue(hornResponse([message("초기", "메시지")]));
        render(<HornPage />);
        expect(await screen.findByText("메시지")).toBeVisible();
        expect(requestPermission).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "알림" }));
        expect(requestPermission).not.toHaveBeenCalled();
        expect(
            screen.getByText("브라우저 알림 권한을 아직 요청하지 않았습니다.")
        ).toBeVisible();
        await user.click(
            screen.getByRole("button", { name: "브라우저 알림 켜기" })
        );

        expect(requestPermission).toHaveBeenCalledTimes(1);
        expect(
            screen.getByText("브라우저 알림이 켜져 있습니다.")
        ).toBeVisible();
        await waitFor(() =>
            expect(
                JSON.parse(localStorage.getItem(HORN_PREFERENCES_KEY)!)
                    .browserNotificationsEnabled
            ).toBe(true)
        );
    });

    it("disables the notification action while permission is pending", async () => {
        const user = userEvent.setup();
        const permissionRequest = deferred<NotificationPermission>();
        const { requestPermission, setPermission } =
            installNotification("default");
        requestPermission.mockReturnValueOnce(permissionRequest.promise);
        global.fetch = jest
            .fn()
            .mockResolvedValue(hornResponse([message("초기", "메시지")]));
        render(<HornPage />);
        expect(await screen.findByText("메시지")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "알림" }));

        await user.click(
            screen.getByRole("button", { name: "브라우저 알림 켜기" })
        );
        expect(
            screen.getByRole("button", { name: "권한 요청 중..." })
        ).toBeDisabled();
        await act(async () => {
            setPermission("granted");
            permissionRequest.resolve("granted");
            await permissionRequest.promise;
        });

        expect(
            screen.getByRole("button", { name: "브라우저 알림 끄기" })
        ).toBeEnabled();
    });

    it("shows an error when requesting notification permission fails", async () => {
        const user = userEvent.setup();
        const { requestPermission } = installNotification("default");
        requestPermission.mockRejectedValueOnce(new Error("blocked"));
        global.fetch = jest
            .fn()
            .mockResolvedValue(hornResponse([message("초기", "메시지")]));
        render(<HornPage />);
        expect(await screen.findByText("메시지")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "알림" }));

        await user.click(
            screen.getByRole("button", { name: "브라우저 알림 켜기" })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "브라우저 알림 권한을 요청하지 못했습니다."
        );
        expect(
            screen.getByRole("button", { name: "브라우저 알림 켜기" })
        ).toBeEnabled();
    });

    it("notifies each new matching message once", async () => {
        const user = userEvent.setup();
        const { instances } = installNotification("granted");
        const focus = jest.spyOn(window, "focus").mockImplementation();
        localStorage.setItem(
            HORN_PREFERENCES_KEY,
            JSON.stringify(
                savedPreferences({
                    alertKeywords: ["거래", "메시지"],
                    browserNotificationsEnabled: true,
                })
            )
        );
        const existing = message("기존", "거래 메시지", "2026-01-01T00:00:00Z");
        const matching = message("신규", "거래 메시지", "2026-01-01T00:01:00Z");
        const nonMatching = message(
            "무관",
            "일반 안내",
            "2026-01-01T00:02:00Z"
        );
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce(hornResponse([existing]))
            .mockResolvedValue(hornResponse([matching, nonMatching, existing]));
        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        await user.click(screen.getByRole("button", { name: "검색" }));
        await waitFor(() => expect(instances).toHaveLength(1));
        expect(instances[0]).toMatchObject({
            title: "울프 · 신규",
            options: { body: "거래 메시지" },
        });
        expect(mockPlay).not.toHaveBeenCalled();
        await user.click(screen.getByRole("button", { name: "검색" }));
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
        expect(instances).toHaveLength(1);

        instances[0].onclick?.();
        expect(instances[0].close).toHaveBeenCalledTimes(1);
        expect(window.location.pathname).toBe("/horn");
        expect(focus).toHaveBeenCalledTimes(1);
    });

    it("keeps sound alerts active while browser notifications are off", async () => {
        const user = userEvent.setup();
        const { instances } = installNotification("granted");
        localStorage.setItem(
            HORN_PREFERENCES_KEY,
            JSON.stringify(savedPreferences({ soundEnabled: true }))
        );
        const existing = message("기존", "거래", "2026-01-01T00:00:00Z");
        const matching = message("신규", "거래", "2026-01-01T00:01:00Z");
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce(hornResponse([existing]))
            .mockResolvedValueOnce(hornResponse([matching, existing]));
        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        await user.click(screen.getByRole("button", { name: "검색" }));
        await waitFor(() => expect(mockPlay).toHaveBeenCalledTimes(1));
        expect(instances).toHaveLength(0);
    });

    it("disables failed browser delivery without interrupting horn results", async () => {
        const user = userEvent.setup();
        installNotification("granted", "granted", true);
        localStorage.setItem(
            HORN_PREFERENCES_KEY,
            JSON.stringify(
                savedPreferences({ browserNotificationsEnabled: true })
            )
        );
        const matching = message("신규", "거래", "2026-01-01T00:01:00Z");
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce(hornResponse([]))
            .mockResolvedValueOnce(hornResponse([matching]));
        render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        await user.click(screen.getByRole("button", { name: "검색" }));
        expect(await screen.findByText("거래", { exact: true })).toBeVisible();
        await user.click(screen.getByRole("button", { name: "알림" }));
        expect(screen.getByRole("alert")).toHaveTextContent(
            "브라우저에서 시스템 알림을 표시하지 못했습니다."
        );
        await waitFor(() =>
            expect(
                JSON.parse(localStorage.getItem(HORN_PREFERENCES_KEY)!)
                    .browserNotificationsEnabled
            ).toBe(false)
        );
    });

    it("shows denied and unsupported notification states without blocking keywords", async () => {
        const user = userEvent.setup();
        installNotification("default", "denied");
        global.fetch = jest.fn().mockResolvedValue(hornResponse([]));
        const view = render(<HornPage />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await user.click(screen.getByRole("button", { name: "알림" }));
        await user.click(
            screen.getByRole("button", { name: "브라우저 알림 켜기" })
        );
        expect(
            screen.getByText(
                "브라우저 또는 기기 설정에서 Erinn.me 알림 권한을 허용해 주세요."
            )
        ).toBeVisible();
        await user.type(screen.getByPlaceholderText("알림 키워드"), "거래");
        await user.click(screen.getByRole("button", { name: "추가" }));
        expect(screen.getByText("거래", { exact: true })).toBeVisible();

        view.unmount();
        Reflect.deleteProperty(globalThis, "Notification");
        render(<HornPage />);
        await user.click(screen.getByRole("button", { name: "알림" }));
        expect(
            screen.getByText(
                "이 브라우저에서는 브라우저 알림을 사용할 수 없습니다."
            )
        ).toBeVisible();
    });

    it("resets the alert cutoff before changing servers", async () => {
        const user = userEvent.setup();
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
            .mockResolvedValueOnce(
                hornResponse([message("기준", "일반", "2026-08-23T00:00:00Z")])
            )
            .mockResolvedValueOnce(
                hornResponse([
                    message("테스터", "거래", "2026-08-23T00:01:00Z"),
                ])
            );
        render(<HornPage />);
        expect(await screen.findByText("기준")).toBeVisible();

        await user.click(screen.getByRole("button", { name: "류트" }));
        await user.click(screen.getByText("울프", { selector: "a" }));
        expect(await screen.findByText("테스터")).toBeVisible();

        expect(mockPlay).not.toHaveBeenCalled();
    });

    it("keeps a stale server response from consuming the new alert baseline", async () => {
        const user = userEvent.setup();
        const { instances } = installNotification("granted");
        const oldRequest = deferred<Response>();
        const newRequest = deferred<Response>();
        localStorage.setItem(
            HORN_PREFERENCES_KEY,
            JSON.stringify(
                savedPreferences({
                    selectedServer: "류트",
                    soundEnabled: true,
                    browserNotificationsEnabled: true,
                })
            )
        );
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
            oldRequest.resolve(
                hornResponse([message("이전", "거래", "2026-08-23T00:00:00Z")])
            );
            await oldRequest.promise;
        });
        await act(async () => {
            newRequest.resolve(
                hornResponse([message("현재", "거래", "2026-08-23T00:01:00Z")])
            );
            await newRequest.promise;
        });

        expect(await screen.findByText("현재")).toBeVisible();
        expect(screen.queryByText("이전")).not.toBeInTheDocument();
        expect(instances).toHaveLength(0);
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
