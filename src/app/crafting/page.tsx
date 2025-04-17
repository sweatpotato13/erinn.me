"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState } from "react";

import { craftingItems } from "@/constant/craft-items";
import { getItemPriceWithQuantity } from "@/lib/api/auction";
import { CraftingItem, Material } from "@/types";

// React Query 캐시에서 아이템의 총 가격을 가져오는 함수
function getCachedItemTotalPrice(
    queryClient: ReturnType<typeof useQueryClient>,
    itemName: string
): number | null {
    const cachedData = queryClient.getQueryData<CraftingItem[]>([
        "craftingPrices",
    ]);
    if (!cachedData) return null;

    const cachedItem = cachedData.find(
        (item: CraftingItem) => item.name === itemName
    );
    if (!cachedItem) return null;

    return cachedItem.materials.reduce(
        (sum: number, m: Material) => sum + m.quantity * m.price,
        0
    );
}

function ItemCard({ item }: { item: CraftingItem }) {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const materialsWithPrices = await Promise.all(
                item.materials.map(async material => {
                    // 먼저 React Query 캐시에서 완성된 아이템의 총 가격을 확인
                    const cachedTotalPrice = getCachedItemTotalPrice(
                        queryClient,
                        material.name
                    );
                    if (cachedTotalPrice !== null && cachedTotalPrice > 0) {
                        return {
                            ...material,
                            price: cachedTotalPrice, // 캐시된 총 가격을 사용
                        };
                    }

                    // 캐시에 없거나 가격이 0인 경우 경매장에서 가격 조회
                    if (material.price === 0) {
                        const priceInfo = await getItemPriceWithQuantity(
                            material.name,
                            material.quantity
                        );
                        return {
                            ...material,
                            price: priceInfo.totalPrice / material.quantity,
                        };
                    }
                    return material;
                })
            );

            const updatedItem = {
                ...item,
                materials: materialsWithPrices,
            };

            // 현재 캐시된 데이터를 업데이트
            const currentData = queryClient.getQueryData<CraftingItem[]>([
                "craftingPrices",
            ]);
            if (currentData) {
                const updatedData = currentData.map(i =>
                    i.name === item.name ? updatedItem : i
                );
                queryClient.setQueryData(["craftingPrices"], updatedData);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    const totalQuantity = item.materials.reduce(
        (sum, m) => sum + m.quantity,
        0
    );
    const totalPrice = item.materials.reduce(
        (sum, m) => sum + m.quantity * m.price,
        0
    );
    const hasZeroPrice = item.materials.some(m => m.price === 0);

    return (
        <section className="bg-white rounded-lg shadow p-4 mb-4 w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image
                            width={48}
                            height={48}
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 object-contain"
                        />
                    </div>
                    <h2 className="text-lg font-bold">{item.name}</h2>
                </div>
                <button
                    onClick={() => void handleRefresh()}
                    disabled={isRefreshing}
                    className="btn btn-ghost btn-sm"
                >
                    {isRefreshing ? (
                        <div className="loading loading-spinner loading-xs"></div>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 2v6h-6" />
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                            <path d="M3 22v-6h6" />
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                        </svg>
                    )}
                </button>
            </div>
            <ul className="mb-3">
                {item.materials.map(mat => (
                    <li key={mat.name} className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Image
                                width={32}
                                height={32}
                                src={mat.imageUrl}
                                alt={mat.name}
                                className="w-6 h-6 object-contain"
                            />
                        </div>
                        <span className="flex-1">{mat.name}</span>
                        <span className="font-mono text-xs">
                            x{mat.quantity}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                            {mat.price === 0 ? (
                                <span className="text-red-500">
                                    가격 조회 중
                                </span>
                            ) : (
                                `(${(mat.price * mat.quantity).toLocaleString()} G)`
                            )}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex justify-between">
                    <span>총 재료 수량</span>
                    <span className="font-semibold">{totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                    <span>총 합 가격</span>
                    <span className="font-semibold text-blue-700">
                        {hasZeroPrice ? (
                            <span className="text-red-500">가격 조회 중</span>
                        ) : (
                            `${totalPrice.toLocaleString()} G`
                        )}
                    </span>
                </div>
            </div>
        </section>
    );
}

type SortOption = "name" | "price" | null;
type SortDirection = "asc" | "desc";

export default function CraftingPage() {
    const [sortBy, setSortBy] = useState<SortOption>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // 모든 재료의 가격 정보를 가져오는 쿼리
    const { data: priceData, isLoading } = useQuery({
        queryKey: ["craftingPrices"],
        queryFn: async () => {
            const itemsWithPrices = await Promise.all(
                craftingItems.map(async item => {
                    const materialsWithPrices = await Promise.all(
                        item.materials.map(async material => {
                            if (material.price === 0) {
                                const priceInfo =
                                    await getItemPriceWithQuantity(
                                        material.name,
                                        material.quantity
                                    );
                                return {
                                    ...material,
                                    price:
                                        priceInfo.totalPrice /
                                        material.quantity,
                                };
                            }
                            return material;
                        })
                    );
                    return {
                        ...item,
                        materials: materialsWithPrices,
                    };
                })
            );
            return itemsWithPrices;
        },
    });

    const sortedItems = [...(priceData || craftingItems)].sort((a, b) => {
        if (sortBy === "name") {
            const comparison = a.name.localeCompare(b.name);
            return sortDirection === "asc" ? comparison : -comparison;
        }
        if (sortBy === "price") {
            const totalPriceA = a.materials.reduce(
                (sum, m) => sum + m.quantity * m.price,
                0
            );
            const totalPriceB = b.materials.reduce(
                (sum, m) => sum + m.quantity * m.price,
                0
            );
            return sortDirection === "asc"
                ? totalPriceA - totalPriceB
                : totalPriceB - totalPriceA;
        }
        return 0;
    });

    const handleSort = (option: SortOption) => {
        if (sortBy === option) {
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(option);
            setSortDirection("asc");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-6">
            <div className="w-full max-w-4xl p-6 backdrop-blur-sm rounded-lg flex-grow">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-end">
                        <div className="join">
                            <button
                                onClick={() => handleSort("name")}
                                className={`join-item btn ${sortBy === "name" ? "btn-active" : ""}`}
                            >
                                이름순{" "}
                                {sortBy === "name" &&
                                    (sortDirection === "asc" ? "↑" : "↓")}
                            </button>
                            <button
                                onClick={() => handleSort("price")}
                                className={`join-item btn ${sortBy === "price" ? "btn-active" : ""}`}
                            >
                                가격순{" "}
                                {sortBy === "price" &&
                                    (sortDirection === "asc" ? "↑" : "↓")}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                        {sortedItems.map(item => (
                            <ItemCard key={item.name} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
