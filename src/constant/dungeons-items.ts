import { DungeonType } from "./dungeons";

export interface DungeonItem {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    dungeon: DungeonType;
    dropAt: string[]; // 드랍되는 세부 난이도 목록
    itemId: number; // 경매장 API용 아이템 ID
}

// 예시 아이템 데이터
export const DUNGEON_ITEMS: DungeonItem[] = [
    {
        id: "br-1",
        name: "브리 레흐의 코어",
        imageUrl: "", // 실제 API URL로 교체 필요
        price: 0, // 경매장 API에서 가져올 가격
        dungeon: "브리 레흐",
        dropAt: ["1관", "2관", "3관"],
        itemId: 12345, // 실제 아이템 ID로 교체 필요
    },
    {
        id: "glen-1",
        name: "불완전한 공상의 왕관 헤일로",
        imageUrl: "", // 실제 API URL로 교체 필요
        price: 0, // 경매장 API에서 가져올 가격
        dungeon: "글렌 베르나",
        dropAt: ["태고의 겨울"],
        itemId: 67890, // 실제 아이템 ID로 교체 필요
    },
];

// 던전별 아이템 목록을 쉽게 가져올 수 있는 유틸리티 함수
export const getItemsByDungeon = (dungeon: DungeonType): DungeonItem[] => {
    return DUNGEON_ITEMS.filter(item => item.dungeon === dungeon);
};
