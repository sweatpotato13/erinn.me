import React from "react";

import { changelogData } from "@/constant/changelog";

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
