import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "마비노기 경매장 시세·옵션 검색",
    description:
        "마비노기 경매장 아이템의 현재 매물과 최근 거래가를 검색하고, 카테고리·세부 옵션·비교 기능으로 시세를 확인하세요.",
    alternates: { canonical: "/auction" },
};

export default function AuctionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
