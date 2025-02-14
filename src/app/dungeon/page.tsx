"use client";

import Image from "next/image";
import React from "react";

import {
    DUNGEON_INFO,
    DUNGEON_LIST,
    DungeonType,
    SubDifficulty,
} from "@/constant/dungeons";
import { getItemsByDungeon } from "@/constant/dungeons-items";

type SortType = "name-asc" | "name-desc" | "price-asc" | "price-desc";

type SortOption = {
    type: SortType;
    label: string;
    icon: string;
};

const SORT_OPTIONS: SortOption[] = [
    { type: "name-asc", label: "이름 오름차순", icon: "↑" },
    { type: "name-desc", label: "이름 내림차순", icon: "↓" },
    { type: "price-asc", label: "가격 낮은순", icon: "↑" },
    { type: "price-desc", label: "가격 높은순", icon: "↓" },
];

export default function DungeonPage() {
    const [selectedDungeon, setSelectedDungeon] = React.useState<DungeonType>(
        DUNGEON_LIST[0]
    );
    const [selectedSubDifficulty, setSelectedSubDifficulty] =
        React.useState<SubDifficulty | null>(
            DUNGEON_INFO[DUNGEON_LIST[0]].subDifficulties[0] || null
        );
    const items = getItemsByDungeon(selectedDungeon);
    const [sortType, setSortType] = React.useState<SortType>("name-asc");

    // 던전이 변경될 때 세부 난이도도 함께 변경
    React.useEffect(() => {
        setSelectedSubDifficulty(
            DUNGEON_INFO[selectedDungeon].subDifficulties[0] || null
        );
    }, [selectedDungeon]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            if (sortType === "name-asc") {
                return a.name.localeCompare(b.name);
            } else if (sortType === "name-desc") {
                return b.name.localeCompare(a.name);
            } else if (sortType === "price-asc") {
                return a.price - b.price;
            } else if (sortType === "price-desc") {
                return b.price - a.price;
            }
            return 0;
        });
    }, [items, sortType]);

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
                    onChange={e =>
                        setSelectedDungeon(e.target.value as DungeonType)
                    }
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
                        onClick={() => setSelectedDungeon(dungeon)}
                    >
                        <span className="truncate">{dungeon}</span>
                    </button>
                ))}
            </div>

            {/* 선택된 던전 정보와 세부 난이도 */}
            <div className="card bg-base-200 mb-6 lg:mb-8">
                <div className="card-body p-4 lg:p-8">
                    <h2 className="card-title text-lg lg:text-xl flex flex-wrap gap-2">
                        {DUNGEON_INFO[selectedDungeon].name}
                    </h2>
                    <p className="text-sm lg:text-base mb-4">
                        {DUNGEON_INFO[selectedDungeon].description}
                    </p>

                    {/* 세부 난이도 선택 */}
                    {DUNGEON_INFO[selectedDungeon].subDifficulties.length >
                        0 && (
                        <div className="space-y-3 lg:space-y-4">
                            <h3 className="font-semibold text-sm lg:text-base">
                                난이도 선택
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {DUNGEON_INFO[
                                    selectedDungeon
                                ].subDifficulties.map(subDiff => (
                                    <button
                                        key={subDiff.name}
                                        className={`btn btn-sm lg:btn-md ${
                                            selectedSubDifficulty?.name ===
                                            subDiff.name
                                                ? "btn-primary"
                                                : "btn-ghost"
                                        }`}
                                        onClick={() =>
                                            setSelectedSubDifficulty(subDiff)
                                        }
                                    >
                                        {subDiff.name}
                                    </button>
                                ))}
                            </div>
                            {selectedSubDifficulty?.description && (
                                <div className="text-sm lg:text-base mt-2 text-base-content/80">
                                    {selectedSubDifficulty.description}
                                </div>
                            )}
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
                    {/* 모바일용 드롭다운 */}
                    <select
                        className="select select-bordered select-sm lg:hidden"
                        value={sortType}
                        onChange={e => setSortType(e.target.value as SortType)}
                    >
                        {SORT_OPTIONS.map(option => (
                            <option key={option.type} value={option.type}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 아이템 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {sortedItems.map(item => (
                    <div
                        key={item.id}
                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                    >
                        <figure className="px-6 pt-6 lg:px-10 lg:pt-10">
                            <div className="relative w-24 h-24 lg:w-32 lg:h-32">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </figure>
                        <div className="card-body p-4 lg:p-6">
                            <h2 className="card-title text-base lg:text-lg">
                                {item.name}
                            </h2>
                            <div className="flex justify-between items-center mt-2 lg:mt-4">
                                <span className="text-primary font-semibold text-sm lg:text-base">
                                    {item.price.toLocaleString()}골드
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 아이템이 없을 경우 */}
            {items.length === 0 && (
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
