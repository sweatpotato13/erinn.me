import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "마비노기 뿔피리 조회·키워드 알림",
    description:
        "마비노기 서버별 거대한 외침의 뿔피리 내역을 닉네임과 내용으로 검색하고, 저장한 키워드의 새 메시지 알림을 설정하세요.",
    alternates: { canonical: "/horn" },
};

export default function HornLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
