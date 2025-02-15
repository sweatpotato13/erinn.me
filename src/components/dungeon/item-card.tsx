import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import type { DungeonType } from "@/constant/dungeons";
import type { DungeonItem } from "@/constant/dungeons-items";
import { getItemPrice } from "@/lib/api/auction";

interface ItemCardProps {
    item: DungeonItem;
    selectedDungeon: DungeonType;
    selectedDifficulty: string | null;
}

export function ItemCard({
    item,
    selectedDungeon,
    selectedDifficulty,
}: ItemCardProps) {
    const { data: priceData } = useQuery({
        queryKey: ["itemPrice", item.name],
        queryFn: () => getItemPrice(item.name),
    });

    // 현재 선택된 던전에서의 드랍 정보
    const dropInfo = item.drops.find(drop => drop.dungeon === selectedDungeon);

    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <figure className="px-4 pt-4">
                <div className="relative w-16 h-16">
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain"
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
                    <span className="text-primary font-semibold text-xs">
                        {priceData
                            ? `${priceData.unitPrice.toLocaleString()}골드`
                            : "가격 로딩중..."}
                    </span>
                </div>
            </div>
        </div>
    );
}
