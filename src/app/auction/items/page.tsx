import type { Metadata } from "next";
import Link from "next/link";

import {
    getAuctionCatalogItems,
    getAuctionItemPath,
} from "@/lib/auction-item-catalog";

export const metadata: Metadata = {
    title: "마비노기 경매장 공개 아이템 시세 목록",
    description:
        "실제 경매 활동이 확인되어 안정적인 시세 페이지로 공개된 마비노기 아이템 목록입니다.",
    alternates: { canonical: "/auction/items" },
};

export default function AuctionItemsPage() {
    const items = getAuctionCatalogItems();
    return (
        <div className="mx-auto min-h-screen w-full max-w-5xl p-6">
            <h1 className="text-2xl font-bold">공개 아이템 시세 목록</h1>
            <p className="mt-2 text-base-content/70">
                현재 경매 활동을 확인한 검토 목록입니다. 인기 순위나 전체 아이템
                목록은 아닙니다.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(item => (
                    <li key={item.id}>
                        <Link
                            href={getAuctionItemPath(item)}
                            prefetch={false}
                            className="link link-hover block rounded border p-3"
                        >
                            {item.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
