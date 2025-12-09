"use client";

import { useEffect, useState } from "react";
import useSound from "use-sound";

const servers = ["류트", "울프", "하프", "만돌린"];
const SOUND_PATH = "/sounds/money-drop.mp3";

export default function HornPage() {
    const [play] = useSound(SOUND_PATH);

    const [selectedServer, setSelectedServer] = useState(servers[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchNickname, setSearchNickname] = useState("");
    const [messagesData, setMessagesData] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [aleryKeyword, setAleryKeyword] = useState("");
    const [alertKeywords, setAlertKeywords] = useState<{ keyword: string }[]>(
        []
    );
    const [isAlertKeyaordPopupVisible, setIsAlertKeyaordPopupVisible] =
        useState(false);
    const [lastAlertTime, setLastAlertTime] = useState(
        new Date().toISOString()
    );
    useEffect(() => {
        const interval = setInterval(() => {
            fetchMessages().catch(error => {
                console.error(error);
            });
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    async function fetchMessages() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `/api/horn?server_name=${selectedServer}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("메시지를 가져오는 데 실패했습니다.");
            }

            const data = await response.json();
            setMessagesData(data.horn_bugle_world_history);
            checkAlertKeywords(data.horn_bugle_world_history);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function checkAlertKeywords(
        messages: Array<{
            character_name: string;
            message: string;
            date_send: string;
        }>
    ) {
        if (alertKeywords.length === 0) {
            // Just skip if there is no alert keywords
            return;
        }

        const now = new Date().toISOString();

        for (const message of messages) {
            for (const keyword of alertKeywords) {
                if (new Date(message.date_send) < new Date(lastAlertTime)) {
                    // Skip if the message is older than the last alert time
                    continue;
                }
                if (message.message.includes(keyword.keyword)) {
                    play();
                    setLastAlertTime(now);
                    return;
                }
            }
        }
    }

    function handleSearch() {
        fetchMessages().catch(error => {
            console.error(error);
        });
    }

    function removeKeyword(index: number) {
        const newFavorites = alertKeywords.filter((_, i) => i !== index);
        setAlertKeywords(newFavorites);
    }

    function handleAddKeyword() {
        if (aleryKeyword.trim() === "") {
            return;
        }

        setAlertKeywords([...alertKeywords, { keyword: aleryKeyword }]);
        setAleryKeyword("");
    }

    return (
        <div className="flex flex-col items-center justify-start h-[70vh] p-6">
            <div className="w-full max-w-4xl p-6 shadow-lg rounded-lg">
                <h2 className="text-xl font-bold mb-4">메시지 목록</h2>
                <div className="flex mb-4 flex-col sm:flex-row gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                        <div className="dropdown">
                            <div tabIndex={0} role="button" className="btn m-1">
                                {selectedServer}
                            </div>
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                            >
                                {servers.map(server => (
                                    <li key={server}>
                                        <a
                                            onClick={() =>
                                                setSelectedServer(server)
                                            }
                                        >
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
                            {alertKeywords.length === 0 ? (
                                <div>저장된 알림 키워드가 없습니다.</div>
                            ) : (
                                <ul className="list-disc ml-4">
                                    {alertKeywords.map((elem, index) => (
                                        <li
                                            key={index}
                                            className="flex justify-between items-center"
                                        >
                                            <span>{elem.keyword}</span>
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
