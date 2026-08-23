"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { HornServer } from "@/app/horn/horn-preferences";
import type { HornResponse } from "@/lib/schemas/nexon";

type HornMessage = HornResponse["horn_bugle_world_history"][number];
export type BrowserNotificationPermission =
    | NotificationPermission
    | "unsupported";

interface UseHornAlertsOptions {
    alertKeywords: string[];
    soundEnabled: boolean;
    browserNotificationsEnabled: boolean;
    play: () => void;
    setBrowserNotificationsEnabled: (enabled: boolean) => void;
}

function messageId(server: HornServer, message: HornMessage): string {
    return JSON.stringify([
        server,
        message.date_send,
        message.character_name,
        message.message,
    ]);
}

export function useHornAlerts({
    alertKeywords,
    soundEnabled,
    browserNotificationsEnabled,
    play,
    setBrowserNotificationsEnabled,
}: UseHornAlertsOptions) {
    const [notificationPermission, setNotificationPermission] =
        useState<BrowserNotificationPermission>("unsupported");
    const [notificationError, setNotificationError] = useState("");
    const permissionRef = useRef(notificationPermission);
    const seenMessagesRef = useRef(new Set<string>());
    const baselinePendingRef = useRef(true);
    const latestMessageTimeRef = useRef(Number.NEGATIVE_INFINITY);
    const keywordsRef = useRef(alertKeywords);
    const soundEnabledRef = useRef(soundEnabled);
    const browserNotificationsEnabledRef = useRef(browserNotificationsEnabled);
    const playRef = useRef(play);
    keywordsRef.current = alertKeywords;
    soundEnabledRef.current = soundEnabled;
    browserNotificationsEnabledRef.current = browserNotificationsEnabled;
    playRef.current = play;

    const refreshPermission = useCallback(() => {
        const permission =
            typeof window !== "undefined" && "Notification" in window
                ? Notification.permission
                : "unsupported";
        permissionRef.current = permission;
        setNotificationPermission(permission);
    }, []);

    useEffect(() => {
        refreshPermission();
        window.addEventListener("focus", refreshPermission);
        return () => window.removeEventListener("focus", refreshPermission);
    }, [refreshPermission]);

    const enableBrowserNotifications = useCallback(async () => {
        setNotificationError("");
        if (!("Notification" in window)) {
            refreshPermission();
            setBrowserNotificationsEnabled(false);
            return;
        }
        try {
            const permission =
                Notification.permission === "default"
                    ? await Notification.requestPermission()
                    : Notification.permission;
            permissionRef.current = permission;
            setNotificationPermission(permission);
            setBrowserNotificationsEnabled(permission === "granted");
        } catch {
            refreshPermission();
            setBrowserNotificationsEnabled(false);
        }
    }, [refreshPermission, setBrowserNotificationsEnabled]);

    const disableBrowserNotifications = useCallback(() => {
        setNotificationError("");
        setBrowserNotificationsEnabled(false);
    }, [setBrowserNotificationsEnabled]);

    const resetBaseline = useCallback(() => {
        baselinePendingRef.current = true;
        latestMessageTimeRef.current = Number.NEGATIVE_INFINITY;
    }, []);

    const processMessages = useCallback(
        (server: HornServer, messages: HornMessage[]) => {
            const entries = messages.map(message => ({
                id: messageId(server, message),
                message,
                time: Date.parse(message.date_send),
            }));
            const latestTime = Math.max(
                latestMessageTimeRef.current,
                ...entries.map(({ time }) =>
                    Number.isNaN(time) ? -Infinity : time
                )
            );
            if (baselinePendingRef.current) {
                entries.forEach(({ id }) => seenMessagesRef.current.add(id));
                latestMessageTimeRef.current = latestTime;
                baselinePendingRef.current = false;
                return;
            }

            const previousLatestTime = latestMessageTimeRef.current;
            const unseen = entries.filter(
                ({ id }) => !seenMessagesRef.current.has(id)
            );
            unseen.forEach(({ id }) => seenMessagesRef.current.add(id));
            latestMessageTimeRef.current = latestTime;
            const matches = unseen.filter(
                ({ message, time }) =>
                    !Number.isNaN(time) &&
                    time >= previousLatestTime &&
                    keywordsRef.current.some(keyword =>
                        message.message.includes(keyword)
                    )
            );
            if (matches.length === 0) return;
            if (soundEnabledRef.current) playRef.current();
            if (
                !browserNotificationsEnabledRef.current ||
                permissionRef.current !== "granted" ||
                !("Notification" in window)
            )
                return;

            for (const { message } of matches) {
                try {
                    const notification = new Notification(
                        `${server} · ${message.character_name}`,
                        { body: message.message }
                    );
                    notification.onclick = () => {
                        notification.close();
                        window.focus();
                    };
                } catch {
                    browserNotificationsEnabledRef.current = false;
                    setBrowserNotificationsEnabled(false);
                    setNotificationError(
                        "브라우저에서 시스템 알림을 표시하지 못했습니다. 브라우저 또는 기기 설정을 확인해 주세요."
                    );
                    break;
                }
            }
        },
        [setBrowserNotificationsEnabled]
    );

    return {
        notificationPermission,
        notificationError,
        enableBrowserNotifications,
        disableBrowserNotifications,
        processMessages,
        resetBaseline,
    };
}
