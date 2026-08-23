"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSound from "use-sound";

import {
    defaultHornPreferences,
    type HornServer,
    loadHornPreferences,
    saveHornPreferences,
} from "@/app/horn/horn-preferences";
import { useHornAlerts } from "@/app/horn/use-horn-alerts";
import type { HornResponse } from "@/lib/schemas/nexon";

const SOUND_PATH = "/sounds/money-drop.mp3";
export type HornMessage = HornResponse["horn_bugle_world_history"][number];

function useStoredHornPreferences() {
    const defaults = defaultHornPreferences();
    const [selectedServer, setSelectedServer] = useState<HornServer>(
        defaults.selectedServer
    );
    const [alertKeywords, setAlertKeywords] = useState(defaults.alertKeywords);
    const [soundEnabled, setSoundEnabled] = useState(defaults.soundEnabled);
    const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
        useState(defaults.browserNotificationsEnabled);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const preferences = loadHornPreferences();
        setSelectedServer(preferences.selectedServer);
        setAlertKeywords(preferences.alertKeywords);
        setSoundEnabled(preferences.soundEnabled);
        setBrowserNotificationsEnabled(preferences.browserNotificationsEnabled);
        setReady(true);
    }, []);
    useEffect(() => {
        if (!ready) return;
        saveHornPreferences({
            selectedServer,
            alertKeywords,
            soundEnabled,
            browserNotificationsEnabled,
        });
    }, [
        alertKeywords,
        browserNotificationsEnabled,
        ready,
        selectedServer,
        soundEnabled,
    ]);
    return {
        selectedServer,
        setSelectedServer,
        alertKeywords,
        setAlertKeywords,
        soundEnabled,
        setSoundEnabled,
        browserNotificationsEnabled,
        setBrowserNotificationsEnabled,
        ready,
    };
}

async function requestHornMessages(
    server: HornServer,
    signal: AbortSignal
): Promise<HornMessage[]> {
    const response = await fetch(
        `/api/horn?${new URLSearchParams({ server_name: server })}`,
        { signal, headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("메시지를 가져오는 데 실패했습니다.");
    const data = (await response.json()) as HornResponse;
    return data.horn_bugle_world_history;
}

function hornRequestError(caught: unknown): string {
    return caught instanceof Error
        ? caught.message
        : "메시지를 가져오는 데 실패했습니다.";
}

function isStaleRequest(
    sequence: number,
    latestSequence: number,
    aborted = false
): boolean {
    return aborted || sequence !== latestSequence;
}

function useHornRequestState(selectedServer: HornServer) {
    const request = useRef({
        server: selectedServer,
        sequence: 0,
        controller: null as AbortController | null,
    }).current;
    useEffect(() => {
        request.server = selectedServer;
    }, [request, selectedServer]);
    return request;
}

function useHornFetcher(
    selectedServer: HornServer,
    processMessages: (server: HornServer, messages: HornMessage[]) => void
) {
    const [messagesData, setMessagesData] = useState<HornMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const request = useHornRequestState(selectedServer);

    const fetchMessages = useCallback(async () => {
        const sequence = ++request.sequence;
        const server = request.server;
        request.controller?.abort();
        const controller = new AbortController();
        request.controller = controller;
        setLoading(true);
        setError("");
        try {
            const messages = await requestHornMessages(
                server,
                controller.signal
            );
            if (isStaleRequest(sequence, request.sequence)) return;
            setMessagesData(messages);
            processMessages(server, messages);
        } catch (caught) {
            if (
                !isStaleRequest(
                    sequence,
                    request.sequence,
                    controller.signal.aborted
                )
            )
                setError(hornRequestError(caught));
        } finally {
            if (!isStaleRequest(sequence, request.sequence)) {
                request.controller = null;
                setLoading(false);
            }
        }
    }, [processMessages, request]);
    return { messagesData, loading, error, fetchMessages, request };
}

function useHornMessages(
    ready: boolean,
    selectedServer: HornServer,
    setSelectedServer: (server: HornServer) => void,
    processMessages: (server: HornServer, messages: HornMessage[]) => void,
    resetBaseline: () => void
) {
    const fetcher = useHornFetcher(selectedServer, processMessages);
    useEffect(() => {
        if (!ready) return;
        void fetcher.fetchMessages();
        const interval = setInterval(() => void fetcher.fetchMessages(), 60000);
        return () => {
            clearInterval(interval);
            fetcher.request.sequence += 1;
            fetcher.request.controller?.abort();
        };
    }, [fetcher.fetchMessages, ready, selectedServer]);

    function selectServer(server: HornServer) {
        fetcher.request.sequence += 1;
        fetcher.request.controller?.abort();
        fetcher.request.controller = null;
        fetcher.request.server = server;
        resetBaseline();
        setSelectedServer(server);
    }
    return { ...fetcher, selectServer };
}

function useHornFilters(
    messagesData: HornMessage[],
    alertKeywords: string[],
    setAlertKeywords: (keywords: string[]) => void
) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchNickname, setSearchNickname] = useState("");
    const [alertKeyword, setAlertKeyword] = useState("");
    const [showAlertSettings, setShowAlertSettings] = useState(false);
    const messages = messagesData.filter(
        message =>
            message.message.includes(searchTerm) &&
            message.character_name.includes(searchNickname)
    );
    function addKeyword() {
        const keyword = alertKeyword.trim();
        if (!keyword) return;
        setAlertKeywords([...alertKeywords, keyword]);
        setAlertKeyword("");
    }
    function removeKeyword(index: number) {
        setAlertKeywords(
            alertKeywords.filter((_, itemIndex) => itemIndex !== index)
        );
    }
    return {
        searchTerm,
        setSearchTerm,
        searchNickname,
        setSearchNickname,
        alertKeyword,
        setAlertKeyword,
        showAlertSettings,
        setShowAlertSettings,
        messages,
        addKeyword,
        removeKeyword,
    };
}

export function useHornPage() {
    const [play] = useSound(SOUND_PATH);
    const preferences = useStoredHornPreferences();
    const alerts = useHornAlerts({
        alertKeywords: preferences.alertKeywords,
        soundEnabled: preferences.soundEnabled,
        browserNotificationsEnabled: preferences.browserNotificationsEnabled,
        play,
        setBrowserNotificationsEnabled:
            preferences.setBrowserNotificationsEnabled,
    });
    const hornMessages = useHornMessages(
        preferences.ready,
        preferences.selectedServer,
        preferences.setSelectedServer,
        alerts.processMessages,
        alerts.resetBaseline
    );
    const filters = useHornFilters(
        hornMessages.messagesData,
        preferences.alertKeywords,
        preferences.setAlertKeywords
    );
    return { ...preferences, ...alerts, ...hornMessages, ...filters };
}

export type HornPageController = ReturnType<typeof useHornPage>;
