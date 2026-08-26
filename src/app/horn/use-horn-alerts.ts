"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { HornServer } from "@/app/horn/horn-preferences";
import type { HornResponse } from "@/lib/schemas/nexon";

type HornMessage = HornResponse["horn_bugle_world_history"][number];
export type BrowserNotificationPermission =
    NotificationPermission | "unsupported";

interface UseHornAlertsOptions {
    alertKeywords: string[];
    soundEnabled: boolean;
    browserNotificationsEnabled: boolean;
    play: () => void;
    setBrowserNotificationsEnabled: (enabled: boolean) => void;
}

export interface UseHornAlertsResult {
    notificationPermission: BrowserNotificationPermission;
    notificationError: string;
    enableBrowserNotifications: () => Promise<void>;
    disableBrowserNotifications: () => void;
    processMessages: (server: HornServer, messages: HornMessage[]) => void;
    resetBaseline: () => void;
}

interface AlertEntry {
    id: string;
    message: HornMessage;
    time: number;
}

interface AlertHistory {
    baselinePending: boolean;
    latestTime: number;
    seenMessageTimes: Map<string, number>;
}

const REQUEST_PERMISSION_ERROR =
    "브라우저 알림 권한을 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const DISPLAY_NOTIFICATION_ERROR =
    "브라우저에서 시스템 알림을 표시하지 못했습니다. 브라우저 또는 기기 설정을 확인해 주세요.";

function currentPermission(): BrowserNotificationPermission {
    return typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "unsupported";
}

async function requestPermission(): Promise<BrowserNotificationPermission> {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission === "default"
        ? Notification.requestPermission()
        : Notification.permission;
}

function usePermissionRefresh(
    updatePermission: (permission: BrowserNotificationPermission) => void
): () => void {
    const refreshPermission = useCallback(
        () => updatePermission(currentPermission()),
        [updatePermission]
    );
    useEffect(() => {
        refreshPermission();
        window.addEventListener("focus", refreshPermission);
        return () => window.removeEventListener("focus", refreshPermission);
    }, [refreshPermission]);
    return refreshPermission;
}

function useNotificationPermission(
    setBrowserNotificationsEnabled: (enabled: boolean) => void
) {
    const [notificationPermission, setNotificationPermission] =
        useState<BrowserNotificationPermission>("unsupported");
    const [notificationError, setNotificationError] = useState("");
    const permissionRef = useRef(notificationPermission);
    const updatePermission = useCallback(
        (permission: BrowserNotificationPermission) => {
            permissionRef.current = permission;
            setNotificationPermission(permission);
        },
        []
    );
    const refreshPermission = usePermissionRefresh(updatePermission);

    const enable = useCallback(async () => {
        setNotificationError("");
        try {
            const permission = await requestPermission();
            updatePermission(permission);
            setBrowserNotificationsEnabled(permission === "granted");
        } catch {
            refreshPermission();
            setBrowserNotificationsEnabled(false);
            setNotificationError(REQUEST_PERMISSION_ERROR);
        }
    }, [refreshPermission, setBrowserNotificationsEnabled, updatePermission]);
    const disable = useCallback(() => {
        setNotificationError("");
        setBrowserNotificationsEnabled(false);
    }, [setBrowserNotificationsEnabled]);

    return {
        notificationPermission,
        notificationError,
        permissionRef,
        setNotificationError,
        enable,
        disable,
    };
}

function createAlertHistory(): AlertHistory {
    return {
        baselinePending: true,
        latestTime: Number.NEGATIVE_INFINITY,
        seenMessageTimes: new Map(),
    };
}

function alertEntry(server: HornServer, message: HornMessage): AlertEntry {
    return {
        id: JSON.stringify([
            server,
            message.date_send,
            message.character_name,
            message.message,
        ]),
        message,
        time: Date.parse(message.date_send),
    };
}

function retainLatestIds(history: AlertHistory): void {
    history.seenMessageTimes.forEach((time, id) => {
        if (time < history.latestTime) history.seenMessageTimes.delete(id);
    });
}

function findNewMatches(
    history: AlertHistory,
    server: HornServer,
    messages: HornMessage[],
    keywords: string[]
): HornMessage[] {
    const entries = messages
        .map(message => alertEntry(server, message))
        .filter(({ time }) => !Number.isNaN(time));
    const latestTime = Math.max(
        history.latestTime,
        ...entries.map(({ time }) => time)
    );
    if (history.baselinePending) {
        entries.forEach(({ id, time }) =>
            history.seenMessageTimes.set(id, time)
        );
        history.latestTime = latestTime;
        history.baselinePending = false;
        retainLatestIds(history);
        return [];
    }

    const unseen = entries.filter(
        ({ id }) => !history.seenMessageTimes.has(id)
    );
    unseen.forEach(({ id, time }) => history.seenMessageTimes.set(id, time));
    const matches = unseen.filter(
        ({ message, time }) =>
            time >= history.latestTime &&
            keywords.some(keyword => message.message.includes(keyword))
    );
    history.latestTime = latestTime;
    retainLatestIds(history);
    return matches.map(({ message }) => message);
}

function displayNotifications(
    server: HornServer,
    messages: HornMessage[],
    navigateToHorn: () => void
): boolean {
    for (const message of messages) {
        try {
            const notification = new Notification(
                `${server} · ${message.character_name}`,
                { body: message.message }
            );
            notification.onclick = () => {
                notification.close();
                navigateToHorn();
                window.focus();
            };
        } catch {
            return false;
        }
    }
    return true;
}

function useAlertRefs(options: UseHornAlertsOptions) {
    const keywordsRef = useRef(options.alertKeywords);
    const soundEnabledRef = useRef(options.soundEnabled);
    const browserNotificationsEnabledRef = useRef(
        options.browserNotificationsEnabled
    );
    const playRef = useRef(options.play);
    useEffect(() => {
        keywordsRef.current = options.alertKeywords;
        soundEnabledRef.current = options.soundEnabled;
        browserNotificationsEnabledRef.current =
            options.browserNotificationsEnabled;
        playRef.current = options.play;
    }, [
        options.alertKeywords,
        options.browserNotificationsEnabled,
        options.play,
        options.soundEnabled,
    ]);
    return {
        keywordsRef,
        soundEnabledRef,
        browserNotificationsEnabledRef,
        playRef,
    };
}

function useMessageProcessor(
    options: UseHornAlertsOptions,
    permission: ReturnType<typeof useNotificationPermission>
) {
    const router = useRouter();
    const navigate = useCallback(() => router.replace("/horn"), [router]);
    const { permissionRef, setNotificationError } = permission;
    const historyRef = useRef(createAlertHistory());
    const {
        keywordsRef,
        soundEnabledRef,
        browserNotificationsEnabledRef,
        playRef,
    } = useAlertRefs(options);

    const resetBaseline = useCallback(() => {
        historyRef.current = createAlertHistory();
    }, []);
    const processMessages = useCallback(
        (server: HornServer, messages: HornMessage[]) => {
            const matches = findNewMatches(
                historyRef.current,
                server,
                messages,
                keywordsRef.current
            );
            if (matches.length === 0) return;
            if (soundEnabledRef.current) playRef.current();
            if (
                !browserNotificationsEnabledRef.current ||
                permissionRef.current !== "granted" ||
                !("Notification" in window)
            )
                return;
            if (displayNotifications(server, matches, navigate)) return;

            browserNotificationsEnabledRef.current = false;
            options.setBrowserNotificationsEnabled(false);
            setNotificationError(DISPLAY_NOTIFICATION_ERROR);
        },
        [
            options.setBrowserNotificationsEnabled,
            navigate,
            permissionRef,
            setNotificationError,
        ]
    );
    return { processMessages, resetBaseline };
}

export function useHornAlerts(
    options: UseHornAlertsOptions
): UseHornAlertsResult {
    const permission = useNotificationPermission(
        options.setBrowserNotificationsEnabled
    );
    const processor = useMessageProcessor(options, permission);
    return {
        notificationPermission: permission.notificationPermission,
        notificationError: permission.notificationError,
        enableBrowserNotifications: permission.enable,
        disableBrowserNotifications: permission.disable,
        ...processor,
    };
}
