import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";

import type { DungeonType } from "@/constant/dungeons";
import type { DungeonItem } from "@/constant/dungeons-items";
import { getItemPrice, ItemPriceResponse } from "@/lib/api/auction";

interface ItemCardProps {
    item: DungeonItem;
    selectedDungeon: DungeonType;
    selectedDifficulty: string | null;
    priceInfo?: ItemPriceResponse;
    onRefresh?: (itemName: string) => void;
}

/**
 * Renders a card displaying a dungeon item's details including its image, drop difficulties, and price information.
 *
 * This component displays the item's name, image, and drop information filtered by the selected dungeon. It shows price data
 * that is either provided via the priceInfo prop or fetched internally, and uses an animated effect to highlight price updates.
 * The refresh button triggers either the provided onRefresh callback or an internal refetch to update the price.
 *
 * @param item - The dungeon item's details, including its name, image URL, and drop information.
 * @param selectedDungeon - The dungeon used to filter and display the relevant drop details.
 * @param selectedDifficulty - The difficulty level to highlight among the item's drops.
 * @param priceInfo - Optional pre-fetched price data; if provided, it disables the internal price query.
 * @param onRefresh - Optional callback invoked with the item's name to trigger a price refresh; if absent, the component refetches the price.
 *
 * @returns A JSX element representing the rendered item card.
 */
export function ItemCard({
    item,
    selectedDungeon,
    selectedDifficulty,
    priceInfo,
    onRefresh,
}: ItemCardProps) {
    // 애니메이션 효과를 위한 상태
    const [isRefreshed, setIsRefreshed] = useState(false);
    const [prevPrice, setPrevPrice] = useState<number | null>(null);

    // 부모 컴포넌트에서 priceInfo를 제공하지 않는 경우에만 useQuery 사용
    const {
        data: queriedPriceData,
        isError,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ["itemPrice", item.name],
        queryFn: () => getItemPrice(item.name),
        retry: 3, // 500 에러 같은 네트워크 오류 시 3번 재시도
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        // priceInfo가 제공되는 경우 쿼리를 비활성화
        enabled: !priceInfo,
    });

    // priceInfo prop이 있으면 그것을 사용하고, 없으면 쿼리 결과 사용
    const priceData = priceInfo || queriedPriceData;

    // 가격이 변경되었을 때 갱신 효과 적용
    useEffect(() => {
        if (
            priceData &&
            prevPrice !== null &&
            prevPrice !== priceData.unitPrice
        ) {
            setIsRefreshed(true);

            // 애니메이션 효과를 1.5초 후 제거
            const timer = setTimeout(() => {
                setIsRefreshed(false);
            }, 1500);

            return () => clearTimeout(timer);
        }

        // 현재 가격 저장
        if (priceData && !isRefetching) {
            setPrevPrice(priceData.unitPrice);
        }
    }, [priceData, prevPrice, isRefetching]);

    // 새로고침 처리 함수
    const handleRefresh = () => {
        // 새로고침 시작 전에 현재 가격 저장
        if (priceData) {
            setPrevPrice(priceData.unitPrice);
        }

        if (onRefresh) {
            // 부모 컴포넌트의 새로고침 함수 호출
            onRefresh(item.name);
        } else {
            // 자체 refetch 실행
            void refetch();
        }
    };

    // 가격 정보가 비어있는지 확인 (API에서 200을 반환했지만 내용이 비어있는 경우)
    const isPriceEmpty =
        priceData?.unitPrice === 0 && priceData?.averagePrice === 0;

    // 현재 선택된 던전에서의 드랍 정보
    const dropInfo = item.drops.find(drop => drop.dungeon === selectedDungeon);

    // 새로고침 중인지 확인 (useQuery의 isRefetching 또는 부모로부터 전달된 상태)
    const isRefreshingPrice = isRefetching || (onRefresh && !priceData);

    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <figure className="px-4 pt-4">
                <div className="relative w-16 h-16">
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain"
                        unoptimized={true}
                    />
                </div>
            </figure>
            <div className="card-body p-3">
                <h2 className="card-title text-sm">{item.name}</h2>
                {/* 드랍 정보 */}
                {dropInfo && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {dropInfo.difficulties.map(difficulty => (
                            <span
                                key={difficulty}
                                className={`badge badge-xs ${
                                    selectedDifficulty === difficulty
                                        ? "badge-primary"
                                        : "badge-ghost"
                                }`}
                            >
                                {difficulty}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex justify-between items-center mt-1">
                    <span
                        className={`text-primary font-semibold text-xs transition-all duration-300
                            ${
                                isRefreshed
                                    ? "text-success animate-pulse scale-110"
                                    : isRefreshingPrice
                                      ? "opacity-50"
                                      : ""
                            }`}
                    >
                        {isRefreshingPrice
                            ? "가격 새로고침 중..."
                            : isError && !priceInfo
                              ? "가격 정보 없음"
                              : isPriceEmpty
                                ? "가격 정보 없음"
                                : priceData
                                  ? `${priceData.unitPrice.toLocaleString()}골드`
                                  : "가격 로딩중..."}
                    </span>

                    {/* 새로고침 버튼 */}
                    <button
                        className={`btn btn-xs ${isRefreshingPrice ? "btn-disabled" : "btn-ghost"} btn-circle`}
                        onClick={handleRefresh}
                        disabled={isRefreshingPrice}
                        aria-label="가격 정보 새로고침"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-3.5 w-3.5 ${isRefreshingPrice ? "animate-spin text-primary" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                </div>

                {/* 새로고침 성공 메시지 */}
                {isRefreshed && (
                    <div className="mt-1 text-xs text-success animate-fadeIn">
                        가격 정보가 갱신되었습니다!
                    </div>
                )}
            </div>
        </div>
    );
}
