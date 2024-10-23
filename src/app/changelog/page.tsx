"use client";

import React from "react";

const changelogData = [
    {
        date: "2024-10-22",
        changes: [
            { description: "업데이트 내역 페이지 추가" },
            {
                description:
                    "경매장 검색 에러시 아이템명 정확히 입력하라는 메시지 추가",
            },
        ],
    },
    {
        date: "2024-10-23",
        changes: [
            { description: "경매장 아이템 옵션 자세하게 볼 수 있도록 수정" },
        ],
    },
];

export default function ChangelogPage() {
    return (
        <div className="container mx-auto p-7">
            <h1 className="text-2xl font-bold mb-4">Changelog</h1>
            {changelogData.map((log, index) => (
                <div key={index} className="mb-6">
                    <h2 className="text-xl font-semibold">{log.date}</h2>
                    <ul className="list-disc list-inside mt-2">
                        {log.changes.map((change, idx) => (
                            <li key={idx} className="ml-4">
                                {change.description}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
