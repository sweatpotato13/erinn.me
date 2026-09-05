import type { Metadata } from "next";
import Link from "next/link";

import AuctionIcon from "@/components/icons/auction-icon";
import HornIcon from "@/components/icons/horn-icon";
import ShopIcon from "@/components/icons/shop-icon";
import {
    FEATURE_GROUPS,
    FEATURE_LINKS,
    SITE_DESCRIPTION,
} from "@/lib/feature-links";

export const metadata: Metadata = {
    alternates: { canonical: "/" },
};

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
            <h1 className="text-3xl font-bold text-slate-900">
                에린 생활 정보, 한곳에서
            </h1>
            <p className="mt-2 mb-8 text-slate-600">{SITE_DESCRIPTION}</p>
            {FEATURE_GROUPS.map(group => (
                <section key={group} className="mb-8" aria-label={group}>
                    <h2 className="mb-4 text-xl font-bold text-slate-900">
                        {group}
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURE_LINKS.filter(link => link.group === group).map(
                            link => (
                                <NavigationCard
                                    key={link.url}
                                    href={link.url}
                                    title={link.label}
                                    description={link.description}
                                    icon={
                                        link.url === "/horn" ? (
                                            <HornIcon className="h-6 w-6 text-slate-600" />
                                        ) : link.url === "/npc-shop" ? (
                                            <ShopIcon className="h-6 w-6 text-slate-600" />
                                        ) : (
                                            <AuctionIcon className="h-6 w-6 text-slate-600" />
                                        )
                                    }
                                />
                            )
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
}
