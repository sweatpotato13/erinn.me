import { AllItemList } from "@/constant/all-item-list";

import { DungeonType } from "./dungeons";

// 아이템이 드랍되는 던전과 난이도 정보
export interface ItemDropInfo {
    dungeon: DungeonType;
    difficulties: string[];
}

// 던전 아이템 정보
export interface DungeonItem {
    id: string; // 고유 식별자
    name: string;
    imageUrl: string;
    price: number;
    drops: ItemDropInfo[]; // 아이템이 드랍되는 던전과 난이도 정보
}

// 고유 ID 생성 함수
function createUniqueId(
    name: string,
    dungeon: string,
    difficulties: string[]
): string {
    return `${name}-${dungeon}-${difficulties.join("-")}`;
}

// 던전 아이템 목록
export const DUNGEON_ITEMS: DungeonItem[] = [
    {
        id: createUniqueId("브리 레흐의 코어", "브리 레흐", [
            "1관",
            "2관",
            "3관",
        ]),
        name: "브리 레흐의 코어",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "브리 레흐의 코어")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["1관", "2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("브리 레흐의 정수", "브리 레흐", [
            "1관",
            "2관",
            "3관",
        ]),
        name: "브리 레흐의 정수",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "브리 레흐의 정수")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["1관", "2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("무리아스의 성수", "브리 레흐", [
            "1관",
            "2관",
            "3관",
        ]),
        name: "무리아스의 성수",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "무리아스의 성수")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["1관", "2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("오묘한 가죽 조각", "브리 레흐", [
            "1관",
            "2관",
            "3관",
        ]),
        name: "오묘한 가죽 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "오묘한 가죽 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["1관", "2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("오묘한 마력석", "브리 레흐", ["1관", "2관", "3관"]),
        name: "오묘한 마력석",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "오묘한 마력석")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["1관", "2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("오묘한 금속 조각", "브리 레흐", [
            "1관",
            "2관",
            "3관",
        ]),
        name: "오묘한 금속 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "오묘한 금속 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["1관", "2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("주황빛 기억의 조각", "브리 레흐", ["2관", "3관"]),
        name: "주황빛 기억의 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "주황빛 기억의 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("금빛 기억의 조각", "브리 레흐", ["2관", "3관"]),
        name: "금빛 기억의 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "금빛 기억의 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("초록빛 기억의 조각", "브리 레흐", ["2관", "3관"]),
        name: "초록빛 기억의 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "초록빛 기억의 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("무른 금속 파편", "브리 레흐", ["2관", "3관"]),
        name: "무른 금속 파편",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "무른 금속 파편")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "브리 레흐",
                difficulties: ["2관", "3관"],
            },
        ],
    },
    {
        id: createUniqueId("불완전한 공상의 왕관 헤일로", "글렌 베르나", [
            "태고의 겨울",
        ]),
        name: "불완전한 공상의 왕관 헤일로",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "불완전한 공상의 왕관 헤일로")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울"],
            },
        ],
    },
    {
        id: createUniqueId(
            "낭만 농장 칼리아흐의 결계 미니어처",
            "글렌 베르나",
            ["태고의 겨울"]
        ),
        name: "낭만 농장 칼리아흐의 결계 미니어처",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "낭만 농장 칼리아흐의 결계 미니어처")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울"],
            },
        ],
    },
    {
        id: createUniqueId("칼리아흐의 얼음 창 외형 주문서", "글렌 베르나", [
            "태고의 겨울",
        ]),
        name: "칼리아흐의 얼음 창 외형 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "칼리아흐의 얼음 창 외형 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울"],
            },
        ],
    },
    {
        id: createUniqueId("칼리아흐의 얼음 낫 외형 주문서", "글렌 베르나", [
            "태고의 겨울",
        ]),
        name: "칼리아흐의 얼음 낫 외형 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "칼리아흐의 얼음 낫 외형 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울"],
            },
        ],
    },
    {
        id: createUniqueId("칼리아흐의 얼음 칼 외형 주문서", "글렌 베르나", [
            "태고의 겨울",
        ]),
        name: "칼리아흐의 얼음 칼 외형 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "칼리아흐의 얼음 칼 외형 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 최대 대미지 증가 +1 주문서",
            "글렌 베르나",
            ["태고의 겨울", "어려움"]
        ),
        name: "세트 효과 최대 대미지 증가 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 최대 대미지 증가 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 매그넘 샷 강화 +1 주문서",
            "글렌 베르나",
            ["태고의 겨울", "어려움"]
        ),
        name: "세트 효과 매그넘 샷 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 매그넘 샷 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 스매시 강화 +1 주문서", "글렌 베르나", [
            "태고의 겨울",
            "어려움",
        ]),
        name: "세트 효과 스매시 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 스매시 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 크리티컬 대미지 증가 +1 주문서",
            "글렌 베르나",
            ["태고의 겨울", "어려움"]
        ),
        name: "세트 효과 크리티컬 대미지 증가 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 크리티컬 대미지 증가 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 힐링 강화 +1 주문서", "글렌 베르나", [
            "태고의 겨울",
            "어려움",
        ]),
        name: "세트 효과 힐링 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 힐링 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 파이어 볼트 강화 +1 주문서",
            "글렌 베르나",
            ["태고의 겨울", "어려움"]
        ),
        name: "세트 효과 파이어 볼트 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 파이어 볼트 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 윈드밀 강화 +1 주문서", "글렌 베르나", [
            "태고의 겨울",
            "어려움",
        ]),
        name: "세트 효과 윈드밀 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 윈드밀 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("잘려 나간 겨울의 꿈 결정", "글렌 베르나", [
            "어려움",
        ]),
        name: "잘려 나간 겨울의 꿈 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "잘려 나간 겨울의 꿈 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("결정화된 겨울의 잔해", "글렌 베르나", ["어려움"]),
        name: "결정화된 겨울의 잔해",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "결정화된 겨울의 잔해")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 공격 속도 증가 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 공격 속도 증가 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 공격 속도 증가 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 서포트 샷 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 서포트 샷 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 서포트 샷 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 반신화 강화 +1 주문서", "글렌 베르나", [
            "어려움",
        ]),
        name: "세트 효과 반신화 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 반신화 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 충격 흡수 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 충격 흡수 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 충격 흡수 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 워터 캐논 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 워터 캐논 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 워터 캐논 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 플레이머 강화 +1 주문서", "글렌 베르나", [
            "어려움",
        ]),
        name: "세트 효과 플레이머 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 플레이머 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 다운 어택 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 다운 어택 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 다운 어택 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 라이프 드레인 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 라이프 드레인 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 라이프 드레인 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 낚시 강화 +1 주문서", "글렌 베르나", [
            "어려움",
        ]),
        name: "세트 효과 낚시 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 낚시 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 제련 강화 +1 주문서", "글렌 베르나", [
            "어려움",
        ]),
        name: "세트 효과 제련 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 제련 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 블랙 스미스 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 블랙 스미스 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 블랙 스미스 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 야금술 강화 +1 주문서", "글렌 베르나", [
            "어려움",
        ]),
        name: "세트 효과 야금술 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 야금술 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 라데카 이동 속도 증가 + 1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 라데카 이동 속도 증가 + 1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 라데카 이동 속도 증가 + 1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 돌진 강화 +1 주문서", "글렌 베르나", [
            "어려움",
        ]),
        name: "세트 효과 돌진 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 돌진 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("세트 효과 배쉬 강화 +1 주문서", "글렌 베르나", [
            "어려움",
        ]),
        name: "세트 효과 배쉬 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 배쉬 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 골드 스트라이크 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 골드 스트라이크 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 골드 스트라이크 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "세트 효과 아이스 볼트 강화 +1 주문서",
            "글렌 베르나",
            ["어려움"]
        ),
        name: "세트 효과 아이스 볼트 강화 +1 주문서",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 아이스 볼트 강화 +1 주문서")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "글렌 베르나",
                difficulties: ["태고의 겨울", "어려움"],
            },
        ],
    },
    {
        id: createUniqueId("심술 난 고양이의 구슬", "크롬 바스", ["30"]),
        name: "심술 난 고양이의 구슬",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "심술 난 고양이의 구슬")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "크롬 바스",
                difficulties: ["30"],
            },
        ],
    },
    {
        id: createUniqueId("손상된 글라스 기브넨의 깃털", "크롬 바스", [
            "50",
            "100",
        ]),
        name: "손상된 글라스 기브넨의 깃털",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "손상된 글라스 기브넨의 깃털")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "크롬 바스",
                difficulties: ["50", "100"],
            },
        ],
    },
    {
        id: createUniqueId("아다만티움", "크롬 바스", ["50", "100"]),
        name: "아다만티움",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "아다만티움")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "크롬 바스",
                difficulties: ["50", "100"],
            },
        ],
    },
    {
        id: createUniqueId("글라스 기브넨의 심장", "크롬 바스", ["50", "100"]),
        name: "글라스 기브넨의 심장",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "글라스 기브넨의 심장")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "크롬 바스",
                difficulties: ["50", "100"],
            },
        ],
    },
    {
        id: createUniqueId("나이트브링어 샤프슈터", "크롬 바스", ["50", "100"]),
        name: "나이트브링어 샤프슈터",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "나이트브링어 샤프슈터")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "크롬 바스",
                difficulties: ["50", "100"],
            },
        ],
    },
    {
        id: createUniqueId("크라켄의 심장", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
        ]),
        name: "크라켄의 심장",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "크라켄의 심장")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["깨어난 심해의 군주 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("크라켄의 점액질", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
        ]),
        name: "크라켄의 점액질",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "크라켄의 점액질")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["깨어난 심해의 군주 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("페러시우스 위스퍼링 애로우", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "페러시우스 위스퍼링 애로우",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "페러시우스 위스퍼링 애로우")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("원혼이 깃든 칼날", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "원혼이 깃든 칼날",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "원혼이 깃든 칼날")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("원혼이 깃든 고목 조각", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "원혼이 깃든 고목 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "원혼이 깃든 고목 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("원혼이 깃든 연금술 결정", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "원혼이 깃든 연금술 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "원혼이 깃든 연금술 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("침식된 광물 조각", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 쉬움",
            "일곱 번의 악몽 - 쉬움",
            "페스 피아다 - 쉬움",
            "되살아난 허상 - 어려움",
            "되살아난 허상 - 쉬움",
        ]),
        name: "침식된 광물 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "침식된 광물 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 쉬움",
                    "페스 피아다 - 쉬움",
                    "되살아난 허상 - 어려움",
                    "되살아난 허상 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("빛 바랜 파편", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 쉬움",
            "일곱 번의 악몽 - 쉬움",
            "되살아난 허상 - 어려움",
        ]),
        name: "빛 바랜 파편",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "빛 바랜 파편")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 쉬움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("각성된 힘의 결정", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "각성된 힘의 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "각성된 힘의 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("각성된 힘의 조각", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "각성된 힘의 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "각성된 힘의 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("크라켄의 다리 가시", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
        ]),
        name: "크라켄의 다리 가시",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "크라켄의 다리 가시")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["깨어난 심해의 군주 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("기아스 크러스티가 깃든 결정", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "깨어난 심해의 군주 - 쉬움",
            "일곱 번의 악몽 - 어려움",
            "일곱 번의 악몽 - 쉬움",
            "페스 피아다 - 어려움",
            "페스 피아다 - 쉬움",
            "되살아난 허상 - 어려움",
            "되살아난 허상 - 쉬움",
        ]),
        name: "기아스 크러스티가 깃든 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "기아스 크러스티가 깃든 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 어려움",
                    "일곱 번의 악몽 - 쉬움",
                    "페스 피아다 - 어려움",
                    "페스 피아다 - 쉬움",
                    "되살아난 허상 - 어려움",
                    "되살아난 허상 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId(
            "기아스 데버스테이션이 깃든 결정",
            "테흐 두인 미션",
            [
                "깨어난 심해의 군주 - 어려움",
                "깨어난 심해의 군주 - 쉬움",
                "일곱 번의 악몽 - 어려움",
                "일곱 번의 악몽 - 쉬움",
                "페스 피아다 - 어려움",
                "페스 피아다 - 쉬움",
                "되살아난 허상 - 어려움",
                "되살아난 허상 - 쉬움",
            ]
        ),
        name: "기아스 데버스테이션이 깃든 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "기아스 데버스테이션이 깃든 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 어려움",
                    "일곱 번의 악몽 - 쉬움",
                    "페스 피아다 - 어려움",
                    "페스 피아다 - 쉬움",
                    "되살아난 허상 - 어려움",
                    "되살아난 허상 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("크라켄 다리살", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
        ]),
        name: "크라켄 다리살",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "크라켄 다리살")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["깨어난 심해의 군주 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("안개 서린 붉은 보석", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "안개 서린 붉은 보석",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "안개 서린 붉은 보석")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("찬란한 교감의 브리 결정", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 어려움",
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "찬란한 교감의 브리 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "찬란한 교감의 브리 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 어려움",
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("수행의 브리 결정", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 쉬움",
            "일곱 번의 악몽 - 쉬움",
            "페스 피아다 - 어려움",
            "페스 피아다 - 쉬움",
            "되살아난 허상 - 어려움",
            "되살아난 허상 - 쉬움",
        ]),
        name: "수행의 브리 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "수행의 브리 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 쉬움",
                    "페스 피아다 - 어려움",
                    "페스 피아다 - 쉬움",
                    "되살아난 허상 - 어려움",
                    "되살아난 허상 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("기아스 코어", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 쉬움",
            "일곱 번의 악몽 - 어려움",
            "일곱 번의 악몽 - 쉬움",
            "페스 피아다 - 어려움",
            "페스 피아다 - 쉬움",
            "되살아난 허상 - 어려움",
            "되살아난 허상 - 쉬움",
        ]),
        name: "기아스 코어",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "기아스 코어")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 어려움",
                    "일곱 번의 악몽 - 쉬움",
                    "페스 피아다 - 어려움",
                    "페스 피아다 - 쉬움",
                    "되살아난 허상 - 어려움",
                    "되살아난 허상 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("교감의 브리 결정", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 쉬움",
            "일곱 번의 악몽 - 쉬움",
            "페스 피아다 - 어려움",
            "페스 피아다 - 쉬움",
            "되살아난 허상 - 어려움",
            "되살아난 허상 - 쉬움",
        ]),
        name: "교감의 브리 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "교감의 브리 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 쉬움",
                    "페스 피아다 - 어려움",
                    "페스 피아다 - 쉬움",
                    "되살아난 허상 - 어려움",
                    "되살아난 허상 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("도전의 브리 결정", "테흐 두인 미션", [
            "깨어난 심해의 군주 - 쉬움",
            "일곱 번의 악몽 - 쉬움",
            "페스 피아다 - 어려움",
            "페스 피아다 - 쉬움",
            "되살아난 허상 - 어려움",
            "되살아난 허상 - 쉬움",
        ]),
        name: "도전의 브리 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "도전의 브리 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "깨어난 심해의 군주 - 쉬움",
                    "일곱 번의 악몽 - 쉬움",
                    "페스 피아다 - 어려움",
                    "페스 피아다 - 쉬움",
                    "되살아난 허상 - 어려움",
                    "되살아난 허상 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("사안이 깃든 바위", "테흐 두인 미션", [
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "사안이 깃든 바위",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "사안이 깃든 바위")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("미지의 파편", "테흐 두인 미션", [
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "미지의 파편",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "미지의 파편")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("날카롭게 결정화된 광물 조각", "테흐 두인 미션", [
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "날카롭게 결정화된 광물 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "날카롭게 결정화된 광물 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("단단하게 결정화된 광물 조각", "테흐 두인 미션", [
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "단단하게 결정화된 광물 조각",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "단단하게 결정화된 광물 조각")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("오묘한 파편", "테흐 두인 미션", [
            "일곱 번의 악몽 - 어려움",
            "페스 피아다 - 어려움",
            "되살아난 허상 - 어려움",
        ]),
        name: "오묘한 파편",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "오묘한 파편")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: [
                    "일곱 번의 악몽 - 어려움",
                    "페스 피아다 - 어려움",
                    "되살아난 허상 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("게아타의 마력 회로", "테흐 두인 미션", [
            "페스 피아다 - 어려움",
        ]),
        name: "게아타의 마력 회로",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "게아타의 마력 회로")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["페스 피아다 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("마름질 된 가죽의 일부", "테흐 두인 미션", [
            "페스 피아다 - 쉬움",
        ]),
        name: "마름질 된 가죽의 일부",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마름질 된 가죽의 일부")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["페스 피아다 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId("허상의 잔재", "테흐 두인 미션", [
            "되살아난 허상 - 어려움",
        ]),
        name: "허상의 잔재",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "허상의 잔재")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["되살아난 허상 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("지축을 가르는 발굽 파편", "테흐 두인 미션", [
            "되살아난 허상 - 어려움",
        ]),
        name: "지축을 가르는 발굽 파편",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "지축을 가르는 발굽 파편")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["되살아난 허상 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("지축을 뒤흔드는 발굽 파편", "테흐 두인 미션", [
            "되살아난 허상 - 어려움",
        ]),
        name: "지축을 뒤흔드는 발굽 파편",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "지축을 뒤흔드는 발굽 파편")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["되살아난 허상 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("고결한 수행의 브리 결정", "테흐 두인 미션", [
            "되살아난 허상 - 어려움",
        ]),
        name: "고결한 수행의 브리 결정",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "고결한 수행의 브리 결정")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["되살아난 허상 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("전장의 기운이 깃든 덮개", "테흐 두인 미션", [
            "되살아난 허상 - 쉬움",
        ]),
        name: "전장의 기운이 깃든 덮개",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "전장의 기운이 깃든 덮개")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "테흐 두인 미션",
                difficulties: ["되살아난 허상 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId("플루아의 눈물", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "역동의 대지 - 어려움",
        ]),
        name: "플루아의 눈물",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "플루아의 눈물")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움", "역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 최고급 핀즈비즈 : 윈드 러시",
            "마그 멜 미션",
            ["사계의숲 - 어려움"]
        ),
        name: "언샤인드 최고급 핀즈비즈 : 윈드 러시",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 최고급 핀즈비즈 : 윈드 러시")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 최고급 핀즈비즈 : 풀링 필드",
            "마그 멜 미션",
            ["사계의숲 - 어려움"]
        ),
        name: "언샤인드 최고급 핀즈비즈 : 풀링 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 최고급 핀즈비즈 : 풀링 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 최고급 핀즈비즈 : 플로랄 실드",
            "마그 멜 미션",
            ["사계의숲 - 어려움"]
        ),
        name: "언샤인드 최고급 핀즈비즈 : 플로랄 실드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 최고급 핀즈비즈 : 플로랄 실드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 최고급 핀즈비즈 : 힐링 버블",
            "마그 멜 미션",
            ["역동의 대지 - 어려움"]
        ),
        name: "언샤인드 최고급 핀즈비즈 : 힐링 버블",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 최고급 핀즈비즈 : 힐링 버블")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 최고급 핀즈비즈 : 푸싱 필드",
            "마그 멜 미션",
            ["역동의 대지 - 어려움"]
        ),
        name: "언샤인드 최고급 핀즈비즈 : 푸싱 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 최고급 핀즈비즈 : 푸싱 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 최고급 핀즈비즈 : 피니 펀치",
            "마그 멜 미션",
            ["역동의 대지 - 어려움"]
        ),
        name: "언샤인드 최고급 핀즈비즈 : 피니 펀치",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 최고급 핀즈비즈 : 피니 펀치")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("향내 나는 실크", "마그 멜 미션", [
            "사계의숲 - 어려움",
        ]),
        name: "향내 나는 실크",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "향내 나는 실크")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("유대의 바이올렛 퍼퓸", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "역동의 대지 - 어려움",
        ]),
        name: "유대의 바이올렛 퍼퓸",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "유대의 바이올렛 퍼퓸")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움", "역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "마그 멜 미션 통행증 - 역동의 대지(어려움)",
            "마그 멜 미션",
            ["사계의숲 - 어려움", "역동의 대지 - 어려움", "역동의 대지 - 쉬움"]
        ),
        name: "마그 멜 미션 통행증 - 역동의 대지(어려움)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마그 멜 미션 통행증 - 역동의 대지(어려움)")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId(
            "마그 멜 미션 통행증 - 사계의 숲(어려움)",
            "마그 멜 미션",
            ["사계의숲 - 어려움", "사계의숲 - 쉬움", "역동의 대지 - 어려움"]
        ),
        name: "마그 멜 미션 통행증 - 사계의 숲(어려움)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마그 멜 미션 통행증 - 사계의 숲(어려움)")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("매끄러운 이파리", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "매끄러운 이파리",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "매끄러운 이파리")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("농축된 바이올렛 추출액", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "농축된 바이올렛 추출액",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "농축된 바이올렛 추출액")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("변화의 애스터 퍼퓸", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "역동의 대지 - 어려움",
        ]),
        name: "변화의 애스터 퍼퓸",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "변화의 애스터 퍼퓸")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움", "역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("용기의 보리지 퍼퓸", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "역동의 대지 - 어려움",
        ]),
        name: "용기의 보리지 퍼퓸",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "용기의 보리지 퍼퓸")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움", "역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("조화의 코스모스 퍼퓸", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "역동의 대지 - 어려움",
        ]),
        name: "조화의 코스모스 퍼퓸",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "조화의 코스모스 퍼퓸")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움", "역동의 대지 - 어려움"],
            },
        ],
    },
    {
        id: createUniqueId("등나무 꽃 장식", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의 숲 - 쉬움",
        ]),
        name: "등나무 꽃 장식",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "등나무 꽃 장식")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움", "사계의 숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId("농축된 보리지 추출액", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의 숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "농축된 보리지 추출액",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "농축된 보리지 추출액")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의 숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("보리지 추출액", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "보리지 추출액",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "보리지 추출액")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("마그 멜의 꽃 시럽", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "마그 멜의 꽃 시럽",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마그 멜의 꽃 시럽")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("향기로운 꽃잎", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
        ]),
        name: "향기로운 꽃잎",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "향기로운 꽃잎")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 어려움", "사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId("활기 넘치는 송진", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "활기 넘치는 송진",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "활기 넘치는 송진")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("마법의 이삭", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "마법의 이삭",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마법의 이삭")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId("생기 도는 송화", "마그 멜 미션", [
            "사계의숲 - 어려움",
            "사계의숲 - 쉬움",
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "생기 도는 송화",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "생기 도는 송화")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: [
                    "사계의숲 - 어려움",
                    "사계의숲 - 쉬움",
                    "역동의 대지 - 어려움",
                    "역동의 대지 - 쉬움",
                ],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 고급 핀즈비즈 : 피니 펀치",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 고급 핀즈비즈 : 피니 펀치",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 고급 핀즈비즈 : 피니 펀치")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 고급 핀즈비즈 : 푸싱 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 고급 핀즈비즈 : 푸싱 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 고급 핀즈비즈 : 푸싱 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 고급 핀즈비즈 : 힐링 버블",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 고급 핀즈비즈 : 힐링 버블",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 고급 핀즈비즈 : 힐링 버블")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 고급 핀즈비즈 : 풀링 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 고급 핀즈비즈 : 풀링 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 고급 핀즈비즈 : 풀링 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 고급 핀즈비즈 : 플로랄 실드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 고급 핀즈비즈 : 플로랄 실드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 고급 핀즈비즈 : 플로랄 실드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 고급 핀즈비즈 : 윈드 러시",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 고급 핀즈비즈 : 윈드 러시",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 고급 핀즈비즈 : 윈드 러시")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 푸싱 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 푸싱 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 푸싱 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 피니 펀치",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 피니 펀치",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 피니 펀치")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 힐링 버블",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 힐링 버블",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 힐링 버블")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 플로랄 실드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 플로랄 실드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 플로랄 실드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 윈드 러시",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 윈드 러시",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 윈드 러시")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 풀링 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 풀링 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 풀링 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 플로랄 실드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 플로랄 실드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 플로랄 실드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 피니 펀치",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 피니 펀치",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 피니 펀치")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 힐링 버블",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 힐링 버블",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 힐링 버블")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 윈드 러시",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 윈드 러시",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 윈드 러시")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 푸싱 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 푸싱 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 푸싱 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 풀링 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 풀링 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 풀링 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId("케룬의 뿔", "마그 멜 미션", [
            "역동의 대지 - 어려움",
            "역동의 대지 - 쉬움",
        ]),
        name: "케룬의 뿔",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "케룬의 뿔")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["역동의 대지 - 어려움", "역동의 대지 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 힐링 버블",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 힐링 버블",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 힐링 버블")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 플로랄 실드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 플로랄 실드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 플로랄 실드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 윈드 러시",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 윈드 러시",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 윈드 러시")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 중급 핀즈비즈 : 풀링 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 중급 핀즈비즈 : 풀링 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 중급 핀즈비즈 : 풀링 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 플로랄 실드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 플로랄 실드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 플로랄 실드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 피니 펀치",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 피니 펀치",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 피니 펀치")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 힐링 버블",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 힐링 버블",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 힐링 버블")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 윈드 러시",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 윈드 러시",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 윈드 러시")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 푸싱 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 푸싱 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 푸싱 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
    {
        id: createUniqueId(
            "언샤인드 일반 핀즈비즈 : 풀링 필드",
            "마그 멜 미션",
            ["사계의숲 - 쉬움"]
        ),
        name: "언샤인드 일반 핀즈비즈 : 풀링 필드",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "언샤인드 일반 핀즈비즈 : 풀링 필드")?.id}`,
        price: 0,
        drops: [
            {
                dungeon: "마그 멜 미션",
                difficulties: ["사계의숲 - 쉬움"],
            },
        ],
    },
];

// 던전별 아이템 목록을 가져오는 유틸리티 함수
export const getItemsByDungeon = (dungeon: DungeonType): DungeonItem[] => {
    return DUNGEON_ITEMS.filter(item =>
        item.drops.some(drop => drop.dungeon === dungeon)
    );
};

// 던전의 특정 난이도에서 드랍되는 아이템 목록을 가져오는 함수
export const getItemsByDungeonDifficulty = (
    dungeon: DungeonType,
    difficulty: string
): DungeonItem[] => {
    return DUNGEON_ITEMS.filter(item =>
        item.drops.some(
            drop =>
                drop.dungeon === dungeon &&
                drop.difficulties.some(diff => diff === difficulty)
        )
    );
};

// 특정 아이템이 드랍되는 던전과 난이도 정보를 가져오는 함수
export const getItemDropLocations = (itemName: string): ItemDropInfo[] => {
    const item = DUNGEON_ITEMS.find(item => item.name === itemName);
    return item?.drops || [];
};
