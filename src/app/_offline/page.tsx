"use client";

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-base-100 p-8">
            <div className="text-center">
                <div className="mb-8 flex justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-24 w-24"
                        aria-hidden="true"
                    >
                        <g className="text-gray-300" stroke="currentColor">
                            <path d="M12 20h.01" />
                            <path d="M2 8.82a15 15 0 0 1 20 0" />
                            <path d="M5 12.859a10 10 0 0 1 14 0" />
                            <path d="M8.5 16.429a5 5 0 0 1 7 0" />
                        </g>
                        <g className="text-error" stroke="currentColor">
                            <path d="M12 20h.01" />
                            <path d="M8.5 16.429a5 5 0 0 1 7 0" />
                            <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
                            <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
                            <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
                            <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
                            <path d="m2 2 20 20" />
                        </g>
                    </svg>
                </div>

                <h1 className="mb-4 text-4xl font-bold text-base-content">
                    오프라인 상태입니다
                </h1>

                <p className="mb-8 text-lg text-base-content/70">
                    인터넷 연결을 확인하고 다시 시도해주세요.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary btn-lg"
                    >
                        다시 시도
                    </button>

                    <div className="text-sm text-base-content/50">
                        <p>연결이 복구되면 자동으로 업데이트됩니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
