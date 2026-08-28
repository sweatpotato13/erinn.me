import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "마비노기 NPC 상점 재고 조회",
    description:
        "마비노기 서버·채널·NPC를 선택해 NPC 상점의 판매 아이템과 가격 정보를 조회하세요.",
    alternates: { canonical: "/npc-shop" },
};

export default function NPCShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
