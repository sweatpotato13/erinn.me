"use client";

import { useEffect, useRef, useState } from "react";

import { HORN_SERVERS } from "@/app/horn/horn-preferences";
import type { BrowserNotificationPermission } from "@/app/horn/use-horn-alerts";
import {
    type HornMessage,
    type HornPageController,
    useHornPage,
} from "@/app/horn/use-horn-page";

interface HornControllerProps {
    horn: HornPageController;
}

function notificationStatus(
    permission: BrowserNotificationPermission,
    enabled: boolean
): string {
    if (permission === "unsupported")
        return "이 브라우저에서는 브라우저 알림을 사용할 수 없습니다.";
    if (permission === "denied")
        return "브라우저 또는 기기 설정에서 Erinn.me 알림 권한을 허용해 주세요.";
    if (permission === "default")
        return "브라우저 알림 권한을 아직 요청하지 않았습니다.";
    if (enabled) return "브라우저 알림이 켜져 있습니다.";
    return "브라우저 권한은 허용되어 있지만 Erinn.me 알림은 꺼져 있습니다.";
}

function NotificationAction({ horn }: HornControllerProps) {
    const [requesting, setRequesting] = useState(false);
    const canEnable =
        horn.notificationPermission === "default" ||
        (horn.notificationPermission === "granted" &&
            !horn.browserNotificationsEnabled);
    async function enable() {
        setRequesting(true);
        try {
            await horn.enableBrowserNotifications();
        } finally {
            setRequesting(false);
        }
    }
    if (canEnable)
        return (
            <button
                className="btn btn-outline btn-sm"
                disabled={requesting}
                onClick={() => void enable()}
            >
                {requesting ? "권한 요청 중..." : "브라우저 알림 켜기"}
            </button>
        );
    if (
        horn.notificationPermission !== "granted" ||
        !horn.browserNotificationsEnabled
    )
        return null;
    return (
        <button
            className="btn btn-outline btn-sm"
            onClick={horn.disableBrowserNotifications}
        >
            브라우저 알림 끄기
        </button>
    );
}

function BrowserNotificationControls({ horn }: HornControllerProps) {
    return (
        <div className="mb-3 border-t pt-3">
            <p className="text-sm">
                저장한 키워드와 일치하는 새 뿔피리를 시스템 알림으로 표시합니다.
            </p>
            <p className="mt-1 text-sm text-base-content/70">
                Erinn.me가 열려 있을 때만 최선을 다해 전달되며, 브라우저가
                백그라운드 탭을 제한하면 늦거나 누락될 수 있습니다.
            </p>
            <p className="my-2 text-sm" role="status" aria-live="polite">
                {notificationStatus(
                    horn.notificationPermission,
                    horn.browserNotificationsEnabled
                )}
            </p>
            {horn.notificationError && (
                <p className="mb-2 text-sm text-error" role="alert">
                    {horn.notificationError}
                </p>
            )}
            <NotificationAction horn={horn} />
        </div>
    );
}

function ServerSelector({ horn }: HornControllerProps) {
    return (
        <div className="dropdown">
            <div
                tabIndex={0}
                role="button"
                className="btn m-1 whitespace-nowrap"
            >
                {horn.selectedServer}
            </div>
            <ul
                tabIndex={0}
                role="menu"
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
                {HORN_SERVERS.map(server => (
                    <li key={server}>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => horn.selectServer(server)}
                        >
                            {server}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SearchFields({ horn }: HornControllerProps) {
    return (
        <div className="flex items-center gap-2">
            <ServerSelector horn={horn} />
            <input
                className="input input-bordered w-full sm:w-48"
                placeholder="닉네임"
                value={horn.searchNickname}
                onChange={event => horn.setSearchNickname(event.target.value)}
            />
            <input
                className="input input-bordered w-full sm:w-48"
                placeholder="키워드"
                value={horn.searchTerm}
                onChange={event => horn.setSearchTerm(event.target.value)}
            />
        </div>
    );
}

function SearchActions({ horn }: HornControllerProps) {
    return (
        <div className="flex items-center justify-end gap-2 sm:ml-auto">
            <button
                className="btn btn-outline"
                onClick={() => void horn.fetchMessages()}
            >
                검색
            </button>
            <div
                className="tooltip tooltip-left"
                data-tip="알림 키워드와 소리·브라우저 알림을 설정합니다."
            >
                <button
                    className="btn btn-outline"
                    onClick={() => horn.setShowAlertSettings(true)}
                >
                    알림
                </button>
            </div>
        </div>
    );
}

function HornSearchControls({ horn }: HornControllerProps) {
    return (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-0">
            <SearchFields horn={horn} />
            <SearchActions horn={horn} />
        </div>
    );
}

function KeywordEditor({ horn }: HornControllerProps) {
    return (
        <div className="mb-3 flex items-center">
            <input
                className="input input-bordered w-full"
                placeholder="알림 키워드"
                value={horn.alertKeyword}
                onChange={event => horn.setAlertKeyword(event.target.value)}
            />
            <button className="btn btn-outline ml-2" onClick={horn.addKeyword}>
                추가
            </button>
        </div>
    );
}

function KeywordList({ horn }: HornControllerProps) {
    if (horn.alertKeywords.length === 0)
        return <div>저장된 알림 키워드가 없습니다.</div>;
    return (
        <ul className="ml-4 list-disc">
            {horn.alertKeywords.map((keyword, index) => (
                <li key={index} className="flex items-center justify-between">
                    <span>{keyword}</span>
                    <button
                        className="ml-4 text-red-500"
                        onClick={() => horn.removeKeyword(index)}
                    >
                        삭제
                    </button>
                </li>
            ))}
        </ul>
    );
}

function AlertSettingsPanel({ horn }: HornControllerProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (horn.showAlertSettings && !dialog.open) dialog.showModal();
        if (!horn.showAlertSettings && dialog.open) dialog.close();
    }, [horn.showAlertSettings]);
    return (
        <dialog
            ref={dialogRef}
            className="m-auto max-h-[80vh] w-80 overflow-y-auto rounded-lg border bg-white p-4 shadow-lg backdrop:bg-black/20"
            aria-labelledby="horn-alert-settings-title"
            onCancel={() => horn.setShowAlertSettings(false)}
            onClose={() => horn.setShowAlertSettings(false)}
        >
            <h2
                id="horn-alert-settings-title"
                className="mb-3 text-lg font-bold"
            >
                알림 키워드 목록
            </h2>
            <KeywordEditor horn={horn} />
            <label className="mb-3 flex cursor-pointer items-center gap-2">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={horn.soundEnabled}
                    onChange={event =>
                        horn.setSoundEnabled(event.target.checked)
                    }
                />
                소리 알림 사용
            </label>
            <BrowserNotificationControls horn={horn} />
            <p className="mb-3 text-sm text-base-content/70">
                설정은 현재 브라우저와 기기에만 저장됩니다.
            </p>
            <KeywordList horn={horn} />
            <button
                type="button"
                className="btn btn-outline mt-4 w-full"
                onClick={() => dialogRef.current?.close()}
            >
                닫기
            </button>
        </dialog>
    );
}

function MessageRows({
    loading,
    messages,
}: {
    loading: boolean;
    messages: HornMessage[];
}) {
    if (loading)
        return (
            <tr>
                <td colSpan={3} className="text-center">
                    로딩 중...
                </td>
            </tr>
        );
    if (messages.length === 0)
        return (
            <tr>
                <td colSpan={3} className="text-center">
                    메시지가 없습니다.
                </td>
            </tr>
        );
    return messages.map((message, index) => (
        <tr key={index}>
            <td className="p-2">{message.character_name}</td>
            <td className="p-2">{message.message}</td>
            <td className="p-2">
                {new Date(message.date_send).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                })}
            </td>
        </tr>
    ));
}

function HornMessageTable({ horn }: HornControllerProps) {
    return (
        <div className="max-h-[400px] overflow-auto">
            <table className="table w-full">
                <thead>
                    <tr>
                        <th className="text-left">캐릭터 이름</th>
                        <th className="text-left">메시지</th>
                        <th className="text-left">날짜</th>
                    </tr>
                </thead>
                <tbody>
                    <MessageRows
                        loading={horn.loading}
                        messages={horn.messages}
                    />
                </tbody>
            </table>
        </div>
    );
}

function HornView({ horn }: HornControllerProps) {
    return (
        <div className="flex h-[70vh] flex-col items-center justify-start p-6">
            <div className="w-full max-w-4xl rounded-lg p-6 shadow-lg">
                <h1 className="text-2xl font-bold">마비노기 뿔피리 조회</h1>
                <p className="mt-2 mb-6 text-base-content/70">
                    서버별 뿔피리 내역을 닉네임과 내용으로 검색하고, 원하면
                    저장한 키워드의 새 메시지 알림을 설정하세요.
                </p>
                <h2 className="mb-4 text-xl font-bold">메시지 목록</h2>
                <HornSearchControls horn={horn} />
                {horn.error && <p className="text-red-500">{horn.error}</p>}
                <AlertSettingsPanel horn={horn} />
                <HornMessageTable horn={horn} />
            </div>
        </div>
    );
}

/** Displays and searches horn messages with configurable keyword alerts. */
export default function HornPage() {
    return <HornView horn={useHornPage()} />;
}
