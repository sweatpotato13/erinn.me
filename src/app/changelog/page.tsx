"use client";

import React, { useMemo } from "react";

import { changelogData } from "@/constant/changelog";

export default function ChangelogPage() {
    const logsByYear = useMemo(() => {
        const years = changelogData.reduce<
            Record<string, typeof changelogData>
        >((acc, log) => {
            const year = log.date.split("-")[0];
            if (!acc[year]) acc[year] = [];
            acc[year].push(log);
            return acc;
        }, {});

        return Object.entries(years).sort(
            ([yearA], [yearB]) => Number(yearB) - Number(yearA)
        );
    }, []);

    return (
        <div className="container mx-auto p-7">
            <h1 className="text-3xl font-bold mb-6">업데이트 내역</h1>

            <div className="join join-vertical w-full">
                {logsByYear.map(([year, logs], index) => (
                    <div
                        key={year}
                        className="collapse collapse-arrow join-item border border-base-300"
                    >
                        <input
                            type="radio"
                            name="changelog-accordion"
                            defaultChecked={index === 0}
                        />
                        <div className="collapse-title text-xl font-medium">
                            {year}년 ({logs.length}개 업데이트)
                        </div>
                        <div className="collapse-content">
                            {logs.map((log, logIndex) => (
                                <div
                                    key={logIndex}
                                    className="mb-6 border-l-2 border-gray-200 pl-4"
                                >
                                    <h3 className="text-lg font-semibold">
                                        {log.date}
                                    </h3>
                                    <ul className="list-disc list-inside mt-2">
                                        {log.changes.map(
                                            (change, changeIndex) => (
                                                <li
                                                    key={changeIndex}
                                                    className="ml-4 mt-1"
                                                >
                                                    {change.description}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
