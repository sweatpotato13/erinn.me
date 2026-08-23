"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSound from "use-sound";

import {
    defaultHornPreferences,
    HORN_SERVERS,
    type HornServer,
    loadHornPreferences,
    saveHornPreferences,
} from "@/app/horn/horn-preferences";
import type { HornResponse } from "@/lib/schemas/nexon";

const SOUND_PATH = "/sounds/money-drop.mp3";
type HornMessage = HornResponse["horn_bugle_world_history"][number];

/**
 * Displays and searches horn messages for the selected server, with configurable keyword alerts.
 */
export default function HornPage() {
    const [play] = useSound(SOUND_PATH);
    const defaults = defaultHornPreferences();
    const [selectedServer, setSelectedServer] = useState<HornServer>(
        defaults.selectedServer
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [searchNickname, setSearchNickname] = useState("");
    const [messagesData, setMessagesData] = useState<HornMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [aleryKeyword, setAleryKeyword] = useState("");
    const [alertKeywords, setAlertKeywords] = useState<string[]>(
        defaults.alertKeywords
    );
    const [soundEnabled, setSoundEnabled] = useState(defaults.soundEnabled);
    const [preferencesReady, setPreferencesReady] = useState(false);
    const [isAlertKeyaordPopupVisible, setIsAlertKeyaordPopupVisible] =
        useState(false);
    const selectedServerRef = useRef(selectedServer);
    const alertKeywordsRef = useRef(alertKeywords);
    const soundEnabledRef = useRef(soundEnabled);
    const lastAlertTimeRef = useRef("");
    const playRef = useRef(play);
    const requestSequenceRef = useRef(0);
    const activeControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        playRef.current = play;
    }, [play]);

    useEffect(() => {
        const preferences = loadHornPreferences();
        const now = new Date().toISOString();
        selectedServerRef.current = preferences.selectedServer;
        alertKeywordsRef.current = preferences.alertKeywords;
        soundEnabledRef.current = preferences.soundEnabled;
        lastAlertTimeRef.current = now;
        setSelectedServer(preferences.selectedServer);
        setAlertKeywords(preferences.alertKeywords);
        setSoundEnabled(preferences.soundEnabled);
        setPreferencesReady(true);
    }, []);

    useEffect(() => {
        if (!preferencesReady) return;
        saveHornPreferences({ selectedServer, alertKeywords, soundEnabled });
    }, [alertKeywords, preferencesReady, selectedServer, soundEnabled]);

    const checkAlertKeywords = useCallback((messages: HornMessage[]) => {
        if (!soundEnabledRef.current || alertKeywordsRef.current.length === 0)
            return;
        const hasMatch = messages.some(
            message =>
                new Date(message.date_send) >=
                    new Date(lastAlertTimeRef.current) &&
                alertKeywordsRef.current.some(keyword =>
                    message.message.includes(keyword)
                )
        );
        if (!hasMatch) return;
        lastAlertTimeRef.current = new Date().toISOString();
        playRef.current();
    }, []);

    const fetchMessages = useCallback(async () => {
        const sequence = ++requestSequenceRef.current;
        activeControllerRef.current?.abort();
        const controller = new AbortController();
        activeControllerRef.current = controller;
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/horn?${new URLSearchParams({ server_name: selectedServerRef.current })}`,
                {
                    signal: controller.signal,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("메시지를 가져오는 데 실패했습니다.");
            }

            const data = (await response.json()) as HornResponse;
            if (sequence !== requestSequenceRef.current) return;
            setMessagesData(data.horn_bugle_world_history);
            checkAlertKeywords(data.horn_bugle_world_history);
        } catch (error) {
            if (
                controller.signal.aborted ||
                sequence !== requestSequenceRef.current
            )
                return;
            setError(
                error instanceof Error
                    ? error.message
                    : "메시지를 가져오는 데 실패했습니다."
            );
        } finally {
            if (sequence === requestSequenceRef.current) {
                activeControllerRef.current = null;
                setLoading(false);
            }
        }
    }, [checkAlertKeywords]);

    useEffect(() => {
        if (!preferencesReady) return;
        void fetchMessages();
        const interval = setInterval(() => void fetchMessages(), 60000);
        return () => {
            clearInterval(interval);
            requestSequenceRef.current += 1;
            activeControllerRef.current?.abort();
        };
    }, [fetchMessages, preferencesReady, selectedServer]);

    function handleSearch() {
        void fetchMessages();
    }

    function selectServer(server: HornServer) {
        selectedServerRef.current = server;
        lastAlertTimeRef.current = new Date().toISOString();
        setSelectedServer(server);
    }

    function removeKeyword(index: number) {
        const nextKeywords = alertKeywords.filter((_, i) => i !== index);
        alertKeywordsRef.current = nextKeywords;
        setAlertKeywords(nextKeywords);
    }

    function handleAddKeyword() {
        const keyword = aleryKeyword.trim();
        if (!keyword) return;
        const nextKeywords = [...alertKeywords, keyword];
        alertKeywordsRef.current = nextKeywords;
        setAlertKeywords(nextKeywords);
        setAleryKeyword("");
    }

    function toggleSound(enabled: boolean) {
        soundEnabledRef.current = enabled;
        if (enabled) lastAlertTimeRef.current = new Date().toISOString();
        setSoundEnabled(enabled);
    }

    return (
        <div className="flex flex-col items-center justify-start h-[70vh] p-6">
            <div className="w-full max-w-4xl p-6 shadow-lg rounded-lg">
                <h2 className="text-xl font-bold mb-4">메시지 목록</h2>
                <div className="flex mb-4 flex-col sm:flex-row gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                        <div className="dropdown">
                            <div
                                tabIndex={0}
                                role="button"
                                className="btn m-1 whitespace-nowrap"
                            >
                                {selectedServer}
                            </div>
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                            >
                                {HORN_SERVERS.map(server => (
                                    <li key={server}>
                                        <a onClick={() => selectServer(server)}>
                                            {server}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <input
                            className="input input-bordered w-full sm:w-48"
                            placeholder="닉네임"
                            value={searchNickname}
                            onChange={e => setSearchNickname(e.target.value)}
                        />
                        <input
                            className="input input-bordered w-full sm:w-48"
                            placeholder="키워드"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-end sm:ml-auto gap-2">
                        <button
                            className="btn btn-outline"
                            onClick={handleSearch}
                        >
                            검색
                        </button>
                        <div
                            className="tooltip tooltip-left"
                            data-tip="1분마다 알림 키워드가 포함된 뿔피리 메시지가 있다면 소리로 알립니다."
                        >
                            <button
                                className="btn btn-outline"
                                onClick={() =>
                                    setIsAlertKeyaordPopupVisible(true)
                                }
                            >
                                알림
                            </button>
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500">{error}</p>}
                {isAlertKeyaordPopupVisible && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white border p-4 rounded-lg shadow-lg w-80">
                            <h2 className="text-lg font-bold mb-3">
                                알림 키워드 목록
                            </h2>
                            <div className="flex items-center mb-3">
                                <input
                                    className="input input-bordered w-full"
                                    placeholder="알림 키워드"
                                    value={aleryKeyword}
                                    onChange={e =>
                                        setAleryKeyword(e.target.value)
                                    }
                                />
                                <button
                                    className="btn btn-outline ml-2"
                                    onClick={handleAddKeyword}
                                >
                                    추가
                                </button>
                            </div>
                            <label className="mb-3 flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={soundEnabled}
                                    onChange={event =>
                                        toggleSound(event.target.checked)
                                    }
                                />
                                소리 알림 사용
                            </label>
                            <p className="mb-3 text-sm text-base-content/70">
                                설정은 현재 브라우저와 기기에만 저장됩니다.
                            </p>
                            {alertKeywords.length === 0 ? (
                                <div>저장된 알림 키워드가 없습니다.</div>
                            ) : (
                                <ul className="list-disc ml-4">
                                    {alertKeywords.map((keyword, index) => (
                                        <li
                                            key={index}
                                            className="flex justify-between items-center"
                                        >
                                            <span>{keyword}</span>
                                            <button
                                                className="text-red-500 ml-4"
                                                onClick={() =>
                                                    removeKeyword(index)
                                                }
                                            >
                                                삭제
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button
                                className="btn btn-outline mt-4 w-full"
                                onClick={() =>
                                    setIsAlertKeyaordPopupVisible(false)
                                }
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-auto max-h-[400px]">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th className="text-left">캐릭터 이름</th>
                                <th className="text-left">메시지</th>
                                <th className="text-left">날짜</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="text-center">
                                        로딩 중...
                                    </td>
                                </tr>
                            ) : messagesData.length > 0 ? (
                                messagesData
                                    .filter((message: any) =>
                                        message.message.includes(searchTerm)
                                    )
                                    .filter((message: any) =>
                                        message.character_name.includes(
                                            searchNickname
                                        )
                                    )
                                    .map((message: any, index: any) => (
                                        <tr key={index}>
                                            <td className="p-2">
                                                {message.character_name}
                                            </td>
                                            <td className="p-2">
                                                {message.message}
                                            </td>
                                            <td className="p-2">
                                                {new Date(
                                                    message.date_send
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center">
                                        메시지가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
