"use client";

import { useEffect, useState } from "react";
import React from "react";

import { ItemCard } from "@/components/dungeon/item-card";
import { DUNGEON_INFO, DUNGEON_LIST, DungeonType } from "@/constant/dungeons";
import {
    getItemsByDungeon,
    getItemsByDungeonDifficulty,
} from "@/constant/dungeons-items";
import { getItemPrice, ItemPriceResponse } from "@/lib/api/auction";

type SortType = "name-asc" | "name-desc" | "price-asc" | "price-desc";

/**
 * Renders the dungeon page interface to display items, manage dungeon and difficulty selections, and handle item price loading and refreshing.
 *
 * This component manages state for the selected dungeon, difficulty level, item sorting order, and asynchronous price fetching. It sequentially loads item prices with a delay to maintain UI responsiveness and provides functionality to refresh individual item prices. The component displays a sorted list of items with their current prices, along with a loading progress indicator.
 */
export default function DungeonPage() {
    const [selectedDungeon, setSelectedDungeon] = React.useState<DungeonType>(
        DUNGEON_LIST[0]
    );
    const [selectedDifficulty, setSelectedDifficulty] = React.useState<
        string | null
    >(null);
    const [sortType, setSortType] = React.useState<SortType>("name-asc");

    // 아이템 가격 정보를 저장할 상태
    const [itemPrices, setItemPrices] = useState<
        Record<string, ItemPriceResponse>
    >({});
    const [loadingItemIndex, setLoadingItemIndex] = useState<number>(0);
    const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

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

    // 던전이나 난이도가 변경되면 가격 로딩을 초기화
    useEffect(() => {
        setItemPrices({});
        setLoadingItemIndex(0);
        setIsLoadingPrice(false);
        setRefreshing({});
    }, [selectedDungeon, selectedDifficulty]);

    // 개별 아이템 가격 새로고침 기능
    const handleRefreshItem = (itemName: string) => {
        // 이미 새로고침 중인 아이템은 중복 호출 방지
        if (refreshing[itemName]) return;

        setRefreshing(prev => ({ ...prev, [itemName]: true }));

        // 비동기 함수를 즉시 실행하여 Promise 처리
        void (async () => {
            try {
                const price = await getItemPrice(itemName);

                setItemPrices(prev => ({
                    ...prev,
                    [itemName]: price,
                }));
            } catch (error) {
                console.error(`${itemName} 가격 새로고침 중 오류:`, error);
            } finally {
                setRefreshing(prev => ({ ...prev, [itemName]: false }));
            }
        })();
    };

    // 순차적으로 아이템 가격 로딩
    useEffect(() => {
        if (loadingItemIndex >= items.length || isLoadingPrice) return;

        const loadNextItemPrice = async () => {
            if (loadingItemIndex < items.length) {
                const currentItem = items[loadingItemIndex];

                // 이미 가격이 로딩된 아이템은 건너뛰기
                if (itemPrices[currentItem.name]) {
                    setLoadingItemIndex(prevIndex => prevIndex + 1);
                    return;
                }

                setIsLoadingPrice(true);
                try {
                    // 아이템 가격 로딩 (1초 간격으로)
                    const price = await getItemPrice(currentItem.name);

                    // 가격 정보 업데이트
                    setItemPrices(prev => ({
                        ...prev,
                        [currentItem.name]: price,
                    }));

                    // 다음 아이템으로 이동하기 전에 1초 대기
                    setTimeout(() => {
                        setLoadingItemIndex(prevIndex => prevIndex + 1);
                        setIsLoadingPrice(false);
                    }, 1000);
                } catch (error) {
                    console.error("가격 조회 중 오류:", error);
                    // 오류 발생 시에도 다음 아이템으로 진행
                    setTimeout(() => {
                        setLoadingItemIndex(prevIndex => prevIndex + 1);
                        setIsLoadingPrice(false);
                    }, 1000);
                }
            }
        };

        void loadNextItemPrice();
    }, [items, loadingItemIndex, isLoadingPrice, itemPrices]);

    // 아이템 정렬
    const sortedItems = React.useMemo(() => {
        const itemsWithPrice = items.map(item => ({
            ...item,
            currentPrice: itemPrices[item.name]?.unitPrice || 0,
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
    }, [items, itemPrices, sortType]);

    // 현재 선택된 던전의 난이도 목록
    const difficulties = React.useMemo(() => {
        return DUNGEON_INFO[selectedDungeon].subDifficulties.map(
            diff => diff.name
        );
    }, [selectedDungeon]);

    // 로딩 진행률 계산
    const loadingProgress = React.useMemo(() => {
        if (items.length === 0) return 100;
        return Math.floor((loadingItemIndex / items.length) * 100);
    }, [items.length, loadingItemIndex]);

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

            {/* 로딩 진행률 표시 */}
            {loadingItemIndex < items.length && (
                <div className="mb-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm">가격 정보 로딩 중...</span>
                        <span className="text-sm">{loadingProgress}%</span>
                    </div>
                    <progress
                        className="progress progress-primary w-full"
                        value={loadingProgress}
                        max="100"
                    ></progress>
                </div>
            )}

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
                        priceInfo={itemPrices[item.name]}
                        onRefresh={handleRefreshItem}
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
