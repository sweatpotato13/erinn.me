"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";

import { craftingItems } from "@/constant/craft-items";
import {
    applyPriceSummaries,
    fetchPriceSummaries,
    loadCraftingPrices,
    PricedCraftingItem,
} from "@/lib/api/crafting";

// React Query 캐시에서 아이템의 총 가격을 가져오는 함수
function getCachedItemTotalPrice(
    queryClient: ReturnType<typeof useQueryClient>,
    itemName: string,
    considerCraftingCount: boolean = false
): number | null {
    const cachedData = queryClient.getQueryData<PricedCraftingItem[]>([
        "craftingPrices",
    ]);
    if (!cachedData) return null;

    const cachedItem = cachedData.find(
        (item: PricedCraftingItem) => item.name === itemName
    );
    if (!cachedItem) return null;
    if (cachedItem.materials.some(material => material.priceError)) return null;

    const materialPrice = cachedItem.materials.reduce(
        (sum, material) => sum + material.totalPrice,
        0
    );

    // 공정 횟수가 있고, considerCraftingCount가 true인 경우 공정 횟수를 고려한 가격 반환
    if (
        considerCraftingCount &&
        cachedItem.craftingCount &&
        cachedItem.craftingCount > 1
    ) {
        // 현재 선택된 공정 횟수를 가져오기 위해 상태 확인 (기본값은 전체 공정 횟수)
        const selectedCraftingCount =
            queryClient.getQueryData<{ [key: string]: number }>([
                "selectedCraftingCounts",
            ])?.[itemName] || cachedItem.craftingCount;
        return materialPrice * selectedCraftingCount;
    }

    return materialPrice;
}

function ItemCard({ item }: { item: PricedCraftingItem }) {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [craftingCount, setCraftingCount] = useState(1);

    // 아이템에 craftingCount 필드가 있으면 사용, 없으면 기본값 1
    const maxCraftingCount = item.craftingCount || 1;

    // 공정 횟수 변경 시 캐시 업데이트
    const updateCraftingCount = (count: number) => {
        setCraftingCount(count);

        // 선택된 공정 횟수를 저장
        const currentCounts =
            queryClient.getQueryData<{ [key: string]: number }>([
                "selectedCraftingCounts",
            ]) || {};
        queryClient.setQueryData(["selectedCraftingCounts"], {
            ...currentCounts,
            [item.name]: count,
        });

        // 이 값은 다른 제작 아이템을 수동 갱신할 때 참조된다.
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const auctionNames: string[] = [];
            const cachedTotals = new Map<string, number>();
            for (const material of item.materials) {
                if (!material.isMarketPrice) continue;
                // 먼저 React Query 캐시에서 완성된 아이템의 총 가격을 확인
                // 공허의 로브와 같이 공정 횟수가 있는 아이템은 공정 횟수를 고려한 가격 사용
                const cachedTotalPrice = getCachedItemTotalPrice(
                    queryClient,
                    material.name,
                    true // 공정 횟수 고려
                );
                if (cachedTotalPrice !== null && cachedTotalPrice > 0) {
                    cachedTotals.set(material.name, cachedTotalPrice);
                } else {
                    auctionNames.push(material.name);
                }
            }

            const summaries = await fetchPriceSummaries(auctionNames);

            // 현재 캐시된 데이터를 업데이트
            const currentData = queryClient.getQueryData<PricedCraftingItem[]>([
                "craftingPrices",
            ]);
            if (currentData) {
                let updatedData = applyPriceSummaries(currentData, summaries);
                updatedData = updatedData.map(currentItem => ({
                    ...currentItem,
                    materials: currentItem.materials.map(material => {
                        const cachedTotal = cachedTotals.get(material.name);
                        return cachedTotal === undefined
                            ? material
                            : {
                                  ...material,
                                  unitPrice: cachedTotal,
                                  availableQuantity: 1,
                                  totalPrice: cachedTotal,
                                  priceError: undefined,
                              };
                    }),
                }));
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
    const oneCraftPrice = item.materials.reduce(
        (sum, material) => sum + material.totalPrice,
        0
    );
    const totalPrice = oneCraftPrice * craftingCount;
    const hasPriceError = item.materials.some(material => material.priceError);

    return (
        <section className="bg-white rounded-lg shadow p-4 mb-4 w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={40}
                            height={40}
                            unoptimized={true}
                            className="w-10 h-10 object-contain"
                        />
                    </div>
                    <h2 className="text-lg font-bold">{item.name}</h2>
                </div>
                <button
                    onClick={() => void handleRefresh()}
                    disabled={isRefreshing}
                    className="btn btn-ghost btn-sm"
                    aria-label="재료 가격 갱신"
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

            {maxCraftingCount > 1 && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">공정 횟수:</span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() =>
                                    updateCraftingCount(
                                        Math.max(1, craftingCount - 1)
                                    )
                                }
                                className="btn btn-xs"
                                disabled={craftingCount <= 1}
                            >
                                -
                            </button>
                            <span className="font-mono text-sm">
                                {craftingCount}/{maxCraftingCount}
                            </span>
                            <button
                                onClick={() =>
                                    updateCraftingCount(
                                        Math.min(
                                            maxCraftingCount,
                                            craftingCount + 1
                                        )
                                    )
                                }
                                className="btn btn-xs"
                                disabled={craftingCount >= maxCraftingCount}
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        총 {maxCraftingCount}회 공정 필요
                    </div>
                </div>
            )}

            <ul className="mb-3">
                {item.materials.map(mat => (
                    <li key={mat.name} className="flex items-center gap-2 py-1">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Image
                                src={mat.imageUrl}
                                alt={mat.name}
                                width={24}
                                height={24}
                                unoptimized={true}
                                className="w-6 h-6 object-contain"
                            />
                        </div>
                        <span className="flex-1">{mat.name}</span>
                        <span className="font-mono text-xs">
                            x{mat.quantity}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                            {mat.priceError ? (
                                <span className="text-red-500">
                                    가격 조회 실패
                                </span>
                            ) : (
                                `(${mat.totalPrice.toLocaleString()} G)`
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

                {maxCraftingCount > 1 ? (
                    <>
                        <div className="flex justify-between">
                            <span>1회 공정 가격</span>
                            <span className="font-semibold">
                                {hasPriceError ? (
                                    <span className="text-red-500">
                                        가격 조회 실패
                                    </span>
                                ) : (
                                    `${oneCraftPrice.toLocaleString()} G`
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                            <span>{craftingCount}회 공정 총액</span>
                            <span className="font-semibold text-blue-700">
                                {hasPriceError ? (
                                    <span className="text-red-500">
                                        가격 조회 실패
                                    </span>
                                ) : (
                                    `${totalPrice.toLocaleString()} G`
                                )}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-between">
                        <span>총 합 가격</span>
                        <span className="font-semibold text-blue-700">
                            {hasPriceError ? (
                                <span className="text-red-500">
                                    가격 조회 실패
                                </span>
                            ) : (
                                `${totalPrice.toLocaleString()} G`
                            )}
                        </span>
                    </div>
                )}
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
        queryFn: () => loadCraftingPrices(craftingItems),
    });

    const sortedItems = [...(priceData ?? [])].sort((a, b) => {
        if (sortBy === "name") {
            const comparison = a.name.localeCompare(b.name);
            return sortDirection === "asc" ? comparison : -comparison;
        }
        if (sortBy === "price") {
            const totalPriceA = a.materials.reduce(
                (sum, material) => sum + material.totalPrice,
                0
            );
            const totalPriceB = b.materials.reduce(
                (sum, material) => sum + material.totalPrice,
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
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">제작 아이템</h1>
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
