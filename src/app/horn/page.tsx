"use client";

import { useState } from "react";

const messagesData = [
    {
        character_name: "캐릭터 A",
        message: "안녕하세요! 이곳은 에린허브입니다.",
        date_send: "2024-09-01T08:28:35Z",
    },
    {
        character_name: "캐릭터 B",
        message: "새로운 소식이 있습니다!",
        date_send: "2024-09-02T10:15:00Z",
    },
    {
        character_name: "캐릭터 C",
        message: "오늘도 즐거운 하루 되세요!",
        date_send: "2024-09-03T12:30:45Z",
    },
    {
        character_name: "캐릭터 C",
        message: "오늘도 즐거운 하루 되세요!",
        date_send: "2024-09-03T12:30:45Z",
    },
    {
        character_name: "캐릭터 C",
        message: "오늘도 즐거운 하루 되세요!",
        date_send: "2024-09-03T12:30:45Z",
    },
    {
        character_name: "캐릭터 C",
        message: "오늘도 즐거운 하루 되세요!",
        date_send: "2024-09-03T12:30:45Z",
    },
    {
        character_name: "캐릭터 C",
        message: "오늘도 즐거운 하루 되세요!",
        date_send: "2024-09-03T12:30:45Z",
    },
];

const servers = ["류트", "울프", "하프", "만돌린"];

export default function HornPage() {
    const [selectedServer, setSelectedServer] = useState(servers[0]);
    const [searchTerm, setSearchTerm] = useState("");

    // 필터링된 메시지
    const filteredMessages = messagesData.filter(message =>
        message.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <button className="btn btn-outline ml-2">검색</button>
                    </div>
                </div>
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
                            {filteredMessages.map((message, index) => (
                                <tr key={index}>
                                    <td className="p-2">
                                        {message.character_name}
                                    </td>
                                    <td className="p-2">{message.message}</td>
                                    <td className="p-2">
                                        {new Date(
                                            message.date_send
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
