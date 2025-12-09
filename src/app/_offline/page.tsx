import { Wifi, WifiOff } from "lucide-react";

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-base-100 p-8">
            <div className="text-center">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <Wifi className="h-24 w-24 text-gray-300" />
                        <WifiOff className="absolute inset-0 h-24 w-24 text-error" />
                    </div>
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
