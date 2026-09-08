import type { ReactElement } from "react";

import {
    basketCost,
    benefitCost,
    effectLabel,
    marketGold,
    type Miniature,
    MINIATURE_EFFECTS,
    type MiniatureBasketCost,
    type MiniatureDelta,
    miniatureDelta,
    miniatureNumber,
    type MiniatureReference,
} from "@/lib/miniatures";

import type {
    MiniatureCandidates,
    MiniatureInstallations,
    MiniaturePrices,
    MiniatureQuote,
} from "./miniature-hooks";
import {
    Auction,
    EffectChange,
    Effects,
    Icon,
    styles,
    typeName,
} from "./miniature-ui";

interface ComparisonProps {
    data: MiniatureReference;
    installations: MiniatureInstallations;
    candidates: MiniatureCandidates;
    prices: MiniaturePrices;
}
interface CandidatePriceProps {
    item: Miniature;
    candidates: MiniatureCandidates;
    prices: MiniaturePrices;
}
function setManualPrice(
    candidates: MiniatureCandidates,
    item: Miniature,
    value?: string
): void {
    candidates.setConfig(c => ({
        ...c,
        manualPrices:
            value === undefined
                ? Object.fromEntries(
                      Object.entries(c.manualPrices).filter(
                          ([key]) => key !== String(item.itemId)
                      )
                  )
                : { ...c.manualPrices, [item.itemId]: value },
    }));
}
function PriceInput({
    item,
    candidates,
    prices,
}: CandidatePriceProps): ReactElement {
    const manual = candidates.config.manualPrices[item.itemId];
    const invalid =
        manual !== undefined && manual !== "" && prices.price(item) === null;
    return (
        <>
            <label>
                가격 (Gold)
                <input
                    aria-label={`${item.name} 가격 (Gold)`}
                    inputMode="numeric"
                    maxLength={16}
                    aria-invalid={invalid}
                    value={manual ?? marketGold(prices.quote(item)?.data) ?? ""}
                    onChange={e =>
                        setManualPrice(candidates, item, e.target.value)
                    }
                />
            </label>
            {manual !== undefined && (
                <>
                    <p>
                        {invalid
                            ? "가격은 안전한 범위의 0 이상 정수로 입력하세요."
                            : "수정한 가격"}
                    </p>
                    <button onClick={() => setManualPrice(candidates, item)}>
                        조회 가격 사용
                    </button>
                </>
            )}
        </>
    );
}
function efficiencyText(
    stat: string,
    price: number | null,
    gain: number
): string {
    const ratio = benefitCost(price, gain);
    if (ratio !== null)
        return `${effectLabel(stat)} 1${MINIATURE_EFFECTS[stat].unit === "%" ? "%p" : "포인트"}당 ${miniatureNumber(ratio)} Gold`;
    if (gain <= 0) return "추가 효과 없음 · 효율 계산 제외";
    if (price === 0) return "0 Gold · 효율 계산 제외";
    return "가격 확인 후 효율 계산";
}
function MarketQuote({
    quote,
}: {
    quote: MiniatureQuote | undefined;
}): ReactElement {
    const data = quote?.data;
    return (
        <>
            {quote?.isFetching && <p role="status">가격 조회 중…</p>}
            {data && (
                <p>
                    최저 개당 가격{" "}
                    {marketGold(data) === null
                        ? "매물 가격 없음"
                        : `${miniatureNumber(data.minPrice)} Gold`}{" "}
                    · 수량 {miniatureNumber(data.availableQuantity)} ·{" "}
                    {data.fetchedAt
                        ? `조회 시각 ${new Date(data.fetchedAt).toLocaleString("ko-KR")}`
                        : "조회 시각 확인 불가"}{" "}
                    ·{" "}
                    {data.isComplete
                        ? "전체 조회"
                        : "일부 조회 · 조회된 페이지 기준"}
                </p>
            )}
            {quote?.isError && (
                <p role="alert">
                    가격 조회 실패. 가격 조회 버튼으로 다시 시도하세요.
                    {data && " 이전 조회 가격을 표시합니다."}
                </p>
            )}
        </>
    );
}
function CandidatePrice(
    props: CandidatePriceProps & { change: MiniatureDelta }
): ReactElement {
    const { item, candidates, prices, change } = props;
    const price = prices.price(item);
    const stat = candidates.config.targetStat;
    return (
        <>
            <PriceInput {...props} />
            <p>
                {price === null
                    ? "가격 미확인"
                    : `${miniatureNumber(price)} Gold`}
            </p>
            {stat !== "all" && (
                <p>{efficiencyText(stat, price, change.delta[stat])}</p>
            )}
            <MarketQuote quote={prices.quote(item)} />
        </>
    );
}
function CandidateEffects({
    item,
    change,
}: {
    item: Miniature;
    change: MiniatureDelta;
}): ReactElement {
    return (
        <dl>
            {Object.keys(item.effects).map(key => (
                <div key={key}>
                    <dt>{effectLabel(key)}</dt>
                    <dd>
                        <EffectChange stat={key} change={change} />
                    </dd>
                </div>
            ))}
        </dl>
    );
}
function CandidateCard({
    item,
    ...props
}: ComparisonProps & { item: Miniature }): ReactElement {
    const { data, installations, candidates } = props;
    const change = miniatureDelta(data.miniatures, installations.installed, [
        item.id,
    ]);
    return (
        <article className={styles.entry} aria-label={`${item.name} 가격 비교`}>
            <div className={styles.row}>
                <Icon item={item} />
                <h3>{item.name}</h3>
            </div>
            <p>
                {typeName(item)} ·{" "}
                {installations.installed.includes(item.id)
                    ? "설치 중"
                    : "미설치"}
            </p>
            <CandidateEffects item={item} change={change} />
            <CandidatePrice item={item} {...props} change={change} />
            <Auction item={item} />
            <Effects item={item} />
            <button
                aria-label={`${item.name} 비교 제거`}
                onClick={() => candidates.remove(item.id)}
            >
                비교 제거
            </button>
        </article>
    );
}
export function CandidateComparison(props: ComparisonProps): ReactElement {
    const { candidates, prices } = props;
    return (
        <section className={styles.panel} aria-label="구매 후보 비교">
            <h2>구매 후보 비교 · {candidates.selected.length} / 4</h2>
            <p>구매를 검토하는 후보입니다. 설치 현황에는 반영되지 않습니다.</p>
            <div className={styles.comparison}>
                {candidates.selected.map(item => (
                    <CandidateCard key={item.id} item={item} {...props} />
                ))}
            </div>
            <div className={styles.controls}>
                <button onClick={() => candidates.remove()}>전체 해제</button>
                <button
                    onClick={() => void prices.lookup()}
                    disabled={prices.fetching || !prices.canLookup}
                >
                    {prices.fetching ? "가격 조회 중…" : "가격 조회"}
                </button>
            </div>
        </section>
    );
}
function basketPriceText(cost: MiniatureBasketCost, count: number): string {
    if (!count) return "가격 미조회";
    if (cost.missing === count)
        return `가격 미조회 · 총액 미완성 (${cost.missing}개 가격 미확인)`;
    if (cost.subtotal === null)
        return "가격 합계가 안전한 계산 범위를 넘습니다.";
    return `알려진 가격 ${miniatureNumber(cost.subtotal)} Gold${cost.missing ? ` · 총액 미완성 (${cost.missing}개 가격 미확인)` : " · 전체 후보 합계"}`;
}
export function BasketSummary({
    change,
    candidates,
    prices,
}: Pick<ComparisonProps, "candidates" | "prices"> & {
    change: MiniatureDelta;
}): ReactElement {
    const stat = candidates.config.targetStat;
    const relevant = Object.keys(MINIATURE_EFFECTS).filter(
        key => change.before.total[key] || change.after.total[key]
    );
    const cost = basketCost(candidates.selected.map(prices.price));
    return (
        <section className={styles.panel} aria-label="함께 설치하면">
            <h2>함께 설치하면</h2>
            {(stat === "all" ? relevant : [stat]).map(key => (
                <p className={styles.value} key={key}>
                    {effectLabel(key)}{" "}
                    <EffectChange stat={key} change={change} />
                </p>
            ))}
            <p>{basketPriceText(cost, candidates.selected.length)}</p>
            <p>
                후보 전체를 함께 설치했을 때의 증가량입니다. 개별 증가량을
                더하지 않습니다.
            </p>
        </section>
    );
}
