"use client";

import React, { useEffect, useState } from "react";

import AuctionIcon from "../icons/auction-icon";
import HornIcon from "../icons/horn-icon";
import ShopIcon from "../icons/shop-icon";

function Topbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    function toggleMenu() {
        setIsMenuOpen(!isMenuOpen);
    }

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            setIsDarkMode(true);
        }
    }, []);

    function toggleDarkMode() {
        if (isDarkMode) {
            document.documentElement.setAttribute("data-theme", "light");
            localStorage.setItem("theme", "light");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
        }
        setIsDarkMode(!isDarkMode);
    }

    return (
        <header className="navbar bg-base-100 fixed top-0 left-0 w-full shadow-lg z-50">
            <div className="flex-1">
                <a className="btn btn-ghost normal-case text-xl">Erinn hub</a>
            </div>
            <div className="flex-none flex items-center space-x-2">
                <button
                    className="btn btn-square btn-ghost"
                    onClick={toggleMenu}
                >
                    {/* 햄버거와 X 아이콘을 상태에 따라 변경 */}
                    {isMenuOpen ? (
                        // X 아이콘
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

                <button
                    className="btn btn-square btn-ghost"
                    onClick={toggleDarkMode}
                >
                    {isDarkMode ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {isMenuOpen && (
                <div className="absolute top-16 right-0 mt-2 w-48 rounded-lg shadow-lg bg-base-200 z-50">
                    <ul className="menu p-2">
                        <li className="flex items-center space-x-2">
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
                    </ul>
                </div>
            )}
        </header>
    );
}

export default Topbar;
