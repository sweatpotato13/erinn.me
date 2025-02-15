import { ArrowLeftRightIcon, Swords } from "lucide-react";
import Link from "next/link";

import AuctionIcon from "@/components/icons/auction-icon";
import DocumentIcon from "@/components/icons/document-icon";
import HornIcon from "@/components/icons/horn-icon";
import ShopIcon from "@/components/icons/shop-icon";

interface NavigationCardProps {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

function NavigationCard({
    href,
    title,
    description,
    icon,
}: NavigationCardProps) {
    return (
        <Link
            href={href}
            className="group relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 group-hover:bg-slate-100">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
            </div>
        </Link>
    );
}

export default function Page() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <NavigationCard
                    href="/auction"
                    title="경매장"
                    description="실시간 경매장 아이템 가격을 확인하세요"
                    icon={<AuctionIcon className="h-6 w-6 text-slate-600" />}
                />
                <NavigationCard
                    href="/dungeon"
                    title="던전 아이템"
                    description="던전별 드롭 아이템과 가격을 확인하세요"
                    icon={<Swords className="h-6 w-6 text-slate-600" />}
                />
                <NavigationCard
                    href="/horn"
                    title="뿔피리 조회"
                    description="뿔피리 내역을 조회하세요"
                    icon={<HornIcon className="h-6 w-6 text-slate-600" />}
                />
                <NavigationCard
                    href="/npc-shop"
                    title="NPC 상점"
                    description="NPC 상점 아이템 정보를 확인하세요"
                    icon={<ShopIcon className="h-6 w-6 text-slate-600" />}
                />
                <NavigationCard
                    href="/changelog"
                    title="변경 이력"
                    description="사이트의 변경 사항을 확인하세요"
                    icon={
                        <ArrowLeftRightIcon className="h-6 w-6 text-slate-600" />
                    }
                />
                <NavigationCard
                    href="/contact"
                    title="문의하기"
                    description="문의사항이나 피드백을 보내주세요"
                    icon={<DocumentIcon className="h-6 w-6 text-slate-600" />}
                />
            </div>
        </div>
    );
}
