import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "업데이트 내역",
    description:
        "Erinn.me의 경매장, 뿔피리, NPC 상점 기능 변경 및 업데이트 내역을 확인하세요.",
    alternates: { canonical: "/changelog" },
};

export default function ChangelogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
