"use client";

import { useQueries } from "@tanstack/react-query";
import React from "react";

import { ItemCard } from "@/components/dungeon/item-card";
import { DUNGEON_INFO, DUNGEON_LIST, DungeonType } from "@/constant/dungeons";
import {
    getItemsByDungeon,
    getItemsByDungeonDifficulty,
} from "@/constant/dungeons-items";
import { getItemPrice } from "@/lib/api/auction";

type SortType = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export default function DungeonPage() {
    const [selectedDungeon, setSelectedDungeon] = React.useState<DungeonType>(
        DUNGEON_LIST[0]
    );
    const [selectedDifficulty, setSelectedDifficulty] = React.useState<
        string | null
    >(null);
    const [sortType, setSortType] = React.useState<SortType>("name-asc");

    // 선택된 던전과 난이도에 따라 아이템 목록 가져오기
    const items = React.useMemo(() => {
        if (selectedDifficulty) {
            return getItemsByDungeonDifficulty(
                selectedDungeon,
                selectedDifficulty
            );
        }
        return getItemsByDungeon(selectedDungeon);
    }, [selectedDungeon, selectedDifficulty]);

    // 모든 아이템의 가격 정보를 병렬로 가져오기
    const itemPriceQueries = useQueries({
        queries: items.map(item => ({
            queryKey: ["itemPrice", item.name],
            queryFn: () => getItemPrice(item.name),
        })),
    });

    // 아이템 정렬
    const sortedItems = React.useMemo(() => {
        const itemsWithPrice = items.map((item, index) => ({
            ...item,
            currentPrice: itemPriceQueries[index]?.data?.unitPrice || 0,
        }));

        return [...itemsWithPrice].sort((a, b) => {
            switch (sortType) {
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                case "price-asc":
                    return a.currentPrice - b.currentPrice;
                case "price-desc":
                    return b.currentPrice - a.currentPrice;
                default:
                    return 0;
            }
        });
    }, [items, itemPriceQueries, sortType]);

    // 현재 선택된 던전의 난이도 목록
    const difficulties = React.useMemo(() => {
        return DUNGEON_INFO[selectedDungeon].subDifficulties.map(
            diff => diff.name
        );
    }, [selectedDungeon]);

    return (
        <div className="container mx-auto px-4 py-6 lg:p-7">
            <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">
                던전 아이템 목록
            </h1>

            {/* 모바일용 던전 선택 */}
            <div className="block lg:hidden mb-6">
                <select
                    className="select select-bordered w-full"
                    value={selectedDungeon}
                    onChange={e => {
                        setSelectedDungeon(e.target.value as DungeonType);
                        setSelectedDifficulty(null);
                    }}
                >
                    {DUNGEON_LIST.map(dungeon => (
                        <option key={dungeon} value={dungeon}>
                            {dungeon}
                        </option>
                    ))}
                </select>
            </div>

            {/* 데스크톱용 던전 선택 탭 */}
            <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-2 mb-8">
                {DUNGEON_LIST.map(dungeon => (
                    <button
                        key={dungeon}
                        className={`btn btn-sm lg:btn-md justify-between ${
                            selectedDungeon === dungeon
                                ? "btn-primary"
                                : "btn-ghost"
                        }`}
                        onClick={() => {
                            setSelectedDungeon(dungeon);
                            setSelectedDifficulty(null);
                        }}
                    >
                        <span className="truncate">{dungeon}</span>
                    </button>
                ))}
            </div>

            {/* 던전 정보와 난이도 선택 */}
            <div className="card bg-base-200 mb-6 lg:mb-8">
                <div className="card-body p-4 lg:p-8">
                    <h2 className="card-title text-lg lg:text-xl">
                        {DUNGEON_INFO[selectedDungeon].name}
                    </h2>
                    <p className="text-sm lg:text-base mb-4">
                        {DUNGEON_INFO[selectedDungeon].description}
                    </p>

                    {/* 난이도 선택 */}
                    {difficulties.length > 0 && (
                        <div className="space-y-3 lg:space-y-4">
                            <h3 className="font-semibold text-sm lg:text-base">
                                난이도 선택
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className={`btn btn-sm lg:btn-md ${
                                        selectedDifficulty === null
                                            ? "btn-primary"
                                            : "btn-ghost"
                                    }`}
                                    onClick={() => setSelectedDifficulty(null)}
                                >
                                    전체
                                </button>
                                {difficulties.map(difficulty => (
                                    <button
                                        key={difficulty}
                                        className={`btn btn-sm lg:btn-md ${
                                            selectedDifficulty === difficulty
                                                ? "btn-primary"
                                                : "btn-ghost"
                                        }`}
                                        onClick={() =>
                                            setSelectedDifficulty(difficulty)
                                        }
                                    >
                                        {difficulty}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 아이템 목록 헤더 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="text-sm lg:text-base text-base-content/80">
                    총 {sortedItems.length}개의 아이템
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="join">
                        <button
                            className={`join-item btn btn-sm ${
                                sortType.startsWith("name")
                                    ? "btn-primary"
                                    : "btn-ghost"
                            }`}
                            onClick={() =>
                                setSortType(
                                    sortType === "name-asc"
                                        ? "name-desc"
                                        : "name-asc"
                                )
                            }
                        >
                            이름순
                            <span className="ml-1">
                                {sortType === "name-asc"
                                    ? "↑"
                                    : sortType === "name-desc"
                                      ? "↓"
                                      : ""}
                            </span>
                        </button>
                        <button
                            className={`join-item btn btn-sm ${
                                sortType.startsWith("price")
                                    ? "btn-primary"
                                    : "btn-ghost"
                            }`}
                            onClick={() =>
                                setSortType(
                                    sortType === "price-asc"
                                        ? "price-desc"
                                        : "price-asc"
                                )
                            }
                        >
                            가격순
                            <span className="ml-1">
                                {sortType === "price-asc"
                                    ? "↑"
                                    : sortType === "price-desc"
                                      ? "↓"
                                      : ""}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 아이템 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {sortedItems.map(item => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        selectedDungeon={selectedDungeon}
                        selectedDifficulty={selectedDifficulty}
                    />
                ))}
            </div>

            {/* 아이템이 없을 경우 */}
            {sortedItems.length === 0 && (
                <div className="alert alert-info text-sm lg:text-base">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-current shrink-0 w-5 h-5 lg:w-6 lg:h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                    </svg>
                    <span>선택한 던전의 아이템 정보가 없습니다.</span>
                </div>
            )}
        </div>
    );
}
