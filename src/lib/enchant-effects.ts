import { normalizeOptionText } from "./auction-options";

export interface EnchantEffect {
    type: string;
    condition: string;
    min: number;
    max: number;
    unit: string;
    direction: "증가" | "감소";
}

const aliases: Record<string, string> = {
    생명력: "최대생명력",
    마나: "최대마나",
    스태미나: "최대스태미나",
    최소공격력: "최소대미지",
    대미지밸런스: "밸런스",
    행운이: "행운",
    음악버프효과: "음악버프스킬효과",
    음악버프지속시간: "음악버프스킬지속시간",
    공격속도증가: "공격속도",
    모든속성연금술대미지: "4대속성연금술대미지",
    마리오네트생명력: "마리오네트최대생명력",
    마리오네트마법방어력: "마리오네트마법방어",
    생산물품질: "생산품품질",
    불속성대미지: "불속성연금술대미지",
    물속성대미지: "물속성연금술대미지",
    불속성공격대미지: "불속성연금술대미지",
    물속성공격대미지: "물속성연금술대미지",
    마리오네트크리티컬: "마리오네트조종술크리티컬",
};
const types = [
    "최대대미지",
    "최소대미지",
    "마법공격력",
    "체력",
    "지력",
    "솜씨",
    "의지",
    "행운",
    "최대생명력",
    "최대마나",
    "최대스태미나",
    "방어",
    "보호",
    "마법방어",
    "마법보호",
    "크리티컬",
    "밸런스",
    "최대부상률",
    "최소부상률",
    "피어싱레벨",
    "수리비",
    "마나소비감소",
    "스태미나소모",
    "공격속도",
    "음악버프스킬효과",
    "음악버프스킬지속시간",
    "4대속성연금술대미지",
    "불속성연금술대미지",
    "물속성연금술대미지",
    "흙속성연금술대미지",
    "바람속성연금술대미지",
    "불속성공격대미지",
    "물속성공격대미지",
    "불속성대미지",
    "물속성대미지",
    "마리오네트최대대미지",
    "마리오네트최소대미지",
    "마리오네트최대생명력",
    "마리오네트방어",
    "마리오네트보호",
    "마리오네트마법방어",
    "마리오네트크리티컬",
    "마리오네트조종술크리티컬",
    "결정제작성공률",
    "합성성공률",
    "분해성공률",
    "연금술생산성공률",
    "생산품품질",
    "폭발저항",
    "독면역",
    "스톰프저항",
    "교역품구매할인율",
    "신용도상승률",
    "프로즌블래스트동결시간",
    "프로즌블래스트적용범위",
    "방호벽내구",
    "시간왜곡쿨타임무시횟수",
    "초월:생명재사용대기시간초기화확률",
    "경계흔최대획득갯수",
    "상점판매가",
    ...Object.keys(aliases),
].sort((a, b) => b.length - a.length);
const percentageTypes = new Set([
    "크리티컬",
    "밸런스",
    "최대부상률",
    "최소부상률",
]);
const lowerIsBetter = new Set(["수리비", "스태미나소모"]);
const compact = (text: string) => normalizeOptionText(text).replace(/\s/g, "");

export function enchantDescriptionLines(text: string) {
    return text
        .replace(/\\n/g, "\n")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
}

export function parseEnchantEffect(text: string): EnchantEffect | null {
    const clean = normalizeOptionText(text)
        .replace(/^\[/, "")
        .replace(/\]$/, "");
    const match = clean.match(
        /^(.*?)\s*([+-]?\d+(?:\.\d+)?)(?:\s*~\s*([+-]?\d+(?:\.\d+)?))?\s*(%|초|만\s*Gold|Gold)?\s*(증가|감소)$/
    );
    if (!match) return null;
    const identity = compact(match[1]);
    const suffix = types.find(type => identity.endsWith(type));
    if (!suffix) return null;
    const condition = identity
        .slice(0, -suffix.length)
        .replace(/랭크가/g, "랭크")
        .replace(/레벨이(?=\d)/g, "레벨")
        .replace(/나이가(?=\d)/g, "나이")
        .replace(/일경우$/g, "일때")
        .replace(/([1-9A-F]|[1-3]단)랭크/g, "랭크$1")
        .replace(/랭크([1-3]단)/g, "$1")
        .replace(/타이틀을달고있을때/g, "타이틀사용중일때")
        .replace(/사용상태일때/g, "사용중일때")
        .replace(/나이(\d+)세/g, "나이$1")
        .replace(/(엘프|자이언트)이거나/g, "$1거나")
        .replace(/(엘프|자이언트)를지지/g, "$1지지")
        .replace(/^연속기:/, "");
    // ponytail: support plain condition predicates; new game-script forms stay text until verified.
    if (
        condition &&
        (!/(?:때|경우|시|당|교역중)$/.test(condition) ||
            /[\\[\]~]|증가|감소/.test(condition))
    )
        return null;
    const type = aliases[suffix] ?? suffix;
    const scale = match[4]?.startsWith("만") ? 10_000 : 1;
    const min = Number(match[2]) * scale;
    const max = Number(match[3] ?? match[2]) * scale;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max)
        return null;
    return {
        type,
        condition,
        min,
        max,
        unit: match[4]?.includes("Gold")
            ? "Gold"
            : (match[4] ?? (percentageTypes.has(type) ? "%" : "")),
        direction: match[5] as EnchantEffect["direction"],
    };
}

export function referenceEffects(description: string) {
    const effects: Array<{ text: string; effect: EnchantEffect }> = [];
    let pending = "";
    for (const line of enchantDescriptionLines(description)) {
        if (/(?:때|경우|시|당)$/.test(line)) {
            pending = line;
            continue;
        }
        if (line.startsWith("[") || parseEnchantEffect(line)?.condition)
            pending = "";
        const text = pending ? `${pending} ${line}` : line;
        const effect = parseEnchantEffect(text);
        if (effect) effects.push({ text, effect });
        if (!effect) pending = "";
    }
    return effects;
}

export function compareEnchantEffect(actualText: string, description: string) {
    const actual = parseEnchantEffect(actualText);
    if (!actual || actual.min !== actual.max) return null;
    const typeNames = types.filter(
        type => (aliases[type] ?? type) === actual.type
    );
    if (
        enchantDescriptionLines(description).some(
            line =>
                !/(?:때|경우|시|당)$/.test(line) &&
                !parseEnchantEffect(line) &&
                typeNames.some(type => compact(line).includes(type))
        )
    )
        return null;
    const compatible = referenceEffects(description).filter(
        ({ effect }) =>
            effect.type === actual.type &&
            effect.unit === actual.unit &&
            effect.direction === actual.direction &&
            (!actual.condition || effect.condition === actual.condition)
    );
    if (compatible.length !== 1) return null;
    const { effect, text } = compatible[0];
    if (effect.min === effect.max) return null;
    const sign = actual.direction === "감소" ? -1 : 1;
    const benefitSign = lowerIsBetter.has(actual.type) ? -sign : sign;
    const best = benefitSign > 0 ? effect.max : effect.min;
    return {
        difference: Number(((actual.min - best) * benefitSign).toFixed(10)),
        best,
        unit: effect.unit,
        outsideRange: actual.min < effect.min || actual.min > effect.max,
        referenceText: text,
    };
}
