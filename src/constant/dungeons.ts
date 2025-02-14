export type DungeonType =
    | "브리 레흐"
    | "글렌 베르나"
    | "크롬 바스"
    | "테흐 두인 미션"
    | "마그 멜 미션"
    | "몽환의 라비 던전"
    | "울라 하드 모드 던전"
    | "베테랑 던전"
    | "심연의 페카 상급"
    | "심연의 코일 상급";

export const DUNGEON_LIST: DungeonType[] = [
    "브리 레흐",
    "글렌 베르나",
    "크롬 바스",
    "테흐 두인 미션",
    "마그 멜 미션",
    "몽환의 라비 던전",
    "울라 하드 모드 던전",
    "베테랑 던전",
    "심연의 페카 상급",
    "심연의 코일 상급",
];

export type SubDifficulty = {
    name: string;
    description?: string;
};

export type DungeonInfo = {
    name: DungeonType;
    description: string;
    subDifficulties: SubDifficulty[];
};

export const DUNGEON_INFO: Record<DungeonType, DungeonInfo> = {
    "브리 레흐": {
        name: "브리 레흐",
        description: "브리 레흐 던전입니다.",
        subDifficulties: [
            { name: "1관", description: "브리 레흐 1관입니다." },
            { name: "2관", description: "브리 레흐 2관입니다." },
            { name: "3관", description: "브리 레흐 3관입니다." },
        ],
    },
    "글렌 베르나": {
        name: "글렌 베르나",
        description: "글렌 베르나 던전입니다.",
        subDifficulties: [
            { name: "쉬움" },
            { name: "어려움" },
            { name: "태고의 겨울" },
        ],
    },
    "크롬 바스": {
        name: "크롬 바스",
        description: "크롬 바스 던전입니다.",
        subDifficulties: [{ name: "30" }, { name: "50" }, { name: "100" }],
    },
    "테흐 두인 미션": {
        name: "테흐 두인 미션",
        description: "테흐 두인 미션입니다.",
        subDifficulties: [
            { name: "되살아난 허상 - 어려움" },
            { name: "되살아난 허상 - 쉬움" },
            { name: "페스 피아다 - 어려움" },
            { name: "페스 피아다 - 쉬움" },
            { name: "일곱 번의 악몽 - 어려움" },
            { name: "일곱 번의 악몽 - 쉬움" },
            { name: "깨어난 심해의 군주 - 어려움" },
            { name: "깨어난 심해의 군주 - 쉬움" },
        ],
    },
    "마그 멜 미션": {
        name: "마그 멜 미션",
        description: "마그 멜 미션입니다.",
        subDifficulties: [
            { name: "사계의숲 - 어려움" },
            { name: "사계의숲 - 쉬움" },
            { name: "역동의 대지 - 어려움" },
            { name: "역동의 대지 - 쉬움" },
        ],
    },
    "몽환의 라비 던전": {
        name: "몽환의 라비 던전",
        description: "몽환의 라비 던전입니다.",
        subDifficulties: [],
    },
    "울라 하드 모드 던전": {
        name: "울라 하드 모드 던전",
        description: "울라 하드 모드 던전입니다.",
        subDifficulties: [],
    },
    "베테랑 던전": {
        name: "베테랑 던전",
        description: "베테랑 던전입니다.",
        subDifficulties: [],
    },
    "심연의 페카 상급": {
        name: "심연의 페카 상급",
        description: "심연의 페카 상급 던전입니다.",
        subDifficulties: [],
    },
    "심연의 코일 상급": {
        name: "심연의 코일 상급",
        description: "심연의 코일 상급 던전입니다.",
        subDifficulties: [],
    },
};
