import { CraftingItem } from "@/types";

import { AllItemList } from "./all-item-list";

export const craftingItems: CraftingItem[] = [
    {
        name: "파멸의 문장",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "파멸의 문장")?.id}`,
        materials: [
            {
                name: "붕괴된 마력의 정수",
                quantity: 45,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "붕괴된 마력의 정수")?.id}`,
            },
            {
                name: "응축된 혼돈의 룬",
                quantity: 25,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "응축된 혼돈의 룬")?.id}`,
            },
            {
                name: "최고급 실크",
                quantity: 21,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 실크")?.id}`,
            },
            {
                name: "최고급 옷감",
                quantity: 14,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 옷감")?.id}`,
            },
            {
                name: "질긴 실",
                quantity: 21,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "질긴 실")?.id}`,
            },
        ],
    },
    {
        name: "공허의 로브(남성용)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "공허의 로브(남성용)")?.id}`,
        materials: [
            {
                name: "최고급 실크",
                quantity: 4,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 실크")?.id}`,
            },
            {
                name: "최고급 옷감",
                quantity: 3,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 옷감")?.id}`,
            },
            {
                name: "질긴 실",
                quantity: 4,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "질긴 실")?.id}`,
            },
            {
                name: "붕괴된 마력의 정수",
                quantity: 7,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "붕괴된 마력의 정수")?.id}`,
            },
            {
                name: "응축된 혼돈의 룬",
                quantity: 4,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "응축된 혼돈의 룬")?.id}`,
            },
            {
                name: "최고급 마감용 실",
                quantity: 5,
                price: 2500,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 마감용 실")?.id}`,
            },
            {
                name: "매듭끈",
                quantity: 10,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "매듭끈")?.id}`,
            },
            {
                name: "마력의 황금 실",
                quantity: 15,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마력의 황금 실")?.id}`,
            },
        ],
    },
    {
        name: "공허의 로브(여성용)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "공허의 로브(여성용)")?.id}`,
        materials: [
            {
                name: "최고급 실크",
                quantity: 4,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 실크")?.id}`,
            },
            {
                name: "최고급 옷감",
                quantity: 3,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 옷감")?.id}`,
            },
            {
                name: "질긴 실",
                quantity: 4,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "질긴 실")?.id}`,
            },
            {
                name: "붕괴된 마력의 정수",
                quantity: 7,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "붕괴된 마력의 정수")?.id}`,
            },
            {
                name: "응축된 혼돈의 룬",
                quantity: 4,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "응축된 혼돈의 룬")?.id}`,
            },
            {
                name: "최고급 마감용 실",
                quantity: 5,
                price: 2500,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 마감용 실")?.id}`,
            },
            {
                name: "매듭끈",
                quantity: 10,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "매듭끈")?.id}`,
            },
            {
                name: "마력의 황금 실",
                quantity: 15,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마력의 황금 실")?.id}`,
            },
        ],
    },
    {
        name: "심연의 로브(남성용)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "심연의 로브(남성용)")?.id}`,
        materials: [
            {
                name: "공허의 로브(남성용)",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "공허의 로브(남성용)")?.id}`,
            },
            {
                name: "파멸의 문장",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "파멸의 문장")?.id}`,
            },
            {
                name: "최고급 마감용 실",
                quantity: 5,
                price: 2500,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 마감용 실")?.id}`,
            },
            {
                name: "매듭끈",
                quantity: 10,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "매듭끈")?.id}`,
            },
            {
                name: "마력의 황금 실",
                quantity: 15,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마력의 황금 실")?.id}`,
            },
        ],
    },
    {
        name: "심연의 로브(여성용)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "심연의 로브(여성용)")?.id}`,
        materials: [
            {
                name: "공허의 로브(여성용)",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "공허의 로브(여성용)")?.id}`,
            },
            {
                name: "파멸의 문장",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "파멸의 문장")?.id}`,
            },
            {
                name: "최고급 마감용 실",
                quantity: 5,
                price: 2500,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 마감용 실")?.id}`,
            },
            {
                name: "매듭끈",
                quantity: 10,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "매듭끈")?.id}`,
            },
            {
                name: "마력의 황금 실",
                quantity: 15,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마력의 황금 실")?.id}`,
            },
        ],
    },
    {
        name: "파멸의 로브(남성용)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "파멸의 로브(남성용)")?.id}`,
        materials: [
            {
                name: "심연의 로브(남성용)",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "심연의 로브(남성용)")?.id}`,
            },
            {
                name: "파멸의 문장",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "파멸의 문장")?.id}`,
            },
            {
                name: "최고급 마감용 실",
                quantity: 5,
                price: 2500,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 마감용 실")?.id}`,
            },
            {
                name: "매듭끈",
                quantity: 10,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "매듭끈")?.id}`,
            },
            {
                name: "마력의 황금 실",
                quantity: 15,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마력의 황금 실")?.id}`,
            },
        ],
    },
    {
        name: "파멸의 로브(여성용)",
        imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "파멸의 로브(여성용)")?.id}`,
        materials: [
            {
                name: "심연의 로브(여성용)",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "심연의 로브(여성용)")?.id}`,
            },
            {
                name: "파멸의 문장",
                quantity: 1,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "파멸의 문장")?.id}`,
            },
            {
                name: "최고급 마감용 실",
                quantity: 5,
                price: 2500,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "최고급 마감용 실")?.id}`,
            },
            {
                name: "매듭끈",
                quantity: 10,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "매듭끈")?.id}`,
            },
            {
                name: "마력의 황금 실",
                quantity: 15,
                price: 0,
                imageUrl: `/api/item-image?id=${AllItemList.find(item => item.name === "마력의 황금 실")?.id}`,
            },
        ],
    },
];
