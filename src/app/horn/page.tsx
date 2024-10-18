"use client";

import { useState } from "react";

const servers = ["류트", "울프", "하프", "만돌린"];

export default function HornPage() {
    const [selectedServer, setSelectedServer] = useState(servers[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [messagesData, setMessagesData] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchMessages = async () => {
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
            setMessagesData(data.horn_bugle_world_history); // API 응답 데이터를 상태에 저장
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 메시지를 검색하는 핸들러
    const handleSearch = () => {
        fetchMessages(); // 검색 버튼 클릭 시 메시지 fetch
    };

    return (
        <div className="flex flex-col items-center justify-start h-[70vh] p-6">
            <div className="w-full max-w-4xl p-6 shadow-lg rounded-lg">
                <h2 className="text-xl font-bold mb-4">메시지 목록</h2>
                <div className="flex mb-4 items-center">
                    <div className="dropdown mr-2">
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
                    <div className="ml-auto flex items-center">
                        <input
                            className="input input-bordered w-64"
                            placeholder="검색 키워드"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button
                            className="btn btn-outline ml-2"
                            onClick={handleSearch}
                        >
                            검색
                        </button>
                    </div>
                </div>

                {/* 에러 메시지 */}
                {error && <p className="text-red-500">{error}</p>}

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
                            {loading ? ( // 로딩 중일 때
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
