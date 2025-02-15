"use client";

import { Swords } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import AuctionIcon from "../icons/auction-icon";
import DocumentIcon from "../icons/document-icon";
import HornIcon from "../icons/horn-icon";
import ShopIcon from "../icons/shop-icon";

function Topbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    function toggleMenu() {
        setIsMenuOpen(!isMenuOpen);
    }

    return (
        <header className="navbar bg-base-100 fixed top-0 left-0 w-full shadow-lg z-50">
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost normal-case text-xl">
                    Erinn.me
                </Link>
            </div>
            <div className="flex-none flex items-center space-x-2">
                <button
                    className="btn btn-square btn-ghost"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 transition-transform duration-300 ease-in-out transform rotate-0"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 transition-transform duration-300 ease-in-out transform"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {isMenuOpen && (
                <div className="absolute top-16 right-0 mt-2 w-48 rounded-lg shadow-lg bg-base-200 z-50">
                    <ul className="menu p-2">
                        <li className="flex space-x-2">
                            <div className="flex">
                                <ShopIcon className="h-5 w-5" />
                                <a href="/npc-shop" className="ml-2">
                                    NPC 상점 조회
                                </a>
                            </div>
                        </li>
                        <li className="flex space-x-2">
                            <div className="flex items-center">
                                <AuctionIcon className="h-5 w-5" />
                                <a href="/auction" className="ml-2">
                                    경매장
                                </a>
                            </div>
                        </li>
                        <li className="flex space-x-2">
                            <div className="flex items-center">
                                <HornIcon className="h-5 w-5" />
                                <a href="/horn" className="ml-2">
                                    뿔피리
                                </a>
                            </div>
                        </li>
                        <li className="flex space-x-2">
                            <div className="flex items-center">
                                <Swords className="h-5 w-5" />
                                <a href="/dungeon" className="ml-2">
                                    던전 드랍 아이템
                                </a>
                            </div>
                        </li>
                        <li className="flex space-x-2">
                            <div className="flex items-center">
                                <DocumentIcon className="h-5 w-5" />
                                <a href="/changelog" className="ml-2">
                                    업데이트 내역
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
}

export default Topbar;
