export const FEATURE_LINKS = [
    {
        label: "경매장",
        url: "/auction",
        description: "실시간 경매장 아이템 가격을 확인하세요",
        group: "거래·조회",
        searchVisible: true,
    },
    {
        label: "파티 분배 계산기",
        url: "/calculator",
        description: "경매 수수료와 파티 분배액을 계산하세요",
        group: "생활·파티 계산",
        searchVisible: true,
    },
    {
        label: "뿔피리 조회",
        url: "/horn",
        description: "뿔피리 내역을 조회하세요",
        group: "거래·조회",
        searchVisible: true,
    },
    {
        label: "NPC 상점",
        url: "/npc-shop",
        description: "NPC 상점 아이템 정보를 확인하세요",
        group: "거래·조회",
        searchVisible: true,
    },
    {
        label: "세공 시뮬레이터",
        url: "/simulators/reforge",
        description: "목표 옵션의 확률과 비용을 계산하고 세공을 돌려보세요",
        group: "강화 시뮬레이터",
        searchVisible: true,
    },
    {
        label: "문의하기",
        url: "/contact",
        description: "문의사항이나 피드백을 보내주세요",
        group: "도움",
        searchVisible: false,
    },
];
export const FEATURE_GROUPS = [
    "거래·조회",
    "강화 시뮬레이터",
    "아이템 비교",
    "생활·파티 계산",
    "도움",
].filter(group => FEATURE_LINKS.some(link => link.group === group));
export const SITE_DESCRIPTION =
    "시세 확인부터 세공 시뮬레이션, 파티 정산까지. 에린 생활에 필요한 도구를 모았습니다.";
export const SITE_TITLE = "Erinn.me - 마비노기 도우미";
