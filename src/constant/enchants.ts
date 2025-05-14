export interface EnchantStat {
    type: string;
    value?: number;
    min?: number;
    max?: number;
}

export interface EnchantInfo {
    name: string;
    stats: EnchantStat[];
}

export const ENCHANT_OPTIONS: { [key: string]: EnchantInfo } = {
    파동: {
        name: "파동",
        stats: [
            {
                type: "내츄럴 매직 실드 랭크 3 이상일 때 마법 공격력",
                min: 8,
                max: 15,
            },
            {
                type: "마나 소비 감소",
                value: 4,
            },
            {
                type: "지력",
                value: 20,
            },
        ],
    },
    공명: {
        name: "공명",
        stats: [
            {
                type: "파이어볼 랭크 1 이상일 때 마법 공격력",
                min: 15,
                max: 20,
            },
            {
                type: "지력",
                value: 50,
            },
        ],
    },
    침식: {
        name: "침식",
        stats: [
            {
                type: "볼트 마법 조합 랭크 2 이상일 때 마법 공격력",
                value: 18,
            },
            {
                type: "최대마나",
                value: 50,
            },
        ],
    },
    붕괴의: {
        name: "붕괴의",
        stats: [
            {
                type: "라이트닝로드 랭크 2 이상일 때 마법 공격력",
                min: 8,
                max: 17,
            },
            {
                type: "아이스 스피어 랭크 2 이상일 때 마나 소비 감소",
                value: 4,
            },
        ],
    },
    의식의: {
        name: "의식의",
        stats: [
            {
                type: "헤일스톰 랭크 1 이상일 때 마법 공격력",
                min: 18,
                max: 25,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "마법 보호",
                value: 1,
            },
        ],
    },
    사념의: {
        name: "사념의",
        stats: [
            {
                type: "썬더 랭크 2 이상일 때 마법 공격력",
                min: 14,
                max: 17,
            },
            {
                type: "마나 소비 감소",
                value: 4,
            },
        ],
    },
    아련한: {
        name: "아련한",
        stats: [
            {
                type: "메테오 스트라이크 랭크 1 이상일 때 마법 공격력",
                min: 25,
                max: 30,
            },
            {
                type: "최대마나",
                value: 100,
            },
            {
                type: "지력",
                value: 10,
            },
        ],
    },
    안락의: {
        name: "안락의",
        stats: [
            {
                type: "최대대미지",
                value: 22,
            },
            {
                type: "마법 공격력",
                value: 6,
            },
            {
                type: "4대 속성 연금술 대미지",
                value: 5,
            },
            {
                type: "음악버프 스킬 효과",
                value: 4,
            },
            {
                type: "음악버프 스킬 지속시간",
                value: 8,
            },
        ],
    },
    어스름한: {
        name: "어스름한",
        stats: [
            {
                type: "아이스볼트 랭크 3단 이상일 때 마법 공격력",
                min: 50,
                max: 65,
            },
            {
                type: "최대마나",
                value: 100,
            },
            {
                type: "마나 소비 감소",
                value: 5,
            },
        ],
    },
    무궁한: {
        name: "무궁한",
        stats: [
            {
                type: "아이스 스피어 랭크 3단 이상일 때 마법 공격력",
                min: 50,
                max: 65,
            },
            {
                type: "썬더 랭크 3단 이상일 때 마나 소비 감소",
                min: 2,
                max: 6,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "지력",
                value: 20,
            },
        ],
    },
    끝없는: {
        name: "끝없는",
        stats: [
            {
                type: "스타 데토네이션 랭크 3단 이상일 때 마법 공격력",
                min: 45,
                max: 65,
            },
            {
                type: "최대마나",
                min: 100,
                max: 200,
            },
        ],
    },
    굳센: {
        name: "굳센",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                value: 3,
            },
            {
                type: "랜스 차지 랭크 3단 이상일 때 최대대미지",
                min: 50,
                max: 70,
            },
            {
                type: "최소대미지",
                min: 20,
                max: 40,
            },
        ],
    },
    거침없는: {
        name: "거침없는",
        stats: [
            {
                type: "윈드밀 랭크 3단 이상일 때 최대대미지",
                min: 50,
                max: 60,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    파괴적인: {
        name: "파괴적인",
        stats: [
            {
                type: "배쉬 랭크 1 이상일 때 최대대미지",
                min: 45,
                max: 60,
            },
            {
                type: "최소대미지",
                min: 30,
                max: 40,
            },
            {
                type: "체력",
                value: 10,
            },
        ],
    },
    해방된: {
        name: "해방된",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
            {
                type: "매그넘 샷 랭크 3단 이상일 때 최대대미지",
                min: 70,
                max: 85,
            },
            {
                type: "솜씨",
                value: 50,
            },
        ],
    },
    은은한: {
        name: "은은한",
        stats: [
            {
                type: "라이프 드레인 랭크 1 이상일 때 모든 속성 연금술 대미지",
                min: 100,
                max: 110,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    깨어난: {
        name: "깨어난",
        stats: [
            {
                type: "4막: 질투의 화신 랭크 3단 이상일 때 마리오네트 최대대미지",
                min: 30,
                max: 50,
            },
            {
                type: "마리오네트 생명력",
                value: 200,
            },
            {
                type: "마리오네트 방어",
                value: 3,
            },
            {
                type: "마리오네트 보호",
                value: 3,
            },
        ],
    },
    위협적인: {
        name: "위협적인",
        stats: [
            {
                type: "연속기 : 대쉬 펀치 랭크 3단 이상일 때 최대대미지",
                min: 50,
                max: 60,
            },
            {
                type: "최소대미지",
                value: 20,
            },
            {
                type: "의지",
                min: 10,
                max: 20,
            },
        ],
    },
    결정적인: {
        name: "결정적인",
        stats: [
            {
                type: "슈팅 러쉬 랭크 3단 이상일 때 최대대미지",
                min: 50,
                max: 60,
            },
            {
                type: "최소대미지",
                value: 25,
            },
            {
                type: "공격 속도",
                min: 4,
                max: 6,
            },
        ],
    },
    속박된: {
        name: "속박된",
        stats: [
            {
                type: "수리검 돌진 랭크 3단 이상일 때 최대대미지",
                min: 50,
                max: 60,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    어두운: {
        name: "어두운",
        stats: [
            {
                type: "데스 마커 랭크 3단 이상일 때 최대대미지",
                min: 50,
                max: 60,
            },
            {
                type: "최소대미지",
                value: 30,
            },
            {
                type: "행운",
                min: 10,
                max: 30,
            },
        ],
    },
    전설의: {
        name: "전설의",
        stats: [
            {
                type: "실드 마스터리 랭크 1 이상일 때 방어",
                min: 30,
                max: 70,
            },
            {
                type: "최대생명력",
                value: 100,
            },
            {
                type: "최대마나",
                value: 100,
            },
        ],
    },
    잊혀진: {
        name: "잊혀진",
        stats: [
            {
                type: "마나 리커버리 랭크 1 이상일 때 마법 공격력",
                min: 10,
                max: 20,
            },
        ],
    },
    폴리포니: {
        name: "폴리포니",
        stats: [
            {
                type: "앵콜 랭크 1 이상일 때 음악버프 스킬 효과",
                min: 4,
                max: 7,
            },
            {
                type: "지력",
                value: 30,
            },
            {
                type: "행운",
                value: 30,
            },
        ],
    },
    결실: {
        name: "결실",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                value: 1,
            },
            {
                type: "파이어볼 랭크 3단 이상일 때 마법 공격력",
                min: 50,
                max: 60,
            },
            {
                type: "마나 소비 감소",
                min: 4,
                max: 8,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    굴레: {
        name: "굴레",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
            {
                type: "스핀 스퍼트 랭크 3단 이상일 때 마법 공격력",
                min: 40,
                max: 55,
            },
            {
                type: "지력",
                value: 30,
            },
        ],
    },
    투사: {
        name: "투사",
        stats: [
            {
                type: "랜스 카운터 랭크 1 이상일 때 최대대미지",
                min: 100,
                max: 110,
            },
            {
                type: "최소대미지",
                min: 50,
                max: 70,
            },
            {
                type: "최대스태미나",
                value: 100,
            },
        ],
    },
    폭주: {
        name: "폭주",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
            {
                type: "다운 어택 랭크 3단 이상일 때 최대대미지",
                min: 60,
                max: 80,
            },
        ],
    },
    투지: {
        name: "투지",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 1,
                max: 2,
            },
            {
                type: "컴뱃 마스터리 랭크 3단 이상일 때 최대대미지",
                min: 60,
                max: 70,
            },
            {
                type: "최대생명력",
                value: 100,
            },
            {
                type: "체력",
                value: 22,
            },
        ],
    },
    영혼: {
        name: "영혼",
        stats: [
            {
                type: "크래시샷 랭크 3단 이상일 때 최대대미지",
                min: 30,
                max: 50,
            },
            {
                type: "크리티컬",
                value: 15,
            },
            {
                type: "솜씨",
                min: 20,
                max: 40,
            },
        ],
    },
    유산: {
        name: "유산",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 1,
                max: 2,
            },
            {
                type: "샌드 버스트 랭크 3단 이상일 때 모든 속성 연금술 대미지",
                min: 100,
                max: 110,
            },
        ],
    },
    동상: {
        name: "동상",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 1,
                max: 2,
            },
            {
                type: "6막: 유혹의 올가미 랭크 3단 이상일 때 마리오네트 최대대미지",
                min: 55,
                max: 65,
            },
            {
                type: "마리오네트 최소대미지",
                value: 80,
            },
        ],
    },
    재현: {
        name: "재현",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
            {
                type: "연속기 : 파운딩 랭크 3단 이상일 때 최대대미지",
                min: 60,
                max: 80,
            },
            {
                type: "체력",
                value: 50,
            },
            {
                type: "의지",
                value: 50,
            },
        ],
    },
    강타: {
        name: "강타",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
            {
                type: "크로스 버스터 랭크 3단 이상일 때 최대대미지",
                min: 60,
                max: 80,
            },
            {
                type: "체력",
                value: 50,
            },
            {
                type: "지력",
                value: 50,
            },
        ],
    },
    잔재: {
        name: "잔재",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
            {
                type: "수리검 폭풍 랭크 3단 이상일 때 최대대미지",
                min: 60,
                max: 80,
            },
            {
                type: "체력",
                value: 50,
            },
            {
                type: "의지",
                value: 50,
            },
        ],
    },
    잔상: {
        name: "잔상",
        stats: [
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
            {
                type: "스피닝 슬래시 랭크 3단 이상일 때 최대대미지",
                min: 60,
                max: 80,
            },
            {
                type: "솜씨",
                value: 50,
            },
            {
                type: "행운",
                value: 50,
            },
        ],
    },
    디펜더: {
        name: "디펜더",
        stats: [
            {
                type: "디펜스 랭크 1 이상일 때 보호",
                min: 3,
                max: 5,
            },
            {
                type: "마법 보호",
                min: 1,
                max: 2,
            },
            {
                type: "최대생명력",
                value: 150,
            },
        ],
    },
    공간: {
        name: "공간",
        stats: [
            {
                type: "그라비테이셔널 풀 랭크 1 이상일 때 마법 공격력",
                min: 10,
                max: 15,
            },
        ],
    },
    템포: {
        name: "템포",
        stats: [
            {
                type: "자장가 랭크 1 이상일 때 음악버프 스킬 효과",
                min: 2,
                max: 3,
            },
            {
                type: "최대생명력",
                value: 100,
            },
            {
                type: "최대마나",
                value: 100,
            },
        ],
    },
    공허한: {
        name: "공허한",
        stats: [
            {
                type: "사이드 슬래시 랭크 3단 이상일 때 마법 공격력",
                min: 15,
                max: 20,
            },
            {
                type: "리볼브 쇼크 랭크 1 이상일 때 최대마나",
                value: 100,
            },
            {
                type: "스타 데토네이션 랭크 2단 이상일 때 지력",
                value: 25,
            },
            {
                type: "스핀 스퍼트 랭크 3단 이상일 때 마나 소비 감소",
                value: 3,
            },
            {
                type: "전투 점성술 마스터리 랭크 1 이상일 때 크리티컬",
                value: 10,
            },
        ],
    },
    별자리: {
        name: "별자리",
        stats: [
            {
                type: "마법 공격력",
                value: 20,
            },
            {
                type: "지력",
                value: 60,
            },
            {
                type: "체력",
                value: 40,
            },
        ],
    },
    밤하늘의: {
        name: "밤하늘의",
        stats: [
            {
                type: "마법 공격력",
                value: 20,
            },
            {
                type: "지력",
                value: 25,
            },
            {
                type: "체력",
                value: 50,
            },
        ],
    },
    나아가는: {
        name: "나아가는",
        stats: [
            {
                type: "마법 공격력",
                min: 10,
                max: 15,
            },
            {
                type: "지력",
                min: 10,
                max: 20,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    확산하는: {
        name: "확산하는",
        stats: [
            {
                type: "마법 공격력",
                min: 10,
                max: 20,
            },
            {
                type: "지력",
                min: 10,
                max: 25,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "체력",
                value: 50,
            },
        ],
    },
    쏟아지는: {
        name: "쏟아지는",
        stats: [
            {
                type: "마법 공격력",
                min: 17,
                max: 25,
            },
            {
                type: "마나 소비 감소",
                min: 1,
                max: 3,
            },
            {
                type: "지력",
                value: 25,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "최대마나",
                value: 80,
            },
            {
                type: "체력",
                value: 50,
            },
        ],
    },
    궤도: {
        name: "궤도",
        stats: [
            {
                type: "마법 공격력",
                min: 10,
                max: 15,
            },
            {
                type: "지력",
                min: 20,
                max: 50,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    은하수: {
        name: "은하수",
        stats: [
            {
                type: "마법 공격력",
                min: 15,
                max: 20,
            },
            {
                type: "지력",
                min: 45,
                max: 60,
            },
            {
                type: "최대마나",
                value: 80,
            },
            {
                type: "체력",
                value: 40,
            },
        ],
    },
    "별 조각": {
        name: "별 조각",
        stats: [
            {
                type: "마법 공격력",
                min: 35,
                max: 45,
            },
            {
                type: "마나 소비 감소",
                value: 8,
            },
            {
                type: "크리티컬",
                value: 7,
            },
            {
                type: "최대마나",
                value: 200,
            },
            {
                type: "체력",
                value: 50,
            },
        ],
    },
    갈망하는: {
        name: "갈망하는",
        stats: [
            {
                type: "최대대미지",
                min: 20,
                max: 25,
            },
            {
                type: "최소대미지",
                value: 15,
            },
            {
                type: "마리오네트 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "방어",
                value: 20,
            },
            {
                type: "밸런스",
                value: 10,
            },
        ],
    },
    열망하는: {
        name: "열망하는",
        stats: [
            {
                type: "마법 공격력",
                min: 22,
                max: 25,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "행운",
                value: 15,
            },
        ],
    },
    소망하는: {
        name: "소망하는",
        stats: [
            {
                type: "4대 속성 연금술 대미지",
                min: 25,
                max: 30,
            },
            {
                type: "최대생명력",
                value: 50,
            },
            {
                type: "최대마나",
                value: 50,
            },
        ],
    },
    가라앉은: {
        name: "가라앉은",
        stats: [
            {
                type: "최대대미지",
                min: 34,
                max: 40,
            },
            {
                type: "최대생명력",
                value: 50,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "보호",
                min: 4,
                max: 5,
            },
        ],
    },
    사라진: {
        name: "사라진",
        stats: [
            {
                type: "최대대미지",
                min: 50,
                max: 55,
            },
            {
                type: "마리오네트 최대대미지",
                value: 10,
            },
            {
                type: "최대생명력",
                value: 25,
            },
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "보호",
                value: 3,
            },
        ],
    },
    뒤덮인: {
        name: "뒤덮인",
        stats: [
            {
                type: "최대대미지",
                value: 15,
            },
            {
                type: "마법 공격력",
                min: 50,
                max: 55,
            },
            {
                type: "4대 속성 연금술 대미지",
                min: 15,
                max: 20,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "마법 보호",
                value: 2,
            },
        ],
    },
    달아나는: {
        name: "달아나는",
        stats: [
            {
                type: "최대대미지",
                min: 22,
                max: 26,
            },
            {
                type: "마리오네트 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    관망하는: {
        name: "관망하는",
        stats: [
            {
                type: "마법 공격력",
                min: 23,
                max: 26,
            },
        ],
    },
    회전하는: {
        name: "회전하는",
        stats: [
            {
                type: "4대 속성 연금술 대미지",
                min: 25,
                max: 30,
            },
            {
                type: "최대생명력",
                value: 10,
            },
            {
                type: "최대마나",
                value: 15,
            },
        ],
    },
    가두는: {
        name: "가두는",
        stats: [
            {
                type: "최대대미지",
                min: 20,
                max: 24,
            },
        ],
    },
    부동의: {
        name: "부동의",
        stats: [
            {
                type: "마법 공격력",
                min: 14,
                max: 15,
            },
        ],
    },
    결빙된: {
        name: "결빙된",
        stats: [
            {
                type: "4대 속성 연금술 대미지",
                min: 12,
                max: 15,
            },
            {
                type: "지력",
                value: 7,
            },
        ],
    },
    "시저 래빗": {
        name: "시저 래빗",
        stats: [
            {
                type: "최대대미지",
                min: 24,
                max: 28,
            },
            {
                type: "마리오네트 최대대미지",
                value: 45,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
            {
                type: "마법 방어",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    구일리온: {
        name: "구일리온",
        stats: [
            {
                type: "마법 공격력",
                min: 25,
                max: 28,
            },
            {
                type: "지력",
                value: 25,
            },
            {
                type: "크리티컬",
                value: 10,
            },
        ],
    },
    구이쉬기: {
        name: "구이쉬기",
        stats: [
            {
                type: "4대 속성 연금술 대미지",
                min: 10,
                max: 15,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    자취: {
        name: "자취",
        stats: [
            {
                type: "최대대미지",
                min: 34,
                max: 40,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "밸런스",
                value: 15,
            },
            {
                type: "마법 보호",
                min: 4,
                max: 5,
            },
            {
                type: "마법 공격력",
                value: 20,
            },
        ],
    },
    궤적: {
        name: "궤적",
        stats: [
            {
                type: "최대대미지",
                min: 50,
                max: 55,
            },
            {
                type: "마리오네트 최대대미지",
                value: 22,
            },
            {
                type: "최대마나",
                value: 25,
            },
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "마법 보호",
                value: 3,
            },
            {
                type: "마법 공격력",
                value: 20,
            },
        ],
    },
    흔적: {
        name: "흔적",
        stats: [
            {
                type: "마법 공격력",
                min: 50,
                max: 55,
            },
            {
                type: "4대 속성 연금술 대미지",
                min: 10,
                max: 15,
            },
            {
                type: "방어",
                value: 10,
            },
            {
                type: "마법 방어",
                value: 20,
            },
            {
                type: "행운",
                value: 25,
            },
        ],
    },
    "폴라하 카트": {
        name: "폴라하 카트",
        stats: [
            {
                type: "최대대미지",
                min: 20,
                max: 24,
            },
            {
                type: "마리오네트 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "마법 공격력",
                value: 7,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    스넷타: {
        name: "스넷타",
        stats: [
            {
                type: "마법 공격력",
                min: 22,
                max: 24,
            },
            {
                type: "크리티컬",
                value: 15,
            },
            {
                type: "마법 보호",
                value: 5,
            },
        ],
    },
    "스노우 슬링": {
        name: "스노우 슬링",
        stats: [
            {
                type: "최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "4대 속성 연금술 대미지",
                min: 10,
                max: 12,
            },
        ],
    },
    자작나무: {
        name: "자작나무",
        stats: [
            {
                type: "최대대미지",
                min: 10,
                max: 12,
            },
        ],
    },
    물결: {
        name: "물결",
        stats: [
            {
                type: "마법 공격력",
                min: 14,
                max: 17,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    거울: {
        name: "거울",
        stats: [
            {
                type: "4대 속성 연금술 대미지",
                min: 17,
                max: 20,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    증오: {
        name: "증오",
        stats: [
            {
                type: "최대대미지",
                value: 16,
            },
            {
                type: "마법 공격력",
                value: 5,
            },
            {
                type: "4대 속성 연금술 대미지",
                value: 7,
            },
            {
                type: "마리오네트 최대대미지",
                value: 16,
            },
            {
                type: "보호",
                value: 2,
            },
            {
                type: "마법 보호",
                value: 5,
            },
        ],
    },
    인페르노: {
        name: "인페르노",
        stats: [
            {
                type: "데스 마커 랭크 3단 이상일 때 최대대미지",
                min: 20,
                max: 45,
            },
            {
                type: "솜씨",
                value: 12,
            },
            {
                type: "행운",
                value: 20,
            },
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 1,
                max: 3,
            },
        ],
    },
    스텔라: {
        name: "스텔라",
        stats: [
            {
                type: "수리검 돌진 랭크 3단 이상일 때 최대대미지",
                min: 25,
                max: 50,
            },
            {
                type: "의지",
                value: 20,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 1,
                max: 3,
            },
        ],
    },
    퓨리: {
        name: "퓨리",
        stats: [
            {
                type: "크로스 버스터 랭크 3단 이상일 때 최대대미지",
                min: 20,
                max: 45,
            },
            {
                type: "지력",
                value: 40,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 1,
                max: 3,
            },
        ],
    },
    광포한: {
        name: "광포한",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 일 때 최대대미지",
                value: 12,
            },
            {
                type: "매직 마스터리 랭크 1 일 때 마법 공격력",
                value: 5,
            },
            {
                type: "밸런스",
                value: 1,
            },
        ],
    },
    판타지: {
        name: "판타지",
        stats: [
            {
                type: "메테오 스트라이크 랭크 1 이상일 때 마법 공격력",
                value: 6,
            },
        ],
    },
    황금: {
        name: "황금",
        stats: [
            {
                type: "소드 마스터리 랭크 1 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "인스턴트 캐스팅 랭크 1 이상일 때 마법 공격력",
                value: 3,
            },
            {
                type: "라이트 아머 마스터리 랭크 1 이상일 때 마법 방어",
                min: 1,
                max: 2,
            },
            {
                type: "디펜스 랭크 1 이상일 때 마법 보호",
                min: 1,
                max: 2,
            },
            {
                type: "윈드밀 랭크 1 이상일 때 최대생명력",
                value: 100,
            },
        ],
    },
    활발한: {
        name: "활발한",
        stats: [
            {
                type: "현혹의 연주 랭크 1 이상일 때 음악버프 스킬 효과",
                min: 1,
                max: 2,
            },
            {
                type: "볼트 마법 조합 랭크 1 이상일 때 마법 공격력",
                min: 2,
                max: 4,
            },
            {
                type: "회피 랭크 6 이상일 때 최대생명력",
                value: 50,
            },
        ],
    },
    다이나믹: {
        name: "다이나믹",
        stats: [
            {
                type: "현혹의 연주 랭크 1 이상일 때 음악버프 스킬 효과",
                min: 1,
                max: 2,
            },
            {
                type: "볼트 마법 조합 랭크 1 이상일 때 마법 공격력",
                min: 2,
                max: 4,
            },
            {
                type: "회피 랭크 6 이상일 때 최대생명력",
                value: 50,
            },
        ],
    },
    은하계의: {
        name: "은하계의",
        stats: [
            {
                type: "라이프 드레인 랭크 1 이상일 때 4대 속성 연금술 대미지",
                min: 4,
                max: 9,
            },
            {
                type: "연성 마스터리 랭크 1 이상일 때 최대마나",
                min: 30,
                max: 70,
            },
        ],
    },
    헤비레인: {
        name: "헤비레인",
        stats: [
            {
                type: "최소대미지",
                min: 25,
                max: 35,
            },
            {
                type: "최대대미지",
                min: 60,
                max: 70,
            },
            {
                type: "크리티컬",
                value: 15,
            },
        ],
    },
    다운버스트: {
        name: "다운버스트",
        stats: [
            {
                type: "최대대미지",
                min: 65,
                max: 75,
            },
            {
                type: "체력",
                value: 30,
            },
            {
                type: "행운",
                value: 20,
            },
            {
                type: "의지",
                value: 20,
            },
        ],
    },
    창백한: {
        name: "창백한",
        stats: [
            {
                type: "최대대미지",
                min: 55,
                max: 65,
            },
            {
                type: "크리티컬",
                value: 18,
            },
            {
                type: "솜씨",
                value: 35,
            },
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 2,
                max: 3,
            },
        ],
    },
    여우비: {
        name: "여우비",
        stats: [
            {
                type: "불 속성 연금술 대미지",
                min: 40,
                max: 50,
            },
            {
                type: "물 속성 연금술 대미지",
                min: 60,
                max: 70,
            },
            {
                type: "크리티컬",
                value: 18,
            },
        ],
    },
    스카이글로우: {
        name: "스카이글로우",
        stats: [
            {
                type: "마리오네트 최대대미지",
                value: 80,
            },
            {
                type: "마리오네트 조종술 크리티컬",
                value: 15,
            },
            {
                type: "체력",
                min: 40,
                max: 50,
            },
        ],
    },
    나이트폴: {
        name: "나이트폴",
        stats: [
            {
                type: "마법 공격력",
                min: 45,
                max: 55,
            },
            {
                type: "마나 소비 감소",
                value: 8,
            },
            {
                type: "최대마나",
                min: 75,
                max: 100,
            },
        ],
    },
    야상곡: {
        name: "야상곡",
        stats: [
            {
                type: "샌드 버스트 랭크 2단 이상일 때 4대 속성 연금술 대미지",
                min: 2,
                max: 5,
            },
            {
                type: "마나 포밍 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 14,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "솜씨",
                value: 20,
            },
        ],
    },
    녹턴: {
        name: "녹턴",
        stats: [
            {
                type: "샌드 버스트 랭크 2단 이상일 때 4대 속성 연금술 대미지",
                min: 2,
                max: 5,
            },
            {
                type: "마나 포밍 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 14,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "솜씨",
                value: 20,
            },
        ],
    },
    한밤의: {
        name: "한밤의",
        stats: [
            {
                type: "레벨이 100 이상일때 최대대미지",
                min: 9,
                max: 16,
            },
            {
                type: "어전트 샷 랭크 1 이상일 때 솜씨",
                min: 17,
                max: 25,
            },
            {
                type: "최대생명력",
                value: 50,
            },
            {
                type: "행운",
                value: 20,
            },
        ],
    },
    미드나잇: {
        name: "미드나잇",
        stats: [
            {
                type: "레벨이 100 이상일때 최대대미지",
                min: 9,
                max: 16,
            },
            {
                type: "어전트 샷 랭크 1 이상일 때 솜씨",
                min: 17,
                max: 25,
            },
            {
                type: "최대생명력",
                value: 50,
            },
            {
                type: "행운",
                value: 20,
            },
        ],
    },
    재회: {
        name: "재회",
        stats: [
            {
                type: "1막: 우연한 충돌 랭크 1 이상일 때 최대대미지",
                min: 9,
                max: 16,
            },
            {
                type: "와이어 바인딩 랭크 1 이상일 때 체력",
                min: 17,
                max: 25,
            },
            {
                type: "마리오네트 최대대미지",
                value: 40,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "지력",
                value: 20,
            },
        ],
    },
    "꿈결 같은": {
        name: "꿈결 같은",
        stats: [
            {
                type: "탐험 레벨이 20 이상일때 최대대미지",
                min: 7,
                max: 15,
            },
            {
                type: "볼트 마법 조합 랭크 1 이상일 때 지력",
                value: 25,
            },
            {
                type: "마법 공격력",
                min: 2,
                max: 5,
            },
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    스나이퍼의: {
        name: "스나이퍼의",
        stats: [
            {
                type: "리로드 랭크 9 이상일 때 공격 속도",
                value: 2,
            },
            {
                type: "듀얼건 마스터리 랭크 5 이상일 때 최소대미지",
                value: 7,
            },
            {
                type: "크로스 버스터 랭크 7 이상일 때 최대대미지",
                min: 5,
                max: 12,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    초자연: {
        name: "초자연",
        stats: [
            {
                type: "볼트 마스터리 랭크 8 이상일 때 마법 공격력",
                min: 5,
                max: 7,
            },
            {
                type: "매직 마스터리 랭크 9 이상일 때 마나 소비 감소",
                min: 2,
                max: 4,
            },
            {
                type: "최대생명력",
                value: 100,
            },
            {
                type: "최대마나",
                value: 100,
            },
        ],
    },
    베어헌터: {
        name: "베어헌터",
        stats: [
            {
                type: "스매시 랭크 9 이상일 때 최소대미지",
                min: 6,
                max: 9,
            },
            {
                type: "윈드밀 랭크 9 이상일 때 최대대미지",
                min: 6,
                max: 9,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    커튼콜: {
        name: "커튼콜",
        stats: [
            {
                type: "마리오네트 조종술 랭크 1 이상일 때 마리오네트 최소대미지",
                min: 15,
                max: 20,
            },
            {
                type: "7막: 광란의 질주 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 20,
                max: 30,
            },
            {
                type: "와이어 바인딩 랭크 3 이상일 때 마리오네트 조종술 크리티컬",
                value: 7,
            },
            {
                type: "와이어 풀링 랭크 3 이상일 때 마리오네트 생명력",
                value: 100,
            },
        ],
    },
    방백: {
        name: "방백",
        stats: [
            {
                type: "2막: 솟구치는 분노 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 7,
                max: 12,
            },
            {
                type: "9막: 깨어나는 생명 랭크 3 이상일 때 마리오네트 생명력",
                value: 50,
            },
            {
                type: "콜로서스 마리오네트 랭크 1 이상일 때 최대대미지",
                min: 8,
                max: 10,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    증류된: {
        name: "증류된",
        stats: [
            {
                type: "프로즌 블래스트 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 20,
                max: 30,
            },
            {
                type: "샌드 버스트 랭크 1 이상일 때 흙 속성 연금술 대미지",
                min: 25,
                max: 35,
            },
            {
                type: "스파크 랭크 6 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "라이프 드레인 랭크 7 이상일 때 방어",
                value: 5,
            },
        ],
    },
    강철의: {
        name: "강철의",
        stats: [
            {
                type: "합성 랭크 1 이상일 때 4대 속성 연금술 대미지",
                min: 6,
                max: 10,
            },
            {
                type: "방호벽 랭크 1 이상일 때 방어",
                min: 7,
                max: 12,
            },
            {
                type: "라이프 드레인 랭크 1 이상일 때 보호",
                value: 2,
            },
            {
                type: "충격 상쇄 발동시 방어",
                value: 20,
            },
            {
                type: "충격 상쇄 발동시 마법 방어",
                value: 10,
            },
        ],
    },
    지원: {
        name: "지원",
        stats: [
            {
                type: "썬더 랭크 1 이상일 때 마법 공격력",
                min: 4,
                max: 7,
            },
            {
                type: "아이스 스피어 랭크 1 이상일 때 지력",
                min: 20,
                max: 45,
            },
            {
                type: "파이어볼 랭크 1 이상일 때 마나 소비 감소",
                value: 2,
            },
        ],
    },
    서포트: {
        name: "서포트",
        stats: [
            {
                type: "썬더 랭크 1 이상일 때 마법 공격력",
                min: 4,
                max: 7,
            },
            {
                type: "아이스 스피어 랭크 1 이상일 때 지력",
                min: 20,
                max: 45,
            },
            {
                type: "파이어볼 랭크 1 이상일 때 마나 소비 감소",
                value: 2,
            },
        ],
    },
    소서러: {
        name: "소서러",
        stats: [
            {
                type: "라이트닝로드 랭크 1 이상일 때 마법 공격력",
                min: 3,
                max: 7,
            },
            {
                type: "메테오 스트라이크 랭크 3 이상일 때 최대대미지",
                min: 4,
                max: 8,
            },
            {
                type: "블레이즈 랭크 1 이상일 때 지력",
                value: 20,
            },
            {
                type: "매직 마스터리 랭크 1 이상일 때 최대마나",
                value: 100,
            },
        ],
    },
    다양한: {
        name: "다양한",
        stats: [
            {
                type: "불 연금술 마스터리 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 10,
                max: 20,
            },
            {
                type: "물 연금술 마스터리 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 10,
                max: 20,
            },
            {
                type: "바람 연금술 마스터리 랭크 1 이상일 때 바람 속성 연금술 대미지",
                value: 10,
            },
            {
                type: "흙 연금술 마스터리 랭크 1 이상일 때 흙 속성 연금술 대미지",
                value: 10,
            },
        ],
    },
    날으는: {
        name: "날으는",
        stats: [
            {
                type: "볼트 마법 조합 랭크 1 이상일 때 마법 공격력",
                min: 4,
                max: 8,
            },
            {
                type: "매직 마스터리 랭크 1 이상일 때 방어",
                min: 2,
                max: 5,
            },
            {
                type: "마나 리커버리 랭크 1 이상일 때 보호",
                value: 2,
            },
        ],
    },
    플라이: {
        name: "플라이",
        stats: [
            {
                type: "볼트 마법 조합 랭크 1 이상일 때 마법 공격력",
                min: 4,
                max: 8,
            },
            {
                type: "매직 마스터리 랭크 1 이상일 때 방어",
                min: 2,
                max: 5,
            },
            {
                type: "마나 리커버리 랭크 1 이상일 때 보호",
                value: 2,
            },
        ],
    },
    회오리: {
        name: "회오리",
        stats: [
            {
                type: "파 어웨이 랭크 1 이상일 때 최대대미지",
                min: 18,
                max: 25,
            },
            {
                type: "리로드 랭크 1 이상일 때 공격 속도",
                min: 3,
                max: 6,
            },
            {
                type: "프렌지 랭크 3 이상일 때 밸런스",
                value: 15,
            },
        ],
    },
    명사수: {
        name: "명사수",
        stats: [
            {
                type: "매그넘 샷 랭크 1 이상일 때 최소대미지",
                min: 10,
                max: 20,
            },
            {
                type: "어전트 샷 랭크 1 이상일 때 최대대미지",
                min: 18,
                max: 25,
            },
            {
                type: "보우 마스터리 랭크 1 이상일 때 솜씨",
                value: 30,
            },
        ],
    },
    마크스맨: {
        name: "마크스맨",
        stats: [
            {
                type: "매그넘 샷 랭크 1 이상일 때 최소대미지",
                min: 10,
                max: 20,
            },
            {
                type: "어전트 샷 랭크 1 이상일 때 최대대미지",
                min: 18,
                max: 25,
            },
            {
                type: "보우 마스터리 랭크 1 이상일 때 솜씨",
                value: 30,
            },
        ],
    },
    운명의: {
        name: "운명의",
        stats: [
            {
                type: "소드 마스터리 랭크 1 이상일 때 최소대미지",
                min: 10,
                max: 20,
            },
            {
                type: "스매시 랭크 1 이상일 때 최대대미지",
                min: 24,
                max: 32,
            },
            {
                type: "실드 마스터리 랭크 5 이상일 때 행운",
                value: 15,
            },
        ],
    },
    랜시아: {
        name: "랜시아",
        stats: [
            {
                type: "랜스 차지 랭크 1 이상일 때 최소대미지",
                min: 15,
                max: 25,
            },
            {
                type: "랜스 카운터 랭크 1 이상일 때 최대대미지",
                min: 24,
                max: 34,
            },
            {
                type: "랜스 마스터리 랭크 1 이상일 때 피어싱 레벨",
                value: 3,
            },
        ],
    },
    "샤프 슈터": {
        name: "샤프 슈터",
        stats: [
            {
                type: "클로저 랭크 1 이상일 때 최소대미지",
                value: 10,
            },
            {
                type: "슈팅 러쉬 랭크 1 이상일 때 최대대미지",
                min: 20,
                max: 35,
            },
            {
                type: "듀얼건 마스터리 랭크 1 이상일 때 공격 속도",
                min: 3,
                max: 6,
            },
        ],
    },
    로켓: {
        name: "로켓",
        stats: [
            {
                type: "레인지 컴뱃 마스터리 랭크 1 이상일 때 최소대미지",
                min: 10,
                max: 20,
            },
            {
                type: "서포트 샷 랭크 1 이상일 때 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "크로스보우 마스터리 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    칼날: {
        name: "칼날",
        stats: [
            {
                type: "듀얼 웨폰 마스터리 랭크 1 이상일 때 최소대미지",
                value: 20,
            },
            {
                type: "배쉬 랭크 1 이상일 때 최대대미지",
                min: 30,
                max: 40,
            },
            {
                type: "카운터 어택 랭크 1 이상일 때 체력",
                min: 20,
                max: 30,
            },
            {
                type: "회피 랭크 6 이상일 때 의지",
                value: 15,
            },
        ],
    },
    코리브: {
        name: "코리브",
        stats: [
            {
                type: "레이지 임팩트 랭크 1 이상일 때 최소대미지",
                min: 20,
                max: 30,
            },
            {
                type: "다운 어택 랭크 1 이상일 때 최대대미지",
                min: 28,
                max: 36,
            },
            {
                type: "돌진 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                value: 1,
            },
        ],
    },
    벚꽃: {
        name: "벚꽃",
        stats: [
            {
                type: "수리검 폭쇄 랭크 9 이상일 때 최소대미지",
                min: 5,
                max: 10,
            },
            {
                type: "수리검 폭풍 랭크 6 이상일 때 최대대미지",
                min: 10,
                max: 12,
            },
            {
                type: "잿빛 연막술 랭크 9 이상일 때 크리티컬",
                value: 7,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    꿰뚫는: {
        name: "꿰뚫는",
        stats: [
            {
                type: "랜스 마스터리 랭크 3 이상일 때 피어싱 레벨",
                value: 2,
            },
            {
                type: "랜스 차지 랭크 5 이상일 때 최소대미지",
                min: 7,
                max: 14,
            },
            {
                type: "최대스태미나",
                value: 100,
            },
        ],
    },
    증발된: {
        name: "증발된",
        stats: [
            {
                type: "플레이머 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 20,
                max: 30,
            },
            {
                type: "윈드 블래스트 랭크 1 이상일 때 바람 속성 연금술 대미지",
                min: 25,
                max: 35,
            },
            {
                type: "스파크 랭크 5 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "라이프 드레인 랭크 8 이상일 때 방어",
                value: 4,
            },
        ],
    },
    상성: {
        name: "상성",
        stats: [
            {
                type: "플레이머 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 10,
                max: 20,
            },
            {
                type: "레인 캐스팅 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 10,
                max: 20,
            },
            {
                type: "최대생명력",
                value: 30,
            },
            {
                type: "최대마나",
                value: 30,
            },
            {
                type: "솜씨",
                value: 20,
            },
        ],
    },
    레플리카: {
        name: "레플리카",
        stats: [
            {
                type: "6막: 유혹의 올가미 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 11,
                max: 15,
            },
            {
                type: "1막: 우연한 충돌 랭크 3 이상일 때 마리오네트 조종술 크리티컬",
                min: 5,
                max: 10,
            },
            {
                type: "피에로 마리오네트 랭크 3 이상일 때 마리오네트 방어",
                value: 5,
            },
            {
                type: "콜로서스 마리오네트 랭크 3 이상일 때 마리오네트 보호",
                value: 2,
            },
        ],
    },
    "럭키 펀치": {
        name: "럭키 펀치",
        stats: [
            {
                type: "너클 마스터리 랭크 9 이상일 때 밸런스",
                value: 10,
            },
            {
                type: "연속기 마스터리 랭크 9 이상일 때 최소대미지",
                min: 10,
                max: 20,
            },
            {
                type: "연속기 : 대쉬 펀치 랭크 8 이상일 때 최대대미지",
                value: 24,
            },
            {
                type: "의지",
                value: 30,
            },
        ],
    },
    독백: {
        name: "독백",
        stats: [
            {
                type: "4막: 질투의 화신 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "1막: 우연한 충돌 랭크 3 이상일 때 마리오네트 조종술 크리티컬",
                min: 5,
                max: 8,
            },
            {
                type: "피에로 마리오네트 랭크 1 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "의지",
                value: 20,
            },
        ],
    },
    모놀로그: {
        name: "모놀로그",
        stats: [
            {
                type: "4막: 질투의 화신 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "1막: 우연한 충돌 랭크 3 이상일 때 마리오네트 조종술 크리티컬",
                min: 5,
                max: 8,
            },
            {
                type: "피에로 마리오네트 랭크 1 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "의지",
                value: 20,
            },
        ],
    },
    성단: {
        name: "성단",
        stats: [
            {
                type: "엘리멘탈 웨이브 랭크 1 이상일 때 4대 속성 연금술 대미지",
                min: 10,
                max: 15,
            },
            {
                type: "연금술 마스터리 랭크 1 이상일 때 최대대미지",
                min: 6,
                max: 7,
            },
        ],
    },
    성운: {
        name: "성운",
        stats: [
            {
                type: "매직 마스터리 랭크 1 이상일 때 마법 공격력",
                min: 8,
                max: 10,
            },
            {
                type: "무빙 캐스팅 랭크 1 이상일 때 지력",
                min: 10,
                max: 20,
            },
        ],
    },
    월식: {
        name: "월식",
        stats: [
            {
                type: "매직 웨폰 마스터리 랭크 1 이상일 때 마법 공격력",
                min: 6,
                max: 9,
            },
            {
                type: "마나 리커버리 랭크 1 이상일 때 마나 소비 감소",
                min: 2,
                max: 4,
            },
        ],
    },
    일식: {
        name: "일식",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 이상일 때 최대대미지",
                min: 11,
                max: 16,
            },
            {
                type: "디펜스 랭크 1 이상일 때 최소대미지",
                min: 5,
                max: 10,
            },
        ],
    },
    "솔라 이클립스": {
        name: "솔라 이클립스",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 이상일 때 최대대미지",
                min: 11,
                max: 16,
            },
            {
                type: "디펜스 랭크 1 이상일 때 최소대미지",
                min: 5,
                max: 10,
            },
        ],
    },
    직감의: {
        name: "직감의",
        stats: [
            {
                type: "최대대미지",
                min: 3,
                max: 6,
            },
            {
                type: "마법 공격력",
                min: 2,
                max: 4,
            },
        ],
    },
    숙련자: {
        name: "숙련자",
        stats: [
            {
                type: "힘의 결속 특성 8 레벨 이상일 때 최대대미지",
                min: 13,
                max: 15,
            },
            {
                type: "시간 왜곡 특성 5 레벨 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
            {
                type: "이면을 보는 눈 특성 사용 1회 당 경계흔 최대 획득 갯수",
                value: 3,
            },
            {
                type: "최대마나",
                value: 50,
            },
        ],
    },
    낙원: {
        name: "낙원",
        stats: [
            {
                type: "굳건한 의지 특성 8 레벨 이상일 때 최대대미지",
                min: 18,
                max: 25,
            },
            {
                type: "재생의 영역 특성 5 레벨 이상일 때 최대스태미나",
                min: 20,
                max: 30,
            },
            {
                type: "방어",
                value: 10,
            },
            {
                type: "밸런스",
                value: 20,
            },
        ],
    },
    희미한: {
        name: "희미한",
        stats: [
            {
                type: "급소 관통 특성 8 레벨 이상일 때 최대대미지",
                min: 18,
                max: 25,
            },
            {
                type: "상태 지원 특성 5 레벨 이상일 때 크리티컬",
                min: 10,
                max: 15,
            },
            {
                type: "마법 보호",
                value: 6,
            },
            {
                type: "최소대미지",
                value: 5,
            },
        ],
    },
    노련한: {
        name: "노련한",
        stats: [
            {
                type: "원소 연마 특성 8 레벨 이상일 때 최대대미지",
                min: 14,
                max: 17,
            },
            {
                type: "기사회생 특성 5 레벨 이상일 때 최소대미지",
                min: 5,
                max: 10,
            },
            {
                type: "초월 : 생명 재사용 대기시간 초기화 확률",
                value: 3,
            },
            {
                type: "최대생명력",
                value: 50,
            },
        ],
    },
    사파이어: {
        name: "사파이어",
        stats: [
            {
                type: "레벨이 40 이상일때 솜씨",
                value: 3,
            },
            {
                type: "레벨이 30 이상일때 의지",
                value: 7,
            },
            {
                type: "레벨이 30 이상일때 행운",
                value: 10,
            },
        ],
    },
    판타스틱: {
        name: "판타스틱",
        stats: [
            {
                type: "탐험 레벨이 15 이상일때 최대대미지",
                min: 8,
                max: 15,
            },
            {
                type: "최소대미지",
                value: 2,
            },
        ],
    },
    철옹성: {
        name: "철옹성",
        stats: [
            {
                type: "충격 상쇄 발동시 방어",
                value: 70,
            },
            {
                type: "충격 상쇄 발동시 마법 방어",
                value: 30,
            },
            {
                type: "최대대미지",
                value: 5,
            },
        ],
    },
    모래시계: {
        name: "모래시계",
        stats: [
            {
                type: "시간 왜곡 쿨타임 무시 횟수",
                value: 1,
            },
            {
                type: "최대대미지",
                min: 4,
                max: 8,
            },
        ],
    },
    결의: {
        name: "결의",
        stats: [
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                min: 8,
                max: 17,
            },
            {
                type: "크리티컬 히트 랭크 1 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
        ],
    },
    레솔루션: {
        name: "레솔루션",
        stats: [
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                min: 8,
                max: 17,
            },
            {
                type: "크리티컬 히트 랭크 1 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
        ],
    },
    영감: {
        name: "영감",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
            {
                type: "체력",
                min: 15,
                max: 30,
            },
            {
                type: "최대대미지",
                min: 8,
                max: 17,
            },
        ],
    },
    브레인스톰: {
        name: "브레인스톰",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
            {
                type: "체력",
                min: 15,
                max: 30,
            },
            {
                type: "최대대미지",
                min: 8,
                max: 17,
            },
        ],
    },
    "현자의 돌": {
        name: "현자의 돌",
        stats: [
            {
                type: "워터 캐논 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "워터 캐논 랭크 3단 이상일 때 물 속성 연금술 대미지",
                min: 10,
                max: 14,
            },
            {
                type: "플레이머 랭크 3단 이상일 때 불 속성 연금술 대미지",
                min: 10,
                max: 14,
            },
            {
                type: "솜씨",
                value: 30,
            },
        ],
    },
    유인: {
        name: "유인",
        stats: [
            {
                type: "최소대미지",
                min: 5,
                max: 10,
            },
            {
                type: "최대대미지",
                min: 38,
                max: 52,
            },
            {
                type: "크리티컬",
                value: 20,
            },
            {
                type: "체력",
                value: 50,
            },
            {
                type: "최대생명력",
                value: 100,
            },
        ],
    },
    신비: {
        name: "신비",
        stats: [
            {
                type: "최대대미지",
                min: 6,
                max: 8,
            },
            {
                type: "행운",
                value: 20,
            },
        ],
    },
    미스터리: {
        name: "미스터리",
        stats: [
            {
                type: "최대대미지",
                min: 6,
                max: 8,
            },
            {
                type: "행운",
                value: 20,
            },
        ],
    },
    소나타: {
        name: "소나타",
        stats: [
            {
                type: "전장의 서곡 랭크 1 이상일 때 최대대미지",
                min: 15,
                max: 18,
            },
            {
                type: "작곡 랭크 1 이상일 때 음악버프 스킬 효과",
                min: 4,
                max: 6,
            },
            {
                type: "음악적 지식 랭크 1 이상일 때 음악버프 스킬 지속시간",
                value: 10,
            },
            {
                type: "솜씨",
                value: 25,
            },
            {
                type: "체력",
                value: 25,
            },
        ],
    },
    진귀한: {
        name: "진귀한",
        stats: [
            {
                type: "최대대미지",
                min: 25,
                max: 40,
            },
            {
                type: "크리티컬",
                value: 13,
            },
            {
                type: "솜씨",
                value: 30,
            },
            {
                type: "피어싱 레벨",
                min: 1,
                max: 3,
            },
        ],
    },
    고독: {
        name: "고독",
        stats: [
            {
                type: "최소대미지",
                value: 10,
            },
            {
                type: "최대대미지",
                min: 25,
                max: 50,
            },
            {
                type: "체력",
                value: 25,
            },
            {
                type: "의지",
                value: 3,
            },
            {
                type: "피어싱 레벨",
                min: 1,
                max: 3,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    포효: {
        name: "포효",
        stats: [
            {
                type: "마법 공격력",
                min: 15,
                max: 30,
            },
            {
                type: "마나 소비 감소",
                value: 4,
            },
            {
                type: "최대마나",
                min: 10,
                max: 50,
            },
            {
                type: "크리티컬",
                value: 7,
            },
            {
                type: "최대생명력",
                value: 30,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    수호자: {
        name: "수호자",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
            {
                type: "공격 속도",
                min: 1,
                max: 3,
            },
            {
                type: "방어",
                value: 3,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "마법 방어",
                value: 3,
            },
            {
                type: "마법 보호",
                value: 1,
            },
        ],
    },
    균열: {
        name: "균열",
        stats: [
            {
                type: "최소대미지",
                min: 15,
                max: 30,
            },
            {
                type: "최대대미지",
                min: 25,
                max: 45,
            },
            {
                type: "크리티컬",
                value: 10,
            },
        ],
    },
    기둥: {
        name: "기둥",
        stats: [
            {
                type: "최대대미지",
                min: 25,
                max: 50,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "피어싱 레벨",
                min: 1,
                max: 3,
            },
            {
                type: "체력",
                value: 25,
            },
        ],
    },
    날선: {
        name: "날선",
        stats: [
            {
                type: "레벨이 100 이상일때 최대대미지",
                value: 12,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    칠흑의: {
        name: "칠흑의",
        stats: [
            {
                type: "스피닝 슬래시 랭크 3단 이상일 때 최대대미지",
                min: 16,
                max: 18,
            },
            {
                type: "데스 마커 랭크 1단 이상일 때 최소대미지",
                min: 5,
                max: 10,
            },
            {
                type: "투아림 익스플로전 랭크 1 이상일 때 행운",
                value: 10,
            },
            {
                type: "앵커 러시 랭크 1 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "체인 스위핑 랭크 2 이하일 때 최대대미지",
                value: 10,
            },
        ],
    },
    수퍼노바: {
        name: "수퍼노바",
        stats: [
            {
                type: "크리티컬 히트 랭크 1 이상일 때 최소대미지",
                min: 10,
                max: 28,
            },
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                min: 20,
                max: 39,
            },
            {
                type: "배쉬 랭크 1 이상일 때 크리티컬",
                value: 7,
            },
            {
                type: "최대생명력",
                value: 55,
            },
        ],
    },
    미티어로이드: {
        name: "미티어로이드",
        stats: [
            {
                type: "배쉬 랭크 1 이상일 때 최대대미지",
                min: 22,
                max: 48,
            },
            {
                type: "디펜스 랭크 1 이상일 때 체력",
                value: 25,
            },
            {
                type: "회피 랭크 6 이상일 때 행운",
                value: 15,
            },
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                min: 1,
                max: 3,
            },
        ],
    },
    나선의: {
        name: "나선의",
        stats: [
            {
                type: "윈드밀 랭크 1 이상일 때 체력",
                value: 57,
            },
            {
                type: "다운 어택 랭크 1 이상일 때 최대대미지",
                min: 15,
                max: 39,
            },
            {
                type: "크리티컬 히트 랭크 1 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
        ],
    },
    충돌의: {
        name: "충돌의",
        stats: [
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                min: 15,
                max: 32,
            },
            {
                type: "스매시 랭크 1 이상일 때 최소대미지",
                value: 15,
            },
            {
                type: "회피 랭크 6 이상일 때 체력",
                min: 20,
                max: 45,
            },
        ],
    },
    그늘: {
        name: "그늘",
        stats: [
            {
                type: "체인 블레이드 마스터리 랭크 5 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "체인 크러시 랭크 9 이상일 때 행운",
                min: 3,
                max: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    새벽달: {
        name: "새벽달",
        stats: [
            {
                type: "체인 블레이드 마스터리 랭크 1 이상일 때 최대대미지",
                min: 17,
                max: 25,
            },
            {
                type: "도르카 컨버전 랭크 5 이상일 때 행운",
                min: 13,
                max: 20,
            },
            {
                type: "방어",
                value: 5,
            },
        ],
    },
    매몰찬: {
        name: "매몰찬",
        stats: [
            {
                type: "도르카 마스터리 랭크 1 이상일 때 최대대미지",
                value: 9,
            },
            {
                type: "투아림 익스플로전 랭크 5 이상일 때 솜씨",
                min: 5,
                max: 10,
            },
            {
                type: "크리티컬",
                min: 3,
                max: 8,
            },
        ],
    },
    만월: {
        name: "만월",
        stats: [
            {
                type: "체인 블레이드 마스터리 랭크 5 이상일 때 최대대미지",
                min: 8,
                max: 16,
            },
            {
                type: "체인 임페일 랭크 9 이상일 때 행운",
                min: 5,
                max: 10,
            },
            {
                type: "방어",
                value: 3,
            },
        ],
    },
    춤추는: {
        name: "춤추는",
        stats: [
            {
                type: "도르카 마스터리 랭크 1 이상일 때 최대대미지",
                min: 13,
                max: 20,
            },
            {
                type: "데스 마커 랭크 5 이상일 때 솜씨",
                min: 13,
                max: 20,
            },
            {
                type: "최대생명력",
                value: 50,
            },
        ],
    },
    그믐달: {
        name: "그믐달",
        stats: [
            {
                type: "체인 블레이드 마스터리 랭크 A 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "행운",
                value: 5,
            },
            {
                type: "방어",
                value: 2,
            },
        ],
    },
    속삭이는: {
        name: "속삭이는",
        stats: [
            {
                type: "도르카 마스터리 랭크 A 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    충동: {
        name: "충동",
        stats: [
            {
                type: "체인 블레이드 마스터리 랭크 1 이상일 때 최대대미지",
                value: 9,
            },
            {
                type: "앵커 러시 랭크 5 이상일 때 행운",
                min: 5,
                max: 10,
            },
            {
                type: "밸런스",
                min: 8,
                max: 15,
            },
        ],
    },
    내면의: {
        name: "내면의",
        stats: [
            {
                type: "도르카 마스터리 랭크 5 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "스피닝 슬래시 랭크 9 이상일 때 솜씨",
                min: 3,
                max: 5,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    일렁이는: {
        name: "일렁이는",
        stats: [
            {
                type: "도르카 마스터리 랭크 5 이상일 때 최대대미지",
                min: 8,
                max: 16,
            },
            {
                type: "체인 스위핑 랭크 9 이상일 때 솜씨",
                min: 5,
                max: 10,
            },
            {
                type: "최대생명력",
                value: 30,
            },
        ],
    },
    협상하는: {
        name: "협상하는",
        stats: [
            {
                type: "상점 판매가",
                value: 1000000,
            },
        ],
    },
    협상가의: {
        name: "협상가의",
        stats: [
            {
                type: "상점 판매가",
                value: 1000000,
            },
        ],
    },
    흥정꾼의: {
        name: "흥정꾼의",
        stats: [
            {
                type: "상점 판매가",
                value: 500000,
            },
        ],
    },
    흥정하는: {
        name: "흥정하는",
        stats: [
            {
                type: "상점 판매가",
                value: 500000,
            },
        ],
    },
    살림꾼의: {
        name: "살림꾼의",
        stats: [
            {
                type: "상점 판매가",
                value: 250000,
            },
        ],
    },
    살림하는: {
        name: "살림하는",
        stats: [
            {
                type: "상점 판매가",
                value: 250000,
            },
        ],
    },
    "와일드 닌자": {
        name: "와일드 닌자",
        stats: [
            {
                type: "수리검 폭풍 랭크 1단 이상일 때 최소대미지",
                min: 10,
                max: 12,
            },
            {
                type: "수리검 폭풍 랭크 3단 이상일 때 의지",
                value: 10,
            },
            {
                type: "수리검 돌진 랭크 1단 이상일 때 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "수리검 돌진 랭크 3단 이상일 때 체력",
                value: 10,
            },
            {
                type: "수리검 마스터리 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "수리검 폭쇄 랭크 2 이하일 때 최대대미지",
                value: 10,
            },
        ],
    },
    속사광: {
        name: "속사광",
        stats: [
            {
                type: "슈팅 러쉬 랭크 1단 이상일 때 최소대미지",
                min: 12,
                max: 15,
            },
            {
                type: "슈팅 러쉬 랭크 3단 이상일 때 크리티컬",
                value: 15,
            },
            {
                type: "크로스 버스터 랭크 1단 이상일 때 최대대미지",
                min: 20,
                max: 25,
            },
            {
                type: "크로스 버스터 랭크 3단 이상일 때 밸런스",
                value: 10,
            },
            {
                type: "리로드 랭크 2 이하일 때 체력",
                value: 10,
            },
            {
                type: "불릿 스톰 랭크 2 이하일 때 최소대미지",
                value: 10,
            },
        ],
    },
    "인형의 날개": {
        name: "인형의 날개",
        stats: [
            {
                type: "6막: 유혹의 올가미 랭크 1단 이상일 때 솜씨",
                value: 15,
            },
            {
                type: "6막: 유혹의 올가미 랭크 3단 이상일 때 마리오네트 최대대미지",
                min: 14,
                max: 18,
            },
            {
                type: "4막: 질투의 화신 랭크 1단 이상일 때 마리오네트 생명력",
                value: 50,
            },
            {
                type: "4막: 질투의 화신 랭크 3단 이상일 때 마리오네트 최소대미지",
                min: 9,
                max: 12,
            },
            {
                type: "밸런스",
                value: 10,
            },
        ],
    },
    격투장인: {
        name: "격투장인",
        stats: [
            {
                type: "연속기 : 대쉬 펀치 랭크 3단 이상일 때 의지",
                value: 25,
            },
            {
                type: "스크류 어퍼 랭크 2단 이상일 때 최소대미지",
                min: 13,
                max: 16,
            },
            {
                type: "파운딩 랭크 1단 이상일 때 최대대미지",
                min: 15,
                max: 24,
            },
            {
                type: "파운딩 랭크 1 이하일 때 의지",
                value: 20,
            },
        ],
    },
    해박한: {
        name: "해박한",
        stats: [
            {
                type: "파이어볼트 랭크 3단 이상일 때 마법 공격력",
                min: 12,
                max: 20,
            },
            {
                type: "아이스볼트 랭크 2단 이상일 때 최대마나",
                value: 15,
            },
            {
                type: "라이트닝볼트 랭크 1단 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "썬더 랭크 3단 이상일 때 마나 소비 감소",
                value: 3,
            },
            {
                type: "라이트닝로드 랭크 3단 이상일 때 지력",
                value: 20,
            },
            {
                type: "파이어볼 랭크 3단 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    강렬한: {
        name: "강렬한",
        stats: [
            {
                type: "랜스 차지 랭크 3단 이상일 때 최대대미지",
                value: 17,
            },
            {
                type: "랜스 차지 랭크 1 이하일 때 최대대미지",
                value: 30,
            },
            {
                type: "랜스 마스터리 랭크 1 이상일 때 피어싱 레벨",
                value: 3,
            },
            {
                type: "랜스 카운터 랭크 1 이상일 때 크리티컬",
                value: 20,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    로빈훗: {
        name: "로빈훗",
        stats: [
            {
                type: "디펜스 랭크 3단 이상일 때 체력",
                value: 15,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 1단 이상일 때 최대대미지",
                min: 10,
                max: 14,
            },
            {
                type: "매그넘 샷 랭크 2단 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "크래시샷 랭크 3단 이상일 때 솜씨",
                value: 20,
            },
            {
                type: "방어",
                value: 5,
            },
        ],
    },
    일격필살: {
        name: "일격필살",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 3단 이상일 때 체력",
                value: 20,
            },
            {
                type: "다운 어택 랭크 1단 이상일 때 최소대미지",
                min: 10,
                max: 17,
            },
            {
                type: "윈드밀 랭크 2단 이상일 때 최대대미지",
                min: 18,
                max: 23,
            },
            {
                type: "돌진 랭크 2단 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "스매시 랭크 3단 이상일 때 의지",
                value: 12,
            },
        ],
    },
    디자이너: {
        name: "디자이너",
        stats: [
            {
                type: "천옷만들기 랭크 3단 이상일 때 생산물 품질",
                value: 3,
            },
            {
                type: "매직 크래프트 랭크 1단 이상일 때 지력",
                value: 10,
            },
            {
                type: "포션 조제 랭크 2단 이상일 때 행운",
                value: 15,
            },
        ],
    },
    신기전: {
        name: "신기전",
        stats: [
            {
                type: "블랙스미스 랭크 3단 이상일 때 생산물 품질",
                value: 3,
            },
            {
                type: "힐웬 공학 랭크 1단 이상일 때 체력",
                value: 10,
            },
            {
                type: "포션 조제 랭크 2단 이상일 때 행운",
                value: 15,
            },
        ],
    },
    무역상: {
        name: "무역상",
        stats: [
            {
                type: "교역 마스터리 랭크 6 이상일 때 교역 중 최대대미지",
                min: 8,
                max: 12,
            },
        ],
    },
    흥정의: {
        name: "흥정의",
        stats: [
            {
                type: "골드 스트라이크 랭크 C 이상일 때 교역 중 최대대미지",
                value: 5,
            },
        ],
    },
    카덴차: {
        name: "카덴차",
        stats: [
            {
                type: "죽음의 무도 랭크 9 이상일 때 음악버프 스킬 효과",
                value: 1,
            },
            {
                type: "최대대미지",
                min: 1,
                max: 3,
            },
            {
                type: "보호",
                value: 1,
            },
        ],
    },
    돌파하는: {
        name: "돌파하는",
        stats: [
            {
                type: "돌진 랭크 5 이상일 때 피어싱 레벨",
                value: 2,
            },
            {
                type: "랜스 차지 랭크 1 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "레벨이 20 이상일때 최대대미지",
                value: 12,
            },
        ],
    },
    침잠: {
        name: "침잠",
        stats: [
            {
                type: "최대생명력",
                value: 7,
            },
            {
                type: "레벨이 40 이상일때 최대대미지",
                value: 8,
            },
            {
                type: "의지",
                value: 5,
            },
        ],
    },
    오후의: {
        name: "오후의",
        stats: [
            {
                type: "최소대미지",
                value: 3,
            },
            {
                type: "최대대미지",
                value: 2,
            },
            {
                type: "의지",
                value: 2,
            },
            {
                type: "솜씨",
                value: 2,
            },
            {
                type: "체력",
                value: 2,
            },
            {
                type: "지력",
                value: 2,
            },
            {
                type: "행운",
                value: 2,
            },
            {
                type: "방어",
                value: 1,
            },
        ],
    },
    정오의: {
        name: "정오의",
        stats: [
            {
                type: "최소대미지",
                value: 2,
            },
            {
                type: "최대대미지",
                value: 2,
            },
            {
                type: "의지",
                value: 2,
            },
            {
                type: "솜씨",
                value: 2,
            },
            {
                type: "체력",
                value: 2,
            },
            {
                type: "지력",
                value: 2,
            },
        ],
    },
    아침의: {
        name: "아침의",
        stats: [
            {
                type: "최소대미지",
                value: 1,
            },
            {
                type: "최대대미지",
                value: 2,
            },
            {
                type: "의지",
                value: 2,
            },
            {
                type: "솜씨",
                value: 2,
            },
            {
                type: "체력",
                value: 2,
            },
        ],
    },
    새벽의: {
        name: "새벽의",
        stats: [
            {
                type: "최소대미지",
                value: 1,
            },
            {
                type: "최대대미지",
                value: 1,
            },
            {
                type: "의지",
                value: 2,
            },
            {
                type: "솜씨",
                value: 2,
            },
        ],
    },
    밤의: {
        name: "밤의",
        stats: [
            {
                type: "최대대미지",
                value: 1,
            },
            {
                type: "의지",
                value: 2,
            },
        ],
    },
    작열하는: {
        name: "작열하는",
        stats: [
            {
                type: "레벨이 50 이상일때 최대대미지",
                value: 8,
            },
            {
                type: "최대생명력",
                value: 15,
            },
        ],
    },
    강한: {
        name: "강한",
        stats: [
            {
                type: "레벨이 40 이상일때 최대대미지",
                value: 7,
            },
            {
                type: "최대생명력",
                value: 10,
            },
        ],
    },
    명멸하는: {
        name: "명멸하는",
        stats: [
            {
                type: "레벨이 30 이상일때 최대대미지",
                value: 6,
            },
            {
                type: "최대생명력",
                value: 10,
            },
        ],
    },
    어슴푸레한: {
        name: "어슴푸레한",
        stats: [
            {
                type: "레벨이 20 이상일때 최대대미지",
                value: 4,
            },
            {
                type: "최대생명력",
                value: 5,
            },
        ],
    },
    가리워진: {
        name: "가리워진",
        stats: [
            {
                type: "레벨이 10 이상일때 최대대미지",
                value: 3,
            },
            {
                type: "최대생명력",
                value: 5,
            },
        ],
    },
    레지스탕스: {
        name: "레지스탕스",
        stats: [
            {
                type: "레이지 임팩트 랭크 1 이상일 때 최대대미지",
                value: 18,
            },
            {
                type: "위기 탈출 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    모순적인: {
        name: "모순적인",
        stats: [
            {
                type: "최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "서포트 샷 랭크 2 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "핸디크래프트 랭크 5 이상일 때 솜씨",
                min: 15,
                max: 20,
            },
        ],
    },
    패러독시컬: {
        name: "패러독시컬",
        stats: [
            {
                type: "최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "서포트 샷 랭크 2 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "핸디크래프트 랭크 5 이상일 때 솜씨",
                min: 15,
                max: 20,
            },
        ],
    },
    지니어스: {
        name: "지니어스",
        stats: [
            {
                type: "파이어볼 랭크 1 이상일 때 마법 공격력",
                value: 8,
            },
            {
                type: "메테오 스트라이크 랭크 1 이상일 때 마법 공격력",
                value: 4,
            },
        ],
    },
    뱀: {
        name: "뱀",
        stats: [
            {
                type: "독 상태일때 체력",
                value: 50,
            },
        ],
    },
    골렘: {
        name: "골렘",
        stats: [
            {
                type: "레벨이 20 이상일때 지력",
                value: 20,
            },
            {
                type: "레벨이 15 이하일때 보호",
                value: 5,
            },
            {
                type: "레벨이 10 이하일때 방어",
                value: 2,
            },
        ],
    },
    다크니스: {
        name: "다크니스",
        stats: [
            {
                type: "방어",
                value: 3,
            },
            {
                type: "의지",
                value: 5,
            },
            {
                type: "레벨이 30 이상일때 최대대미지",
                min: 5,
                max: 15,
            },
        ],
    },
    연사: {
        name: "연사",
        stats: [
            {
                type: "최강의 서번트 타이틀을 달고 있을때 최대대미지",
                value: 8,
            },
            {
                type: "체력",
                value: 12,
            },
            {
                type: "의지",
                value: 5,
            },
        ],
    },
    투영된: {
        name: "투영된",
        stats: [
            {
                type: "어전트 샷 랭크 A 이상일 때 크리티컬",
                min: 10,
                max: 20,
            },
            {
                type: "지력",
                value: 12,
            },
            {
                type: "최대스태미나",
                value: 30,
            },
        ],
    },
    약속된: {
        name: "약속된",
        stats: [
            {
                type: "최강의 서번트 타이틀을 달고 있을때 행운",
                min: 15,
                max: 30,
            },
            {
                type: "체력",
                value: 8,
            },
            {
                type: "솜씨",
                value: 3,
            },
            {
                type: "최대마나",
                value: 20,
            },
        ],
    },
    전설적인: {
        name: "전설적인",
        stats: [
            {
                type: "배쉬 랭크 8 이상일 때 최대대미지",
                min: 30,
                max: 40,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    의기로운: {
        name: "의기로운",
        stats: [
            {
                type: "수리검 마스터리 랭크 1 이상일 때 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "수리검 폭쇄 랭크 1 이상일 때 의지",
                value: 15,
            },
            {
                type: "그림자 속박 랭크 1 이상일 때 최대스태미나",
                min: 15,
                max: 20,
            },
            {
                type: "잿빛 연막술 랭크 2 이상일 때 최대생명력",
                value: 20,
            },
        ],
    },
    날렵한: {
        name: "날렵한",
        stats: [
            {
                type: "수리검 폭풍 랭크 1 이상일 때 의지",
                min: 12,
                max: 17,
            },
            {
                type: "수리검 폭쇄 랭크 1 이상일 때 체력",
                value: 20,
            },
            {
                type: "수리검 마스터리 랭크 1 이상일 때 크리티컬",
                value: 15,
            },
        ],
    },
    "빠짐 없이": {
        name: "빠짐 없이",
        stats: [
            {
                type: "수리검 마스터리 랭크 A 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "수리검 돌진 랭크 6 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "그림자 속박 랭크 3 이상일 때 크리티컬",
                value: 10,
            },
        ],
    },
    쓸만한: {
        name: "쓸만한",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
            {
                type: "수리검 폭풍 랭크 B 이상일 때 최소대미지",
                min: 2,
                max: 4,
            },
        ],
    },
    오래가는: {
        name: "오래가는",
        stats: [
            {
                type: "벚꽃 비화술 랭크 3 이상일 때 최대대미지",
                value: 18,
            },
            {
                type: "그림자 은신 랭크 3 이상일 때 의지",
                value: 12,
            },
            {
                type: "그림자 속박 랭크 1 이상일 때 체력",
                min: 15,
                max: 20,
            },
            {
                type: "잿빛 연막술 랭크 2 이상일 때 크리티컬",
                min: 8,
                max: 12,
            },
        ],
    },
    기운센: {
        name: "기운센",
        stats: [
            {
                type: "수리검 마스터리 랭크 7 이상일 때 최소대미지",
                min: 3,
                max: 6,
            },
            {
                type: "수리검 돌진 랭크 5 이상일 때 의지",
                value: 10,
            },
            {
                type: "그림자 속박 랭크 1 이상일 때 체력",
                value: 20,
            },
        ],
    },
    차오르는: {
        name: "차오르는",
        stats: [
            {
                type: "수리검 마스터리 랭크 5 이상일 때 최대대미지",
                min: 10,
                max: 14,
            },
            {
                type: "수리검 폭쇄 랭크 4 이상일 때 의지",
                value: 10,
            },
            {
                type: "수리검 폭풍 랭크 5 이상일 때 체력",
                min: 10,
                max: 14,
            },
        ],
    },
    솟아오르는: {
        name: "솟아오르는",
        stats: [
            {
                type: "최소대미지",
                min: 1,
                max: 3,
            },
            {
                type: "수리검 마스터리 랭크 B 이상일 때 최대대미지",
                min: 5,
                max: 8,
            },
        ],
    },
    계승자의: {
        name: "계승자의",
        stats: [
            {
                type: "최대대미지",
                value: 6,
            },
            {
                type: "마법 공격력",
                value: 4,
            },
            {
                type: "크리티컬",
                value: 1,
            },
        ],
    },
    각성한: {
        name: "각성한",
        stats: [
            {
                type: "최대생명력",
                value: 10,
            },
            {
                type: "최대대미지",
                value: 12,
            },
            {
                type: "마법 공격력",
                value: 6,
            },
            {
                type: "밸런스",
                value: 1,
            },
        ],
    },
    구도자의: {
        name: "구도자의",
        stats: [
            {
                type: "파이어볼트 랭크 3 이상일 때 마법 공격력",
                min: 4,
                max: 12,
            },
            {
                type: "아이스볼트 랭크 3 이상일 때 최대마나",
                min: 10,
                max: 50,
            },
            {
                type: "라이트닝볼트 랭크 3 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    트루스시커: {
        name: "트루스시커",
        stats: [
            {
                type: "파이어볼트 랭크 3 이상일 때 마법 공격력",
                min: 4,
                max: 12,
            },
            {
                type: "아이스볼트 랭크 3 이상일 때 최대마나",
                min: 10,
                max: 50,
            },
            {
                type: "라이트닝볼트 랭크 3 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    직관의: {
        name: "직관의",
        stats: [
            {
                type: "파이어볼트 랭크 3 이상일 때 마법 공격력",
                min: 4,
                max: 12,
            },
            {
                type: "아이스볼트 랭크 3 이상일 때 마나 소비 감소",
                min: 1,
                max: 2,
            },
            {
                type: "라이트닝볼트 랭크 3 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    인튜이션: {
        name: "인튜이션",
        stats: [
            {
                type: "파이어볼트 랭크 3 이상일 때 마법 공격력",
                min: 4,
                max: 12,
            },
            {
                type: "아이스볼트 랭크 3 이상일 때 마나 소비 감소",
                min: 1,
                max: 2,
            },
            {
                type: "라이트닝볼트 랭크 3 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    백일몽의: {
        name: "백일몽의",
        stats: [
            {
                type: "라이트닝로드 랭크 5 이상일 때 마법 공격력",
                min: 8,
                max: 16,
            },
            {
                type: "라이트닝로드 랭크 5 이상일 때 지력",
                min: 30,
                max: 60,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 최대마나",
                value: 30,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    데이드림: {
        name: "데이드림",
        stats: [
            {
                type: "라이트닝로드 랭크 5 이상일 때 마법 공격력",
                min: 8,
                max: 16,
            },
            {
                type: "라이트닝로드 랭크 5 이상일 때 지력",
                min: 30,
                max: 60,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 최대마나",
                value: 30,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    예지의: {
        name: "예지의",
        stats: [
            {
                type: "라이트닝로드 랭크 5 이상일 때 마법 공격력",
                min: 12,
                max: 20,
            },
            {
                type: "라이트닝로드 랭크 5 이상일 때 지력",
                min: 40,
                max: 70,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 최대마나",
                value: 50,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    포어사이트: {
        name: "포어사이트",
        stats: [
            {
                type: "라이트닝로드 랭크 5 이상일 때 마법 공격력",
                min: 12,
                max: 20,
            },
            {
                type: "라이트닝로드 랭크 5 이상일 때 지력",
                min: 40,
                max: 70,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 최대마나",
                value: 50,
            },
            {
                type: "마나 리커버리 랭크 5 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    정신적인: {
        name: "정신적인",
        stats: [
            {
                type: "썬더 랭크 7 이상일 때 마법 공격력",
                min: 4,
                max: 8,
            },
            {
                type: "아이스 스피어 랭크 7 이상일 때 마나 소비 감소",
                min: 2,
                max: 4,
            },
            {
                type: "파이어볼 랭크 7 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "마나 실드 랭크 7 이상일 때 최대생명력",
                value: 50,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    스피리츄얼: {
        name: "스피리츄얼",
        stats: [
            {
                type: "썬더 랭크 7 이상일 때 마법 공격력",
                min: 4,
                max: 8,
            },
            {
                type: "아이스 스피어 랭크 7 이상일 때 마나 소비 감소",
                min: 2,
                max: 4,
            },
            {
                type: "파이어볼 랭크 7 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "마나 실드 랭크 7 이상일 때 최대생명력",
                value: 50,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    학구적인: {
        name: "학구적인",
        stats: [
            {
                type: "썬더 랭크 7 이상일 때 마법 공격력",
                min: 4,
                max: 8,
            },
            {
                type: "아이스 스피어 랭크 7 일 때 최대마나",
                value: 20,
            },
            {
                type: "파이어볼 랭크 7 이상일 때 마나 소비 감소",
                min: 1,
                max: 2,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    스칼러리: {
        name: "스칼러리",
        stats: [
            {
                type: "썬더 랭크 7 이상일 때 마법 공격력",
                min: 4,
                max: 8,
            },
            {
                type: "아이스 스피어 랭크 7 일 때 최대마나",
                value: 20,
            },
            {
                type: "파이어볼 랭크 7 이상일 때 마나 소비 감소",
                min: 1,
                max: 2,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    기묘한: {
        name: "기묘한",
        stats: [
            {
                type: "마법 공격력",
                min: 10,
                max: 20,
            },
            {
                type: "지력",
                value: 15,
            },
            {
                type: "마나 소비 감소",
                min: 2,
                max: 4,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "최대생명력",
                value: 50,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    위얼드: {
        name: "위얼드",
        stats: [
            {
                type: "마법 공격력",
                min: 10,
                max: 20,
            },
            {
                type: "지력",
                value: 15,
            },
            {
                type: "마나 소비 감소",
                min: 2,
                max: 4,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "최대생명력",
                value: 50,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    불가사의한: {
        name: "불가사의한",
        stats: [
            {
                type: "마법 공격력",
                min: 10,
                max: 20,
            },
            {
                type: "지력",
                min: 10,
                max: 20,
            },
            {
                type: "최대마나",
                value: 30,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    아케인: {
        name: "아케인",
        stats: [
            {
                type: "마법 공격력",
                min: 10,
                max: 20,
            },
            {
                type: "지력",
                min: 10,
                max: 20,
            },
            {
                type: "최대마나",
                value: 30,
            },
            {
                type: "체력",
                value: 30,
            },
        ],
    },
    절규의: {
        name: "절규의",
        stats: [
            {
                type: "체력",
                value: 15,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    초승달: {
        name: "초승달",
        stats: [
            {
                type: "체력",
                value: 20,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    얼음파편: {
        name: "얼음파편",
        stats: [
            {
                type: "체력",
                value: 10,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "솜씨",
                value: 10,
            },
        ],
    },
    검은안개: {
        name: "검은안개",
        stats: [
            {
                type: "디펜스 랭크 4 이상일 때 최대대미지",
                value: 20,
            },
            {
                type: "최소대미지",
                min: 10,
                max: 15,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "지력",
                value: 10,
            },
        ],
    },
    절대자: {
        name: "절대자",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 이상일 때 체력",
                min: 13,
                max: 18,
            },
            {
                type: "스매시 랭크 1 이상일 때 의지",
                value: 12,
            },
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                min: 25,
                max: 30,
            },
            {
                type: "최소대미지",
                value: 15,
            },
            {
                type: "밸런스",
                value: 10,
            },
        ],
    },
    고요의: {
        name: "고요의",
        stats: [
            {
                type: "체력",
                value: 15,
            },
            {
                type: "최대 부상률",
                value: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    거대: {
        name: "거대",
        stats: [
            {
                type: "체력",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 20,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    여명: {
        name: "여명",
        stats: [
            {
                type: "체력",
                value: 10,
            },
            {
                type: "최대대미지",
                value: 12,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 30,
            },
        ],
    },
    악몽의: {
        name: "악몽의",
        stats: [
            {
                type: "스매시 랭크 4 이상일 때 최대대미지",
                value: 18,
            },
            {
                type: "최소대미지",
                min: 8,
                max: 13,
            },
            {
                type: "크리티컬",
                value: 8,
            },
            {
                type: "솜씨",
                value: 10,
            },
        ],
    },
    광란의: {
        name: "광란의",
        stats: [
            {
                type: "크리티컬 히트 랭크 1 이상일 때 체력",
                min: 15,
                max: 20,
            },
            {
                type: "다운 어택 랭크 1 이상일 때 최대대미지",
                min: 18,
                max: 23,
            },
            {
                type: "최소대미지",
                value: 12,
            },
            {
                type: "크리티컬",
                value: 12,
            },
        ],
    },
    기르가쉬: {
        name: "기르가쉬",
        stats: [
            {
                type: "최대대미지",
                min: 30,
                max: 35,
            },
            {
                type: "크리티컬",
                value: 15,
            },
            {
                type: "체력",
                min: 30,
                max: 50,
            },
            {
                type: "기르가쉬 학살자 타이틀을 달고 있을때 최대생명력",
                value: 80,
            },
            {
                type: "기르가쉬 척결자 타이틀을 달고 있을때 최대생명력",
                value: 60,
            },
            {
                type: "기르가쉬 도전자 타이틀을 달고 있을때 최대생명력",
                value: 40,
            },
        ],
    },
    절대: {
        name: "절대",
        stats: [
            {
                type: "물 속성 연금술 대미지",
                min: 14,
                max: 17,
            },
            {
                type: "불 속성 연금술 대미지",
                min: 14,
                max: 17,
            },
        ],
    },
    짙은: {
        name: "짙은",
        stats: [
            {
                type: "마법 공격력",
                min: 5,
                max: 8,
            },
            {
                type: "지력",
                value: 10,
            },
            {
                type: "실드 오브 트러스트 랭크 5 이상일 때 최대마나",
                min: 30,
                max: 50,
            },
        ],
    },
    별빛: {
        name: "별빛",
        stats: [
            {
                type: "최대대미지",
                min: 10,
                max: 12,
            },
            {
                type: "솜씨",
                value: 12,
            },
            {
                type: "저지먼트 블레이드 랭크 5 이상일 때 최대대미지",
                min: 2,
                max: 5,
            },
        ],
    },
    황혼: {
        name: "황혼",
        stats: [
            {
                type: "최대대미지",
                min: 12,
                max: 16,
            },
            {
                type: "체력",
                value: 10,
            },
            {
                type: "실드 오브 트러스트 랭크 5 이상일 때 최대생명력",
                min: 50,
                max: 80,
            },
        ],
    },
    용암: {
        name: "용암",
        stats: [
            {
                type: "최대대미지",
                min: 18,
                max: 23,
            },
            {
                type: "의지",
                value: 15,
            },
            {
                type: "저지먼트 블레이드 랭크 5 이상일 때 최대생명력",
                min: 50,
                max: 80,
            },
        ],
    },
    침묵: {
        name: "침묵",
        stats: [
            {
                type: "최대대미지",
                min: 20,
                max: 27,
            },
            {
                type: "체력",
                value: 10,
            },
            {
                type: "셀레스티얼 스파이크 랭크 5 이상일 때 최대생명력",
                min: 50,
                max: 80,
            },
        ],
    },
    레이븐: {
        name: "레이븐",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 A 이상일 때 방어",
                value: 3,
            },
            {
                type: "스매시 랭크 9 이상일 때 최대대미지",
                min: 5,
                max: 8,
            },
            {
                type: "스매시 랭크 9 이상일 때 최소대미지",
                min: 2,
                max: 4,
            },
        ],
    },
    나이트: {
        name: "나이트",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 8 이상일 때 최대생명력",
                value: 30,
            },
            {
                type: "레벨이 40 이상일때 솜씨",
                value: 5,
            },
            {
                type: "레벨이 40 이상일때 체력",
                value: 15,
            },
        ],
    },
    이글: {
        name: "이글",
        stats: [
            {
                type: "레벨이 55 이상일때 최소 부상률",
                min: 1,
                max: 3,
            },
            {
                type: "레벨이 55 이상일때 최대 부상률",
                min: 1,
                max: 6,
            },
        ],
    },
    "48층의": {
        name: "48층의",
        stats: [
            {
                type: "크리티컬 히트 랭크 1 이상일 때 최소대미지",
                min: 25,
                max: 35,
            },
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                min: 28,
                max: 35,
            },
            {
                type: "크리티컬",
                value: 7,
            },
        ],
    },
    "35층의": {
        name: "35층의",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 이상일 때 체력",
                min: 10,
                max: 20,
            },
            {
                type: "다운 어택 랭크 1 이상일 때 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "크리티컬",
                value: 10,
            },
        ],
    },
    "67층의": {
        name: "67층의",
        stats: [
            {
                type: "다운 어택 랭크 1 이상일 때 최대대미지",
                min: 30,
                max: 40,
            },
            {
                type: "카운터 어택 랭크 1 이상일 때 체력",
                min: 15,
                max: 20,
            },
            {
                type: "회피 랭크 6 이상일 때 의지",
                value: 20,
            },
            {
                type: "피어싱 레벨이 있을 때 피어싱 레벨",
                value: 3,
            },
        ],
    },
    "56층의": {
        name: "56층의",
        stats: [
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "회피 랭크 6 이상일 때 최대대미지",
                min: 20,
                max: 35,
            },
            {
                type: "디펜스 랭크 1 이상일 때 체력",
                min: 50,
                max: 60,
            },
        ],
    },
    달콤한: {
        name: "달콤한",
        stats: [
            {
                type: "마법 공격력",
                min: 2,
                max: 4,
            },
            {
                type: "지력",
                value: 15,
            },
            {
                type: "카이토 타이틀을 달고 있을때 크리티컬",
                value: 3,
            },
        ],
    },
    부드러운: {
        name: "부드러운",
        stats: [
            {
                type: "크리티컬",
                min: 5,
                max: 15,
            },
            {
                type: "솜씨",
                value: 7,
            },
            {
                type: "카가미네 렌 타이틀을 달고 있을때 최대대미지",
                value: 7,
            },
        ],
    },
    눈물나는: {
        name: "눈물나는",
        stats: [
            {
                type: "최대대미지",
                min: 10,
                max: 20,
            },
            {
                type: "하츠네 미쿠 타이틀을 달고 있을때 최대대미지",
                value: 10,
            },
        ],
    },
    상큼한: {
        name: "상큼한",
        stats: [
            {
                type: "최대대미지",
                min: 5,
                max: 15,
            },
            {
                type: "크리티컬",
                value: 8,
            },
            {
                type: "카가미네 린 타이틀을 달고 있을때 최대대미지",
                value: 7,
            },
        ],
    },
    청과물: {
        name: "청과물",
        stats: [
            {
                type: "최대생명력",
                value: 50,
            },
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    신나는: {
        name: "신나는",
        stats: [
            {
                type: "음악버프 스킬 지속시간",
                value: 3,
            },
            {
                type: "음악버프 스킬 효과",
                value: 3,
            },
            {
                type: "하츠네 미쿠 타이틀을 달고 있을때 마나 소비 감소",
                value: 3,
            },
            {
                type: "카가미네 린 타이틀을 달고 있을때 마나 소비 감소",
                value: 3,
            },
            {
                type: "카가미네 렌 타이틀을 달고 있을때 마나 소비 감소",
                value: 3,
            },
            {
                type: "카이토 타이틀을 달고 있을때 마나 소비 감소",
                value: 3,
            },
        ],
    },
    등껍질: {
        name: "등껍질",
        stats: [
            {
                type: "누적레벨이 1000 이하일때 방어",
                min: 1,
                max: 4,
            },
        ],
    },
    풍선: {
        name: "풍선",
        stats: [
            {
                type: "누적레벨이 1000 이하일때 최대생명력",
                min: 5,
                max: 15,
            },
        ],
    },
    석양: {
        name: "석양",
        stats: [
            {
                type: "누적레벨이 1000 이하일때 최대생명력",
                value: 25,
            },
        ],
    },
    요정의: {
        name: "요정의",
        stats: [
            {
                type: "누적레벨이 1000 이하일때 마법 공격력",
                min: 1,
                max: 2,
            },
            {
                type: "누적레벨이 1000 이하일때 최대마나",
                min: 5,
                max: 12,
            },
        ],
    },
    열정의: {
        name: "열정의",
        stats: [
            {
                type: "누적레벨이 1000 이하일때 최소대미지",
                min: 3,
                max: 6,
            },
            {
                type: "누적레벨이 1000 이하일때 최대대미지",
                min: 3,
                max: 6,
            },
        ],
    },
    음유시인: {
        name: "음유시인",
        stats: [
            {
                type: "레벨이 10 이상일때 체력",
                value: 10,
            },
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 10,
            },
            {
                type: "최소대미지",
                value: 5,
            },
        ],
    },
    바드: {
        name: "바드",
        stats: [
            {
                type: "레벨이 10 이상일때 체력",
                value: 10,
            },
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 10,
            },
            {
                type: "최소대미지",
                value: 5,
            },
        ],
    },
    우등생: {
        name: "우등생",
        stats: [
            {
                type: "보호",
                value: 2,
            },
            {
                type: "레벨이 10 이상일때 최대스태미나",
                value: 25,
            },
            {
                type: "크리티컬",
                value: 10,
            },
        ],
    },
    천사의: {
        name: "천사의",
        stats: [
            {
                type: "크리티컬",
                value: 15,
            },
            {
                type: "레벨이 40 이상일때 의지",
                value: 10,
            },
            {
                type: "레벨이 40 이상일때 체력",
                value: 10,
            },
        ],
    },
    엔젤: {
        name: "엔젤",
        stats: [
            {
                type: "크리티컬",
                value: 15,
            },
            {
                type: "레벨이 40 이상일때 의지",
                value: 10,
            },
            {
                type: "레벨이 40 이상일때 체력",
                value: 10,
            },
        ],
    },
    친위대의: {
        name: "친위대의",
        stats: [
            {
                type: "불릿 스톰 랭크 1 이상일 때 지력",
                min: 8,
                max: 15,
            },
            {
                type: "프렌지 랭크 3 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "프렌지 랭크 1 이상일 때 최대마나",
                value: 20,
            },
        ],
    },
    어설트: {
        name: "어설트",
        stats: [
            {
                type: "슈팅 러쉬 랭크 3 이상일 때 크리티컬",
                value: 8,
            },
        ],
    },
    첩보원의: {
        name: "첩보원의",
        stats: [
            {
                type: "클로저 랭크 1 이상일 때 체력",
                min: 8,
                max: 15,
            },
            {
                type: "파 어웨이 랭크 3 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "파 어웨이 랭크 1 이상일 때 최대스태미나",
                value: 20,
            },
        ],
    },
    반자동: {
        name: "반자동",
        stats: [
            {
                type: "공격 속도",
                value: 4,
            },
            {
                type: "리로드 랭크 9 이상일 때 밸런스",
                min: 5,
                max: 15,
            },
            {
                type: "파 어웨이 랭크 A 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
        ],
    },
    마력의: {
        name: "마력의",
        stats: [
            {
                type: "매직 크래프트 랭크 9 이상일 때 지력",
                min: 3,
                max: 8,
            },
            {
                type: "매직 크래프트 랭크 5 이상일 때 행운",
                min: 1,
                max: 10,
            },
            {
                type: "매직 크래프트 랭크 3 이상일 때 최대마나",
                value: 50,
            },
        ],
    },
    굴착: {
        name: "굴착",
        stats: [
            {
                type: "희귀 광물학 랭크 5 이상일 때 체력",
                min: 5,
                max: 12,
            },
            {
                type: "희귀 광물학 랭크 3 이상일 때 행운",
                min: 1,
                max: 10,
            },
            {
                type: "희귀 광물학 랭크 1 이상일 때 최대스태미나",
                value: 50,
            },
        ],
    },
    오토매틱: {
        name: "오토매틱",
        stats: [
            {
                type: "공격 속도",
                value: 8,
            },
            {
                type: "리로드 랭크 5 이상일 때 밸런스",
                value: 15,
            },
            {
                type: "슈팅 러쉬 랭크 7 이상일 때 크리티컬",
                min: 10,
                max: 15,
            },
        ],
    },
    신병의: {
        name: "신병의",
        stats: [
            {
                type: "최소대미지",
                min: 1,
                max: 3,
            },
            {
                type: "듀얼건 마스터리 랭크 B 이상일 때 최대대미지",
                min: 5,
                max: 8,
            },
        ],
    },
    카모플라쥬: {
        name: "카모플라쥬",
        stats: [
            {
                type: "듀얼건 마스터리 랭크 3 이상일 때 최대대미지",
                min: 3,
                max: 9,
            },
        ],
    },
    베테랑의: {
        name: "베테랑의",
        stats: [
            {
                type: "듀얼건 마스터리 랭크 7 이상일 때 최소대미지",
                min: 2,
                max: 5,
            },
            {
                type: "클로저 랭크 5 이상일 때 최대대미지",
                min: 5,
                max: 10,
            },
        ],
    },
    밀렵꾼: {
        name: "밀렵꾼",
        stats: [
            {
                type: "실리엔 생태학 랭크 3 이상일 때 솜씨",
                min: 8,
                max: 15,
            },
            {
                type: "실리엔 생태학 랭크 5 이상일 때 크리티컬",
                value: 15,
            },
            {
                type: "행운",
                value: 20,
            },
        ],
    },
    오피서의: {
        name: "오피서의",
        stats: [
            {
                type: "듀얼건 마스터리 랭크 1 이상일 때 최소대미지",
                min: 4,
                max: 8,
            },
            {
                type: "프렌지 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 28,
            },
        ],
    },
    고출력: {
        name: "고출력",
        stats: [
            {
                type: "불릿 스톰 랭크 3 이상일 때 최소대미지",
                min: 2,
                max: 8,
            },
            {
                type: "불릿 스톰 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 22,
            },
            {
                type: "크로스 버스터 랭크 1 이상일 때 크리티컬",
                value: 10,
            },
        ],
    },
    엔지니어의: {
        name: "엔지니어의",
        stats: [
            {
                type: "힐웬 공학 랭크 9 이상일 때 체력",
                min: 3,
                max: 10,
            },
            {
                type: "힐웬 공학 랭크 5 이상일 때 솜씨",
                min: 5,
                max: 12,
            },
            {
                type: "힐웬 공학 랭크 3 이상일 때 최대스태미나",
                value: 30,
            },
        ],
    },
    혼수상태: {
        name: "혼수상태",
        stats: [
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "마법 공격력",
                min: 3,
                max: 7,
            },
        ],
    },
    코마: {
        name: "코마",
        stats: [
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "마법 공격력",
                min: 3,
                max: 7,
            },
        ],
    },
    기억상실: {
        name: "기억상실",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대대미지",
                min: 10,
                max: 13,
            },
        ],
    },
    암네시아: {
        name: "암네시아",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대대미지",
                min: 10,
                max: 13,
            },
        ],
    },
    "디펜스 주니어": {
        name: "디펜스 주니어",
        stats: [
            {
                type: "챔피언 타이틀을 달고 있을때 체력",
                value: 20,
            },
            {
                type: "디펜스 랭크 2단 이상일 때 최대대미지",
                value: 6,
            },
        ],
    },
    대적자: {
        name: "대적자",
        stats: [
            {
                type: "마리오네트 최대대미지",
                value: 10,
            },
            {
                type: "9막: 깨어나는 생명 랭크 1 이상일 때 마리오네트 최대대미지",
                value: 25,
            },
            {
                type: "1막: 우연한 충돌 랭크 1 이상일 때 마리오네트 조종술 크리티컬",
                min: 5,
                max: 10,
            },
            {
                type: "콜로서스 마리오네트 랭크 1 이상일 때 체력",
                min: 25,
                max: 35,
            },
            {
                type: "피에로 마리오네트 랭크 1 이상일 때 행운",
                value: 25,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    조화: {
        name: "조화",
        stats: [
            {
                type: "비바체 랭크 1 이상일 때 음악버프 스킬 효과",
                value: 5,
            },
            {
                type: "음악적 지식 랭크 1 이상일 때 음악버프 스킬 지속시간",
                value: 10,
            },
            {
                type: "멜로디 쇼크 랭크 1 이상일 때 최대대미지",
                min: 20,
                max: 25,
            },
            {
                type: "행운",
                min: 10,
                max: 25,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    앙상블: {
        name: "앙상블",
        stats: [
            {
                type: "비바체 랭크 1 이상일 때 음악버프 스킬 효과",
                value: 5,
            },
            {
                type: "음악적 지식 랭크 1 이상일 때 음악버프 스킬 지속시간",
                value: 10,
            },
            {
                type: "멜로디 쇼크 랭크 1 이상일 때 최대대미지",
                min: 20,
                max: 25,
            },
            {
                type: "행운",
                min: 10,
                max: 25,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    재난: {
        name: "재난",
        stats: [
            {
                type: "히트 버스터 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 15,
                max: 25,
            },
            {
                type: "레인 캐스팅 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 30,
                max: 50,
            },
            {
                type: "윈드 블래스트 랭크 1 이상일 때 크리티컬",
                value: 15,
            },
            {
                type: "연금술 마스터리 랭크 2 이하일 때 최대대미지",
                value: 50,
            },
        ],
    },
    합리적인: {
        name: "합리적인",
        stats: [
            {
                type: "블레이즈 랭크 1 이상일 때 마법 공격력",
                min: 2,
                max: 4,
            },
            {
                type: "볼트 마법 조합 랭크 1 이상일 때 크리티컬",
                min: 2,
                max: 5,
            },
            {
                type: "메디테이션 랭크 8 이상일 때 최대마나",
                value: 20,
            },
        ],
    },
    이용한: {
        name: "이용한",
        stats: [
            {
                type: "파이어볼 랭크 1 이상일 때 지력",
                min: 40,
                max: 70,
            },
            {
                type: "헤일스톰 랭크 1 이상일 때 마법 공격력",
                value: 5,
            },
            {
                type: "볼트 마법 조합 랭크 1 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
            {
                type: "메디테이션 랭크 8 이상일 때 최대마나",
                value: 50,
            },
        ],
    },
    깍지: {
        name: "깍지",
        stats: [
            {
                type: "매그넘 샷 랭크 1 이상일 때 크리티컬",
                min: 8,
                max: 15,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 1 이상일 때 최대대미지",
                min: 5,
                max: 10,
            },
            {
                type: "솜씨",
                value: 30,
            },
            {
                type: "방어",
                value: 4,
            },
        ],
    },
    발리투도: {
        name: "발리투도",
        stats: [
            {
                type: "차징 피스트 랭크 1 이상일 때 최대대미지",
                min: 25,
                max: 30,
            },
            {
                type: "연속기 마스터리 랭크 1 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
            {
                type: "리스토어 랭크 1 이상일 때 의지",
                value: 20,
            },
            {
                type: "방어",
                value: 4,
            },
        ],
    },
    정복자: {
        name: "정복자",
        stats: [
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                min: 20,
                max: 25,
            },
            {
                type: "파이널 히트 랭크 1 이상일 때 최소대미지",
                min: 10,
                max: 15,
            },
            {
                type: "회피 랭크 6 이상일 때 체력",
                value: 40,
            },
        ],
    },
    지배자: {
        name: "지배자",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 이상일 때 최대대미지",
                min: 8,
                max: 15,
            },
            {
                type: "윈드밀 랭크 1 이상일 때 크리티컬",
                min: 5,
                max: 8,
            },
            {
                type: "스매시 랭크 1 이상일 때 체력",
                value: 10,
            },
        ],
    },
    아레나: {
        name: "아레나",
        stats: [
            {
                type: "돌진 랭크 1 이상일 때 체력",
                min: 25,
                max: 40,
            },
            {
                type: "크리티컬 히트 랭크 1 이상일 때 방어",
                min: 1,
                max: 3,
            },
            {
                type: "스매시 랭크 2 이하일 때 의지",
                value: 50,
            },
        ],
    },
    힘든: {
        name: "힘든",
        stats: [
            {
                type: "제련 랭크 1 이상일 때 최대대미지",
                min: 8,
                max: 15,
            },
            {
                type: "요리 랭크 6 이상일 때 솜씨",
                min: 10,
                max: 15,
            },
            {
                type: "목공 랭크 1 이상일 때 최대스태미나",
                value: 30,
            },
            {
                type: "야금술 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "최대마나",
                value: 40,
            },
        ],
    },
    어마어마한: {
        name: "어마어마한",
        stats: [
            {
                type: "목공 랭크 1 이상일 때 생산물 품질",
                value: 1,
            },
            {
                type: "야금술 랭크 1 이상일 때 최대대미지",
                min: 6,
                max: 10,
            },
            {
                type: "행운",
                min: 10,
                max: 15,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    기호: {
        name: "기호",
        stats: [
            {
                type: "스파크 랭크 1 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "방호벽 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    오만한: {
        name: "오만한",
        stats: [
            {
                type: "라이트닝 매직실드 랭크 1 이상일 때 지력",
                min: 10,
                max: 30,
            },
            {
                type: "파이어 매직 실드 랭크 1 이상일 때 크리티컬",
                value: 8,
            },
            {
                type: "방어",
                min: 3,
                max: 5,
            },
        ],
    },
    달리는: {
        name: "달리는",
        stats: [
            {
                type: "랜스 카운터 랭크 1 이상일 때 체력",
                value: 30,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "회피 랭크 9 이상일 때 방어",
                value: 2,
            },
            {
                type: "솜씨",
                min: 20,
                max: 30,
            },
        ],
    },
    벌레스크: {
        name: "벌레스크",
        stats: [
            {
                type: "6막: 유혹의 올가미 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 7,
                max: 15,
            },
            {
                type: "9막: 깨어나는 생명 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "의지",
                value: 20,
            },
        ],
    },
    솔리스트: {
        name: "솔리스트",
        stats: [
            {
                type: "비바체 랭크 1 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "풍년가 랭크 1 이상일 때 행운",
                value: 25,
            },
            {
                type: "전장의 서곡 랭크 1 이상일 때 음악버프 스킬 효과",
                value: 2,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    삼발이: {
        name: "삼발이",
        stats: [
            {
                type: "금속 변환 랭크 1 이상일 때 연금술 생산 성공률",
                min: 2,
                max: 4,
            },
            {
                type: "연성 마스터리 랭크 1 이상일 때 최대대미지",
                min: 6,
                max: 10,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    브레이크: {
        name: "브레이크",
        stats: [
            {
                type: "연속기 : 대쉬 펀치 랭크 1 이상일 때 의지",
                min: 5,
                max: 10,
            },
            {
                type: "스크류 어퍼 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "크리티컬",
                value: 4,
            },
        ],
    },
    투르나이: {
        name: "투르나이",
        stats: [
            {
                type: "랜스 마스터리 랭크 1 이상일 때 최대대미지",
                min: 12,
                max: 15,
            },
            {
                type: "크리티컬 히트 랭크 1 이상일 때 크리티컬",
                min: 3,
                max: 5,
            },
            {
                type: "디펜스 랭크 1 이상일 때 방어",
                value: 3,
            },
            {
                type: "솜씨",
                value: 50,
            },
        ],
    },
    합창: {
        name: "합창",
        stats: [
            {
                type: "전장의 서곡 랭크 1 이상일 때 최대대미지",
                value: 13,
            },
            {
                type: "행진곡 랭크 1 이상일 때 음악버프 스킬 지속시간",
                min: 5,
                max: 10,
            },
            {
                type: "악기 연주 랭크 1 이상일 때 음악버프 스킬 효과",
                min: 2,
                max: 3,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    코러스: {
        name: "코러스",
        stats: [
            {
                type: "전장의 서곡 랭크 1 이상일 때 최대대미지",
                value: 13,
            },
            {
                type: "행진곡 랭크 1 이상일 때 음악버프 스킬 지속시간",
                min: 5,
                max: 10,
            },
            {
                type: "악기 연주 랭크 1 이상일 때 음악버프 스킬 효과",
                min: 2,
                max: 3,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    창조한: {
        name: "창조한",
        stats: [
            {
                type: "분해 랭크 1 이상일 때 연금술 생산 성공률",
                min: 2,
                max: 4,
            },
            {
                type: "합성 랭크 1 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "솜씨",
                min: 10,
                max: 20,
            },
        ],
    },
    얼어붙은: {
        name: "얼어붙은",
        stats: [
            {
                type: "불 연금술 마스터리 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 3,
                max: 5,
            },
            {
                type: "물 연금술 마스터리 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 7,
                max: 10,
            },
            {
                type: "골렘 연성 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    그로기: {
        name: "그로기",
        stats: [
            {
                type: "백스텝 랭크 1 이상일 때 의지",
                min: 15,
                max: 25,
            },
            {
                type: "너클 마스터리 랭크 1 이상일 때 크리티컬",
                min: 5,
                max: 7,
            },
            {
                type: "연속기 마스터리 랭크 1 이상일 때 최대대미지",
                value: 10,
            },
        ],
    },
    과녁: {
        name: "과녁",
        stats: [
            {
                type: "크래시샷 랭크 1 이상일 때 솜씨",
                min: 30,
                max: 40,
            },
            {
                type: "매그넘 샷 랭크 1 이상일 때 행운",
                value: 25,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 2 이하일 때 의지",
                value: 50,
            },
        ],
    },
    월계관: {
        name: "월계관",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 이상일 때 체력",
                min: 25,
                max: 40,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 5 이하일 때 크리티컬",
                value: 5,
            },
            {
                type: "디펜스 랭크 1 이상일 때 방어",
                min: 1,
                max: 3,
            },
            {
                type: "솜씨",
                value: 50,
            },
        ],
    },
    무관심한: {
        name: "무관심한",
        stats: [
            {
                type: "볼트 마스터리 랭크 1 이상일 때 지력",
                min: 15,
                max: 30,
            },
            {
                type: "썬더 랭크 1 이상일 때 마법 공격력",
                min: 3,
                max: 5,
            },
        ],
    },
    알레고리: {
        name: "알레고리",
        stats: [
            {
                type: "와이어 바인딩 랭크 1 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "와이어 풀링 랭크 1 이상일 때 크리티컬",
                value: 7,
            },
            {
                type: "4막: 질투의 화신 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "의지",
                min: 10,
                max: 30,
            },
        ],
    },
    꾸준한: {
        name: "꾸준한",
        stats: [
            {
                type: "천옷만들기 랭크 1 이상일 때 생산물 품질",
                value: 2,
            },
            {
                type: "방직 랭크 1 이상일 때 최대대미지",
                min: 7,
                max: 10,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    챔피언: {
        name: "챔피언",
        stats: [
            {
                type: "카운터 어택 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "레벨이 40 이상일때 체력",
                min: 25,
                max: 35,
            },
            {
                type: "방어",
                value: 3,
            },
            {
                type: "최대스태미나",
                value: 60,
            },
        ],
    },
    아방가르드: {
        name: "아방가르드",
        stats: [
            {
                type: "2막: 솟구치는 분노 랭크 1 이상일 때 마리오네트 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "7막: 광란의 질주 랭크 1 이상일 때 마리오네트 방어",
                value: 5,
            },
            {
                type: "마리오네트 조종술 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "최대생명력",
                value: 40,
            },
        ],
    },
    쉽지않은: {
        name: "쉽지않은",
        stats: [
            {
                type: "블랙스미스 랭크 1 이상일 때 생산물 품질",
                value: 2,
            },
            {
                type: "제련 랭크 1 이상일 때 최대대미지",
                min: 7,
                max: 15,
            },
            {
                type: "행운",
                min: 15,
                max: 25,
            },
            {
                type: "최대생명력",
                value: 50,
            },
        ],
    },
    찌르는: {
        name: "찌르는",
        stats: [
            {
                type: "랜스 차지 랭크 1 이상일 때 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "랜스 마스터리 랭크 1 이상일 때 크리티컬",
                min: 7,
                max: 12,
            },
            {
                type: "방어",
                value: 3,
            },
        ],
    },
    스파링: {
        name: "스파링",
        stats: [
            {
                type: "파운딩 랭크 1 이상일 때 의지",
                min: 35,
                max: 50,
            },
            {
                type: "드롭킥 랭크 1 이상일 때 크리티컬",
                min: 10,
                max: 12,
            },
            {
                type: "섬머솔트 랭크 1 이상일 때 최소대미지",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 20,
            },
            {
                type: "방어",
                value: 3,
            },
        ],
    },
    노킹: {
        name: "노킹",
        stats: [
            {
                type: "서포트 샷 랭크 1 이상일 때 최대대미지",
                min: 5,
                max: 7,
            },
            {
                type: "크래시샷 랭크 1 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "매그넘 샷 랭크 1 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "방어",
                value: 3,
            },
            {
                type: "최대스태미나",
                value: 60,
            },
        ],
    },
    펄펄끓는: {
        name: "펄펄끓는",
        stats: [
            {
                type: "플레이머 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 5,
                max: 7,
            },
            {
                type: "워터 캐논 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 10,
                max: 15,
            },
            {
                type: "샌드 버스트 랭크 1 이상일 때 최대대미지",
                value: 13,
            },
            {
                type: "체인 실린더 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    앙코르: {
        name: "앙코르",
        stats: [
            {
                type: "자장가 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "작곡 랭크 1 이상일 때 음악버프 스킬 효과",
                value: 3,
            },
            {
                type: "음악적 지식 랭크 1 이상일 때 음악버프 스킬 지속시간",
                min: 5,
                max: 10,
            },
            {
                type: "인내의 노래 랭크 1 이상일 때 최대생명력",
                value: 50,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    환영: {
        name: "환영",
        stats: [
            {
                type: "헤일스톰 랭크 5 이상일 때 지력",
                min: 15,
                max: 30,
            },
            {
                type: "인챈트 랭크 1 이상일 때 마법 공격력",
                min: 3,
                max: 5,
            },
            {
                type: "파티 힐링 랭크 1 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    열쇠: {
        name: "열쇠",
        stats: [
            {
                type: "마나 포밍 랭크 1 이상일 때 연금술 생산 성공률",
                min: 2,
                max: 4,
            },
            {
                type: "연금술 마스터리 랭크 1 이상일 때 최대대미지",
                min: 7,
                max: 12,
            },
            {
                type: "최대생명력",
                value: 30,
            },
            {
                type: "최대스태미나",
                value: 30,
            },
        ],
    },
    릴리스: {
        name: "릴리스",
        stats: [
            {
                type: "보우 마스터리 랭크 1 이상일 때 솜씨",
                value: 20,
            },
            {
                type: "크로스보우 마스터리 랭크 1 이상일 때 최대대미지",
                min: 5,
                max: 8,
            },
            {
                type: "서포트 샷 랭크 2 이하일 때 의지",
                value: 50,
            },
        ],
    },
    카르텔: {
        name: "카르텔",
        stats: [
            {
                type: "랜스 마스터리 랭크 1 이상일 때 피어싱 레벨",
                value: 3,
            },
            {
                type: "랜스 차지 랭크 1 이상일 때 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "랜스 카운터 랭크 1 이상일 때 크리티컬",
                min: 10,
                max: 15,
            },
            {
                type: "랜스 카운터 랭크 3 이하일 때 최대대미지",
                value: 30,
            },
            {
                type: "최대스태미나",
                value: 50,
            },
        ],
    },
    초연: {
        name: "초연",
        stats: [
            {
                type: "체력",
                min: 10,
                max: 15,
            },
            {
                type: "솜씨",
                min: 7,
                max: 10,
            },
            {
                type: "마리오네트 방어",
                value: 2,
            },
        ],
    },
    프리미어: {
        name: "프리미어",
        stats: [
            {
                type: "체력",
                min: 10,
                max: 15,
            },
            {
                type: "솜씨",
                min: 7,
                max: 10,
            },
            {
                type: "마리오네트 방어",
                value: 2,
            },
        ],
    },
    새겨진: {
        name: "새겨진",
        stats: [
            {
                type: "마리오네트 최소대미지",
                value: 10,
            },
            {
                type: "7막: 광란의 질주 랭크 9 이상일 때 마리오네트 최대대미지",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 50,
            },
        ],
    },
    카브드: {
        name: "카브드",
        stats: [
            {
                type: "마리오네트 최소대미지",
                value: 10,
            },
            {
                type: "7막: 광란의 질주 랭크 9 이상일 때 마리오네트 최대대미지",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 50,
            },
        ],
    },
    조종하는: {
        name: "조종하는",
        stats: [
            {
                type: "마리오네트 조종술 랭크 5 이상일 때 마리오네트 최대대미지",
                min: 10,
                max: 20,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    컨트롤: {
        name: "컨트롤",
        stats: [
            {
                type: "마리오네트 조종술 랭크 5 이상일 때 마리오네트 최대대미지",
                min: 10,
                max: 20,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    인형: {
        name: "인형",
        stats: [
            {
                type: "마리오네트 생명력",
                value: 20,
            },
            {
                type: "마리오네트 방어",
                value: 2,
            },
            {
                type: "마리오네트 보호",
                value: 2,
            },
        ],
    },
    마리오네트: {
        name: "마리오네트",
        stats: [
            {
                type: "마리오네트 생명력",
                value: 20,
            },
            {
                type: "마리오네트 방어",
                value: 2,
            },
            {
                type: "마리오네트 보호",
                value: 2,
            },
        ],
    },
    연결된: {
        name: "연결된",
        stats: [
            {
                type: "마리오네트 조종술 랭크 3 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "마리오네트 조종술 랭크 7 이상일 때 크리티컬",
                min: 3,
                max: 6,
            },
            {
                type: "마리오네트 조종술 크리티컬",
                min: 6,
                max: 9,
            },
            {
                type: "마리오네트 최대대미지",
                value: 5,
            },
        ],
    },
    링크드: {
        name: "링크드",
        stats: [
            {
                type: "마리오네트 조종술 랭크 3 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "마리오네트 조종술 랭크 7 이상일 때 크리티컬",
                min: 3,
                max: 6,
            },
            {
                type: "마리오네트 조종술 크리티컬",
                min: 6,
                max: 9,
            },
            {
                type: "마리오네트 최대대미지",
                value: 5,
            },
        ],
    },
    기억: {
        name: "기억",
        stats: [
            {
                type: "마리오네트 최대대미지",
                value: 6,
            },
            {
                type: "레벨이 20 이상일때 최대대미지",
                min: 5,
                max: 9,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    메모리: {
        name: "메모리",
        stats: [
            {
                type: "마리오네트 최대대미지",
                value: 6,
            },
            {
                type: "레벨이 20 이상일때 최대대미지",
                min: 5,
                max: 9,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    비극적인: {
        name: "비극적인",
        stats: [
            {
                type: "4막: 질투의 화신 랭크 8 이상일 때 마리오네트 최대대미지",
                min: 5,
                max: 10,
            },
            {
                type: "7막: 광란의 질주 랭크 4 이상일 때 체력",
                value: 10,
            },
        ],
    },
    트래직: {
        name: "트래직",
        stats: [
            {
                type: "4막: 질투의 화신 랭크 8 이상일 때 마리오네트 최대대미지",
                min: 5,
                max: 10,
            },
            {
                type: "7막: 광란의 질주 랭크 4 이상일 때 체력",
                value: 10,
            },
        ],
    },
    공연: {
        name: "공연",
        stats: [
            {
                type: "마리오네트 최대대미지",
                value: 5,
            },
            {
                type: "체력",
                value: 8,
            },
            {
                type: "솜씨",
                value: 8,
            },
        ],
    },
    퍼포먼스: {
        name: "퍼포먼스",
        stats: [
            {
                type: "마리오네트 최대대미지",
                value: 5,
            },
            {
                type: "체력",
                value: 8,
            },
            {
                type: "솜씨",
                value: 8,
            },
        ],
    },
    반복되는: {
        name: "반복되는",
        stats: [
            {
                type: "1막: 우연한 충돌 랭크 D 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "2막: 솟구치는 분노 랭크 6 이상일 때 마리오네트 조종술 크리티컬",
                value: 8,
            },
        ],
    },
    리피티드: {
        name: "리피티드",
        stats: [
            {
                type: "1막: 우연한 충돌 랭크 D 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "2막: 솟구치는 분노 랭크 6 이상일 때 마리오네트 조종술 크리티컬",
                value: 8,
            },
        ],
    },
    광대: {
        name: "광대",
        stats: [
            {
                type: "피에로 마리오네트 랭크 B 이상일 때 솜씨",
                value: 20,
            },
            {
                type: "피에로 마리오네트 랭크 7 이상일 때 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "마리오네트 생명력",
                value: 20,
            },
        ],
    },
    피에로: {
        name: "피에로",
        stats: [
            {
                type: "피에로 마리오네트 랭크 B 이상일 때 솜씨",
                value: 20,
            },
            {
                type: "피에로 마리오네트 랭크 7 이상일 때 최대대미지",
                min: 15,
                max: 20,
            },
            {
                type: "마리오네트 생명력",
                value: 20,
            },
        ],
    },
    거인상: {
        name: "거인상",
        stats: [
            {
                type: "콜로서스 마리오네트 랭크 B 이상일 때 체력",
                value: 30,
            },
            {
                type: "콜로서스 마리오네트 랭크 7 이상일 때 마리오네트 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    콜로서스: {
        name: "콜로서스",
        stats: [
            {
                type: "콜로서스 마리오네트 랭크 B 이상일 때 체력",
                value: 30,
            },
            {
                type: "콜로서스 마리오네트 랭크 7 이상일 때 마리오네트 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    대단원: {
        name: "대단원",
        stats: [
            {
                type: "6막: 유혹의 올가미 랭크 5 이상일 때 솜씨",
                value: 15,
            },
            {
                type: "마리오네트 방어",
                value: 2,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    카타스트로피: {
        name: "카타스트로피",
        stats: [
            {
                type: "6막: 유혹의 올가미 랭크 5 이상일 때 솜씨",
                value: 15,
            },
            {
                type: "마리오네트 방어",
                value: 2,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    극적인: {
        name: "극적인",
        stats: [
            {
                type: "9막: 깨어나는 생명 랭크 B 이상일 때 마리오네트 생명력",
                value: 20,
            },
            {
                type: "9막: 깨어나는 생명 랭크 6 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
        ],
    },
    드라마틱: {
        name: "드라마틱",
        stats: [
            {
                type: "9막: 깨어나는 생명 랭크 B 이상일 때 마리오네트 생명력",
                value: 20,
            },
            {
                type: "9막: 깨어나는 생명 랭크 6 이상일 때 크리티컬",
                min: 5,
                max: 10,
            },
        ],
    },
    감독: {
        name: "감독",
        stats: [
            {
                type: "크리티컬",
                min: 3,
                max: 5,
            },
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "마리오네트 생명력",
                value: 20,
            },
        ],
    },
    디렉터: {
        name: "디렉터",
        stats: [
            {
                type: "크리티컬",
                min: 3,
                max: 5,
            },
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "마리오네트 생명력",
                value: 20,
            },
        ],
    },
    소품: {
        name: "소품",
        stats: [
            {
                type: "1막: 우연한 충돌 랭크 3 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "마리오네트 조종술 크리티컬",
                min: 3,
                max: 7,
            },
        ],
    },
    프랍: {
        name: "프랍",
        stats: [
            {
                type: "1막: 우연한 충돌 랭크 3 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "마리오네트 조종술 크리티컬",
                min: 3,
                max: 7,
            },
        ],
    },
    기괴한: {
        name: "기괴한",
        stats: [
            {
                type: "크리티컬",
                value: 6,
            },
            {
                type: "마리오네트 조종술 크리티컬",
                value: 6,
            },
            {
                type: "마리오네트 마법 방어력",
                value: 4,
            },
            {
                type: "마리오네트 생명력",
                value: 20,
            },
        ],
    },
    그로테스크: {
        name: "그로테스크",
        stats: [
            {
                type: "크리티컬",
                value: 6,
            },
            {
                type: "마리오네트 조종술 크리티컬",
                value: 6,
            },
            {
                type: "마리오네트 마법 방어력",
                value: 4,
            },
            {
                type: "마리오네트 생명력",
                value: 20,
            },
        ],
    },
    "8주년 기념 각진": {
        name: "8주년 기념 각진",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 크리티컬",
                value: 8,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    "8주년 기념 폭발의": {
        name: "8주년 기념 폭발의",
        stats: [
            {
                type: "연금술 마스터리 랭크 A 이상일 때 불 속성 연금술 대미지",
                value: 8,
            },
            {
                type: "히트 버스터 랭크 8 이상일 때 최대생명력",
                value: 12,
            },
        ],
    },
    "8주년 기념 디펜시브": {
        name: "8주년 기념 디펜시브",
        stats: [
            {
                type: "방어",
                value: 8,
            },
            {
                type: "체력",
                value: 8,
            },
            {
                type: "솜씨",
                value: 8,
            },
        ],
    },
    "8주년 기념 비범한": {
        name: "8주년 기념 비범한",
        stats: [
            {
                type: "최대대미지",
                value: 8,
            },
            {
                type: "최소대미지",
                value: 8,
            },
        ],
    },
    "8주년 기념 마나 니들": {
        name: "8주년 기념 마나 니들",
        stats: [
            {
                type: "매직 마스터리 랭크 A 이상일 때 마법 공격력",
                value: 3,
            },
            {
                type: "밸런스",
                value: 8,
            },
        ],
    },
    "8주년 기념 클래식": {
        name: "8주년 기념 클래식",
        stats: [
            {
                type: "현혹의 연주 랭크 B 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "현혹의 연주 랭크 6 이상일 때 크리티컬",
                value: 8,
            },
        ],
    },
    "8주년 기념 글로리어스": {
        name: "8주년 기념 글로리어스",
        stats: [
            {
                type: "레벨이 25 이상일때 크리티컬",
                value: 8,
            },
            {
                type: "마나 실드 랭크 A 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 3 이상일 때 최대대미지",
                value: 8,
            },
        ],
    },
    "8주년 기념 시너지": {
        name: "8주년 기념 시너지",
        stats: [
            {
                type: "플레이머 랭크 5 이상일 때 불 속성 연금술 대미지",
                value: 5,
            },
            {
                type: "워터 캐논 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 5,
                max: 8,
            },
            {
                type: "플레이머 랭크 9 이상일 때 물 속성 연금술 대미지",
                min: 8,
                max: 12,
            },
            {
                type: "연금술 마스터리 랭크 5 이상일 때 크리티컬",
                value: 6,
            },
        ],
    },
    "8주년 기념 새싹": {
        name: "8주년 기념 새싹",
        stats: [
            {
                type: "최대마나",
                value: 88,
            },
            {
                type: "지력",
                value: 8,
            },
        ],
    },
    "8주년 기념 임프": {
        name: "8주년 기념 임프",
        stats: [
            {
                type: "방어",
                value: 8,
            },
            {
                type: "보호",
                value: 3,
            },
            {
                type: "체력",
                value: 10,
            },
        ],
    },
    "8주년 기념 우아한": {
        name: "8주년 기념 우아한",
        stats: [
            {
                type: "크리티컬",
                value: 8,
            },
            {
                type: "밸런스",
                value: 10,
            },
        ],
    },
    "8주년 기념 물방울": {
        name: "8주년 기념 물방울",
        stats: [
            {
                type: "물 속성 연금술 대미지",
                value: 8,
            },
        ],
    },
    극복: {
        name: "극복",
        stats: [
            {
                type: "리스토어 후유증 상태일때 의지",
                value: 21,
            },
        ],
    },
    명료한: {
        name: "명료한",
        stats: [
            {
                type: "썬더 랭크 5 이상일 때 마법 공격력",
                value: 2,
            },
            {
                type: "파이어볼 랭크 5 이상일 때 최대마나",
                value: 15,
            },
        ],
    },
    오케스트라: {
        name: "오케스트라",
        stats: [
            {
                type: "인내의 노래 랭크 3 이상일 때 음악버프 스킬 지속시간",
                value: 3,
            },
            {
                type: "행진곡 랭크 A 이상일 때 최대생명력",
                value: 40,
            },
            {
                type: "최대마나",
                value: 30,
            },
            {
                type: "최대스태미나",
                value: 30,
            },
        ],
    },
    오페라: {
        name: "오페라",
        stats: [
            {
                type: "악기 연주 랭크 7 이상일 때 음악버프 스킬 지속시간",
                value: 2,
            },
            {
                type: "인내의 노래 랭크 7 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "최대마나",
                value: 15,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    합주: {
        name: "합주",
        stats: [
            {
                type: "인내의 노래 랭크 A 이상일 때 최대스태미나",
                value: 15,
            },
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
        ],
    },
    장조의: {
        name: "장조의",
        stats: [
            {
                type: "악기 연주 랭크 2 이상일 때 음악버프 스킬 지속시간",
                value: 2,
            },
            {
                type: "풍년가 랭크 9 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 25,
            },
            {
                type: "최대스태미나",
                value: 25,
            },
        ],
    },
    단조의: {
        name: "단조의",
        stats: [
            {
                type: "악기 연주 랭크 9 이상일 때 최대스태미나",
                value: 5,
            },
            {
                type: "자장가 랭크 C 이상일 때 최대생명력",
                value: 2,
            },
            {
                type: "최대생명력",
                value: 4,
            },
            {
                type: "최대스태미나",
                value: 4,
            },
        ],
    },
    리듬: {
        name: "리듬",
        stats: [
            {
                type: "악기 연주 랭크 3 이상일 때 음악버프 스킬 지속시간",
                value: 2,
            },
            {
                type: "멜로디 쇼크 랭크 3 이상일 때 최대대미지",
                value: 12,
            },
            {
                type: "최대대미지",
                value: 8,
            },
            {
                type: "최대스태미나",
                min: 20,
                max: 30,
            },
        ],
    },
    코드: {
        name: "코드",
        stats: [
            {
                type: "악기 연주 랭크 7 이상일 때 음악버프 스킬 효과",
                value: 1,
            },
            {
                type: "멜로디 쇼크 랭크 7 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "최대대미지",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    도레미: {
        name: "도레미",
        stats: [
            {
                type: "악기 연주 랭크 9 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "멜로디 쇼크 랭크 9 이상일 때 최대대미지",
                value: 7,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    알레그로: {
        name: "알레그로",
        stats: [
            {
                type: "악기 연주 랭크 3 이상일 때 음악버프 스킬 효과",
                value: 3,
            },
            {
                type: "자장가 랭크 5 이상일 때 최대생명력",
                value: 15,
            },
            {
                type: "최대대미지",
                value: 8,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    모데라토: {
        name: "모데라토",
        stats: [
            {
                type: "악기 연주 랭크 8 이상일 때 음악버프 스킬 효과",
                value: 2,
            },
            {
                type: "자장가 랭크 9 이상일 때 최대생명력",
                value: 7,
            },
            {
                type: "최대대미지",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
        ],
    },
    안단테: {
        name: "안단테",
        stats: [
            {
                type: "악기 연주 랭크 B 이상일 때 음악버프 스킬 효과",
                value: 1,
            },
            {
                type: "자장가 랭크 B 이상일 때 최대생명력",
                value: 4,
            },
            {
                type: "최대대미지",
                value: 3,
            },
            {
                type: "최대스태미나",
                value: 12,
            },
        ],
    },
    결전의: {
        name: "결전의",
        stats: [
            {
                type: "누적레벨이 500 이하일때 최대대미지",
                value: 4,
            },
            {
                type: "누적레벨이 500 이하일때 지력",
                value: 10,
            },
            {
                type: "누적레벨이 500 이하일때 최대스태미나",
                value: 10,
            },
        ],
    },
    음모의: {
        name: "음모의",
        stats: [
            {
                type: "누적레벨이 500 이하일때 최대대미지",
                value: 8,
            },
            {
                type: "누적레벨이 500 이하일때 크리티컬",
                value: 5,
            },
            {
                type: "누적레벨이 500 이하일때 최대생명력",
                value: 5,
            },
        ],
    },
    무곡의: {
        name: "무곡의",
        stats: [
            {
                type: "누적레벨이 500 이하일때 최대대미지",
                value: 5,
            },
            {
                type: "누적레벨이 500 이하일때 밸런스",
                value: 5,
            },
            {
                type: "누적레벨이 500 이하일때 최대마나",
                value: 5,
            },
        ],
    },
    "피닉스의 날개": {
        name: "피닉스의 날개",
        stats: [
            {
                type: "크리티컬",
                min: 2,
                max: 5,
            },
            {
                type: "피닉스의 탄생을 지켜본 타이틀을 달고 있을때 솜씨",
                value: 10,
            },
        ],
    },
    "피닉스의 분노": {
        name: "피닉스의 분노",
        stats: [
            {
                type: "행운",
                value: 20,
            },
            {
                type: "크리티컬",
                min: 5,
                max: 10,
            },
            {
                type: "피닉스의 탄생을 지켜본 타이틀을 달고 있을때 최대대미지",
                min: 1,
                max: 3,
            },
        ],
    },
    "피닉스의 불꽃": {
        name: "피닉스의 불꽃",
        stats: [
            {
                type: "크리티컬",
                min: 7,
                max: 9,
            },
            {
                type: "최대대미지",
                min: 6,
                max: 8,
            },
            {
                type: "피닉스의 탄생을 지켜본 타이틀을 달고 있을때 행운",
                value: 10,
            },
        ],
    },
    "피닉스의 축복": {
        name: "피닉스의 축복",
        stats: [
            {
                type: "행운",
                value: 20,
            },
            {
                type: "피닉스의 탄생을 지켜본 타이틀을 달고 있을때 행운",
                min: 5,
                max: 25,
            },
        ],
    },
    "피닉스의 통찰": {
        name: "피닉스의 통찰",
        stats: [
            {
                type: "지력",
                min: 4,
                max: 6,
            },
            {
                type: "피닉스의 탄생을 지켜본 타이틀을 달고 있을때 마나 소비 감소",
                min: 1,
                max: 4,
            },
        ],
    },
    "피닉스의 지혜": {
        name: "피닉스의 지혜",
        stats: [
            {
                type: "마나 소비 감소",
                min: 1,
                max: 4,
            },
            {
                type: "마법 공격력",
                min: 1,
                max: 3,
            },
            {
                type: "피닉스의 탄생을 지켜본 타이틀을 달고 있을때 지력",
                value: 10,
            },
        ],
    },
    불굴의: {
        name: "불굴의",
        stats: [
            {
                type: "리스토어 후유증 상태일때 의지",
                value: 27,
            },
        ],
    },
    사하긴: {
        name: "사하긴",
        stats: [
            {
                type: "마나실드 사용 상태일때 솜씨",
                value: 16,
            },
        ],
    },
    도전자: {
        name: "도전자",
        stats: [
            {
                type: "연속기 마스터리 랭크 1 이상일 때 의지",
                min: 8,
                max: 16,
            },
            {
                type: "연속기 마스터리 랭크 5 이상일 때 최대대미지",
                min: 8,
                max: 12,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    "하드 펀치": {
        name: "하드 펀치",
        stats: [
            {
                type: "스크류 어퍼 랭크 3 이상일 때 최대대미지",
                min: 13,
                max: 20,
            },
            {
                type: "차징 피스트 랭크 5 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "의지",
                min: 12,
                max: 20,
            },
        ],
    },
    탐욕: {
        name: "탐욕",
        stats: [
            {
                type: "교역 상태일때 최대대미지",
                value: 15,
            },
            {
                type: "행운",
                value: 15,
            },
        ],
    },
    나비: {
        name: "나비",
        stats: [
            {
                type: "마나실드 사용 상태일때 최대대미지",
                min: 7,
                max: 12,
            },
        ],
    },
    버터플라이: {
        name: "버터플라이",
        stats: [
            {
                type: "마나실드 사용 상태일때 최대대미지",
                min: 7,
                max: 12,
            },
        ],
    },
    달인: {
        name: "달인",
        stats: [
            {
                type: "백스텝 랭크 9 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "리스토어 랭크 5 이상일 때 의지",
                min: 8,
                max: 16,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    조개: {
        name: "조개",
        stats: [
            {
                type: "체력",
                min: 25,
                max: 35,
            },
        ],
    },
    추적하는: {
        name: "추적하는",
        stats: [
            {
                type: "의지",
                value: 10,
            },
            {
                type: "현상범 추적 모드 상태일때 최대대미지",
                value: 10,
            },
        ],
    },
    쾌속의: {
        name: "쾌속의",
        stats: [
            {
                type: "파운딩 랭크 1 이상일 때 최대대미지",
                min: 17,
                max: 25,
            },
            {
                type: "파운딩 랭크 5 이상일 때 최소대미지",
                value: 7,
            },
            {
                type: "파운딩 랭크 9 이상일 때 의지",
                value: 20,
            },
        ],
    },
    결투의: {
        name: "결투의",
        stats: [
            {
                type: "드롭킥 랭크 3 이상일 때 최대대미지",
                min: 8,
                max: 10,
            },
            {
                type: "섬머솔트 랭크 5 이상일 때 의지",
                min: 8,
                max: 15,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    젖은: {
        name: "젖은",
        stats: [
            {
                type: "연금술 구름 아래 상태일때 마법 공격력",
                value: 10,
            },
        ],
    },
    주먹의: {
        name: "주먹의",
        stats: [
            {
                type: "너클 마스터리 랭크 5 이상일 때 의지",
                min: 20,
                max: 30,
            },
            {
                type: "너클 마스터리 랭크 9 이상일 때 의지",
                min: 18,
                max: 25,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    무딘: {
        name: "무딘",
        stats: [
            {
                type: "체력",
                min: 20,
                max: 40,
            },
        ],
    },
    농장: {
        name: "농장",
        stats: [
            {
                type: "마법 공격력",
                value: 2,
            },
        ],
    },
    현상범: {
        name: "현상범",
        stats: [
            {
                type: "솜씨",
                value: 11,
            },
        ],
    },
    전쟁의: {
        name: "전쟁의",
        stats: [
            {
                type: "체력",
                value: 100,
            },
            {
                type: "의지",
                value: 100,
            },
            {
                type: "행운",
                value: 100,
            },
        ],
    },
    친구: {
        name: "친구",
        stats: [
            {
                type: "야생 동물 조련 랭크 5 이상일 때 행운",
                value: 15,
            },
            {
                type: "목공 랭크 5 이상일 때 체력",
                value: 35,
            },
        ],
    },
    프렌드: {
        name: "프렌드",
        stats: [
            {
                type: "야생 동물 조련 랭크 5 이상일 때 행운",
                value: 15,
            },
            {
                type: "목공 랭크 5 이상일 때 체력",
                value: 35,
            },
        ],
    },
    몬스터: {
        name: "몬스터",
        stats: [
            {
                type: "행운",
                value: 20,
            },
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "의지",
                value: 20,
            },
        ],
    },
    결백한: {
        name: "결백한",
        stats: [
            {
                type: "보우 마스터리 랭크 3 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "크로스보우 마스터리 랭크 3 이상일 때 크리티컬",
                value: 9,
            },
        ],
    },
    화창한: {
        name: "화창한",
        stats: [
            {
                type: "크리티컬",
                value: 4,
            },
            {
                type: "최대대미지",
                value: 4,
            },
        ],
    },
    써니: {
        name: "써니",
        stats: [
            {
                type: "크리티컬",
                value: 4,
            },
            {
                type: "최대대미지",
                value: 4,
            },
        ],
    },
    마녀: {
        name: "마녀",
        stats: [
            {
                type: "파이어 마스터리 랭크 3 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
            {
                type: "라이트닝 마스터리 랭크 3 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
        ],
    },
    블라인드: {
        name: "블라인드",
        stats: [
            {
                type: "피어싱 레벨",
                value: 2,
            },
            {
                type: "랜스 마스터리 랭크 1 이상일 때 크리티컬",
                value: 7,
            },
            {
                type: "랜스 카운터 랭크 1 이상일 때 최대대미지",
                value: 7,
            },
        ],
    },
    벌새: {
        name: "벌새",
        stats: [
            {
                type: "공격 속도",
                min: 2,
                max: 3,
            },
            {
                type: "솜씨",
                min: 5,
                max: 10,
            },
        ],
    },
    카우보이: {
        name: "카우보이",
        stats: [
            {
                type: "물 속성 연금술 대미지",
                value: 6,
            },
            {
                type: "불 속성 연금술 대미지",
                value: 4,
            },
        ],
    },
    여행자의: {
        name: "여행자의",
        stats: [
            {
                type: "누적레벨이 200 이하일때 최대생명력",
                value: 5,
            },
            {
                type: "누적레벨이 100 이하일때 최대생명력",
                value: 5,
            },
            {
                type: "누적레벨이 200 이하일때 최대마나",
                value: 5,
            },
            {
                type: "누적레벨이 100 이상일때 최대마나",
                value: 5,
            },
            {
                type: "누적레벨이 200 이하일때 최대스태미나",
                value: 5,
            },
            {
                type: "누적레벨이 100 이상일때 최대스태미나",
                value: 5,
            },
        ],
    },
    신입생의: {
        name: "신입생의",
        stats: [
            {
                type: "누적레벨이 200 이하일때 체력",
                value: 3,
            },
            {
                type: "누적레벨이 100 이상일때 체력",
                value: 3,
            },
            {
                type: "누적레벨이 200 이하일때 솜씨",
                value: 3,
            },
            {
                type: "누적레벨이 100 이상일때 솜씨",
                value: 3,
            },
            {
                type: "누적레벨이 200 이하일때 지력",
                value: 3,
            },
            {
                type: "누적레벨이 100 이상일때 지력",
                value: 3,
            },
        ],
    },
    매복: {
        name: "매복",
        stats: [
            {
                type: "블런트 마스터리 랭크 1 이상일 때 최대대미지",
                min: 7,
                max: 11,
            },
            {
                type: "액스 마스터리 랭크 1 이상일 때 최소대미지",
                value: 5,
            },
        ],
    },
    저주받은: {
        name: "저주받은",
        stats: [
            {
                type: "레인 캐스팅 랭크 D 이상일 때 크리티컬",
                min: 3,
                max: 7,
            },
            {
                type: "회피 랭크 E 이상일 때 최대대미지",
                min: 11,
                max: 25,
            },
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "보호",
                value: 3,
            },
        ],
    },
    보물: {
        name: "보물",
        stats: [
            {
                type: "볼트 마스터리 랭크 1 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
            {
                type: "아이스 마스터리 랭크 1 이상일 때 마법 공격력",
                value: 1,
            },
        ],
    },
    트레져: {
        name: "트레져",
        stats: [
            {
                type: "볼트 마스터리 랭크 1 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
            {
                type: "아이스 마스터리 랭크 1 이상일 때 마법 공격력",
                value: 1,
            },
        ],
    },
    약탈자: {
        name: "약탈자",
        stats: [
            {
                type: "돌진 랭크 1 이상일 때 체력",
                value: 25,
            },
            {
                type: "회피 랭크 1 이상일 때 행운",
                value: 25,
            },
        ],
    },
    꿈꾸는: {
        name: "꿈꾸는",
        stats: [
            {
                type: "누적레벨이 200 이하일때 의지",
                value: 2,
            },
            {
                type: "누적레벨이 100 이상일때 의지",
                value: 2,
            },
            {
                type: "누적레벨이 200 이하일때 행운",
                value: 1,
            },
            {
                type: "누적레벨이 100 이상일때 행운",
                value: 1,
            },
        ],
    },
    출발하는: {
        name: "출발하는",
        stats: [
            {
                type: "누적레벨이 200 이하일때 방어",
                value: 1,
            },
            {
                type: "누적레벨이 100 이상일때 방어",
                value: 1,
            },
            {
                type: "누적레벨이 200 이하일때 최대대미지",
                value: 2,
            },
            {
                type: "누적레벨이 100 이상일때 최대대미지",
                value: 2,
            },
        ],
    },
    사악한: {
        name: "사악한",
        stats: [
            {
                type: "레벨이 60 이하일때 최대마나",
                value: 20,
            },
            {
                type: "레벨이 60 이하일때 지력",
                value: 10,
            },
            {
                type: "나이가 13 이하일때 최대생명력",
                value: 15,
            },
        ],
    },
    마그마: {
        name: "마그마",
        stats: [
            {
                type: "불 연금술 마스터리 랭크 3 이상일 때 불 속성 연금술 대미지",
                min: 4,
                max: 6,
            },
            {
                type: "히트 버스터 랭크 3 이상일 때 불 속성 연금술 대미지",
                min: 4,
                max: 6,
            },
        ],
    },
    아일랜드: {
        name: "아일랜드",
        stats: [
            {
                type: "헤일스톰 랭크 A 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
            {
                type: "헤일스톰 랭크 5 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
        ],
    },
    소매치기: {
        name: "소매치기",
        stats: [
            {
                type: "행운",
                value: 10,
            },
            {
                type: "나이가 15 이하일때 솜씨",
                value: 15,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
            {
                type: "보호",
                min: 1,
                max: 3,
            },
        ],
    },
    연옥: {
        name: "연옥",
        stats: [
            {
                type: "워터 캐논 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 5,
                max: 27,
            },
            {
                type: "플레이머 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 1,
                max: 10,
            },
            {
                type: "연금술 마스터리 랭크 6 이상일 때 물 속성 연금술 대미지",
                value: 10,
            },
            {
                type: "연금술 마스터리 랭크 6 이상일 때 불 속성 연금술 대미지",
                value: 3,
            },
        ],
    },
    소네트: {
        name: "소네트",
        stats: [
            {
                type: "체력",
                value: 10,
            },
            {
                type: "지력",
                value: 10,
            },
            {
                type: "솜씨",
                value: 10,
            },
        ],
    },
    건달: {
        name: "건달",
        stats: [
            {
                type: "돌진 랭크 A 이상일 때 최대대미지",
                min: 9,
                max: 12,
            },
            {
                type: "다운 어택 랭크 A 이상일 때 크리티컬",
                min: 2,
                max: 4,
            },
            {
                type: "스매시 랭크 5 이하일 때 보호",
                value: 2,
            },
        ],
    },
    개구쟁이: {
        name: "개구쟁이",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
            {
                type: "나이가 13 이하일때 행운",
                value: 16,
            },
            {
                type: "나이가 13 이하일때 최대대미지",
                value: 4,
            },
        ],
    },
    천방지축: {
        name: "천방지축",
        stats: [
            {
                type: "나이가 16 이하일때 크리티컬",
                value: 5,
            },
            {
                type: "회피 랭크 D 이상일 때 최대대미지",
                min: 3,
                max: 6,
            },
            {
                type: "윈드밀 랭크 9 이상일 때 최대대미지",
                min: 3,
                max: 6,
            },
            {
                type: "방어",
                value: 4,
            },
        ],
    },
    불장난: {
        name: "불장난",
        stats: [
            {
                type: "플레이머 랭크 E 이상일 때 크리티컬",
                min: 3,
                max: 9,
            },
            {
                type: "히트 버스터 랭크 E 이상일 때 최대대미지",
                min: 2,
                max: 5,
            },
            {
                type: "블레이즈 랭크 E 이상일 때 최소대미지",
                value: 3,
            },
            {
                type: "캠프 파이어 랭크 A 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "힐링 랭크 D 이상일 때 방어",
                value: 3,
            },
            {
                type: "파티 힐링 랭크 5 이상일 때 보호",
                value: 2,
            },
        ],
    },
    사고뭉치: {
        name: "사고뭉치",
        stats: [
            {
                type: "레벨이 55 이하일때 솜씨",
                value: 7,
            },
            {
                type: "나이가 13 이하일때 솜씨",
                min: 13,
                max: 17,
            },
            {
                type: "나이가 13 이하일때 최대스태미나",
                value: 10,
            },
            {
                type: "방어",
                value: 4,
            },
        ],
    },
    소름끼치는: {
        name: "소름끼치는",
        stats: [
            {
                type: "현혹의 연주 랭크 C 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "라이프 드레인 랭크 A 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
            {
                type: "최대생명력",
                value: 10,
            },
        ],
    },
    엘프의: {
        name: "엘프의",
        stats: [
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "최소대미지",
                value: 2,
            },
            {
                type: "최대대미지",
                value: 3,
            },
            {
                type: "솜씨",
                min: 1,
                max: 10,
            },
        ],
    },
    클래식: {
        name: "클래식",
        stats: [
            {
                type: "현혹의 연주 랭크 B 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "현혹의 연주 랭크 6 이상일 때 크리티컬",
                value: 8,
            },
        ],
    },
    부지런한: {
        name: "부지런한",
        stats: [
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "포션 조제 랭크 9 이상일 때 행운",
                value: 25,
            },
            {
                type: "목공 랭크 8 이상일 때 최대스태미나",
                value: 10,
            },
        ],
    },
    특별한: {
        name: "특별한",
        stats: [
            {
                type: "최대대미지",
                value: 8,
            },
            {
                type: "최소대미지",
                value: 5,
            },
            {
                type: "볼트마법조합 랭크 6 이상일 때 크리티컬",
                value: 4,
            },
        ],
    },
    스페셜: {
        name: "스페셜",
        stats: [
            {
                type: "최대대미지",
                value: 8,
            },
            {
                type: "최소대미지",
                value: 5,
            },
            {
                type: "볼트마법조합 랭크 6 이상일 때 크리티컬",
                value: 4,
            },
        ],
    },
    황홀: {
        name: "황홀",
        stats: [
            {
                type: "크리티컬",
                value: 7,
            },
        ],
    },
    가시연꽃: {
        name: "가시연꽃",
        stats: [
            {
                type: "최대대미지",
                value: 12,
            },
            {
                type: "약초학 랭크 5 이상일 때 솜씨",
                min: 8,
                max: 14,
            },
            {
                type: "포션 조제 랭크 5 이상일 때 행운",
                min: 8,
                max: 14,
            },
        ],
    },
    바다냄새의: {
        name: "바다냄새의",
        stats: [
            {
                type: "최대대미지",
                value: 23,
            },
            {
                type: "행운",
                value: 5,
            },
            {
                type: "세월을 낚는 타이틀을 달고 있을때 최대대미지",
                min: 2,
                max: 12,
            },
        ],
    },
    주방장: {
        name: "주방장",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "최소대미지",
                value: 5,
            },
            {
                type: "미식의 달인 타이틀을 달고 있을때 최대대미지",
                min: 2,
                max: 10,
            },
        ],
    },
    끈질긴: {
        name: "끈질긴",
        stats: [
            {
                type: "크리티컬",
                value: 8,
            },
            {
                type: "미식의 달인 타이틀을 달고 있을때 크리티컬",
                min: 3,
                max: 6,
            },
            {
                type: "자연을 상대한 타이틀을 달고 있을때 크리티컬",
                min: 3,
                max: 6,
            },
            {
                type: "세월을 낚는 타이틀을 달고 있을때 크리티컬",
                value: 5,
            },
        ],
    },
    유혹의: {
        name: "유혹의",
        stats: [
            {
                type: "마법 공격력",
                value: 2,
            },
            {
                type: "의지",
                value: 5,
            },
            {
                type: "최대마나",
                value: 20,
            },
            {
                type: "자연을 상대한 타이틀을 달고 있을때 마법 공격력",
                min: 2,
                max: 4,
            },
        ],
    },
    불운한: {
        name: "불운한",
        stats: [
            {
                type: "행운",
                min: 1,
                max: 3,
            },
        ],
    },
    관통하는: {
        name: "관통하는",
        stats: [
            {
                type: "랜스 카운터 랭크 3 이상일 때 피어싱 레벨",
                value: 2,
            },
            {
                type: "랜스 마스터 타이틀을 달고 있을때 최대대미지",
                value: 6,
            },
            {
                type: "랜스 차지 랭크 8 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "랜스 차지 랭크 B 이하일 때 최소대미지",
                value: 12,
            },
            {
                type: "최대생명력",
                value: 20,
            },
        ],
    },
    상쾌한: {
        name: "상쾌한",
        stats: [
            {
                type: "프로즌 블래스트 랭크 3 이상일 때 물 속성 연금술 대미지",
                value: 15,
            },
            {
                type: "워터 캐논 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 30,
                max: 40,
            },
            {
                type: "플레이머 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 10,
                max: 15,
            },
            {
                type: "솜씨",
                value: 30,
            },
        ],
    },
    공성의: {
        name: "공성의",
        stats: [
            {
                type: "랜스 차지 랭크 8 이상일 때 피어싱 레벨",
                value: 1,
            },
            {
                type: "랜스 차지 랭크 5 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "랜스 마스터리 랭크 8 이상일 때 최대대미지",
                min: 6,
                max: 14,
            },
            {
                type: "방어",
                value: 2,
            },
        ],
    },
    시즈: {
        name: "시즈",
        stats: [
            {
                type: "랜스 차지 랭크 8 이상일 때 피어싱 레벨",
                value: 1,
            },
            {
                type: "랜스 차지 랭크 5 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "랜스 마스터리 랭크 8 이상일 때 최대대미지",
                min: 6,
                max: 14,
            },
            {
                type: "방어",
                value: 2,
            },
        ],
    },
    훈장: {
        name: "훈장",
        stats: [
            {
                type: "랜스 카운터 랭크 9 이상일 때 크리티컬",
                value: 6,
            },
            {
                type: "랜스 차지 랭크 6 이상일 때 최대대미지",
                min: 10,
                max: 18,
            },
            {
                type: "랜스 마스터리 랭크 6 이상일 때 최소대미지",
                value: 16,
            },
            {
                type: "랜스 카운터 랭크 3 이상일 때 피어싱 레벨",
                value: 1,
            },
            {
                type: "최대마나",
                value: 25,
            },
        ],
    },
    메달: {
        name: "메달",
        stats: [
            {
                type: "랜스 카운터 랭크 9 이상일 때 크리티컬",
                value: 6,
            },
            {
                type: "랜스 차지 랭크 6 이상일 때 최대대미지",
                min: 10,
                max: 18,
            },
            {
                type: "랜스 마스터리 랭크 6 이상일 때 최소대미지",
                value: 16,
            },
            {
                type: "랜스 카운터 랭크 3 이상일 때 피어싱 레벨",
                value: 1,
            },
            {
                type: "최대마나",
                value: 25,
            },
        ],
    },
    데들리: {
        name: "데들리",
        stats: [
            {
                type: "스매시 랭크 9 이상일 때 솜씨",
                value: 5,
            },
            {
                type: "윈드밀 랭크 9 이상일 때 크리티컬",
                value: 15,
            },
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 밸런스",
                value: 40,
            },
        ],
    },
    지치지않는: {
        name: "지치지않는",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 최대대미지",
                value: 7,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
        ],
    },
    되돌린: {
        name: "되돌린",
        stats: [
            {
                type: "크리티컬",
                value: 8,
            },
            {
                type: "힐링 랭크 5 이상일 때 크리티컬",
                min: 6,
                max: 9,
            },
            {
                type: "최소대미지",
                value: 5,
            },
            {
                type: "최대대미지",
                value: 5,
            },
            {
                type: "파티 힐링 랭크 9 이상일 때 최대생명력",
                min: 10,
                max: 15,
            },
        ],
    },
    광활한: {
        name: "광활한",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    스트라이더: {
        name: "스트라이더",
        stats: [
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "체력",
                value: 16,
            },
        ],
    },
    제비: {
        name: "제비",
        stats: [
            {
                type: "공격 속도",
                min: 2,
                max: 4,
            },
        ],
    },
    웨이브: {
        name: "웨이브",
        stats: [
            {
                type: "워터 캐논 랭크 1 이상일 때 물 속성 연금술 대미지",
                min: 15,
                max: 25,
            },
            {
                type: "연금술 마스터리 랭크 5 이상일 때 물 속성 연금술 대미지",
                value: 18,
            },
        ],
    },
    백작: {
        name: "백작",
        stats: [
            {
                type: "공격 속도",
                min: 1,
                max: 3,
            },
            {
                type: "컴뱃 마스터리 랭크 3 이상일 때 체력",
                value: 15,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    똑똑한: {
        name: "똑똑한",
        stats: [
            {
                type: "지력",
                value: 15,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "파이어볼 랭크 7 이상일 때 크리티컬",
                value: 8,
            },
        ],
    },
    질긴: {
        name: "질긴",
        stats: [
            {
                type: "최대생명력",
                min: 10,
                max: 15,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    남작: {
        name: "남작",
        stats: [
            {
                type: "크리티컬 히트 랭크 3 이상일 때 공격 속도",
                min: 1,
                max: 3,
            },
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "다운 어택 랭크 6 이상일 때 체력",
                min: 10,
                max: 20,
            },
            {
                type: "디펜스 랭크 1 이상일 때 방어",
                value: 1,
            },
        ],
    },
    흑단: {
        name: "흑단",
        stats: [
            {
                type: "방호벽 랭크 7 이상일 때 방호벽 내구",
                value: 60,
            },
            {
                type: "밸런스",
                value: 4,
            },
        ],
    },
    스태틱: {
        name: "스태틱",
        stats: [
            {
                type: "스파크 랭크 9 이상일 때 크리티컬",
                min: 12,
                max: 14,
            },
            {
                type: "레벨이 25 이상일때 의지",
                value: 15,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    흐름의: {
        name: "흐름의",
        stats: [
            {
                type: "인챈트 랭크 A 이상일 때 최대마나",
                value: 10,
            },
            {
                type: "메디테이션 랭크 7 이상일 때 최대마나",
                value: 10,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "메이킹 마스터리 랭크 9 이상일 때 최대스태미나",
                value: 10,
            },
        ],
    },
    분해의: {
        name: "분해의",
        stats: [
            {
                type: "분해 성공률",
                value: 3,
            },
        ],
    },
    풍족한: {
        name: "풍족한",
        stats: [
            {
                type: "최대스태미나",
                value: 15,
            },
            {
                type: "야금술 랭크 D 이상일 때 솜씨",
                value: 15,
            },
        ],
    },
    착실한: {
        name: "착실한",
        stats: [
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "메이킹 마스터리 랭크 A 이상일 때 행운",
                value: 8,
            },
        ],
    },
    엘레멘탈리스트: {
        name: "엘레멘탈리스트",
        stats: [
            {
                type: "아이스볼트 랭크 9 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "파이어볼트 랭크 9 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "라이트닝볼트 랭크 9 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "레벨이 25 이상일때 크리티컬",
                value: 2,
            },
        ],
    },
    섬광의: {
        name: "섬광의",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
            {
                type: "최소대미지",
                value: 5,
            },
            {
                type: "레벨이 35 이상일때 최대대미지",
                value: 7,
            },
        ],
    },
    방랑자: {
        name: "방랑자",
        stats: [
            {
                type: "레벨이 30 이상일때 최대대미지",
                min: 10,
                max: 15,
            },
            {
                type: "최대스태미나",
                value: 8,
            },
        ],
    },
    호크: {
        name: "호크",
        stats: [
            {
                type: "공격 속도",
                min: 1,
                max: 3,
            },
            {
                type: "탐험 레벨이 10 이상일때 최대대미지",
                value: 5,
            },
        ],
    },
    타이달: {
        name: "타이달",
        stats: [
            {
                type: "물 속성 연금술 대미지",
                value: 10,
            },
        ],
    },
    자작: {
        name: "자작",
        stats: [
            {
                type: "공격 속도",
                min: 1,
                max: 2,
            },
            {
                type: "카운터 어택 랭크 3 이상일 때 최대대미지",
                value: 8,
            },
        ],
    },
    올빼미: {
        name: "올빼미",
        stats: [
            {
                type: "공격 속도",
                min: 1,
                max: 3,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    안전한: {
        name: "안전한",
        stats: [
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "최대마나",
                value: 15,
            },
            {
                type: "지력",
                value: 10,
            },
        ],
    },
    손재주: {
        name: "손재주",
        stats: [
            {
                type: "탐험 레벨이 15 이상일때 솜씨",
                value: 10,
            },
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    부적: {
        name: "부적",
        stats: [
            {
                type: "블랙스미스 랭크 9 이상일 때 행운",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    교수: {
        name: "교수",
        stats: [
            {
                type: "메디테이션 랭크 9 이상일 때 최대마나",
                value: 18,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "마법 방어",
                value: 2,
            },
            {
                type: "지력",
                min: 3,
                max: 6,
            },
        ],
    },
    리플: {
        name: "리플",
        stats: [
            {
                type: "워터 캐논 랭크 D 이상일 때 물 속성 연금술 대미지",
                value: 3,
            },
            {
                type: "워터 캐논 랭크 6 이상일 때 물 속성 연금술 대미지",
                value: 4,
            },
            {
                type: "최대스태미나",
                value: 4,
            },
        ],
    },
    들끓는: {
        name: "들끓는",
        stats: [
            {
                type: "최소대미지",
                value: 4,
            },
            {
                type: "최대대미지",
                value: 4,
            },
            {
                type: "밸런스",
                value: 3,
            },
        ],
    },
    통찰력의: {
        name: "통찰력의",
        stats: [
            {
                type: "힐링 랭크 C 이상일 때 지력",
                value: 10,
            },
            {
                type: "밸런스",
                value: 3,
            },
            {
                type: "최대마나",
                value: 15,
            },
        ],
    },
    솜씨좋은: {
        name: "솜씨좋은",
        stats: [
            {
                type: "최소대미지",
                value: 4,
            },
            {
                type: "최대대미지",
                value: 5,
            },
            {
                type: "밸런스",
                value: 3,
            },
        ],
    },
    유리조각: {
        name: "유리조각",
        stats: [
            {
                type: "최대대미지",
                value: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    새싹: {
        name: "새싹",
        stats: [
            {
                type: "지력",
                value: 7,
            },
            {
                type: "최대마나",
                value: 12,
            },
        ],
    },
    고슴도치: {
        name: "고슴도치",
        stats: [
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    주말: {
        name: "주말",
        stats: [
            {
                type: "폭발 저항",
                min: 1,
                max: 3,
            },
            {
                type: "스톰프 저항",
                min: 1,
                max: 3,
            },
            {
                type: "독면역",
                value: 2,
            },
            {
                type: "임볼릭(Imbolic) 상태일때 체력",
                value: 60,
            },
            {
                type: "삼하인(Samhain) 상태일때 행운",
                value: 60,
            },
            {
                type: "알반 엘베드(Alban Elved) 상태일때 의지",
                value: 60,
            },
        ],
    },
    "마나 해머": {
        name: "마나 해머",
        stats: [
            {
                type: "매직 마스터리 랭크 5 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
            {
                type: "블레이즈 랭크 7 이상일 때 마법 공격력",
                min: 1,
                max: 2,
            },
            {
                type: "아이스 스피어 랭크 9 이상일 때 마법 공격력",
                value: 1,
            },
        ],
    },
    채집의: {
        name: "채집의",
        stats: [
            {
                type: "레벨이 40 이상일때 행운",
                min: 20,
                max: 35,
            },
            {
                type: "방직 랭크 6 이상일 때 솜씨",
                min: 10,
                max: 15,
            },
        ],
    },
    공작: {
        name: "공작",
        stats: [
            {
                type: "블런트 마스터리 랭크 6 이상일 때 공격 속도",
                min: 1,
                max: 3,
            },
            {
                type: "액스 마스터리 랭크 6 이상일 때 최대생명력",
                value: 15,
            },
            {
                type: "소드 마스터리 랭크 6 이상일 때 체력",
                min: 20,
                max: 30,
            },
            {
                type: "타운트 랭크 6 이상일 때 행운",
                value: 15,
            },
        ],
    },
    후작: {
        name: "후작",
        stats: [
            {
                type: "공격 속도",
                min: 2,
                max: 4,
            },
            {
                type: "윈드밀 랭크 1 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "윈드밀 랭크 6 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "회피 랭크 6 이상일 때 최대스태미나",
                value: 10,
            },
        ],
    },
    시너지: {
        name: "시너지",
        stats: [
            {
                type: "플레이머 랭크 5 이상일 때 불 속성 연금술 대미지",
                value: 5,
            },
            {
                type: "워터 캐논 랭크 1 이상일 때 불 속성 연금술 대미지",
                min: 3,
                max: 7,
            },
            {
                type: "플레이머 랭크 9 이상일 때 물 속성 연금술 대미지",
                min: 7,
                max: 11,
            },
            {
                type: "연금술 마스터리 랭크 5 이상일 때 크리티컬",
                value: 6,
            },
        ],
    },
    행운아: {
        name: "행운아",
        stats: [
            {
                type: "낚시 랭크 3 이상일 때 행운",
                min: 25,
                max: 40,
            },
        ],
    },
    "마나 월": {
        name: "마나 월",
        stats: [
            {
                type: "매직 마스터리 랭크 6 이상일 때 마법 방어",
                value: 10,
            },
            {
                type: "디펜스 랭크 9 이상일 때 방어",
                value: 2,
            },
            {
                type: "지력",
                value: 12,
            },
            {
                type: "의지",
                value: 12,
            },
        ],
    },
    트위스터: {
        name: "트위스터",
        stats: [
            {
                type: "최소대미지",
                min: 6,
                max: 10,
            },
            {
                type: "레벨이 40 이상일때 최대대미지",
                min: 10,
                max: 14,
            },
        ],
    },
    "마나 컨져러": {
        name: "마나 컨져러",
        stats: [
            {
                type: "썬더 랭크 9 이상일 때 마나 소비 감소",
                min: 2,
                max: 4,
            },
            {
                type: "아이스 스피어 랭크 8 이상일 때 마법 공격력",
                value: 2,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    동결된: {
        name: "동결된",
        stats: [
            {
                type: "프로즌 블래스트 적용 범위",
                value: 8,
            },
        ],
    },
    오아시스: {
        name: "오아시스",
        stats: [
            {
                type: "솜씨",
                min: 5,
                max: 10,
            },
            {
                type: "레벨이 45 이상일때 크리티컬",
                min: 6,
                max: 10,
            },
            {
                type: "최대스태미나",
                value: 6,
            },
            {
                type: "최대생명력",
                value: 6,
            },
        ],
    },
    스팀: {
        name: "스팀",
        stats: [
            {
                type: "크리티컬",
                value: 6,
            },
            {
                type: "마나 포밍 랭크 B 이상일 때 불 속성 연금술 대미지",
                value: 3,
            },
            {
                type: "레인 캐스팅 랭크 B 이상일 때 물 속성 연금술 대미지",
                value: 6,
            },
        ],
    },
    "마나 스톤": {
        name: "마나 스톤",
        stats: [
            {
                type: "마나 실드 랭크 8 이상일 때 마법 방어",
                value: 5,
            },
            {
                type: "최대대미지",
                value: 5,
            },
        ],
    },
    "마나 소서러": {
        name: "마나 소서러",
        stats: [
            {
                type: "메디테이션 랭크 9 이상일 때 마나 소비 감소",
                min: 2,
                max: 3,
            },
            {
                type: "최대생명력",
                value: 8,
            },
        ],
    },
    릴렉스: {
        name: "릴렉스",
        stats: [
            {
                type: "레벨이 16 이상일때 최대대미지",
                value: 10,
            },
        ],
    },
    망각: {
        name: "망각",
        stats: [
            {
                type: "최대생명력",
                value: 8,
            },
            {
                type: "레벨이 20 이상일때 최대대미지",
                value: 10,
            },
            {
                type: "행운",
                value: 15,
            },
        ],
    },
    "마나 니들": {
        name: "마나 니들",
        stats: [
            {
                type: "매직 마스터리 랭크 A 이상일 때 마법 공격력",
                value: 2,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    고통: {
        name: "고통",
        stats: [
            {
                type: "레벨이 25 이상일때 크리티컬",
                value: 3,
            },
            {
                type: "레벨이 25 이상일때 체력",
                value: 12,
            },
            {
                type: "방어",
                value: 3,
            },
        ],
    },
    경호원: {
        name: "경호원",
        stats: [
            {
                type: "폭발 저항",
                min: 1,
                max: 2,
            },
            {
                type: "스톰프 저항",
                min: 1,
                max: 2,
            },
            {
                type: "독면역",
                value: 2,
            },
            {
                type: "체력",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 5,
            },
        ],
    },
    폭발의: {
        name: "폭발의",
        stats: [
            {
                type: "연금술 마스터리 랭크 A 이상일 때 불 속성 연금술 대미지",
                value: 6,
            },
            {
                type: "히트 버스터 랭크 8 이상일 때 최대생명력",
                value: 12,
            },
        ],
    },
    뾰족한: {
        name: "뾰족한",
        stats: [
            {
                type: "크리티컬",
                value: 4,
            },
            {
                type: "최대마나",
                value: 13,
            },
        ],
    },
    발굴자: {
        name: "발굴자",
        stats: [
            {
                type: "밸런스",
                value: 12,
            },
            {
                type: "솜씨",
                value: 5,
            },
        ],
    },
    고정된: {
        name: "고정된",
        stats: [
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "마나 소비 감소",
                value: 1,
            },
            {
                type: "행운",
                value: 15,
            },
        ],
    },
    시야: {
        name: "시야",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "밸런스",
                value: 10,
            },
        ],
    },
    덩굴: {
        name: "덩굴",
        stats: [
            {
                type: "크리티컬",
                value: 14,
            },
            {
                type: "행운",
                value: 20,
            },
        ],
    },
    이점의: {
        name: "이점의",
        stats: [
            {
                type: "행운",
                value: 14,
            },
        ],
    },
    스파크: {
        name: "스파크",
        stats: [
            {
                type: "플레이머 랭크 C 이상일 때 불 속성 연금술 대미지",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 7,
            },
        ],
    },
    송곳니: {
        name: "송곳니",
        stats: [
            {
                type: "크리티컬",
                value: 8,
            },
            {
                type: "체력",
                value: 10,
            },
        ],
    },
    벼려진: {
        name: "벼려진",
        stats: [
            {
                type: "최대대미지",
                value: 5,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    돌풍: {
        name: "돌풍",
        stats: [
            {
                type: "최대스태미나",
                value: 16,
            },
            {
                type: "레인 캐스팅 랭크 C 이상일 때 밸런스",
                value: 6,
            },
            {
                type: "윈드 블래스트 랭크 A 이상일 때 최대스태미나",
                value: 12,
            },
        ],
    },
    부유한: {
        name: "부유한",
        stats: [
            {
                type: "솜씨",
                value: 7,
            },
        ],
    },
    촉촉한: {
        name: "촉촉한",
        stats: [
            {
                type: "워터 캐논 랭크 5 이상일 때 물 속성 연금술 대미지",
                value: 9,
            },
            {
                type: "워터 캐논 랭크 1 이상일 때 물 속성 연금술 대미지",
                value: 18,
            },
        ],
    },
    화염: {
        name: "화염",
        stats: [
            {
                type: "플레이머 랭크 A 이상일 때 불 속성 연금술 대미지",
                value: 6,
            },
            {
                type: "파이어볼트 랭크 A 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "파이어볼 랭크 D 이상일 때 최대마나",
                min: 10,
                max: 20,
            },
            {
                type: "파이어 매직 실드 랭크 B 이상일 때 크리티컬",
                min: 2,
                max: 5,
            },
        ],
    },
    플레임: {
        name: "플레임",
        stats: [
            {
                type: "플레이머 랭크 A 이상일 때 불 속성 연금술 대미지",
                value: 6,
            },
            {
                type: "파이어볼트 랭크 A 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "파이어볼 랭크 D 이상일 때 최대마나",
                min: 10,
                max: 20,
            },
            {
                type: "파이어 매직 실드 랭크 B 이상일 때 크리티컬",
                min: 2,
                max: 5,
            },
        ],
    },
    "강철 바늘": {
        name: "강철 바늘",
        stats: [
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "크리티컬 히트 랭크 9 이상일 때 크리티컬",
                min: 1,
                max: 4,
            },
            {
                type: "컴뱃 마스터리 랭크 7 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 4 이상일 때 최대대미지",
                min: 7,
                max: 11,
            },
        ],
    },
    "스틸 니들": {
        name: "스틸 니들",
        stats: [
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "크리티컬 히트 랭크 9 이상일 때 크리티컬",
                min: 1,
                max: 4,
            },
            {
                type: "컴뱃 마스터리 랭크 7 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 4 이상일 때 최대대미지",
                min: 7,
                max: 11,
            },
        ],
    },
    뿔: {
        name: "뿔",
        stats: [
            {
                type: "최대대미지",
                value: 12,
            },
            {
                type: "약초학 랭크 A 이상일 때 솜씨",
                min: 8,
                max: 14,
            },
            {
                type: "포션 조제 랭크 B 이상일 때 체력",
                min: 8,
                max: 14,
            },
        ],
    },
    혼: {
        name: "혼",
        stats: [
            {
                type: "최대대미지",
                value: 12,
            },
            {
                type: "약초학 랭크 A 이상일 때 솜씨",
                min: 8,
                max: 14,
            },
            {
                type: "포션 조제 랭크 B 이상일 때 체력",
                min: 8,
                max: 14,
            },
        ],
    },
    화이트호스: {
        name: "화이트호스",
        stats: [
            {
                type: "행운",
                value: 20,
            },
            {
                type: "조련 랭크 C 이상일 때 최소대미지",
                value: 3,
            },
            {
                type: "조련 랭크 9 이상일 때 최대대미지",
                min: 5,
                max: 7,
            },
        ],
    },
    장군: {
        name: "장군",
        stats: [
            {
                type: "카운터 어택 랭크 6 이상일 때 크리티컬",
                min: 2,
                max: 5,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "최대생명력",
                min: 10,
                max: 16,
            },
            {
                type: "지력",
                value: 5,
            },
        ],
    },
    제너럴: {
        name: "제너럴",
        stats: [
            {
                type: "카운터 어택 랭크 6 이상일 때 크리티컬",
                min: 2,
                max: 5,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "최대생명력",
                min: 10,
                max: 16,
            },
            {
                type: "지력",
                value: 5,
            },
        ],
    },
    품위있는: {
        name: "품위있는",
        stats: [
            {
                type: "크리티컬",
                min: 5,
                max: 7,
            },
            {
                type: "밸런스",
                min: 10,
                max: 12,
            },
            {
                type: "최대마나",
                value: 5,
            },
        ],
    },
    근본의: {
        name: "근본의",
        stats: [
            {
                type: "체력",
                value: 7,
            },
            {
                type: "지력",
                value: 7,
            },
            {
                type: "솜씨",
                value: 7,
            },
            {
                type: "크리티컬 히트 랭크 1 이상일 때 크리티컬",
                min: 6,
                max: 12,
            },
            {
                type: "메이즈 평원 유적을 발견한 타이틀을 달고 있을때 크리티컬",
                value: 6,
            },
        ],
    },
    윌로우: {
        name: "윌로우",
        stats: [
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "디펜스 랭크 9 이상일 때 최소대미지",
                value: 2,
            },
            {
                type: "스매시 랭크 1 일 때 최대대미지",
                min: 3,
                max: 6,
            },
            {
                type: "카운터 어택 랭크 6 이상일 때 최대대미지",
                min: 3,
                max: 6,
            },
            {
                type: "최대스태미나",
                value: 70,
            },
        ],
    },
    네크로맨서: {
        name: "네크로맨서",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 1 일 때 체력",
                min: 35,
                max: 42,
            },
            {
                type: "파이널 히트 랭크 5 이상일 때 체력",
                min: 18,
                max: 22,
            },
            {
                type: "윈드 브레이커 랭크 5 이상일 때 체력",
                value: 20,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    개념의: {
        name: "개념의",
        stats: [
            {
                type: "체력",
                value: 5,
            },
            {
                type: "지력",
                value: 10,
            },
            {
                type: "의지",
                value: 20,
            },
            {
                type: "컴뱃 마스터리 랭크 1 이상일 때 최대대미지",
                min: 8,
                max: 14,
            },
            {
                type: "메이즈 평원 유적을 발견한 타이틀을 달고 있을때 최대대미지",
                value: 5,
            },
        ],
    },
    작곡가의: {
        name: "작곡가의",
        stats: [
            {
                type: "작곡 랭크 9 이상일 때 크리티컬",
                min: 3,
                max: 5,
            },
            {
                type: "음악적 지식 랭크 8 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "악기 연주 랭크 9 이하일 때 솜씨",
                value: 10,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    존귀한: {
        name: "존귀한",
        stats: [
            {
                type: "레벨이 25 이상일때 크리티컬",
                value: 8,
            },
            {
                type: "마나 실드 랭크 B 이상일 때 최대대미지",
                min: 5,
                max: 7,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 4 이상일 때 최대대미지",
                min: 6,
                max: 8,
            },
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    노빌러티: {
        name: "노빌러티",
        stats: [
            {
                type: "레벨이 25 이상일때 크리티컬",
                value: 8,
            },
            {
                type: "마나 실드 랭크 B 이상일 때 최대대미지",
                min: 5,
                max: 7,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 4 이상일 때 최대대미지",
                min: 6,
                max: 8,
            },
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    둥근: {
        name: "둥근",
        stats: [
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 크리티컬",
                min: 4,
                max: 7,
            },
        ],
    },
    리액티브: {
        name: "리액티브",
        stats: [
            {
                type: "방어",
                value: 3,
            },
            {
                type: "디펜스 랭크 6 이상일 때 방어",
                value: 5,
            },
            {
                type: "악기 연주 랭크 8 이상일 때 보호",
                min: 1,
                max: 3,
            },
            {
                type: "매직 마스터리 랭크 A 이상일 때 폭발 저항",
                min: 2,
                max: 5,
            },
            {
                type: "체력",
                value: 15,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    마이트: {
        name: "마이트",
        stats: [
            {
                type: "체력",
                value: 5,
            },
            {
                type: "목공 랭크 B 이상일 때 체력",
                value: 10,
            },
            {
                type: "목공 랭크 8 이상일 때 체력",
                min: 7,
                max: 15,
            },
            {
                type: "목공 랭크 4 이상일 때 체력",
                min: 7,
                max: 15,
            },
            {
                type: "지력",
                value: 20,
            },
        ],
    },
    다크호스: {
        name: "다크호스",
        stats: [
            {
                type: "행운",
                value: 15,
            },
            {
                type: "조련 랭크 B 이상일 때 최소대미지",
                value: 3,
            },
            {
                type: "조련 랭크 7 이상일 때 최대대미지",
                min: 3,
                max: 6,
            },
        ],
    },
    감미로운: {
        name: "감미로운",
        stats: [
            {
                type: "방어",
                value: 5,
            },
            {
                type: "악기 연주 랭크 A 이상일 때 최대스태미나",
                min: 25,
                max: 30,
            },
            {
                type: "음악적 지식 랭크 A 이상일 때 최대마나",
                min: 25,
                max: 30,
            },
            {
                type: "최대대미지",
                value: 10,
            },
        ],
    },
    스위트: {
        name: "스위트",
        stats: [
            {
                type: "방어",
                value: 5,
            },
            {
                type: "악기 연주 랭크 A 이상일 때 최대스태미나",
                min: 25,
                max: 30,
            },
            {
                type: "음악적 지식 랭크 A 이상일 때 최대마나",
                min: 25,
                max: 30,
            },
            {
                type: "최대대미지",
                value: 10,
            },
        ],
    },
    홍수: {
        name: "홍수",
        stats: [
            {
                type: "왕정 연금술사 타이틀을 달고 있을때 물 속성 연금술 대미지",
                value: 12,
            },
        ],
    },
    중고의: {
        name: "중고의",
        stats: [
            {
                type: "최대 부상률",
                min: 5,
                max: 9,
            },
            {
                type: "레벨이 40 이상일때 크리티컬",
                min: 2,
                max: 5,
            },
            {
                type: "최대대미지",
                value: 7,
            },
            {
                type: "최소대미지",
                value: 7,
            },
        ],
    },
    스크랩: {
        name: "스크랩",
        stats: [
            {
                type: "최대 부상률",
                min: 5,
                max: 9,
            },
            {
                type: "레벨이 40 이상일때 크리티컬",
                min: 2,
                max: 5,
            },
            {
                type: "최대대미지",
                value: 7,
            },
            {
                type: "최소대미지",
                value: 7,
            },
        ],
    },
    증폭의: {
        name: "증폭의",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 3 이상일 때 최대생명력",
                value: 15,
            },
            {
                type: "디펜스 랭크 3 이상일 때 방어",
                value: 1,
            },
            {
                type: "크리티컬 히트 랭크 3 이상일 때 크리티컬",
                value: 3,
            },
        ],
    },
    헤이즈: {
        name: "헤이즈",
        stats: [
            {
                type: "의지",
                min: 1,
                max: 3,
            },
        ],
    },
    놀라운: {
        name: "놀라운",
        stats: [
            {
                type: "행운",
                value: 25,
            },
        ],
    },
    서프라이징: {
        name: "서프라이징",
        stats: [
            {
                type: "행운",
                value: 25,
            },
        ],
    },
    슬기로운: {
        name: "슬기로운",
        stats: [
            {
                type: "최대마나",
                value: 20,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    인텔리전트: {
        name: "인텔리전트",
        stats: [
            {
                type: "최대마나",
                value: 20,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    라이트: {
        name: "라이트",
        stats: [
            {
                type: "솜씨",
                value: 15,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    가벼운: {
        name: "가벼운",
        stats: [
            {
                type: "솜씨",
                value: 15,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    듬직한: {
        name: "듬직한",
        stats: [
            {
                type: "체력",
                value: 15,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    투명한: {
        name: "투명한",
        stats: [
            {
                type: "물 속성 연금술 대미지",
                value: 9,
            },
        ],
    },
    가열된: {
        name: "가열된",
        stats: [
            {
                type: "불 속성 연금술 대미지",
                value: 6,
            },
        ],
    },
    빈틈없는: {
        name: "빈틈없는",
        stats: [
            {
                type: "솜씨",
                value: 20,
            },
        ],
    },
    당당한: {
        name: "당당한",
        stats: [
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    스타우트: {
        name: "스타우트",
        stats: [
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    뜨거운: {
        name: "뜨거운",
        stats: [
            {
                type: "플레이머 랭크 9 이상일 때 불 속성 연금술 대미지",
                value: 8,
            },
        ],
    },
    핫: {
        name: "핫",
        stats: [
            {
                type: "플레이머 랭크 9 이상일 때 불 속성 연금술 대미지",
                value: 8,
            },
        ],
    },
    고결한: {
        name: "고결한",
        stats: [
            {
                type: "요리 랭크 E 이상일 때 크리티컬",
                value: 3,
            },
            {
                type: "요리 랭크 C 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "요리 랭크 A 이상일 때 크리티컬",
                value: 2,
            },
        ],
    },
    칼리번: {
        name: "칼리번",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    저격의: {
        name: "저격의",
        stats: [
            {
                type: "최대대미지",
                value: 4,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 B 이상일 때 최대대미지",
                min: 4,
                max: 8,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 8 이상일 때 최대대미지",
                min: 4,
                max: 8,
            },
            {
                type: "지력",
                value: 10,
            },
        ],
    },
    스나이핑: {
        name: "스나이핑",
        stats: [
            {
                type: "최대대미지",
                value: 4,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 B 이상일 때 최대대미지",
                min: 4,
                max: 8,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 8 이상일 때 최대대미지",
                min: 4,
                max: 8,
            },
            {
                type: "지력",
                value: 10,
            },
        ],
    },
    양념: {
        name: "양념",
        stats: [
            {
                type: "요리 랭크 D 이상일 때 솜씨",
                value: 7,
            },
        ],
    },
    스파이스: {
        name: "스파이스",
        stats: [
            {
                type: "요리 랭크 D 이상일 때 솜씨",
                value: 7,
            },
        ],
    },
    고기: {
        name: "고기",
        stats: [
            {
                type: "요리 랭크 C 이상일 때 방어",
                value: 5,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    야채: {
        name: "야채",
        stats: [
            {
                type: "요리 랭크 9 이상일 때 크리티컬",
                value: 30,
            },
        ],
    },
    재빠른: {
        name: "재빠른",
        stats: [
            {
                type: "돌진 랭크 B 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "돌진 랭크 8 이상일 때 최대대미지",
                min: 1,
                max: 4,
            },
            {
                type: "돌진 랭크 6 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    플릿: {
        name: "플릿",
        stats: [
            {
                type: "돌진 랭크 B 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "돌진 랭크 8 이상일 때 최대대미지",
                min: 1,
                max: 4,
            },
            {
                type: "돌진 랭크 6 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    풍부한: {
        name: "풍부한",
        stats: [
            {
                type: "지력",
                value: 20,
            },
            {
                type: "행운",
                value: 10,
            },
            {
                type: "파티 힐링 랭크 B 이상일 때 최대마나",
                min: 15,
                max: 20,
            },
            {
                type: "파티 힐링 랭크 8 이상일 때 최대마나",
                min: 15,
                max: 20,
            },
            {
                type: "의지",
                value: 15,
            },
        ],
    },
    앰플: {
        name: "앰플",
        stats: [
            {
                type: "지력",
                value: 20,
            },
            {
                type: "행운",
                value: 10,
            },
            {
                type: "파티 힐링 랭크 B 이상일 때 최대마나",
                min: 15,
                max: 20,
            },
            {
                type: "파티 힐링 랭크 8 이상일 때 최대마나",
                min: 15,
                max: 20,
            },
            {
                type: "의지",
                value: 15,
            },
        ],
    },
    수집가의: {
        name: "수집가의",
        stats: [
            {
                type: "블레이즈 랭크 C 이상일 때 지력",
                value: 10,
            },
            {
                type: "블레이즈 랭크 9 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "블레이즈 랭크 7 이상일 때 최대생명력",
                value: 12,
            },
            {
                type: "방어",
                value: 2,
            },
            {
                type: "보호",
                value: 1,
            },
        ],
    },
    콜렉터: {
        name: "콜렉터",
        stats: [
            {
                type: "블레이즈 랭크 C 이상일 때 지력",
                value: 10,
            },
            {
                type: "블레이즈 랭크 9 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "블레이즈 랭크 7 이상일 때 최대생명력",
                value: 12,
            },
            {
                type: "방어",
                value: 2,
            },
            {
                type: "보호",
                value: 1,
            },
        ],
    },
    씁쓸한: {
        name: "씁쓸한",
        stats: [
            {
                type: "요리 랭크 E 이상일 때 최소대미지",
                value: 20,
            },
            {
                type: "요리 랭크 9 이상일 때 최대대미지",
                value: 40,
            },
        ],
    },
    비터: {
        name: "비터",
        stats: [
            {
                type: "요리 랭크 E 이상일 때 최소대미지",
                value: 20,
            },
            {
                type: "요리 랭크 9 이상일 때 최대대미지",
                value: 40,
            },
        ],
    },
    삶은: {
        name: "삶은",
        stats: [
            {
                type: "요리 랭크 B 이상일 때 솜씨",
                value: 15,
            },
        ],
    },
    보일드: {
        name: "보일드",
        stats: [
            {
                type: "요리 랭크 B 이상일 때 솜씨",
                value: 15,
            },
        ],
    },
    성실한: {
        name: "성실한",
        stats: [
            {
                type: "요리 랭크 A 이상일 때 크리티컬",
                value: 7,
            },
        ],
    },
    맛있는: {
        name: "맛있는",
        stats: [
            {
                type: "요리 랭크 9 이상일 때 최대대미지",
                value: 30,
            },
        ],
    },
    딜리셔스: {
        name: "딜리셔스",
        stats: [
            {
                type: "요리 랭크 9 이상일 때 최대대미지",
                value: 30,
            },
        ],
    },
    변화의: {
        name: "변화의",
        stats: [
            {
                type: "스피릿 오브 오더 랭크 A 이상일 때 체력",
                value: 20,
            },
            {
                type: "소울 오브 카오스 랭크 A 이상일 때 체력",
                min: 15,
                max: 25,
            },
            {
                type: "데몬 오브 피시스 랭크 A 이상일 때 체력",
                min: 15,
                max: 25,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
        ],
    },
    알터레이션: {
        name: "알터레이션",
        stats: [
            {
                type: "스피릿 오브 오더 랭크 A 이상일 때 체력",
                value: 20,
            },
            {
                type: "소울 오브 카오스 랭크 A 이상일 때 체력",
                min: 15,
                max: 25,
            },
            {
                type: "데몬 오브 피시스 랭크 A 이상일 때 체력",
                min: 15,
                max: 25,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
        ],
    },
    녹는: {
        name: "녹는",
        stats: [
            {
                type: "마나 실드 랭크 A 이상일 때 최대스태미나",
                value: 25,
            },
            {
                type: "솜씨",
                value: 12,
            },
        ],
    },
    멜팅: {
        name: "멜팅",
        stats: [
            {
                type: "마나 실드 랭크 A 이상일 때 최대스태미나",
                value: 25,
            },
            {
                type: "솜씨",
                value: 12,
            },
        ],
    },
    불타는: {
        name: "불타는",
        stats: [
            {
                type: "플레이머 랭크 B 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "플레이머 랭크 7 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "워터 캐논 랭크 9 이상일 때 의지",
                value: 10,
            },
            {
                type: "워터 캐논 랭크 9 이상일 때 밸런스",
                value: 5,
            },
        ],
    },
    버닝: {
        name: "버닝",
        stats: [
            {
                type: "플레이머 랭크 B 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "플레이머 랭크 7 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "워터 캐논 랭크 9 이상일 때 의지",
                value: 10,
            },
            {
                type: "워터 캐논 랭크 9 이상일 때 밸런스",
                value: 5,
            },
        ],
    },
    수달: {
        name: "수달",
        stats: [
            {
                type: "조련 랭크 B 이상일 때 체력",
                value: 8,
            },
            {
                type: "조련 랭크 9 이상일 때 체력",
                value: 12,
            },
            {
                type: "보호",
                value: 2,
            },
        ],
    },
    트윙클: {
        name: "트윙클",
        stats: [
            {
                type: "레벨이 8 이상일때 의지",
                min: 1,
                max: 2,
            },
        ],
    },
    무지개: {
        name: "무지개",
        stats: [
            {
                type: "내츄럴 매직 실드 랭크 B 이상일 때 행운",
                value: 15,
            },
            {
                type: "라이트닝 매직실드 랭크 B 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "방어",
                value: 1,
            },
        ],
    },
    레인보우: {
        name: "레인보우",
        stats: [
            {
                type: "내츄럴 매직 실드 랭크 B 이상일 때 행운",
                value: 15,
            },
            {
                type: "라이트닝 매직실드 랭크 B 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "방어",
                value: 1,
            },
        ],
    },
    빛나는: {
        name: "빛나는",
        stats: [
            {
                type: "아이스 매직 실드 랭크 A 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "파이어 매직 실드 랭크 B 이상일 때 크리티컬",
                value: 4,
            },
        ],
    },
    광폭한: {
        name: "광폭한",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "레벨이 30 이상일때 솜씨",
                value: 20,
            },
        ],
    },
    버서크: {
        name: "버서크",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "레벨이 30 이상일때 솜씨",
                value: 20,
            },
        ],
    },
    신속한: {
        name: "신속한",
        stats: [
            {
                type: "파이널 샷 랭크 5 이상일 때 솜씨",
                value: 20,
            },
            {
                type: "미라지 미사일 랭크 7 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "최대생명력",
                value: 40,
            },
        ],
    },
    스위프트: {
        name: "스위프트",
        stats: [
            {
                type: "파이널 샷 랭크 5 이상일 때 솜씨",
                value: 20,
            },
            {
                type: "미라지 미사일 랭크 7 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "최대생명력",
                value: 40,
            },
        ],
    },
    거대한: {
        name: "거대한",
        stats: [
            {
                type: "윈드 브레이커 랭크 5 이상일 때 체력",
                value: 30,
            },
            {
                type: "타운트 랭크 9 이상일 때 체력",
                value: 25,
            },
            {
                type: "지력",
                value: 50,
            },
        ],
    },
    타이타닉: {
        name: "타이타닉",
        stats: [
            {
                type: "윈드 브레이커 랭크 5 이상일 때 체력",
                value: 30,
            },
            {
                type: "타운트 랭크 9 이상일 때 체력",
                value: 25,
            },
            {
                type: "지력",
                value: 50,
            },
        ],
    },
    "할로우 나이트": {
        name: "할로우 나이트",
        stats: [
            {
                type: "크리티컬 히트 랭크 9 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "크리티컬 히트 랭크 6 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "솜씨",
                value: 20,
            },
        ],
    },
    재능: {
        name: "재능",
        stats: [
            {
                type: "매직 마스터리 랭크 8 이상일 때 지력",
                value: 15,
            },
            {
                type: "컴뱃 마스터리 랭크 8 이상일 때 체력",
                value: 15,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    탤런트: {
        name: "탤런트",
        stats: [
            {
                type: "매직 마스터리 랭크 8 이상일 때 지력",
                value: 15,
            },
            {
                type: "컴뱃 마스터리 랭크 8 이상일 때 체력",
                value: 15,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    은신처: {
        name: "은신처",
        stats: [
            {
                type: "방호벽 소환 상태일때 최대대미지",
                value: 13,
            },
            {
                type: "매그넘 샷 랭크 3 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    셸터: {
        name: "셸터",
        stats: [
            {
                type: "방호벽 소환 상태일때 최대대미지",
                value: 13,
            },
            {
                type: "매그넘 샷 랭크 3 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    망가진: {
        name: "망가진",
        stats: [
            {
                type: "크리티컬",
                value: 4,
            },
        ],
    },
    브로큰: {
        name: "브로큰",
        stats: [
            {
                type: "크리티컬",
                value: 4,
            },
        ],
    },
    멜로디: {
        name: "멜로디",
        stats: [
            {
                type: "작곡 랭크 9 이상일 때 크리티컬",
                value: 6,
            },
            {
                type: "음악적 지식 랭크 9 이상일 때 크리티컬",
                value: 6,
            },
            {
                type: "최대마나",
                value: 18,
            },
            {
                type: "밸런스",
                value: 12,
            },
        ],
    },
    와이트: {
        name: "와이트",
        stats: [
            {
                type: "썬더 랭크 9 이상일 때 지력",
                value: 10,
            },
            {
                type: "썬더 랭크 C 이상일 때 최대마나",
                value: 10,
            },
            {
                type: "솜씨",
                value: 10,
            },
        ],
    },
    구울: {
        name: "구울",
        stats: [
            {
                type: "매그넘 샷 랭크 8 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "매그넘 샷 랭크 6 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "스매시 랭크 9 이상일 때 방어",
                value: 10,
            },
        ],
    },
    고스트: {
        name: "고스트",
        stats: [
            {
                type: "파이어볼 랭크 9 이상일 때 지력",
                value: 10,
            },
            {
                type: "파이어볼 랭크 C 이상일 때 최대마나",
                value: 10,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    비범한: {
        name: "비범한",
        stats: [
            {
                type: "최대대미지",
                value: 7,
            },
            {
                type: "최소대미지",
                value: 4,
            },
            {
                type: "레벨이 30 이상일때 의지",
                value: 10,
            },
        ],
    },
    "하드 페카": {
        name: "하드 페카",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 3 이상일 때 최소대미지",
                value: 6,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 3 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "매직 마스터리 랭크 6 이상일 때 최대마나",
                value: 15,
            },
        ],
    },
    "종이공작으로 만든": {
        name: "종이공작으로 만든",
        stats: [
            {
                type: "밸런스",
                min: 24,
                max: 30,
            },
        ],
    },
    페이퍼: {
        name: "페이퍼",
        stats: [
            {
                type: "밸런스",
                min: 24,
                max: 30,
            },
        ],
    },
    좋은: {
        name: "좋은",
        stats: [
            {
                type: "레벨이 3 이상일때 밸런스",
                min: 1,
                max: 3,
            },
        ],
    },
    굿: {
        name: "굿",
        stats: [
            {
                type: "레벨이 3 이상일때 밸런스",
                min: 1,
                max: 3,
            },
        ],
    },
    "포이즌 레인저": {
        name: "포이즌 레인저",
        stats: [
            {
                type: "레벨이 42 이하일때 솜씨",
                min: 1,
                max: 4,
            },
            {
                type: "레벨이 24 이상일때 체력",
                value: 3,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 4 이상일 때 독면역",
                min: 1,
                max: 3,
            },
        ],
    },
    허리케인의: {
        name: "허리케인의",
        stats: [
            {
                type: "최대스태미나",
                value: 15,
            },
            {
                type: "의지",
                value: 5,
            },
            {
                type: "솜씨",
                value: 5,
            },
        ],
    },
    혹한의: {
        name: "혹한의",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "지력",
                value: 5,
            },
            {
                type: "의지",
                value: 15,
            },
        ],
    },
    글래디에이터: {
        name: "글래디에이터",
        stats: [
            {
                type: "글래디에이터 타이틀을 달고 있을때 최대대미지",
                min: 3,
                max: 7,
            },
        ],
    },
    "죽음의 화살": {
        name: "죽음의 화살",
        stats: [
            {
                type: "애로우 리볼버 랭크 9 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "애로우 리볼버 랭크 6 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "의지",
                value: 20,
            },
        ],
    },
    "데스 애로우": {
        name: "데스 애로우",
        stats: [
            {
                type: "애로우 리볼버 랭크 9 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "애로우 리볼버 랭크 6 이상일 때 최대대미지",
                value: 10,
            },
            {
                type: "의지",
                value: 20,
            },
        ],
    },
    차가운: {
        name: "차가운",
        stats: [
            {
                type: "프로즌 블래스트 랭크 8 이상일 때 최대대미지",
                value: 7,
            },
            {
                type: "프로즌 블래스트 랭크 B 이상일 때 최소대미지",
                value: 3,
            },
        ],
    },
    콜드: {
        name: "콜드",
        stats: [
            {
                type: "프로즌 블래스트 랭크 8 이상일 때 최대대미지",
                value: 7,
            },
            {
                type: "프로즌 블래스트 랭크 B 이상일 때 최소대미지",
                value: 3,
            },
        ],
    },
    소용돌이의: {
        name: "소용돌이의",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "행운",
                value: 5,
            },
            {
                type: "방어",
                value: 3,
            },
        ],
    },
    자이언트: {
        name: "자이언트",
        stats: [
            {
                type: "지력",
                value: 15,
            },
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 체력",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 최대생명력",
                value: 5,
            },
        ],
    },
    고귀한: {
        name: "고귀한",
        stats: [
            {
                type: "발구르기 랭크 A 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "발구르기 랭크 6 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "발구르기 랭크 3 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    디그너파이드: {
        name: "디그너파이드",
        stats: [
            {
                type: "발구르기 랭크 A 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "발구르기 랭크 6 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "발구르기 랭크 3 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    쾌활한: {
        name: "쾌활한",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 최대생명력",
                value: 3,
            },
            {
                type: "컴뱃 마스터리 랭크 D 이상일 때 최대스태미나",
                value: 3,
            },
        ],
    },
    치어풀: {
        name: "치어풀",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 최대생명력",
                value: 3,
            },
            {
                type: "컴뱃 마스터리 랭크 D 이상일 때 최대스태미나",
                value: 3,
            },
        ],
    },
    정장석: {
        name: "정장석",
        stats: [
            {
                type: "의지",
                value: 5,
            },
            {
                type: "레벨이 15 이하일때 크리티컬",
                value: 3,
            },
            {
                type: "탐험 레벨이 9 이상일때 최대대미지",
                value: 4,
            },
        ],
    },
    형석: {
        name: "형석",
        stats: [
            {
                type: "의지",
                value: 5,
            },
            {
                type: "레벨이 10 이하일때 크리티컬",
                value: 2,
            },
            {
                type: "탐험 레벨이 6 이상일때 최대대미지",
                value: 3,
            },
        ],
    },
    아처: {
        name: "아처",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "매그넘 샷 랭크 C 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "매그넘 샷 랭크 A 이상일 때 최소대미지",
                min: 2,
                max: 5,
            },
        ],
    },
    달맞이꽃: {
        name: "달맞이꽃",
        stats: [
            {
                type: "최대대미지",
                value: 3,
            },
        ],
    },
    대양의: {
        name: "대양의",
        stats: [
            {
                type: "휴식 랭크 C 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "휴식 랭크 A 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "체력",
                value: 5,
            },
            {
                type: "솜씨",
                value: 5,
            },
        ],
    },
    해양의: {
        name: "해양의",
        stats: [
            {
                type: "메디테이션 랭크 D 이상일 때 크리티컬",
                value: 10,
            },
            {
                type: "메디테이션 랭크 B 이상일 때 밸런스",
                value: 10,
            },
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 5,
            },
        ],
    },
    폭풍의: {
        name: "폭풍의",
        stats: [
            {
                type: "체력",
                value: 7,
            },
            {
                type: "지력",
                value: 7,
            },
            {
                type: "솜씨",
                value: 7,
            },
            {
                type: "의지",
                value: 7,
            },
        ],
    },
    패배자의: {
        name: "패배자의",
        stats: [
            {
                type: "체력",
                min: 9,
                max: 12,
            },
        ],
    },
    루저: {
        name: "루저",
        stats: [
            {
                type: "체력",
                min: 9,
                max: 12,
            },
        ],
    },
    천둥의: {
        name: "천둥의",
        stats: [
            {
                type: "최대생명력",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "최대대미지",
                value: 2,
            },
        ],
    },
    전나무: {
        name: "전나무",
        stats: [
            {
                type: "최대마나",
                value: 5,
            },
            {
                type: "도서관 귀신을 본 타이틀을 달고 있을때 최소대미지",
                value: 3,
            },
            {
                type: "도서관 귀신을 본 타이틀을 달고 있을때 최대대미지",
                value: 3,
            },
        ],
    },
    육지의: {
        name: "육지의",
        stats: [
            {
                type: "응급치료 랭크 D 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "응급치료 랭크 B 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    위크니스: {
        name: "위크니스",
        stats: [
            {
                type: "최대생명력",
                min: 3,
                max: 4,
            },
        ],
    },
    워터폴: {
        name: "워터폴",
        stats: [
            {
                type: "레벨이 28 이상일때 최대마나",
                min: 12,
                max: 16,
            },
        ],
    },
    에너지: {
        name: "에너지",
        stats: [
            {
                type: "레벨이 38 이상일때 최대스태미나",
                min: 12,
                max: 16,
            },
        ],
    },
    견고한: {
        name: "견고한",
        stats: [
            {
                type: "디펜스 랭크 C 이상일 때 체력",
                value: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    스테이블: {
        name: "스테이블",
        stats: [
            {
                type: "디펜스 랭크 C 이상일 때 체력",
                value: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    스위트피: {
        name: "스위트피",
        stats: [
            {
                type: "최대생명력",
                value: 12,
            },
            {
                type: "최대마나",
                value: 12,
            },
            {
                type: "최대스태미나",
                value: 12,
            },
            {
                type: "의지",
                value: 5,
            },
        ],
    },
    스내피: {
        name: "스내피",
        stats: [
            {
                type: "최대생명력",
                value: 6,
            },
            {
                type: "최대마나",
                value: 4,
            },
            {
                type: "최대스태미나",
                value: 6,
            },
            {
                type: "레벨이 15 이하일때 의지",
                value: 5,
            },
        ],
    },
    셰이크: {
        name: "셰이크",
        stats: [
            {
                type: "발구르기 랭크 8 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "매직 마스터리 랭크 C 이상일 때 최대마나",
                value: 20,
            },
        ],
    },
    샤이닝: {
        name: "샤이닝",
        stats: [
            {
                type: "레벨이 28 이상일때 의지",
                min: 5,
                max: 10,
            },
        ],
    },
    샐비어: {
        name: "샐비어",
        stats: [
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "솜씨",
                value: 10,
            },
        ],
    },
    삼나무: {
        name: "삼나무",
        stats: [
            {
                type: "레벨이 8 이상일때 의지",
                value: 5,
            },
            {
                type: "레벨이 10 이상일때 보호",
                value: 2,
            },
        ],
    },
    사랑스러운: {
        name: "사랑스러운",
        stats: [
            {
                type: "레벨이 10 이상일때 체력",
                value: 10,
            },
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 15,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    베이비: {
        name: "베이비",
        stats: [
            {
                type: "체력",
                min: 3,
                max: 6,
            },
        ],
    },
    "버스트 솔저": {
        name: "버스트 솔저",
        stats: [
            {
                type: "의지",
                value: 1,
            },
            {
                type: "컴뱃 마스터리 랭크 D 이상일 때 폭발 저항",
                value: 1,
            },
        ],
    },
    바람빛: {
        name: "바람빛",
        stats: [
            {
                type: "라이프 드레인 랭크 B 이상일 때 최대생명력",
                value: 5,
            },
            {
                type: "윈드 블래스트 랭크 A 이상일 때 최대스태미나",
                value: 5,
            },
        ],
    },
    윈디: {
        name: "윈디",
        stats: [
            {
                type: "라이프 드레인 랭크 B 이상일 때 최대생명력",
                value: 5,
            },
            {
                type: "윈드 블래스트 랭크 A 이상일 때 최대스태미나",
                value: 5,
            },
        ],
    },
    믿음직한: {
        name: "믿음직한",
        stats: [
            {
                type: "라이트닝볼트 랭크 C 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "아이스볼트 랭크 9 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "파이어볼트 랭크 5 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "솜씨",
                value: 10,
            },
        ],
    },
    민첩한: {
        name: "민첩한",
        stats: [
            {
                type: "팔콘 세이지 타이틀을 달고 있을때 크리티컬",
                value: 15,
            },
            {
                type: "팔콘 세이지 타이틀을 달고 있을때 밸런스",
                value: 5,
            },
            {
                type: "마인드 오브 콘누스 랭크 9 이상일 때 지력",
                value: 15,
            },
            {
                type: "샤프니스 오브 콘누스 랭크 6 이상일 때 솜씨",
                value: 20,
            },
        ],
    },
    무거운: {
        name: "무거운",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 방어",
                value: 1,
            },
            {
                type: "자이언트이거나 자이언트를 지지중일때 체력",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 체력",
                value: 5,
            },
            {
                type: "애로우 리볼버 랭크 C 이상일 때 솜씨",
                value: 8,
            },
        ],
    },
    헤비: {
        name: "헤비",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 방어",
                value: 1,
            },
            {
                type: "자이언트이거나 자이언트를 지지중일때 체력",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 체력",
                value: 5,
            },
            {
                type: "애로우 리볼버 랭크 C 이상일 때 솜씨",
                value: 8,
            },
        ],
    },
    망각의: {
        name: "망각의",
        stats: [
            {
                type: "지력",
                min: 1,
                max: 3,
            },
        ],
    },
    마법의: {
        name: "마법의",
        stats: [
            {
                type: "초보 엘레멘탈 마스터 타이틀을 달고 있을때 크리티컬",
                value: 5,
            },
            {
                type: "엘리멘탈 마스터 타이틀을 달고 있을때 최대대미지",
                value: 10,
            },
        ],
    },
    "레이븐 슬레이어": {
        name: "레이븐 슬레이어",
        stats: [
            {
                type: "레벨이 24 이상일때 최대 부상률",
                min: 5,
                max: 10,
            },
        ],
    },
    라이프: {
        name: "라이프",
        stats: [
            {
                type: "레벨이 29 이상일때 최대생명력",
                min: 12,
                max: 16,
            },
        ],
    },
    단호한: {
        name: "단호한",
        stats: [
            {
                type: "최대마나",
                value: 50,
            },
            {
                type: "컴뱃 마스터리 랭크 7 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 최대대미지",
                value: 4,
            },
        ],
    },
    눈보라의: {
        name: "눈보라의",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대마나",
                value: 15,
            },
            {
                type: "체력",
                value: 5,
            },
        ],
    },
    지식의: {
        name: "지식의",
        stats: [
            {
                type: "레벨이 31 이상일때 지력",
                min: 5,
                max: 10,
            },
        ],
    },
    날리지: {
        name: "날리지",
        stats: [
            {
                type: "레벨이 31 이상일때 지력",
                min: 5,
                max: 10,
            },
        ],
    },
    인회석: {
        name: "인회석",
        stats: [
            {
                type: "탐험 레벨이 6 이상일때 최대대미지",
                value: 4,
            },
            {
                type: "탐험 레벨이 12 이하일때 최소대미지",
                value: 3,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    석영: {
        name: "석영",
        stats: [
            {
                type: "탐험 레벨이 8 이상일때 최대대미지",
                value: 5,
            },
            {
                type: "탐험 레벨이 15 이하일때 최소대미지",
                value: 4,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    회복의: {
        name: "회복의",
        stats: [
            {
                type: "힐링 랭크 9 이상일 때 최대생명력",
                value: 20,
            },
            {
                type: "힐링 랭크 7 이상일 때 지력",
                value: 5,
            },
            {
                type: "힐링 랭크 5 이상일 때 의지",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    달팽이의: {
        name: "달팽이의",
        stats: [
            {
                type: "솜씨",
                min: 9,
                max: 12,
            },
        ],
    },
    스네일: {
        name: "스네일",
        stats: [
            {
                type: "솜씨",
                min: 9,
                max: 12,
            },
        ],
    },
    노르만: {
        name: "노르만",
        stats: [
            {
                type: "크리티컬",
                value: 8,
            },
            {
                type: "돌진 랭크 8 이상일 때 체력",
                value: 6,
            },
            {
                type: "돌진 랭크 B 이상일 때 최대스태미나",
                value: 6,
            },
            {
                type: "솜씨",
                value: 12,
            },
        ],
    },
    사이프러스: {
        name: "사이프러스",
        stats: [
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "디펜스 랭크 9 이상일 때 최소대미지",
                value: 2,
            },
            {
                type: "스매시 랭크 1 일 때 최대대미지",
                value: 4,
            },
            {
                type: "카운터 어택 랭크 6 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "최대스태미나",
                value: 100,
            },
        ],
    },
    "버스트 워리어": {
        name: "버스트 워리어",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 체력",
                min: 2,
                max: 8,
            },
            {
                type: "행운",
                value: 3,
            },
            {
                type: "스매시 랭크 5 이상일 때 폭발 저항",
                min: 1,
                max: 3,
            },
        ],
    },
    야생의: {
        name: "야생의",
        stats: [
            {
                type: "스매시 랭크 8 이상일 때 최대대미지",
                value: 16,
            },
            {
                type: "보호",
                value: 4,
            },
            {
                type: "최대생명력",
                value: 30,
            },
        ],
    },
    언테임드: {
        name: "언테임드",
        stats: [
            {
                type: "스매시 랭크 8 이상일 때 최대대미지",
                value: 16,
            },
            {
                type: "보호",
                value: 4,
            },
            {
                type: "최대생명력",
                value: 30,
            },
        ],
    },
    구원자의: {
        name: "구원자의",
        stats: [
            {
                type: "라이프 드레인 랭크 B 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "워터 캐논 랭크 9 이상일 때 최대생명력",
                value: 10,
            },
        ],
    },
    "라이프 세이버": {
        name: "라이프 세이버",
        stats: [
            {
                type: "라이프 드레인 랭크 B 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "워터 캐논 랭크 9 이상일 때 최대생명력",
                value: 10,
            },
        ],
    },
    농부의: {
        name: "농부의",
        stats: [
            {
                type: "체력",
                min: 1,
                max: 3,
            },
        ],
    },
    파머: {
        name: "파머",
        stats: [
            {
                type: "체력",
                min: 1,
                max: 3,
            },
        ],
    },
    눈물의: {
        name: "눈물의",
        stats: [
            {
                type: "최대마나",
                min: 3,
                max: 4,
            },
        ],
    },
    티어드랍: {
        name: "티어드랍",
        stats: [
            {
                type: "최대마나",
                min: 3,
                max: 4,
            },
        ],
    },
    친절한: {
        name: "친절한",
        stats: [
            {
                type: "파티 힐링 랭크 C 이상일 때 솜씨",
                value: 2,
            },
            {
                type: "힐링 랭크 8 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "응급치료 랭크 D 이하일 때 행운",
                value: 10,
            },
        ],
    },
    "포이즌 스나이퍼": {
        name: "포이즌 스나이퍼",
        stats: [
            {
                type: "독면역",
                min: 1,
                max: 4,
            },
            {
                type: "레벨이 20 이상일때 솜씨",
                min: 1,
                max: 6,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 A 이하일 때 솜씨",
                value: 3,
            },
            {
                type: "매그넘 샷 랭크 6 이하일 때 의지",
                value: 6,
            },
        ],
    },
    게으른: {
        name: "게으른",
        stats: [
            {
                type: "땡땡이치는 타이틀을 달고 있을때 크리티컬",
                value: 10,
            },
            {
                type: "레벨이 15 이하일때 최대대미지",
                value: 2,
            },
            {
                type: "탐험 레벨이 10 이하일때 최대대미지",
                value: 2,
            },
        ],
    },
    지진의: {
        name: "지진의",
        stats: [
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "체력",
                value: 15,
            },
        ],
    },
    그레이스: {
        name: "그레이스",
        stats: [
            {
                type: "밸런스",
                value: 6,
            },
            {
                type: "카운터 어택 랭크 9 이상일 때 최소대미지",
                value: 3,
            },
            {
                type: "카운터 어택 랭크 6 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "카운터 어택 랭크 3 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    "포이즌 헌터": {
        name: "포이즌 헌터",
        stats: [
            {
                type: "매그넘 샷 랭크 8 이상일 때 독면역",
                min: 1,
                max: 3,
            },
            {
                type: "최대마나",
                value: 5,
            },
            {
                type: "엘프이거나 엘프를 지지중일때 최대스태미나",
                min: 6,
                max: 9,
            },
        ],
    },
    섬세한: {
        name: "섬세한",
        stats: [
            {
                type: "합성 랭크 B 이상일 때 합성 성공률",
                value: 1,
            },
        ],
    },
    바위: {
        name: "바위",
        stats: [
            {
                type: "골렘 소환 상태일때 방어",
                value: 3,
            },
            {
                type: "골렘 연성 랭크 9 이상일 때 방어",
                value: 6,
            },
            {
                type: "골렘 연성 랭크 5 이상일 때 보호",
                value: 1,
            },
        ],
    },
    락: {
        name: "락",
        stats: [
            {
                type: "골렘 소환 상태일때 방어",
                value: 3,
            },
            {
                type: "골렘 연성 랭크 9 이상일 때 방어",
                value: 6,
            },
            {
                type: "골렘 연성 랭크 5 이상일 때 보호",
                value: 1,
            },
        ],
    },
    영광스러운: {
        name: "영광스러운",
        stats: [
            {
                type: "레벨이 25 이상일때 크리티컬",
                value: 8,
            },
            {
                type: "마나 실드 랭크 A 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 3 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    글로리어스: {
        name: "글로리어스",
        stats: [
            {
                type: "레벨이 25 이상일때 크리티컬",
                value: 8,
            },
            {
                type: "마나 실드 랭크 A 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 3 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    악어: {
        name: "악어",
        stats: [
            {
                type: "최대생명력",
                value: 40,
            },
            {
                type: "방어",
                value: 5,
            },
            {
                type: "윈드 블래스트 랭크 6 이상일 때 최대대미지",
                value: 29,
            },
            {
                type: "자이언트이거나 자이언트를 지지중일때 체력",
                value: 20,
            },
        ],
    },
    크로코다일: {
        name: "크로코다일",
        stats: [
            {
                type: "최대생명력",
                value: 40,
            },
            {
                type: "방어",
                value: 5,
            },
            {
                type: "윈드 블래스트 랭크 6 이상일 때 최대대미지",
                value: 29,
            },
            {
                type: "자이언트이거나 자이언트를 지지중일때 체력",
                value: 20,
            },
        ],
    },
    "브로큰 애로우": {
        name: "브로큰 애로우",
        stats: [
            {
                type: "솜씨",
                value: 9,
            },
        ],
    },
    모이스트: {
        name: "모이스트",
        stats: [
            {
                type: "워터 캐논 랭크 5 이상일 때 물 속성 연금술 대미지",
                value: 9,
            },
            {
                type: "워터 캐논 랭크 1 이상일 때 물 속성 연금술 대미지",
                value: 18,
            },
        ],
    },
    물방울: {
        name: "물방울",
        stats: [
            {
                type: "물 속성 연금술 대미지",
                value: 5,
            },
        ],
    },
    워터드롭: {
        name: "워터드롭",
        stats: [
            {
                type: "물 속성 연금술 대미지",
                value: 5,
            },
        ],
    },
    산들바람: {
        name: "산들바람",
        stats: [
            {
                type: "바람 속성 연금술 대미지",
                value: 5,
            },
        ],
    },
    깊은: {
        name: "깊은",
        stats: [
            {
                type: "방호벽 소환 상태일때 보호",
                value: 3,
            },
            {
                type: "방호벽 랭크 6 이상일 때 보호",
                value: 1,
            },
            {
                type: "체력",
                value: 5,
            },
        ],
    },
    딮: {
        name: "딮",
        stats: [
            {
                type: "방호벽 소환 상태일때 보호",
                value: 3,
            },
            {
                type: "방호벽 랭크 6 이상일 때 보호",
                value: 1,
            },
            {
                type: "체력",
                value: 5,
            },
        ],
    },
    사나운: {
        name: "사나운",
        stats: [
            {
                type: "의지",
                value: 20,
            },
            {
                type: "카운터 어택 랭크 8 이상일 때 최대대미지",
                value: 24,
            },
            {
                type: "밸런스",
                value: 10,
            },
        ],
    },
    "마나 매지션": {
        name: "마나 매지션",
        stats: [
            {
                type: "최대생명력",
                value: 2,
            },
            {
                type: "매직 마스터리 랭크 C 이상일 때 마나 소비 감소",
                value: 1,
            },
        ],
    },
    진눈깨비의: {
        name: "진눈깨비의",
        stats: [
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "행운",
                value: 10,
            },
            {
                type: "보호",
                value: 1,
            },
        ],
    },
    한가한: {
        name: "한가한",
        stats: [
            {
                type: "캠프 파이어 랭크 B 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "휴식 랭크 B 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "낚시 랭크 A 이하일 때 최소대미지",
                value: 5,
            },
        ],
    },
    "마나 위치": {
        name: "마나 위치",
        stats: [
            {
                type: "엘프이거나 엘프를 지지중일때 지력",
                min: 2,
                max: 5,
            },
            {
                type: "솜씨",
                value: 3,
            },
            {
                type: "아이스 스피어 랭크 A 이상일 때 마나 소비 감소",
                min: 1,
                max: 3,
            },
        ],
    },
    기쁨의: {
        name: "기쁨의",
        stats: [
            {
                type: "레벨이 28 이상일때 행운",
                min: 5,
                max: 10,
            },
        ],
    },
    조이: {
        name: "조이",
        stats: [
            {
                type: "레벨이 28 이상일때 행운",
                min: 5,
                max: 10,
            },
        ],
    },
    방해석: {
        name: "방해석",
        stats: [
            {
                type: "탐험 레벨이 9 이하일때 최소대미지",
                value: 2,
            },
            {
                type: "탐험 레벨이 4 이상일때 최대대미지",
                value: 3,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    공들인: {
        name: "공들인",
        stats: [
            {
                type: "분해 랭크 A 이상일 때 크리티컬",
                min: 1,
                max: 3,
            },
        ],
    },
    충격의: {
        name: "충격의",
        stats: [
            {
                type: "챔피언 타이틀을 달고 있을때 체력",
                value: 20,
            },
            {
                type: "챔피언 타이틀을 달고 있을때 솜씨",
                value: 20,
            },
            {
                type: "소드 오브 오더 랭크 C 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "아이 오브 오더 랭크 9 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "파워 오브 오더 랭크 6 이상일 때 최소대미지",
                value: 6,
            },
        ],
    },
    쇼킹: {
        name: "쇼킹",
        stats: [
            {
                type: "챔피언 타이틀을 달고 있을때 체력",
                value: 20,
            },
            {
                type: "챔피언 타이틀을 달고 있을때 솜씨",
                value: 20,
            },
            {
                type: "소드 오브 오더 랭크 C 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "아이 오브 오더 랭크 9 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "파워 오브 오더 랭크 6 이상일 때 최소대미지",
                value: 6,
            },
        ],
    },
    파워풀: {
        name: "파워풀",
        stats: [
            {
                type: "최대스태미나",
                value: 20,
            },
            {
                type: "디펜스 랭크 D 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "스매시 랭크 B 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "카운터 어택 랭크 9 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "나이가 19 이상일때 체력",
                value: 10,
            },
            {
                type: "나이가 22 이상일때 체력",
                value: 20,
            },
            {
                type: "나이가 25 이상일때 체력",
                value: 30,
            },
        ],
    },
    자극적인: {
        name: "자극적인",
        stats: [
            {
                type: "스매시 랭크 C 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "카운터 어택 랭크 A 이상일 때 최대스태미나",
                value: 18,
            },
            {
                type: "최대마나",
                value: 15,
            },
        ],
    },
    행운의: {
        name: "행운의",
        stats: [
            {
                type: "솜씨",
                value: 3,
            },
            {
                type: "레벨이 35 이상일때 행운",
                value: 15,
            },
            {
                type: "레벨이 30 이상일때 최대생명력",
                value: 20,
            },
        ],
    },
    럭키: {
        name: "럭키",
        stats: [
            {
                type: "솜씨",
                value: 3,
            },
            {
                type: "레벨이 35 이상일때 행운",
                value: 15,
            },
            {
                type: "레벨이 30 이상일때 최대생명력",
                value: 20,
            },
        ],
    },
    든든한: {
        name: "든든한",
        stats: [
            {
                type: "비스트 로드 타이틀을 달고 있을때 체력",
                value: 30,
            },
            {
                type: "비스트 로드 타이틀을 달고 있을때 솜씨",
                value: 10,
            },
            {
                type: "실드 오브 피시스 랭크 C 이상일 때 밸런스",
                value: 6,
            },
            {
                type: "라이프 오브 피시스 랭크 8 이상일 때 최대대미지",
                value: 8,
            },
        ],
    },
    야만인: {
        name: "야만인",
        stats: [
            {
                type: "윈드밀 랭크 7 이상일 때 최대대미지",
                value: 13,
            },
            {
                type: "크리티컬 히트 랭크 9 이상일 때 크리티컬",
                value: 6,
            },
            {
                type: "방어",
                value: 5,
            },
        ],
    },
    바바리안: {
        name: "바바리안",
        stats: [
            {
                type: "윈드밀 랭크 7 이상일 때 최대대미지",
                value: 13,
            },
            {
                type: "크리티컬 히트 랭크 9 이상일 때 크리티컬",
                value: 6,
            },
            {
                type: "방어",
                value: 5,
            },
        ],
    },
    난폭한: {
        name: "난폭한",
        stats: [
            {
                type: "행운",
                value: 20,
            },
            {
                type: "윈드밀 랭크 6 이상일 때 최대대미지",
                value: 20,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    반짝이는: {
        name: "반짝이는",
        stats: [
            {
                type: "방어",
                value: 1,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "체력",
                value: 5,
            },
        ],
    },
    연금술사의: {
        name: "연금술사의",
        stats: [
            {
                type: "최소대미지",
                value: 3,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
            {
                type: "연금술 마스터리 랭크 B 이상일 때 체력",
                value: 10,
            },
            {
                type: "레벨이 18 이하일때 의지",
                value: 20,
            },
        ],
    },
    딱딱한: {
        name: "딱딱한",
        stats: [
            {
                type: "돌진 랭크 B 이상일 때 방어",
                value: 3,
            },
            {
                type: "최대스태미나",
                min: 5,
                max: 10,
            },
            {
                type: "체력",
                min: 4,
                max: 8,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    리지드: {
        name: "리지드",
        stats: [
            {
                type: "돌진 랭크 B 이상일 때 방어",
                value: 3,
            },
            {
                type: "최대스태미나",
                min: 5,
                max: 10,
            },
            {
                type: "체력",
                min: 4,
                max: 8,
            },
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    사령관: {
        name: "사령관",
        stats: [
            {
                type: "카운터 어택 랭크 6 이상일 때 크리티컬",
                value: 3,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "최대생명력",
                min: 6,
                max: 12,
            },
            {
                type: "지력",
                value: 15,
            },
        ],
    },
    마샬: {
        name: "마샬",
        stats: [
            {
                type: "카운터 어택 랭크 6 이상일 때 크리티컬",
                value: 3,
            },
            {
                type: "보호",
                value: 1,
            },
            {
                type: "최대생명력",
                min: 6,
                max: 12,
            },
            {
                type: "지력",
                value: 15,
            },
        ],
    },
    근육의: {
        name: "근육의",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 방어",
                value: 1,
            },
            {
                type: "디펜스 랭크 C 이상일 때 체력",
                value: 3,
            },
            {
                type: "솜씨",
                value: 4,
            },
        ],
    },
    머슬: {
        name: "머슬",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 방어",
                value: 1,
            },
            {
                type: "디펜스 랭크 C 이상일 때 체력",
                value: 3,
            },
            {
                type: "솜씨",
                value: 4,
            },
        ],
    },
    겁없는: {
        name: "겁없는",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대마나",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "크리티컬 히트 랭크 6 이상일 때 크리티컬",
                value: 4,
            },
        ],
    },
    격렬한: {
        name: "격렬한",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 최소대미지",
                value: 16,
            },
            {
                type: "컴뱃 마스터리 랭크 7 이상일 때 최대대미지",
                value: 22,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 9 이상일 때 솜씨",
                value: 20,
            },
        ],
    },
    산사나무: {
        name: "산사나무",
        stats: [
            {
                type: "탐험 레벨이 4 이상일때 체력",
                value: 3,
            },
            {
                type: "탐험 레벨이 8 이상일때 지력",
                value: 3,
            },
            {
                type: "탐험 레벨이 12 이상일때 솜씨",
                value: 3,
            },
            {
                type: "레벨이 36 이상일때 최대스태미나",
                value: 10,
            },
        ],
    },
    "마나 위자드": {
        name: "마나 위자드",
        stats: [
            {
                type: "레벨이 20 이상일때 최대마나",
                min: 6,
                max: 12,
            },
            {
                type: "레벨이 24 이하일때 의지",
                value: 5,
            },
            {
                type: "파이어볼 랭크 8 이상일 때 마나 소비 감소",
                min: 1,
                max: 3,
            },
        ],
    },
    마거리트: {
        name: "마거리트",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대마나",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "지력",
                value: 10,
            },
        ],
    },
    "검붉은 곰": {
        name: "검붉은 곰",
        stats: [
            {
                type: "라이프 드레인 랭크 9 이상일 때 방어",
                value: 1,
            },
            {
                type: "윈드 블래스트 랭크 5 이상일 때 보호",
                value: 1,
            },
        ],
    },
    우아한: {
        name: "우아한",
        stats: [
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "최대마나",
                value: 20,
            },
        ],
    },
    "포이즌 아처": {
        name: "포이즌 아처",
        stats: [
            {
                type: "체력",
                value: 1,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 E 이상일 때 독면역",
                value: 1,
            },
        ],
    },
    평화로운: {
        name: "평화로운",
        stats: [
            {
                type: "낚시 랭크 5 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "핸디크래프트 랭크 9 이상일 때 체력",
                value: 15,
            },
            {
                type: "최대스태미나",
                value: 15,
            },
        ],
    },
    민트: {
        name: "민트",
        stats: [
            {
                type: "디펜스 랭크 5 이상일 때 방어",
                value: 4,
            },
            {
                type: "지력",
                value: 5,
            },
            {
                type: "의지",
                value: 5,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    릴리: {
        name: "릴리",
        stats: [
            {
                type: "솜씨",
                value: 15,
            },
            {
                type: "행운",
                value: 5,
            },
            {
                type: "체력",
                value: 5,
            },
        ],
    },
    용감한: {
        name: "용감한",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "체력",
                value: 5,
            },
            {
                type: "애로우 리볼버 랭크 A 이상일 때 솜씨",
                value: 10,
            },
        ],
    },
    기울어진: {
        name: "기울어진",
        stats: [
            {
                type: "연금술 마스터리 랭크 9 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "워터 캐논 랭크 6 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 체력",
                value: 20,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 9 이상일 때 솜씨",
                value: 20,
            },
        ],
    },
    방어의: {
        name: "방어의",
        stats: [
            {
                type: "솜씨",
                value: 4,
            },
            {
                type: "체력",
                value: 7,
            },
            {
                type: "방어",
                value: 4,
            },
        ],
    },
    디펜시브: {
        name: "디펜시브",
        stats: [
            {
                type: "솜씨",
                value: 4,
            },
            {
                type: "체력",
                value: 7,
            },
            {
                type: "방어",
                value: 4,
            },
        ],
    },
    거친: {
        name: "거친",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 C 이상일 때 체력",
                value: 5,
            },
            {
                type: "레벨이 16 이상일때 솜씨",
                value: 5,
            },
        ],
    },
    파괴의: {
        name: "파괴의",
        stats: [
            {
                type: "레벨이 32 이상일때 최소대미지",
                value: 9,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 최대대미지",
                min: 15,
                max: 26,
            },
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 40,
            },
        ],
    },
    디스트럭션: {
        name: "디스트럭션",
        stats: [
            {
                type: "레벨이 32 이상일때 최소대미지",
                value: 9,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 최대대미지",
                min: 15,
                max: 26,
            },
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "최대생명력",
                value: 40,
            },
        ],
    },
    요리사의: {
        name: "요리사의",
        stats: [
            {
                type: "요리대회 입상자 타이틀을 달고 있을때 크리티컬",
                value: 10,
            },
            {
                type: "요리 랭크 9 이상일 때 밸런스",
                value: 5,
            },
            {
                type: "요리 랭크 C 이하일 때 최대스태미나",
                value: 20,
            },
        ],
    },
    클로버: {
        name: "클로버",
        stats: [
            {
                type: "방어",
                value: 2,
            },
            {
                type: "보호",
                value: 2,
            },
            {
                type: "최대생명력",
                value: 10,
            },
        ],
    },
    세이프가드: {
        name: "세이프가드",
        stats: [
            {
                type: "골렘 연성 랭크 B 이상일 때 방어",
                value: 1,
            },
            {
                type: "방호벽 랭크 B 이상일 때 보호",
                value: 1,
            },
        ],
    },
    "레이븐 서머너": {
        name: "레이븐 서머너",
        stats: [
            {
                type: "레벨이 19 이상일때 최소 부상률",
                value: 4,
            },
        ],
    },
    폴리쉬드: {
        name: "폴리쉬드",
        stats: [
            {
                type: "레벨이 42 이상일때 크리티컬",
                value: 4,
            },
        ],
    },
    "마나 서머너": {
        name: "마나 서머너",
        stats: [
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "라이트닝볼트 랭크 3 이상일 때 마나 소비 감소",
                min: 1,
                max: 2,
            },
            {
                type: "라이트닝볼트 랭크 7 이상일 때 마나 소비 감소",
                min: 1,
                max: 2,
            },
            {
                type: "메디테이션 랭크 E 이하일 때 행운",
                value: 5,
            },
        ],
    },
    도전적인: {
        name: "도전적인",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 D 이상일 때 체력",
                value: 6,
            },
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 솜씨",
                value: 6,
            },
            {
                type: "최대마나",
                value: 15,
            },
        ],
    },
    망상의: {
        name: "망상의",
        stats: [
            {
                type: "레벨이 15 이상일때 솜씨",
                value: 6,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 B 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "레벨이 25 이상일때 지력",
                value: 10,
            },
        ],
    },
    팬시: {
        name: "팬시",
        stats: [
            {
                type: "레벨이 15 이상일때 솜씨",
                value: 6,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 B 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "레벨이 25 이상일때 지력",
                value: 10,
            },
        ],
    },
    느릅나무: {
        name: "느릅나무",
        stats: [
            {
                type: "행운",
                value: 20,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    무모한: {
        name: "무모한",
        stats: [
            {
                type: "크리티컬 히트 랭크 9 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "크리티컬 히트 랭크 C 이상일 때 밸런스",
                value: 5,
            },
            {
                type: "레벨이 20 이상일때 지력",
                value: 20,
            },
        ],
    },
    물망초: {
        name: "물망초",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "지력",
                value: 5,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    장미: {
        name: "장미",
        stats: [
            {
                type: "체력",
                value: 6,
            },
            {
                type: "솜씨",
                value: 8,
            },
            {
                type: "보호",
                value: 1,
            },
        ],
    },
    우박의: {
        name: "우박의",
        stats: [
            {
                type: "최소대미지",
                value: 3,
            },
        ],
    },
    혼합된: {
        name: "혼합된",
        stats: [
            {
                type: "연금술 마스터리 랭크 F 이상일 때 최대스태미나",
                value: 3,
            },
            {
                type: "마나 포밍 랭크 E 이상일 때 최대마나",
                value: 2,
            },
        ],
    },
    단장: {
        name: "단장",
        stats: [
            {
                type: "내츄럴 매직 실드 랭크 C 이상일 때 보호",
                value: 2,
            },
            {
                type: "내츄럴 매직 실드 랭크 C 이상일 때 최대마나",
                min: 8,
                max: 12,
            },
            {
                type: "지력",
                min: 6,
                max: 8,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 6,
            },
        ],
    },
    콜로넬: {
        name: "콜로넬",
        stats: [
            {
                type: "내츄럴 매직 실드 랭크 C 이상일 때 보호",
                value: 2,
            },
            {
                type: "내츄럴 매직 실드 랭크 C 이상일 때 최대마나",
                min: 8,
                max: 12,
            },
            {
                type: "지력",
                min: 6,
                max: 8,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 6,
            },
        ],
    },
    침착한: {
        name: "침착한",
        stats: [
            {
                type: "최대 부상률",
                value: 10,
            },
            {
                type: "미라지 미사일 랭크 9 이상일 때 방어",
                value: 3,
            },
            {
                type: "컴뱃 마스터리 랭크 A 이하일 때 최소대미지",
                value: 3,
            },
        ],
    },
    "아크 리치": {
        name: "아크 리치",
        stats: [
            {
                type: "레벨이 44 이상일때 최대대미지",
                value: 5,
            },
            {
                type: "레벨이 22 이상일때 최소대미지",
                value: 5,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    "버스트 파이터": {
        name: "버스트 파이터",
        stats: [
            {
                type: "레벨이 12 이상일때 최대스태미나",
                min: 5,
                max: 10,
            },
            {
                type: "레벨이 35 이하일때 최대마나",
                value: 4,
            },
            {
                type: "카운터 어택 랭크 8 이상일 때 폭발 저항",
                min: 1,
                max: 3,
            },
        ],
    },
    "새도우 헌터": {
        name: "새도우 헌터",
        stats: [
            {
                type: "연금술 마스터리 랭크 9 이상일 때 최대생명력",
                value: 15,
            },
            {
                type: "워터 캐논 랭크 1 일 때 최대대미지",
                value: 10,
            },
            {
                type: "라이프 드레인 랭크 6 이상일 때 크리티컬",
                value: 5,
            },
        ],
    },
    코스모스: {
        name: "코스모스",
        stats: [
            {
                type: "최대생명력",
                value: 15,
            },
            {
                type: "체력",
                value: 10,
            },
            {
                type: "방어",
                value: 2,
            },
            {
                type: "솜씨",
                value: 15,
            },
        ],
    },
    히스: {
        name: "히스",
        stats: [
            {
                type: "탐험 레벨이 5 이상일때 방어",
                value: 3,
            },
            {
                type: "탐험 레벨이 15 이상일때 방어",
                value: 3,
            },
            {
                type: "최대생명력",
                value: 20,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
            {
                type: "최대마나",
                value: 20,
            },
        ],
    },
    아이스: {
        name: "아이스",
        stats: [
            {
                type: "아이스볼트 랭크 A 이상일 때 체력",
                value: 5,
            },
            {
                type: "아이스볼트 랭크 A 이상일 때 의지",
                value: 5,
            },
            {
                type: "스매시 랭크 8 이상일 때 솜씨",
                value: 10,
            },
        ],
    },
    얼음의: {
        name: "얼음의",
        stats: [
            {
                type: "아이스볼트 랭크 A 이상일 때 체력",
                value: 5,
            },
            {
                type: "아이스볼트 랭크 A 이상일 때 의지",
                value: 5,
            },
            {
                type: "스매시 랭크 8 이상일 때 솜씨",
                value: 10,
            },
        ],
    },
    방직: {
        name: "방직",
        stats: [
            {
                type: "방직 랭크 C 이상일 때 솜씨",
                value: 2,
            },
            {
                type: "방직 랭크 9 이상일 때 솜씨",
                value: 4,
            },
            {
                type: "체력",
                value: 6,
            },
        ],
    },
    워리어: {
        name: "워리어",
        stats: [
            {
                type: "레벨이 35 이상일때 체력",
                min: 5,
                max: 10,
            },
        ],
    },
    분노의: {
        name: "분노의",
        stats: [
            {
                type: "인프라블랙 타이틀을 달고 있을때 크리티컬",
                value: 20,
            },
            {
                type: "브레인 오브 카오스 랭크 A 이상일 때 지력",
                value: 12,
            },
            {
                type: "핸즈 오브 카오스 랭크 7 이상일 때 솜씨",
                value: 12,
            },
            {
                type: "바디 오브 카오스 랭크 4 이상일 때 체력",
                value: 18,
            },
        ],
    },
    설원의: {
        name: "설원의",
        stats: [
            {
                type: "최대스태미나",
                value: 10,
            },
            {
                type: "지력",
                value: 5,
            },
            {
                type: "솜씨",
                value: 10,
            },
        ],
    },
    세련된: {
        name: "세련된",
        stats: [
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 20,
            },
            {
                type: "레벨이 20 이상일때 보호",
                value: 3,
            },
        ],
    },
    리파인드: {
        name: "리파인드",
        stats: [
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 20,
            },
            {
                type: "레벨이 20 이상일때 보호",
                value: 3,
            },
        ],
    },
    리치: {
        name: "리치",
        stats: [
            {
                type: "레벨이 5 이상일때 행운",
                min: 2,
                max: 3,
            },
        ],
    },
    수레국화: {
        name: "수레국화",
        stats: [
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "행운",
                value: 10,
            },
            {
                type: "방어",
                value: 1,
            },
        ],
    },
    고대의: {
        name: "고대의",
        stats: [
            {
                type: "휴식 랭크 8 이상일 때 행운",
                value: 20,
            },
            {
                type: "휴식 랭크 7 이상일 때 최대대미지",
                min: 6,
                max: 12,
            },
        ],
    },
    에인션트: {
        name: "에인션트",
        stats: [
            {
                type: "휴식 랭크 8 이상일 때 행운",
                value: 20,
            },
            {
                type: "휴식 랭크 7 이상일 때 최대대미지",
                min: 6,
                max: 12,
            },
        ],
    },
    각진: {
        name: "각진",
        stats: [
            {
                type: "자이언트이거나 자이언트를 지지중일때 크리티컬",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 크리티컬",
                value: 5,
            },
            {
                type: "레벨이 10 이상일때 솜씨",
                value: 5,
            },
        ],
    },
    수호의: {
        name: "수호의",
        stats: [
            {
                type: "디펜스 랭크 8 이상일 때 방어",
                value: 4,
            },
            {
                type: "의지",
                min: 4,
                max: 6,
            },
            {
                type: "최대생명력",
                min: 6,
                max: 10,
            },
            {
                type: "지력",
                value: 20,
            },
            {
                type: "행운",
                value: 4,
            },
        ],
    },
    가드: {
        name: "가드",
        stats: [
            {
                type: "디펜스 랭크 8 이상일 때 방어",
                value: 4,
            },
            {
                type: "의지",
                min: 4,
                max: 6,
            },
            {
                type: "최대생명력",
                min: 6,
                max: 10,
            },
            {
                type: "지력",
                value: 20,
            },
            {
                type: "행운",
                value: 4,
            },
        ],
    },
    스노드롭: {
        name: "스노드롭",
        stats: [
            {
                type: "레벨이 30 이상일때 크리티컬",
                value: 10,
            },
            {
                type: "윈드밀 랭크 6 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "매그넘 샷 랭크 6 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "행운",
                value: 20,
            },
        ],
    },
    "나무 바늘": {
        name: "나무 바늘",
        stats: [
            {
                type: "크리티컬",
                value: 6,
            },
            {
                type: "컴뱃 마스터리 랭크 8 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "컴뱃 마스터리 랭크 5 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "솜씨",
                value: 16,
            },
        ],
    },
    "우든 니들": {
        name: "우든 니들",
        stats: [
            {
                type: "크리티컬",
                value: 6,
            },
            {
                type: "컴뱃 마스터리 랭크 8 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "컴뱃 마스터리 랭크 5 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "솜씨",
                value: 16,
            },
        ],
    },
    서리의: {
        name: "서리의",
        stats: [
            {
                type: "최대마나",
                value: 5,
            },
            {
                type: "지력",
                value: 10,
            },
            {
                type: "행운",
                value: 5,
            },
            {
                type: "방어",
                value: 1,
            },
        ],
    },
    히야신스: {
        name: "히야신스",
        stats: [
            {
                type: "지력",
                value: 10,
            },
            {
                type: "행운",
                value: 5,
            },
            {
                type: "보호",
                value: 2,
            },
        ],
    },
    와이번: {
        name: "와이번",
        stats: [
            {
                type: "드래곤의기사 타이틀을 달고 있을때 최대대미지",
                min: 12,
                max: 20,
            },
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "체력",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    대담한: {
        name: "대담한",
        stats: [
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "발구르기 랭크 C 이상일 때 체력",
                value: 3,
            },
            {
                type: "발구르기 랭크 9 이상일 때 체력",
                value: 3,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 A 이상일 때 솜씨",
                value: 5,
            },
        ],
    },
    궁수: {
        name: "궁수",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "매그넘 샷 랭크 C 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "매그넘 샷 랭크 A 이상일 때 최소대미지",
                min: 2,
                max: 5,
            },
        ],
    },
    생명의: {
        name: "생명의",
        stats: [
            {
                type: "지력",
                value: 5,
            },
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 25,
            },
            {
                type: "레벨이 20 이상일때 보호",
                value: 2,
            },
        ],
    },
    소나기의: {
        name: "소나기의",
        stats: [
            {
                type: "체력",
                value: 10,
            },
            {
                type: "솜씨",
                value: 5,
            },
        ],
    },
    제비꽃: {
        name: "제비꽃",
        stats: [
            {
                type: "의지",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    멧돼지: {
        name: "멧돼지",
        stats: [
            {
                type: "연금술 마스터리 랭크 C 이상일 때 최대대미지",
                min: 1,
                max: 3,
            },
        ],
    },
    음악가의: {
        name: "음악가의",
        stats: [
            {
                type: "작곡 랭크 9 이상일 때 크리티컬",
                value: 3,
            },
            {
                type: "음악적 지식 랭크 6 이상일 때 크리티컬",
                value: 4,
            },
            {
                type: "악기 연주 랭크 9 이하일 때 솜씨",
                value: 10,
            },
        ],
    },
    "버스트 나이트": {
        name: "버스트 나이트",
        stats: [
            {
                type: "체력",
                min: 1,
                max: 10,
            },
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "디펜스 랭크 9 이상일 때 폭발 저항",
                min: 1,
                max: 4,
            },
        ],
    },
    라이온헌터: {
        name: "라이온헌터",
        stats: [
            {
                type: "레벨이 40 이상일때 최대대미지",
                min: 8,
                max: 10,
            },
        ],
    },
    칼라: {
        name: "칼라",
        stats: [
            {
                type: "연금술 마스터리 랭크 D 이상일 때 최소대미지",
                value: 3,
            },
            {
                type: "연금술 마스터리 랭크 B 이상일 때 최대대미지",
                min: 2,
                max: 4,
            },
        ],
    },
    "금속 바늘": {
        name: "금속 바늘",
        stats: [
            {
                type: "레벨이 16 이상일때 크리티컬",
                value: 2,
            },
            {
                type: "레벨이 24 이상일때 최소대미지",
                value: 2,
            },
            {
                type: "레벨이 32 이상일때 최대대미지",
                value: 6,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 9 이상일 때 최대대미지",
                value: 12,
            },
        ],
    },
    "메탈 니들": {
        name: "메탈 니들",
        stats: [
            {
                type: "레벨이 16 이상일때 크리티컬",
                value: 2,
            },
            {
                type: "레벨이 24 이상일때 최소대미지",
                value: 2,
            },
            {
                type: "레벨이 32 이상일때 최대대미지",
                value: 6,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 9 이상일 때 최대대미지",
                value: 12,
            },
        ],
    },
    불편의: {
        name: "불편의",
        stats: [
            {
                type: "레벨이 9 이상일때 의지",
                value: 5,
            },
        ],
    },
    선장의: {
        name: "선장의",
        stats: [
            {
                type: "의지",
                value: 5,
            },
            {
                type: "레벨이 10 이상일때 체력",
                value: 10,
            },
            {
                type: "레벨이 20 이상일때 방어",
                value: 3,
            },
        ],
    },
    캡틴: {
        name: "캡틴",
        stats: [
            {
                type: "의지",
                value: 5,
            },
            {
                type: "레벨이 10 이상일때 체력",
                value: 10,
            },
            {
                type: "레벨이 20 이상일때 방어",
                value: 3,
            },
        ],
    },
    수놓은: {
        name: "수놓은",
        stats: [
            {
                type: "최대생명력",
                value: 10,
            },
            {
                type: "방직 랭크 C 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "방직 랭크 B 이상일 때 최대스태미나",
                value: 10,
            },
        ],
    },
    스매시: {
        name: "스매시",
        stats: [
            {
                type: "스매시 랭크 A 이상일 때 체력",
                value: 3,
            },
            {
                type: "스매시 랭크 A 이상일 때 밸런스",
                value: 5,
            },
            {
                type: "크리티컬 히트 랭크 C 이상일 때 최소대미지",
                min: 5,
                max: 8,
            },
        ],
    },
    양자리의: {
        name: "양자리의",
        stats: [
            {
                type: "보호",
                value: 2,
            },
            {
                type: "체력",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 10,
            },
        ],
    },
    어쌔신: {
        name: "어쌔신",
        stats: [
            {
                type: "레벨이 14 이상일때 솜씨",
                min: 3,
                max: 5,
            },
        ],
    },
    예언의: {
        name: "예언의",
        stats: [
            {
                type: "레벨이 15 이상일때 최대스태미나",
                value: 15,
            },
            {
                type: "인챈트 랭크 A 이상일 때 지력",
                value: 11,
            },
            {
                type: "최대마나",
                value: 8,
            },
        ],
    },
    윈드밀: {
        name: "윈드밀",
        stats: [
            {
                type: "윈드밀 랭크 A 이상일 때 최대스태미나",
                value: 10,
            },
            {
                type: "윈드밀 랭크 A 이상일 때 체력",
                value: 3,
            },
            {
                type: "디펜스 랭크 C 이상일 때 보호",
                value: 5,
            },
        ],
    },
    자연: {
        name: "자연",
        stats: [
            {
                type: "메디테이션 랭크 B 이상일 때 지력",
                value: 5,
            },
            {
                type: "메디테이션 랭크 B 이상일 때 최대마나",
                value: 10,
            },
            {
                type: "레벨이 35 이상일때 최대생명력",
                value: 15,
            },
        ],
    },
    네이쳐: {
        name: "네이쳐",
        stats: [
            {
                type: "메디테이션 랭크 B 이상일 때 지력",
                value: 5,
            },
            {
                type: "메디테이션 랭크 B 이상일 때 최대마나",
                value: 10,
            },
            {
                type: "레벨이 35 이상일때 최대생명력",
                value: 15,
            },
        ],
    },
    지장의: {
        name: "지장의",
        stats: [
            {
                type: "레벨이 9 이상일때 체력",
                value: 5,
            },
        ],
    },
    카운터: {
        name: "카운터",
        stats: [
            {
                type: "카운터 어택 랭크 9 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "카운터 어택 랭크 9 이상일 때 크리티컬",
                value: 3,
            },
            {
                type: "디펜스 랭크 C 이상일 때 방어",
                value: 4,
            },
        ],
    },
    팔콘: {
        name: "팔콘",
        stats: [
            {
                type: "체력",
                value: 2,
            },
            {
                type: "메디테이션 랭크 D 이상일 때 지력",
                value: 3,
            },
            {
                type: "메디테이션 랭크 C 이상일 때 솜씨",
                value: 3,
            },
        ],
    },
    흑십자: {
        name: "흑십자",
        stats: [
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "의지",
                value: 20,
            },
            {
                type: "나이가 17 이하일때 최대생명력",
                value: 50,
            },
            {
                type: "나이가 17 이하일때 체력",
                value: 10,
            },
        ],
    },
    다크크로스: {
        name: "다크크로스",
        stats: [
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "의지",
                value: 20,
            },
            {
                type: "나이가 17 이하일때 최대생명력",
                value: 50,
            },
            {
                type: "나이가 17 이하일때 체력",
                value: 10,
            },
        ],
    },
    격식있는: {
        name: "격식있는",
        stats: [
            {
                type: "아이스볼트 랭크 A 이상일 때 지력",
                value: 10,
            },
            {
                type: "파이어볼트 랭크 A 이상일 때 최대마나",
                value: 20,
            },
            {
                type: "체력",
                value: 20,
            },
        ],
    },
    명중: {
        name: "명중",
        stats: [
            {
                type: "레인지 컴뱃 마스터리 랭크 F 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 9 이상일 때 솜씨",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 C 이상일 때 방어",
                value: 5,
            },
        ],
    },
    무서운: {
        name: "무서운",
        stats: [
            {
                type: "크리티컬",
                value: 2,
            },
            {
                type: "독 상태일때 솜씨",
                value: 5,
            },
            {
                type: "데들리 상태일때 체력",
                value: 10,
            },
        ],
    },
    소나무: {
        name: "소나무",
        stats: [
            {
                type: "미라지 미사일 랭크 9 이상일 때 최소대미지",
                value: 5,
            },
            {
                type: "미라지 미사일 랭크 5 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "방어",
                value: 3,
            },
            {
                type: "체력",
                value: 10,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    심각한: {
        name: "심각한",
        stats: [
            {
                type: "포션중독 상태일때 의지",
                value: 5,
            },
            {
                type: "데들리 상태일때 솜씨",
                value: 10,
            },
            {
                type: "최대 부상률",
                value: 10,
            },
        ],
    },
    위험한: {
        name: "위험한",
        stats: [
            {
                type: "최소 부상률",
                value: 5,
            },
            {
                type: "독 상태일때 의지",
                value: 5,
            },
            {
                type: "포션중독 상태일때 체력",
                value: 10,
            },
        ],
    },
    "이지 페카": {
        name: "이지 페카",
        stats: [
            {
                type: "의지",
                value: 20,
            },
            {
                type: "크리티컬 히트 랭크 9 이상일 때 최대스태미나",
                value: 10,
            },
            {
                type: "크리티컬 히트 랭크 9 이상일 때 체력",
                value: 10,
            },
        ],
    },
    장애의: {
        name: "장애의",
        stats: [
            {
                type: "레벨이 6 이상일때 솜씨",
                value: 10,
            },
        ],
    },
    처녀자리의: {
        name: "처녀자리의",
        stats: [
            {
                type: "보호",
                value: 2,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    해의: {
        name: "해의",
        stats: [
            {
                type: "레벨이 3 이상일때 행운",
                value: 10,
            },
        ],
    },
    황소자리의: {
        name: "황소자리의",
        stats: [
            {
                type: "방어",
                value: 1,
            },
            {
                type: "보호",
                value: 3,
            },
        ],
    },
    곤란의: {
        name: "곤란의",
        stats: [
            {
                type: "레벨이 3 이상일때 지력",
                value: 15,
            },
        ],
    },
    기운찬: {
        name: "기운찬",
        stats: [
            {
                type: "나이가 16 이하일때 최대스태미나",
                value: 50,
            },
            {
                type: "나이가 12 이상일때 최대대미지",
                value: 3,
            },
            {
                type: "나이가 17 이상일때 체력",
                value: 15,
            },
        ],
    },
    도둑: {
        name: "도둑",
        stats: [
            {
                type: "레벨이 25 이상일때 최대생명력",
                value: 15,
            },
            {
                type: "레벨이 30 이상일때 행운",
                value: 10,
            },
        ],
    },
    매정한: {
        name: "매정한",
        stats: [
            {
                type: "데들리 상태일때 솜씨",
                value: 10,
            },
            {
                type: "최대생명력",
                value: 10,
            },
        ],
    },
    무정한: {
        name: "무정한",
        stats: [
            {
                type: "독 상태일때 지력",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    바람의: {
        name: "바람의",
        stats: [
            {
                type: "레벨이 7 이상일때 솜씨",
                min: 2,
                max: 3,
            },
        ],
    },
    윈드: {
        name: "윈드",
        stats: [
            {
                type: "레벨이 7 이상일때 솜씨",
                min: 2,
                max: 3,
            },
        ],
    },
    블러드: {
        name: "블러드",
        stats: [
            {
                type: "레벨이 7 이상일때 최대생명력",
                min: 4,
                max: 7,
            },
        ],
    },
    비참한: {
        name: "비참한",
        stats: [
            {
                type: "포션중독 상태일때 체력",
                value: 10,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    사수자리의: {
        name: "사수자리의",
        stats: [
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    선인장: {
        name: "선인장",
        stats: [
            {
                type: "미라지 미사일 랭크 B 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "미라지 미사일 랭크 9 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "레벨이 30 이상일때 보호",
                value: 4,
            },
        ],
    },
    임프: {
        name: "임프",
        stats: [
            {
                type: "방어",
                value: 2,
            },
            {
                type: "보호",
                value: 2,
            },
            {
                type: "체력",
                value: 10,
            },
        ],
    },
    전갈자리의: {
        name: "전갈자리의",
        stats: [
            {
                type: "최대스태미나",
                value: 9,
            },
            {
                type: "최대생명력",
                value: 9,
            },
            {
                type: "최대마나",
                value: 9,
            },
        ],
    },
    천칭자리의: {
        name: "천칭자리의",
        stats: [
            {
                type: "방어",
                value: 1,
            },
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대마나",
                value: 5,
            },
        ],
    },
    파이터: {
        name: "파이터",
        stats: [
            {
                type: "레벨이 8 이상일때 체력",
                min: 2,
                max: 3,
            },
        ],
    },
    힐러: {
        name: "힐러",
        stats: [
            {
                type: "힐링 랭크 B 이상일 때 최대생명력",
                value: 15,
            },
            {
                type: "힐링 랭크 B 이상일 때 의지",
                value: 5,
            },
            {
                type: "인챈트 랭크 C 이상일 때 최대스태미나",
                value: 20,
            },
        ],
    },
    골드고블린: {
        name: "골드고블린",
        stats: [
            {
                type: "레벨이 8 이하일때 최대대미지",
                min: 3,
                max: 5,
            },
            {
                type: "레벨이 13 이하일때 밸런스",
                value: 5,
            },
            {
                type: "레벨이 18 이상일때 체력",
                value: 15,
            },
        ],
    },
    다이어울프: {
        name: "다이어울프",
        stats: [
            {
                type: "레벨이 10 이상일때 최대스태미나",
                value: 5,
            },
            {
                type: "휴식 랭크 연습 이하일 때 방어",
                value: 3,
            },
        ],
    },
    루비: {
        name: "루비",
        stats: [
            {
                type: "레벨이 8 이상일때 보호",
                value: 1,
            },
        ],
    },
    매서운: {
        name: "매서운",
        stats: [
            {
                type: "레벨이 15 이상일때 체력",
                value: 5,
            },
            {
                type: "윈드밀 랭크 B 이상일 때 최대생명력",
                value: 10,
            },
            {
                type: "레벨이 20 이하일때 최대스태미나",
                value: 5,
            },
        ],
    },
    물고기자리의: {
        name: "물고기자리의",
        stats: [
            {
                type: "보호",
                value: 1,
            },
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "체력",
                value: 8,
            },
            {
                type: "최대생명력",
                value: 5,
            },
        ],
    },
    물병자리의: {
        name: "물병자리의",
        stats: [
            {
                type: "지력",
                value: 10,
            },
            {
                type: "최대마나",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 5,
            },
        ],
    },
    서스테이너: {
        name: "서스테이너",
        stats: [
            {
                type: "레벨이 16 이상일때 최대스태미나",
                min: 5,
                max: 8,
            },
        ],
    },
    연못의: {
        name: "연못의",
        stats: [
            {
                type: "카운터 어택 랭크 C 이상일 때 최소 부상률",
                value: 4,
            },
            {
                type: "밸런스",
                value: 2,
            },
        ],
    },
    위습: {
        name: "위습",
        stats: [
            {
                type: "아이스볼트 랭크 C 이상일 때 체력",
                value: 5,
            },
            {
                type: "라이트닝볼트 랭크 D 이상일 때 최대마나",
                value: 10,
            },
            {
                type: "파이어볼트 랭크 C 이상일 때 지력",
                value: 3,
            },
        ],
    },
    컨시더레이션: {
        name: "컨시더레이션",
        stats: [
            {
                type: "레벨이 7 이상일때 지력",
                min: 2,
                max: 3,
            },
        ],
    },
    파운테인: {
        name: "파운테인",
        stats: [
            {
                type: "레벨이 8 이상일때 최대마나",
                min: 4,
                max: 7,
            },
        ],
    },
    포츈: {
        name: "포츈",
        stats: [
            {
                type: "행운",
                min: 1,
                max: 2,
            },
        ],
    },
    해적의: {
        name: "해적의",
        stats: [
            {
                type: "레벨이 10 이상일때 체력",
                value: 15,
            },
            {
                type: "레벨이 20 이상일때 방어",
                value: 2,
            },
            {
                type: "최대마나",
                value: 10,
            },
        ],
    },
    희망의: {
        name: "희망의",
        stats: [
            {
                type: "레벨이 15 이상일때 체력",
                value: 8,
            },
            {
                type: "레벨이 30 이하일때 최대마나",
                value: 10,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    호프: {
        name: "호프",
        stats: [
            {
                type: "레벨이 15 이상일때 체력",
                value: 8,
            },
            {
                type: "레벨이 30 이하일때 최대마나",
                value: 10,
            },
            {
                type: "의지",
                value: 10,
            },
        ],
    },
    흰거미: {
        name: "흰거미",
        stats: [
            {
                type: "천옷만들기 랭크 C 이상일 때 최대스태미나",
                value: 10,
            },
            {
                type: "블랙스미스 랭크 C 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "방직 랭크 E 이상일 때 최대대미지",
                min: 3,
                max: 8,
            },
        ],
    },
    구름의: {
        name: "구름의",
        stats: [
            {
                type: "레벨이 2 이상일때 솜씨",
                min: 1,
                max: 2,
            },
        ],
    },
    클라우드: {
        name: "클라우드",
        stats: [
            {
                type: "레벨이 2 이상일때 솜씨",
                min: 1,
                max: 2,
            },
        ],
    },
    대지의: {
        name: "대지의",
        stats: [
            {
                type: "크리티컬 히트 랭크 B 이상일 때 최대생명력",
                value: 15,
            },
            {
                type: "레벨이 25 이상일때 체력",
                value: 3,
            },
            {
                type: "디펜스 랭크 C 이상일 때 최대스태미나",
                value: 5,
            },
        ],
    },
    데드맨: {
        name: "데드맨",
        stats: [
            {
                type: "최대생명력",
                min: 16,
                max: 20,
            },
        ],
    },
    목련의: {
        name: "목련의",
        stats: [
            {
                type: "레벨이 30 이상일때 지력",
                value: 7,
            },
            {
                type: "레벨이 16 이하일때 의지",
                value: 6,
            },
            {
                type: "솜씨",
                value: 4,
            },
        ],
    },
    매그놀리아: {
        name: "매그놀리아",
        stats: [
            {
                type: "레벨이 30 이상일때 지력",
                value: 7,
            },
            {
                type: "레벨이 16 이하일때 의지",
                value: 6,
            },
            {
                type: "솜씨",
                value: 4,
            },
        ],
    },
    솔져: {
        name: "솔져",
        stats: [
            {
                type: "레벨이 2 이상일때 체력",
                min: 1,
                max: 2,
            },
        ],
    },
    스톤: {
        name: "스톤",
        stats: [
            {
                type: "레벨이 10 이하일때 보호",
                value: 2,
            },
            {
                type: "레벨이 10 이하일때 방어",
                value: 1,
            },
            {
                type: "레벨이 5 이상일때 밸런스",
                value: 20,
            },
        ],
    },
    염소자리의: {
        name: "염소자리의",
        stats: [
            {
                type: "최소대미지",
                value: 1,
            },
            {
                type: "최대대미지",
                value: 1,
            },
        ],
    },
    오거: {
        name: "오거",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 최대생명력",
                value: 5,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 C 이상일 때 최대대미지",
                value: 2,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 A 이상일 때 최소대미지",
                value: 2,
            },
        ],
    },
    "피로한 자의": {
        name: "피로한 자의",
        stats: [
            {
                type: "최대스태미나",
                min: 10,
                max: 15,
            },
        ],
    },
    "타이어드 맨": {
        name: "타이어드 맨",
        stats: [
            {
                type: "최대스태미나",
                min: 10,
                max: 15,
            },
        ],
    },
    헬스: {
        name: "헬스",
        stats: [
            {
                type: "최대생명력",
                min: 2,
                max: 3,
            },
        ],
    },
    겁쟁이의: {
        name: "겁쟁이의",
        stats: [
            {
                type: "체력",
                min: 6,
                max: 9,
            },
        ],
    },
    카우어드: {
        name: "카우어드",
        stats: [
            {
                type: "체력",
                min: 6,
                max: 9,
            },
        ],
    },
    미명의: {
        name: "미명의",
        stats: [
            {
                type: "레벨이 18 이상일때 체력",
                value: 3,
            },
            {
                type: "레벨이 15 이상일때 의지",
                value: 6,
            },
            {
                type: "힐링 랭크 D 이상일 때 최대마나",
                value: 5,
            },
        ],
    },
    트윌라이트: {
        name: "트윌라이트",
        stats: [
            {
                type: "레벨이 18 이상일때 체력",
                value: 3,
            },
            {
                type: "레벨이 15 이상일때 의지",
                value: 6,
            },
            {
                type: "힐링 랭크 D 이상일 때 최대마나",
                value: 5,
            },
        ],
    },
    병든자의: {
        name: "병든자의",
        stats: [
            {
                type: "최대생명력",
                min: 10,
                max: 15,
            },
        ],
    },
    페이션트: {
        name: "페이션트",
        stats: [
            {
                type: "최대생명력",
                min: 10,
                max: 15,
            },
        ],
    },
    붉은곰: {
        name: "붉은곰",
        stats: [
            {
                type: "레벨이 10 이하일때 보호",
                value: 1,
            },
            {
                type: "레벨이 35 이상일때 최대스태미나",
                value: 10,
            },
        ],
    },
    스켈레톤: {
        name: "스켈레톤",
        stats: [
            {
                type: "레벨이 10 이하일때 최소대미지",
                value: 1,
            },
            {
                type: "레벨이 35 이상일때 최대생명력",
                value: 10,
            },
        ],
    },
    언더스탠딩: {
        name: "언더스탠딩",
        stats: [
            {
                type: "레벨이 2 이상일때 지력",
                min: 1,
                max: 2,
            },
        ],
    },
    오리나무: {
        name: "오리나무",
        stats: [
            {
                type: "체력",
                value: 5,
            },
            {
                type: "휴식 랭크 E 이상일 때 의지",
                value: 5,
            },
        ],
    },
    워터: {
        name: "워터",
        stats: [
            {
                type: "최대마나",
                min: 2,
                max: 3,
            },
        ],
    },
    음침함의: {
        name: "음침함의",
        stats: [
            {
                type: "의지",
                min: 6,
                max: 9,
            },
        ],
    },
    글룸: {
        name: "글룸",
        stats: [
            {
                type: "의지",
                min: 6,
                max: 9,
            },
        ],
    },
    인내의: {
        name: "인내의",
        stats: [
            {
                type: "최대스태미나",
                min: 3,
                max: 4,
            },
        ],
    },
    페이션스: {
        name: "페이션스",
        stats: [
            {
                type: "최대스태미나",
                min: 3,
                max: 4,
            },
        ],
    },
    정지하는: {
        name: "정지하는",
        stats: [
            {
                type: "선원지망생 타이틀을 달고 있을때 체력",
                value: 10,
            },
            {
                type: "솜씨",
                value: 5,
            },
        ],
    },
    크랩: {
        name: "크랩",
        stats: [
            {
                type: "방어",
                min: 6,
                max: 8,
            },
        ],
    },
    허수아비의: {
        name: "허수아비의",
        stats: [
            {
                type: "솜씨",
                min: 6,
                max: 9,
            },
        ],
    },
    스캐어크로우: {
        name: "스캐어크로우",
        stats: [
            {
                type: "솜씨",
                min: 6,
                max: 9,
            },
        ],
    },
    회색늑대: {
        name: "회색늑대",
        stats: [
            {
                type: "레벨이 10 이하일때 최대대미지",
                value: 2,
            },
            {
                type: "레벨이 25 이상일때 체력",
                value: 3,
            },
        ],
    },
    흰여우: {
        name: "흰여우",
        stats: [
            {
                type: "레벨이 5 이상일때 최대생명력",
                value: 3,
            },
            {
                type: "레벨이 10 이상일때 최대마나",
                value: 3,
            },
            {
                type: "레벨이 15 이상일때 최대스태미나",
                value: 3,
            },
        ],
    },
    갈색곰: {
        name: "갈색곰",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 E 이하일 때 최대생명력",
                value: 3,
            },
            {
                type: "컴뱃 마스터리 랭크 B 이상일 때 체력",
                value: 2,
            },
        ],
    },
    늪의: {
        name: "늪의",
        stats: [
            {
                type: "최대스태미나",
                min: 3,
                max: 4,
            },
        ],
    },
    스웜프: {
        name: "스웜프",
        stats: [
            {
                type: "최대스태미나",
                min: 3,
                max: 4,
            },
        ],
    },
    드라이: {
        name: "드라이",
        stats: [
            {
                type: "최대마나",
                min: 5,
                max: 9,
            },
        ],
    },
    부자의: {
        name: "부자의",
        stats: [
            {
                type: "레벨이 5 이상일때 행운",
                min: 2,
                max: 3,
            },
        ],
    },
    붉은여우: {
        name: "붉은여우",
        stats: [
            {
                type: "레벨이 5 이상일때 최대생명력",
                value: 2,
            },
            {
                type: "레벨이 10 이상일때 최대스태미나",
                value: 2,
            },
            {
                type: "레벨이 15 이상일때 최대마나",
                value: 2,
            },
        ],
    },
    오팔: {
        name: "오팔",
        stats: [
            {
                type: "레벨이 5 이하일때 솜씨",
                value: 2,
            },
            {
                type: "레벨이 25 이상일때 최대스태미나",
                value: 10,
            },
        ],
    },
    잔존한: {
        name: "잔존한",
        stats: [
            {
                type: "말과 타조의 친구 타이틀을 달고 있을때 행운",
                value: 10,
            },
            {
                type: "최소 부상률",
                value: 20,
            },
        ],
    },
    제이드: {
        name: "제이드",
        stats: [
            {
                type: "보호",
                min: 2,
                max: 4,
            },
        ],
    },
    크레이피쉬: {
        name: "크레이피쉬",
        stats: [
            {
                type: "방어",
                min: 4,
                max: 6,
            },
        ],
    },
    갈색여우: {
        name: "갈색여우",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 E 이상일 때 체력",
                value: 1,
            },
            {
                type: "컴뱃 마스터리 랭크 E 이상일 때 지력",
                value: 1,
            },
        ],
    },
    너구리: {
        name: "너구리",
        stats: [
            {
                type: "레벨이 3 이상일때 솜씨",
                value: 1,
            },
            {
                type: "레벨이 3 이상일때 최대생명력",
                value: 3,
            },
        ],
    },
    느림보의: {
        name: "느림보의",
        stats: [
            {
                type: "솜씨",
                min: 1,
                max: 3,
            },
        ],
    },
    슬러그: {
        name: "슬러그",
        stats: [
            {
                type: "솜씨",
                min: 1,
                max: 3,
            },
        ],
    },
    랍스터: {
        name: "랍스터",
        stats: [
            {
                type: "방어",
                min: 2,
                max: 4,
            },
        ],
    },
    머무른: {
        name: "머무른",
        stats: [
            {
                type: "손이 미끄러운 타이틀을 달고 있을때 최대스태미나",
                value: 20,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    토파즈: {
        name: "토파즈",
        stats: [
            {
                type: "보호",
                min: 1,
                max: 2,
            },
        ],
    },
    복수자: {
        name: "복수자",
        stats: [
            {
                type: "최대대미지",
                value: 12,
            },
            {
                type: "데들리 상태일때 크리티컬",
                value: 10,
            },
            {
                type: "포션중독 상태일때 체력",
                value: 20,
            },
            {
                type: "독 상태일때 밸런스",
                value: 20,
            },
        ],
    },
    어벤저: {
        name: "어벤저",
        stats: [
            {
                type: "최대대미지",
                value: 12,
            },
            {
                type: "데들리 상태일때 크리티컬",
                value: 10,
            },
            {
                type: "포션중독 상태일때 체력",
                value: 20,
            },
            {
                type: "독 상태일때 밸런스",
                value: 20,
            },
        ],
    },
    디바이드: {
        name: "디바이드",
        stats: [
            {
                type: "밸런스",
                value: 10,
            },
            {
                type: "레벨이 10 이상일때 체력",
                value: 20,
            },
            {
                type: "레벨이 40 이상일때 행운",
                value: 20,
            },
        ],
    },
    리볼버: {
        name: "리볼버",
        stats: [
            {
                type: "크리티컬",
                value: 10,
            },
            {
                type: "방직 랭크 7 이상일 때 솜씨",
                value: 20,
            },
            {
                type: "천옷만들기 랭크 9 이상일 때 의지",
                value: 10,
            },
        ],
    },
    가시: {
        name: "가시",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "약초학 랭크 9 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "포션 조제 랭크 A 이상일 때 체력",
                value: 10,
            },
        ],
    },
    스파이크: {
        name: "스파이크",
        stats: [
            {
                type: "최대대미지",
                value: 10,
            },
            {
                type: "약초학 랭크 9 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "포션 조제 랭크 A 이상일 때 체력",
                value: 10,
            },
        ],
    },
    바이퍼: {
        name: "바이퍼",
        stats: [
            {
                type: "독 상태일때 체력",
                value: 50,
            },
        ],
    },
    스탬프: {
        name: "스탬프",
        stats: [
            {
                type: "나이가 20 이상일때 최소대미지",
                value: 4,
            },
            {
                type: "나이가 16 이상일때 최대대미지",
                value: 8,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    종려나무: {
        name: "종려나무",
        stats: [
            {
                type: "레인지 컴뱃 마스터리 랭크 A 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 7 이상일 때 최소대미지",
                value: 6,
            },
            {
                type: "레인지 컴뱃 마스터리 랭크 4 이상일 때 최대대미지",
                value: 8,
            },
            {
                type: "최대생명력",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    기사: {
        name: "기사",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 8 이상일 때 최대생명력",
                value: 30,
            },
            {
                type: "레벨이 40 이상일때 솜씨",
                value: 5,
            },
            {
                type: "레벨이 40 이상일때 체력",
                value: 15,
            },
        ],
    },
    마법사: {
        name: "마법사",
        stats: [
            {
                type: "최대마나",
                value: 40,
            },
            {
                type: "최대생명력",
                value: 20,
            },
            {
                type: "라이트닝볼트 랭크 6 이상일 때 지력",
                value: 20,
            },
        ],
    },
    위자드: {
        name: "위자드",
        stats: [
            {
                type: "최대마나",
                value: 40,
            },
            {
                type: "최대생명력",
                value: 20,
            },
            {
                type: "라이트닝볼트 랭크 6 이상일 때 지력",
                value: 20,
            },
        ],
    },
    사자자리의: {
        name: "사자자리의",
        stats: [
            {
                type: "보호",
                value: 1,
            },
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "체력",
                value: 10,
            },
        ],
    },
    쌍둥이자리의: {
        name: "쌍둥이자리의",
        stats: [
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "지력",
                value: 5,
            },
            {
                type: "최대마나",
                value: 5,
            },
        ],
    },
    떡갈나무: {
        name: "떡갈나무",
        stats: [
            {
                type: "파이널 히트 랭크 A 이상일 때 최소대미지",
                value: 6,
            },
            {
                type: "파이널 히트 랭크 6 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "방어",
                value: 6,
            },
        ],
    },
    마나: {
        name: "마나",
        stats: [
            {
                type: "메디테이션 랭크 A 이상일 때 체력",
                value: 15,
            },
            {
                type: "메디테이션 랭크 A 이상일 때 지력",
                value: 10,
            },
            {
                type: "아이스볼트 랭크 8 이상일 때 최대마나",
                value: 20,
            },
        ],
    },
    번개: {
        name: "번개",
        stats: [
            {
                type: "라이트닝볼트 랭크 A 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "라이트닝볼트 랭크 A 이상일 때 최대마나",
                value: 20,
            },
            {
                type: "아이스볼트 랭크 C 이상일 때 체력",
                value: 5,
            },
        ],
    },
    라이트닝: {
        name: "라이트닝",
        stats: [
            {
                type: "라이트닝볼트 랭크 A 이상일 때 솜씨",
                value: 3,
            },
            {
                type: "라이트닝볼트 랭크 A 이상일 때 최대마나",
                value: 20,
            },
            {
                type: "아이스볼트 랭크 C 이상일 때 체력",
                value: 5,
            },
        ],
    },
    불꽃의: {
        name: "불꽃의",
        stats: [
            {
                type: "파이어볼트 랭크 A 이상일 때 의지",
                value: 3,
            },
            {
                type: "파이어볼트 랭크 A 이상일 때 지력",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 C 이상일 때 최대스태미나",
                value: 20,
            },
        ],
    },
    파이어: {
        name: "파이어",
        stats: [
            {
                type: "파이어볼트 랭크 A 이상일 때 의지",
                value: 3,
            },
            {
                type: "파이어볼트 랭크 A 이상일 때 지력",
                value: 5,
            },
            {
                type: "컴뱃 마스터리 랭크 C 이상일 때 최대스태미나",
                value: 20,
            },
        ],
    },
    새벽: {
        name: "새벽",
        stats: [
            {
                type: "레벨이 30 이상일때 최대스태미나",
                value: 20,
            },
            {
                type: "레벨이 30 이상일때 최대생명력",
                value: 30,
            },
        ],
    },
    게자리의: {
        name: "게자리의",
        stats: [
            {
                type: "방어",
                value: 1,
            },
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
        ],
    },
    동백나무: {
        name: "동백나무",
        stats: [
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 10,
            },
            {
                type: "레벨이 15 이상일때 최대마나",
                value: 15,
            },
            {
                type: "레벨이 20 이상일때 최대스태미나",
                value: 10,
            },
        ],
    },
    망설이는: {
        name: "망설이는",
        stats: [
            {
                type: "윈드밀 랭크 C 이상일 때 최대 부상률",
                value: 6,
            },
            {
                type: "크리티컬",
                value: 2,
            },
        ],
    },
    사막거미: {
        name: "사막거미",
        stats: [
            {
                type: "탐험 레벨이 9 이상일때 최대대미지",
                value: 6,
            },
            {
                type: "탐험 레벨이 12 이하일때 최소대미지",
                value: 2,
            },
            {
                type: "보호",
                value: 5,
            },
        ],
    },
    정밀한: {
        name: "정밀한",
        stats: [
            {
                type: "레벨이 26 이상일때 최대스태미나",
                value: 20,
            },
            {
                type: "레벨이 14 이상일때 최대생명력",
                value: 5,
            },
            {
                type: "천옷만들기 랭크 A 이하일 때 솜씨",
                value: 8,
            },
        ],
    },
    축복의: {
        name: "축복의",
        stats: [
            {
                type: "레벨이 15 이상일때 최대스태미나",
                value: 10,
            },
            {
                type: "레벨이 20 이상일때 크리티컬",
                value: 5,
            },
            {
                type: "레벨이 20 이상일때 밸런스",
                value: 15,
            },
        ],
    },
    블레싱: {
        name: "블레싱",
        stats: [
            {
                type: "레벨이 15 이상일때 최대스태미나",
                value: 10,
            },
            {
                type: "레벨이 20 이상일때 크리티컬",
                value: 5,
            },
            {
                type: "레벨이 20 이상일때 밸런스",
                value: 15,
            },
        ],
    },
    탄탄한: {
        name: "탄탄한",
        stats: [
            {
                type: "최대생명력",
                value: 10,
            },
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "최대스태미나",
                value: 10,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    특이한: {
        name: "특이한",
        stats: [
            {
                type: "캠프 파이어 랭크 D 이상일 때 최대대미지",
                value: 5,
            },
            {
                type: "지력",
                value: 15,
            },
        ],
    },
    튼튼한: {
        name: "튼튼한",
        stats: [
            {
                type: "레벨이 15 이상일때 밸런스",
                min: 3,
                max: 5,
            },
        ],
    },
    스터디: {
        name: "스터디",
        stats: [
            {
                type: "레벨이 15 이상일때 밸런스",
                min: 3,
                max: 5,
            },
        ],
    },
    햄스터: {
        name: "햄스터",
        stats: [
            {
                type: "최대대미지",
                min: 1,
                max: 10,
            },
            {
                type: "최소대미지",
                min: 1,
                max: 6,
            },
        ],
    },
    호수의: {
        name: "호수의",
        stats: [
            {
                type: "카운터 어택 랭크 A 이상일 때 최소 부상률",
                value: 6,
            },
            {
                type: "밸런스",
                value: 3,
            },
        ],
    },
    간편한: {
        name: "간편한",
        stats: [
            {
                type: "레벨이 5 이상일때 크리티컬",
                value: 5,
            },
            {
                type: "레벨이 20 이하일때 최대마나",
                value: 10,
            },
            {
                type: "레벨이 10 이상일때 최대스태미나",
                value: 10,
            },
        ],
    },
    강옥: {
        name: "강옥",
        stats: [
            {
                type: "탐험 레벨이 10 이상일때 최대대미지",
                value: 6,
            },
            {
                type: "탐험 레벨이 18 이하일때 최소대미지",
                value: 5,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    고블린: {
        name: "고블린",
        stats: [
            {
                type: "레벨이 10 이상일때 방어",
                value: 1,
            },
        ],
    },
    고원의: {
        name: "고원의",
        stats: [
            {
                type: "디펜스 랭크 B 이상일 때 밸런스",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 5,
            },
        ],
    },
    금강석: {
        name: "금강석",
        stats: [
            {
                type: "탐험 레벨이 15 이상일때 최대대미지",
                value: 6,
            },
            {
                type: "레벨이 25 이하일때 크리티컬",
                value: 5,
            },
            {
                type: "의지",
                value: 5,
            },
        ],
    },
    리자드: {
        name: "리자드",
        stats: [
            {
                type: "탐험 레벨이 12 이상일때 크리티컬",
                value: 10,
            },
            {
                type: "최소 부상률",
                value: 5,
            },
            {
                type: "최대 부상률",
                value: 15,
            },
        ],
    },
    세심한: {
        name: "세심한",
        stats: [
            {
                type: "라이트닝볼트 랭크 B 이상일 때 솜씨",
                value: 5,
            },
            {
                type: "스매시 랭크 B 이상일 때 솜씨",
                value: 5,
            },
            {
                type: "애로우 리볼버 랭크 B 이상일 때 솜씨",
                value: 5,
            },
        ],
    },
    수상한: {
        name: "수상한",
        stats: [
            {
                type: "윈드밀 랭크 F 이상일 때 최대 부상률",
                value: 3,
            },
            {
                type: "크리티컬",
                value: 1,
            },
        ],
    },
    치킨: {
        name: "치킨",
        stats: [
            {
                type: "최소 부상률",
                min: 1,
                max: 6,
            },
            {
                type: "최대 부상률",
                min: 1,
                max: 20,
            },
        ],
    },
    "치킨 서머너": {
        name: "치킨 서머너",
        stats: [
            {
                type: "최소 부상률",
                min: 5,
                max: 6,
            },
        ],
    },
    "치킨 슬레이어": {
        name: "치킨 슬레이어",
        stats: [
            {
                type: "최대 부상률",
                min: 14,
                max: 18,
            },
        ],
    },
    폭스테이머: {
        name: "폭스테이머",
        stats: [
            {
                type: "레벨이 8 이상일때 최소대미지",
                value: 2,
            },
        ],
    },
    햄스터테이머: {
        name: "햄스터테이머",
        stats: [
            {
                type: "최소대미지",
                min: 5,
                max: 6,
            },
        ],
    },
    햄스터헌터: {
        name: "햄스터헌터",
        stats: [
            {
                type: "최대대미지",
                min: 10,
                max: 12,
            },
        ],
    },
    강인한: {
        name: "강인한",
        stats: [
            {
                type: "레벨이 8 이상일때 최대생명력",
                value: 5,
            },
            {
                type: "레벨이 10 이하일때 체력",
                value: 2,
            },
            {
                type: "레벨이 20 이상일때 솜씨",
                value: 2,
            },
        ],
    },
    스트롱: {
        name: "스트롱",
        stats: [
            {
                type: "레벨이 8 이상일때 최대생명력",
                value: 5,
            },
            {
                type: "레벨이 10 이하일때 체력",
                value: 2,
            },
            {
                type: "레벨이 20 이상일때 솜씨",
                value: 2,
            },
        ],
    },
    별난: {
        name: "별난",
        stats: [
            {
                type: "캠프 파이어 랭크 E 이상일 때 최대대미지",
                value: 4,
            },
            {
                type: "지력",
                value: 10,
            },
        ],
    },
    사막여우: {
        name: "사막여우",
        stats: [
            {
                type: "탐험 레벨이 6 이상일때 최대대미지",
                value: 4,
            },
            {
                type: "탐험 레벨이 9 이하일때 최소대미지",
                value: 2,
            },
            {
                type: "보호",
                value: 3,
            },
        ],
    },
    승리의: {
        name: "승리의",
        stats: [
            {
                type: "레벨이 24 이상일때 의지",
                value: 10,
            },
            {
                type: "레벨이 18 이하일때 밸런스",
                value: 6,
            },
            {
                type: "최대대미지",
                value: 6,
            },
        ],
    },
    영리한: {
        name: "영리한",
        stats: [
            {
                type: "레벨이 8 이상일때 최대마나",
                value: 5,
            },
            {
                type: "레벨이 10 이하일때 지력",
                value: 2,
            },
            {
                type: "레벨이 20 이상일때 의지",
                value: 2,
            },
        ],
    },
    스마트: {
        name: "스마트",
        stats: [
            {
                type: "레벨이 8 이상일때 최대마나",
                value: 5,
            },
            {
                type: "레벨이 10 이하일때 지력",
                value: 2,
            },
            {
                type: "레벨이 20 이상일때 의지",
                value: 2,
            },
        ],
    },
    울프헌터: {
        name: "울프헌터",
        stats: [
            {
                type: "레벨이 10 이상일때 최대대미지",
                min: 4,
                max: 6,
            },
        ],
    },
    웅덩이의: {
        name: "웅덩이의",
        stats: [
            {
                type: "카운터 어택 랭크 E 이상일 때 최소 부상률",
                value: 2,
            },
            {
                type: "밸런스",
                value: 1,
            },
        ],
    },
    장난감: {
        name: "장난감",
        stats: [
            {
                type: "밸런스",
                min: 19,
                max: 24,
            },
        ],
    },
    토이: {
        name: "토이",
        stats: [
            {
                type: "밸런스",
                min: 19,
                max: 24,
            },
        ],
    },
    펭귄: {
        name: "펭귄",
        stats: [
            {
                type: "최대 부상률",
                min: 1,
                max: 15,
            },
            {
                type: "최소 부상률",
                min: 1,
                max: 4,
            },
        ],
    },
    "펭귄 서머너": {
        name: "펭귄 서머너",
        stats: [
            {
                type: "최소 부상률",
                min: 4,
                max: 5,
            },
        ],
    },
    "펭귄 슬레이어": {
        name: "펭귄 슬레이어",
        stats: [
            {
                type: "최대 부상률",
                min: 9,
                max: 14,
            },
        ],
    },
    편리한: {
        name: "편리한",
        stats: [
            {
                type: "레벨이 20 이하일때 최대스태미나",
                value: 5,
            },
            {
                type: "요리 랭크 D 이상일 때 솜씨",
                value: 2,
            },
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 5,
            },
        ],
    },
    황옥: {
        name: "황옥",
        stats: [
            {
                type: "의지",
                value: 5,
            },
            {
                type: "레벨이 20 이하일때 크리티컬",
                value: 4,
            },
            {
                type: "탐험 레벨이 12 이상일때 최대대미지",
                value: 5,
            },
        ],
    },
    희생의: {
        name: "희생의",
        stats: [
            {
                type: "레벨이 25 이상일때 최대생명력",
                value: 6,
            },
            {
                type: "레벨이 15 이상일때 체력",
                value: 2,
            },
            {
                type: "스매시 랭크 C 이하일 때 최대대미지",
                value: 6,
            },
        ],
    },
    새크리피셜: {
        name: "새크리피셜",
        stats: [
            {
                type: "레벨이 25 이상일때 최대생명력",
                value: 6,
            },
            {
                type: "레벨이 15 이상일때 체력",
                value: 2,
            },
            {
                type: "스매시 랭크 C 이하일 때 최대대미지",
                value: 6,
            },
        ],
    },
    가짜: {
        name: "가짜",
        stats: [
            {
                type: "밸런스",
                min: 8,
                max: 13,
            },
        ],
    },
    이미테이션: {
        name: "이미테이션",
        stats: [
            {
                type: "밸런스",
                min: 8,
                max: 13,
            },
        ],
    },
    금이간: {
        name: "금이간",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    크랙트: {
        name: "크랙트",
        stats: [
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    냉혹한: {
        name: "냉혹한",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 D 이상일 때 최대생명력",
                value: 15,
            },
            {
                type: "최대대미지",
                value: 5,
            },
        ],
    },
    "마스크 고블린": {
        name: "마스크 고블린",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 9 이상일 때 크리티컬",
                value: 3,
            },
            {
                type: "최대마나",
                value: 5,
            },
        ],
    },
    스네이크: {
        name: "스네이크",
        stats: [
            {
                type: "레벨이 4 이상일때 최소대미지",
                value: 1,
            },
            {
                type: "레벨이 4 이상일때 최대대미지",
                min: 1,
                max: 2,
            },
        ],
    },
    스네이크테이머: {
        name: "스네이크테이머",
        stats: [
            {
                type: "레벨이 3 이상일때 최소대미지",
                value: 1,
            },
        ],
    },
    "스완 서머너": {
        name: "스완 서머너",
        stats: [
            {
                type: "레벨이 12 이상일때 최소 부상률",
                value: 1,
            },
        ],
    },
    여신의: {
        name: "여신의",
        stats: [
            {
                type: "최대스태미나",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "최대대미지",
                value: 8,
            },
            {
                type: "최소대미지",
                value: 5,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "체력",
                value: 10,
            },
        ],
    },
    초원의: {
        name: "초원의",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "디펜스 랭크 D 이상일 때 밸런스",
                value: 3,
            },
        ],
    },
    타조: {
        name: "타조",
        stats: [
            {
                type: "탐험 레벨이 8 이상일때 크리티컬",
                value: 5,
            },
            {
                type: "최소 부상률",
                value: 3,
            },
            {
                type: "최대 부상률",
                value: 10,
            },
        ],
    },
    피그: {
        name: "피그",
        stats: [
            {
                type: "최대대미지",
                min: 1,
                max: 6,
            },
            {
                type: "최소대미지",
                min: 1,
                max: 3,
            },
        ],
    },
    피그테이머: {
        name: "피그테이머",
        stats: [
            {
                type: "최소대미지",
                min: 3,
                max: 4,
            },
        ],
    },
    피그헌터: {
        name: "피그헌터",
        stats: [
            {
                type: "최대대미지",
                min: 6,
                max: 8,
            },
        ],
    },
    활석: {
        name: "활석",
        stats: [
            {
                type: "행운",
                value: 5,
            },
            {
                type: "탐험 레벨이 6 이하일때 최소대미지",
                value: 1,
            },
            {
                type: "탐험 레벨이 2 이상일때 최대대미지",
                value: 2,
            },
        ],
    },
    흑요석: {
        name: "흑요석",
        stats: [
            {
                type: "최대스태미나",
                value: 30,
            },
            {
                type: "체력",
                value: 15,
            },
            {
                type: "지력",
                value: 15,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    값싼: {
        name: "값싼",
        stats: [
            {
                type: "밸런스",
                min: 2,
                max: 8,
            },
        ],
    },
    칩: {
        name: "칩",
        stats: [
            {
                type: "밸런스",
                min: 2,
                max: 8,
            },
        ],
    },
    괴상한: {
        name: "괴상한",
        stats: [
            {
                type: "캠프 파이어 랭크 F 이상일 때 최대대미지",
                value: 3,
            },
            {
                type: "지력",
                value: 5,
            },
        ],
    },
    날카로운: {
        name: "날카로운",
        stats: [
            {
                type: "레벨이 12 이상일때 크리티컬",
                value: 2,
            },
        ],
    },
    샤프: {
        name: "샤프",
        stats: [
            {
                type: "레벨이 12 이상일때 크리티컬",
                value: 2,
            },
        ],
    },
    녹슨: {
        name: "녹슨",
        stats: [
            {
                type: "크리티컬",
                value: 2,
            },
        ],
    },
    러스티: {
        name: "러스티",
        stats: [
            {
                type: "크리티컬",
                value: 2,
            },
        ],
    },
    단단한: {
        name: "단단한",
        stats: [
            {
                type: "레벨이 25 이상일때 솜씨",
                value: 3,
            },
            {
                type: "레벨이 5 이상일때 체력",
                value: 1,
            },
            {
                type: "레벨이 18 이하일때 최대생명력",
                value: 8,
            },
        ],
    },
    하드: {
        name: "하드",
        stats: [
            {
                type: "레벨이 25 이상일때 솜씨",
                value: 3,
            },
            {
                type: "레벨이 5 이상일때 체력",
                value: 1,
            },
            {
                type: "레벨이 18 이하일때 최대생명력",
                value: 8,
            },
        ],
    },
    동키: {
        name: "동키",
        stats: [
            {
                type: "최대대미지",
                min: 1,
                max: 4,
            },
            {
                type: "최소대미지",
                min: 1,
                max: 2,
            },
        ],
    },
    동키헌터: {
        name: "동키헌터",
        stats: [
            {
                type: "최대대미지",
                min: 4,
                max: 6,
            },
        ],
    },
    몽구스: {
        name: "몽구스",
        stats: [
            {
                type: "탐험 레벨이 3 이상일때 최대대미지",
                value: 2,
            },
            {
                type: "탐험 레벨이 6 이하일때 최대대미지",
                value: 2,
            },
            {
                type: "보호",
                value: 1,
            },
        ],
    },
    미스트: {
        name: "미스트",
        stats: [
            {
                type: "레벨이 5 이하일때 체력",
                value: 2,
            },
            {
                type: "레벨이 25 이상일때 최대생명력",
                value: 8,
            },
        ],
    },
    반달곰: {
        name: "반달곰",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 C 이상일 때 크리티컬",
                value: 2,
            },
            {
                type: "최대마나",
                value: 3,
            },
        ],
    },
    불안한: {
        name: "불안한",
        stats: [
            {
                type: "레벨이 13 이상일때 밸런스",
                value: 5,
            },
            {
                type: "크리티컬 히트 랭크 E 이상일 때 체력",
                value: 2,
            },
            {
                type: "크리티컬",
                value: 4,
            },
        ],
    },
    숲의: {
        name: "숲의",
        stats: [
            {
                type: "스매시 랭크 E 이상일 때 최소대미지",
                value: 2,
            },
            {
                type: "최대스태미나",
                value: 4,
            },
        ],
    },
    양치기의: {
        name: "양치기의",
        stats: [
            {
                type: "레벨이 15 이하일때 체력",
                value: 5,
            },
            {
                type: "레벨이 10 이상일때 최대생명력",
                value: 3,
            },
            {
                type: "레벨이 5 이상일때 최대스태미나",
                value: 3,
            },
        ],
    },
    "펠리컨 서머너": {
        name: "펠리컨 서머너",
        stats: [
            {
                type: "최소 부상률",
                min: 2,
                max: 3,
            },
        ],
    },
    "펠리컨 슬레이어": {
        name: "펠리컨 슬레이어",
        stats: [
            {
                type: "최대 부상률",
                min: 4,
                max: 6,
            },
        ],
    },
    편안한: {
        name: "편안한",
        stats: [
            {
                type: "레벨이 25 이상일때 최대스태미나",
                value: 3,
            },
            {
                type: "레벨이 15 이상일때 행운",
                value: 3,
            },
            {
                type: "레벨이 5 이상일때 의지",
                value: 1,
            },
        ],
    },
    플라밍고: {
        name: "플라밍고",
        stats: [
            {
                type: "최대 부상률",
                min: 1,
                max: 2,
            },
            {
                type: "최소 부상률",
                value: 1,
            },
        ],
    },
    하이에나: {
        name: "하이에나",
        stats: [
            {
                type: "레벨이 5 이상일때 최대생명력",
                value: 2,
            },
            {
                type: "레벨이 15 이상일때 최대스태미나",
                value: 2,
            },
        ],
    },
    협곡의: {
        name: "협곡의",
        stats: [
            {
                type: "스매시 랭크 F 이상일 때 최소대미지",
                value: 1,
            },
            {
                type: "최대스태미나",
                value: 2,
            },
        ],
    },
    낡은: {
        name: "낡은",
        stats: [
            {
                type: "크리티컬",
                value: 1,
            },
        ],
    },
    올드: {
        name: "올드",
        stats: [
            {
                type: "크리티컬",
                value: 1,
            },
        ],
    },
    동키테이머: {
        name: "동키테이머",
        stats: [
            {
                type: "최소대미지",
                min: 2,
                max: 3,
            },
        ],
    },
    래빗: {
        name: "래빗",
        stats: [
            {
                type: "레벨이 3 이상일때 최대생명력",
                value: 1,
            },
            {
                type: "레벨이 10 이상일때 최대스태미나",
                value: 1,
            },
        ],
    },
    석고: {
        name: "석고",
        stats: [
            {
                type: "탐험 레벨이 3 이상일때 최대대미지",
                value: 2,
            },
            {
                type: "레벨이 5 이하일때 크리티컬",
                value: 1,
            },
            {
                type: "의지",
                value: 5,
            },
        ],
    },
    소박한: {
        name: "소박한",
        stats: [
            {
                type: "솜씨",
                value: 3,
            },
            {
                type: "방직 랭크 E 이상일 때 최대스태미나",
                value: 6,
            },
        ],
    },
    아트리스: {
        name: "아트리스",
        stats: [
            {
                type: "솜씨",
                value: 3,
            },
            {
                type: "방직 랭크 E 이상일 때 최대스태미나",
                value: 6,
            },
        ],
    },
    스네이크헌터: {
        name: "스네이크헌터",
        stats: [
            {
                type: "최대대미지",
                min: 1,
                max: 2,
            },
        ],
    },
    스완: {
        name: "스완",
        stats: [
            {
                type: "레벨이 5 이상일때 최소 부상률",
                value: 1,
            },
            {
                type: "레벨이 5 이상일때 최대 부상률",
                min: 1,
                max: 2,
            },
        ],
    },
    "스완 슬레이어": {
        name: "스완 슬레이어",
        stats: [
            {
                type: "레벨이 6 이상일때 최대 부상률",
                min: 2,
                max: 4,
            },
        ],
    },
    야생마: {
        name: "야생마",
        stats: [
            {
                type: "컴뱃 마스터리 랭크 F 이상일 때 크리티컬",
                value: 1,
            },
            {
                type: "최대마나",
                value: 1,
            },
        ],
    },
    정교한: {
        name: "정교한",
        stats: [
            {
                type: "레벨이 4 이상일때 크리티컬",
                value: 1,
            },
        ],
    },
    파인: {
        name: "파인",
        stats: [
            {
                type: "레벨이 4 이상일때 크리티컬",
                value: 1,
            },
        ],
    },
    초록의: {
        name: "초록의",
        stats: [
            {
                type: "솜씨",
                value: 1,
            },
            {
                type: "의지",
                value: 1,
            },
        ],
    },
    초보의: {
        name: "초보의",
        stats: [
            {
                type: "레벨이 5 이하일때 최대생명력",
                value: 3,
            },
            {
                type: "레벨이 5 이하일때 체력",
                value: 1,
            },
        ],
    },
    비기너의: {
        name: "비기너의",
        stats: [
            {
                type: "레벨이 5 이하일때 최대생명력",
                value: 3,
            },
            {
                type: "레벨이 5 이하일때 체력",
                value: 1,
            },
        ],
    },
    키위: {
        name: "키위",
        stats: [
            {
                type: "탐험 레벨이 4 이상일때 크리티컬",
                value: 3,
            },
            {
                type: "최소 부상률",
                value: 1,
            },
            {
                type: "최대 부상률",
                value: 5,
            },
        ],
    },
    평원의: {
        name: "평원의",
        stats: [
            {
                type: "디펜스 랭크 F 이상일 때 밸런스",
                value: 1,
            },
            {
                type: "최대생명력",
                value: 5,
            },
        ],
    },
    "플라밍고 슬레이어": {
        name: "플라밍고 슬레이어",
        stats: [
            {
                type: "최소 부상률",
                min: 2,
                max: 4,
            },
        ],
    },
    "플라밍고 서머너": {
        name: "플라밍고 서머너",
        stats: [
            {
                type: "최소 부상률",
                min: 1,
                max: 2,
            },
        ],
    },
    하이에나테이머: {
        name: "하이에나테이머",
        stats: [
            {
                type: "최소대미지",
                min: 1,
                max: 2,
            },
        ],
    },
    하이에나헌터: {
        name: "하이에나헌터",
        stats: [
            {
                type: "최대대미지",
                min: 2,
                max: 4,
            },
        ],
    },
    치료의: {
        name: "치료의",
        stats: [
            {
                type: "힐링 랭크 9 이상일 때 지력",
                value: 16,
            },
            {
                type: "레벨이 30 이상일때 최대마나",
                value: 12,
            },
            {
                type: "레벨이 15 이상일때 밸런스",
                value: 8,
            },
        ],
    },
    혼돈의: {
        name: "혼돈의",
        stats: [
            {
                type: "레벨이 10 이상일때 지력",
                value: 4,
            },
            {
                type: "레벨이 20 이하일때 최대마나",
                value: 10,
            },
            {
                type: "레벨이 30 이상일때 최대마나",
                value: 30,
            },
        ],
    },
    거센: {
        name: "거센",
        stats: [
            {
                type: "라이트닝볼트 랭크 A 이상일 때 솜씨",
                value: 10,
            },
            {
                type: "스매시 랭크 9 이상일 때 최대 부상률",
                value: 10,
            },
            {
                type: "크리티컬",
                value: 10,
            },
        ],
    },
    럭셔리한: {
        name: "럭셔리한",
        stats: [
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "의지",
                value: 5,
            },
            {
                type: "행운",
                value: 15,
            },
            {
                type: "최대생명력",
                value: 7,
            },
        ],
    },
    명예로운: {
        name: "명예로운",
        stats: [
            {
                type: "레벨이 20 이상일때 체력",
                value: 11,
            },
            {
                type: "레벨이 15 이상일때 최대스태미나",
                value: 3,
            },
            {
                type: "아이스볼트 랭크 9 이상일 때 지력",
                value: 12,
            },
        ],
    },
    페이머스: {
        name: "페이머스",
        stats: [
            {
                type: "레벨이 20 이상일때 체력",
                value: 11,
            },
            {
                type: "레벨이 15 이상일때 최대스태미나",
                value: 3,
            },
            {
                type: "아이스볼트 랭크 9 이상일 때 지력",
                value: 12,
            },
        ],
    },
    비싸보이는: {
        name: "비싸보이는",
        stats: [
            {
                type: "방어",
                value: 2,
            },
            {
                type: "체력",
                value: 5,
            },
            {
                type: "솜씨",
                value: 5,
            },
        ],
    },
    신기루: {
        name: "신기루",
        stats: [
            {
                type: "론가사막 유적을 발견한 타이틀을 달고 있을때 방어",
                value: 6,
            },
            {
                type: "론가사막 유적을 발견한 타이틀을 달고 있을때 최소대미지",
                value: 4,
            },
            {
                type: "론가사막 유적을 발견한 타이틀을 달고 있을때 최대대미지",
                value: 8,
            },
            {
                type: "행운",
                value: 10,
            },
        ],
    },
    신중한: {
        name: "신중한",
        stats: [
            {
                type: "최대생명력",
                value: 30,
            },
            {
                type: "최대스태미나",
                value: 30,
            },
            {
                type: "디펜스 랭크 7 이상일 때 최소대미지",
                value: 4,
            },
            {
                type: "디펜스 랭크 C 이상일 때 최대대미지",
                value: 4,
            },
        ],
    },
    "은 여우": {
        name: "은 여우",
        stats: [
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "아이 오브 오더 랭크 A 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "스피릿 오브 오더 랭크 A 이상일 때 최소대미지",
                value: 2,
            },
        ],
    },
    실버폭스: {
        name: "실버폭스",
        stats: [
            {
                type: "솜씨",
                value: 20,
            },
            {
                type: "아이 오브 오더 랭크 A 이상일 때 최대대미지",
                value: 6,
            },
            {
                type: "스피릿 오브 오더 랭크 A 이상일 때 최소대미지",
                value: 2,
            },
        ],
    },
    이상한: {
        name: "이상한",
        stats: [
            {
                type: "윈드밀 랭크 9 이상일 때 최대 부상률",
                value: 9,
            },
            {
                type: "크리티컬",
                value: 3,
            },
        ],
    },
    인큐버스: {
        name: "인큐버스",
        stats: [
            {
                type: "행운",
                value: 20,
            },
            {
                type: "디펜스 랭크 1 이상일 때 최소대미지",
                value: 6,
            },
            {
                type: "디펜스 마스터 타이틀을 달고 있을때 최대대미지",
                value: 12,
            },
            {
                type: "밸런스",
                value: 5,
            },
        ],
    },
    감춰진: {
        name: "감춰진",
        stats: [
            {
                type: "방직 랭크 B 이상일 때 솜씨",
                min: 2,
                max: 4,
            },
            {
                type: "블랙스미스 랭크 B 이상일 때 최대스태미나",
                min: 2,
                max: 4,
            },
            {
                type: "체력",
                value: 5,
            },
        ],
    },
    히든: {
        name: "히든",
        stats: [
            {
                type: "방직 랭크 B 이상일 때 솜씨",
                min: 2,
                max: 4,
            },
            {
                type: "블랙스미스 랭크 B 이상일 때 최대스태미나",
                min: 2,
                max: 4,
            },
            {
                type: "체력",
                value: 5,
            },
        ],
    },
    강의: {
        name: "강의",
        stats: [
            {
                type: "스매시 랭크 D 이상일 때 최소대미지",
                value: 3,
            },
            {
                type: "최대스태미나",
                value: 6,
            },
        ],
    },
    광택나는: {
        name: "광택나는",
        stats: [
            {
                type: "최대생명력",
                value: 5,
            },
            {
                type: "지력",
                value: 5,
            },
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "행운",
                value: 5,
            },
        ],
    },
    근사한: {
        name: "근사한",
        stats: [
            {
                type: "아이스볼트 랭크 A 이상일 때 체력",
                value: 10,
            },
            {
                type: "레벨이 28 이상일때 최대스태미나",
                value: 8,
            },
            {
                type: "레벨이 20 이하일때 최대 부상률",
                value: 5,
            },
        ],
    },
    "잘 다듬어진": {
        name: "잘 다듬어진",
        stats: [
            {
                type: "최대생명력",
                value: 12,
            },
            {
                type: "최대대미지",
                value: 2,
            },
        ],
    },
    완고한: {
        name: "완고한",
        stats: [
            {
                type: "레벨이 6 이상일때 밸런스",
                value: 5,
            },
            {
                type: "레벨이 18 이상일때 크리티컬",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 20,
            },
            {
                type: "최대스태미나",
                value: 20,
            },
        ],
    },
    비밀의: {
        name: "비밀의",
        stats: [
            {
                type: "밸런스",
                value: 5,
            },
            {
                type: "크리티컬",
                value: 5,
            },
            {
                type: "메이즈 평원 유적을 발견한 타이틀을 달고 있을때 최소대미지",
                value: 6,
            },
            {
                type: "메이즈 평원 유적을 발견한 타이틀을 달고 있을때 최대대미지",
                value: 6,
            },
        ],
    },
    "데미 리치": {
        name: "데미 리치",
        stats: [
            {
                type: "최대생명력",
                value: 100,
            },
            {
                type: "레벨이 30 이상일때 최대대미지",
                value: 20,
            },
            {
                type: "레벨이 40 이하일때 최소대미지",
                value: 10,
            },
        ],
    },
    낯선: {
        name: "낯선",
        stats: [
            {
                type: "탐험 레벨이 1 이상일때 최소대미지",
                value: 4,
            },
            {
                type: "탐험 레벨이 5 이상일때 최대대미지",
                value: 4,
            },
            {
                type: "카루 숲 유적을 발견한 타이틀을 달고 있을때 크리티컬",
                value: 10,
            },
            {
                type: "방어",
                value: 5,
            },
        ],
    },
    화려한: {
        name: "화려한",
        stats: [
            {
                type: "방어",
                value: 1,
            },
            {
                type: "의지",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 12,
            },
        ],
    },
    아름다운: {
        name: "아름다운",
        stats: [
            {
                type: "행운",
                value: 5,
            },
            {
                type: "최대생명력",
                value: 15,
            },
        ],
    },
    성스러운: {
        name: "성스러운",
        stats: [
            {
                type: "최대생명력",
                value: 15,
            },
            {
                type: "의지",
                value: 5,
            },
        ],
    },
    파멸의: {
        name: "파멸의",
        stats: [
            {
                type: "최대생명력",
                value: 30,
            },
            {
                type: "체력",
                value: 15,
            },
            {
                type: "최대 부상률",
                value: 30,
            },
        ],
    },
    기초의: {
        name: "기초의",
        stats: [
            {
                type: "체력",
                value: 5,
            },
            {
                type: "지력",
                value: 20,
            },
            {
                type: "의지",
                value: 20,
            },
            {
                type: "컴뱃 마스터 타이틀을 달고 있을때 최대대미지",
                value: 15,
            },
            {
                type: "메이즈 평원 유적을 발견한 타이틀을 달고 있을때 최대대미지",
                value: 5,
            },
        ],
    },
    유니온: {
        name: "유니온",
        stats: [
            {
                type: "나이가 16 이상일때 최대대미지",
                value: 4,
            },
            {
                type: "나이가 20 이하일때 최대대미지",
                value: 4,
            },
            {
                type: "최소대미지",
                value: 4,
            },
            {
                type: "크리티컬",
                value: 5,
            },
        ],
    },
    원리의: {
        name: "원리의",
        stats: [
            {
                type: "체력",
                value: 5,
            },
            {
                type: "지력",
                value: 5,
            },
            {
                type: "솜씨",
                value: 5,
            },
            {
                type: "크리티컬 히트 마스터 타이틀을 달고 있을때 크리티컬",
                value: 16,
            },
            {
                type: "메이즈 평원 유적을 발견한 타이틀을 달고 있을때 크리티컬",
                value: 6,
            },
        ],
    },
    스테이지: {
        name: "스테이지",
        stats: [
            {
                type: "솜씨",
                value: 10,
            },
            {
                type: "불화살 타이틀을 달고 있을때 최대대미지",
                value: 10,
            },
            {
                type: "초보 엘레멘탈 마스터 타이틀을 달고 있을때 밸런스",
                value: 10,
            },
        ],
    },
    변덕스러운: {
        name: "변덕스러운",
        stats: [
            {
                type: "지력",
                value: 10,
            },
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "근면한 타이틀을 달고 있을때 밸런스",
                value: 10,
            },
            {
                type: "땡땡이치는 타이틀을 달고 있을때 크리티컬",
                value: 10,
            },
        ],
    },
    피클: {
        name: "피클",
        stats: [
            {
                type: "지력",
                value: 10,
            },
            {
                type: "최대마나",
                value: 10,
            },
            {
                type: "근면한 타이틀을 달고 있을때 밸런스",
                value: 10,
            },
            {
                type: "땡땡이치는 타이틀을 달고 있을때 크리티컬",
                value: 10,
            },
        ],
    },
    규칙의: {
        name: "규칙의",
        stats: [
            {
                type: "최대스태미나",
                value: 20,
            },
            {
                type: "의지",
                value: 10,
            },
            {
                type: "행운",
                value: 10,
            },
            {
                type: "힐링 마스터 타이틀을 달고 있을때 밸런스",
                value: 12,
            },
            {
                type: "메이즈 평원 유적을 발견한 타이틀을 달고 있을때 밸런스",
                value: 6,
            },
        ],
    },
    해빗: {
        name: "해빗",
        stats: [
            {
                type: "체력",
                value: 20,
            },
            {
                type: "헝그리한 타이틀을 달고 있을때 최대대미지",
                value: 12,
            },
            {
                type: "럭셔리한 타이틀을 달고 있을때 크리티컬",
                value: 10,
            },
        ],
    },
    위대한: {
        name: "위대한",
        stats: [
            {
                type: "레벨이 70 이상일때 밸런스",
                min: 7,
                max: 9,
            },
        ],
    },
    그레이트: {
        name: "그레이트",
        stats: [
            {
                type: "레벨이 70 이상일때 밸런스",
                min: 7,
                max: 9,
            },
        ],
    },
    반시: {
        name: "반시",
        stats: [
            {
                type: "나이가 14 이상일때 최소대미지",
                value: 6,
            },
            {
                type: "나이가 20 이하일때 최대대미지",
                value: 12,
            },
            {
                type: "레벨이 20 이상일때 최대생명력",
                value: 100,
            },
        ],
    },
    완벽한: {
        name: "완벽한",
        stats: [
            {
                type: "레벨이 101 이상일때 밸런스",
                min: 9,
                max: 11,
            },
        ],
    },
    퍼펙트: {
        name: "퍼펙트",
        stats: [
            {
                type: "레벨이 101 이상일때 밸런스",
                min: 9,
                max: 11,
            },
        ],
    },
    코볼트: {
        name: "코볼트",
        stats: [
            {
                type: "레벨이 25 이상일때 솜씨",
                value: 3,
            },
            {
                type: "레벨이 10 이하일때 최대대미지",
                value: 2,
            },
        ],
    },
    폭스: {
        name: "폭스",
        stats: [
            {
                type: "레벨이 14 이상일때 최대대미지",
                min: 1,
                max: 4,
            },
            {
                type: "레벨이 14 이상일때 최소대미지",
                min: 1,
                max: 2,
            },
        ],
    },
    암흑: {
        name: "암흑",
        stats: [
            {
                type: "방어",
                value: 3,
            },
            {
                type: "의지",
                value: 5,
            },
            {
                type: "레벨이 30 이상일때 최대대미지",
                min: 5,
                max: 15,
            },
        ],
    },
    폭스헌터: {
        name: "폭스헌터",
        stats: [
            {
                type: "레벨이 3 이상일때 최대대미지",
                min: 2,
                max: 4,
            },
        ],
    },
    직장인의: {
        name: "직장인의",
        stats: [
            {
                type: "딴짓하다 걸림 상태일때 최대생명력",
                value: 100,
            },
            {
                type: "월급날 상태일때 의지",
                value: 50,
            },
            {
                type: "야근 상태일때 밸런스",
                value: 18,
            },
            {
                type: "야근 상태일때 체력",
                min: 100,
                max: 200,
            },
            {
                type: "어제 밤샌 타이틀을 달고 있을때 최대스태미나",
                value: 500,
            },
            {
                type: "지각 상태일때 골드",
                value: 5000,
            },
        ],
    },
    비지니스맨: {
        name: "비지니스맨",
        stats: [
            {
                type: "딴짓하다 걸림 상태일때 최대생명력",
                value: 100,
            },
            {
                type: "월급날 상태일때 의지",
                value: 50,
            },
            {
                type: "야근 상태일때 밸런스",
                value: 18,
            },
            {
                type: "야근 상태일때 체력",
                min: 100,
                max: 200,
            },
            {
                type: "어제 밤샌 타이틀을 달고 있을때 최대스태미나",
                value: 500,
            },
            {
                type: "지각 상태일때 골드",
                value: 5000,
            },
        ],
    },
};
