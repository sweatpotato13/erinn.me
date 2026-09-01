"use client";

import Link from "next/link";
import { useState } from "react";

import AuctionIcon from "../icons/auction-icon";
import HornIcon from "../icons/horn-icon";
import ShopIcon from "../icons/shop-icon";

const MENU_ITEMS = [
    { href: "/npc-shop", label: "NPC 상점 조회", Icon: ShopIcon },
    { href: "/auction", label: "경매장", Icon: AuctionIcon },
    { href: "/calculator", label: "파티 분배 계산기", Icon: AuctionIcon },
    { href: "/horn", label: "뿔피리", Icon: HornIcon },
];

function MenuIcon({ isOpen }: { isOpen: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6 transform transition-transform duration-300 ease-in-out"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                    isOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                }
            />
        </svg>
    );
}

function NavigationMenu({ onNavigate }: { onNavigate: () => void }) {
    return (
        <nav className="absolute top-[calc(4rem+env(safe-area-inset-top))] right-0 z-50 mt-2 w-48 rounded-lg bg-base-200 shadow-lg">
            <ul className="menu p-2">
                {MENU_ITEMS.map(({ href, label, Icon }) => (
                    <li key={href}>
                        <Link href={href} onClick={onNavigate}>
                            <Icon className="h-5 w-5" />
                            <span>{label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function Topbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="navbar fixed top-0 left-0 z-50 h-[calc(4rem+env(safe-area-inset-top))] w-full bg-base-100 pt-[env(safe-area-inset-top)] shadow-lg">
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost text-xl normal-case">
                    Erinn.me
                </Link>
            </div>
            <button
                className="btn btn-square btn-ghost"
                aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen(open => !open)}
            >
                <MenuIcon isOpen={isMenuOpen} />
            </button>
            {isMenuOpen && (
                <NavigationMenu onNavigate={() => setIsMenuOpen(false)} />
            )}
        </header>
    );
}

export default Topbar;
