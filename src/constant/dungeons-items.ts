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
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "세트 효과 아이스     볼트 강화 +1 주문서")?.id}`,
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
                drop.difficulties.includes(difficulty)
        )
    );
};

// 특정 아이템이 드랍되는 던전과 난이도 정보를 가져오는 함수
export const getItemDropLocations = (itemName: string): ItemDropInfo[] => {
    const item = DUNGEON_ITEMS.find(item => item.name === itemName);
    return item?.drops || [];
};
