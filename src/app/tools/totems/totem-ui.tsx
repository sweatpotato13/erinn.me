import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";

import {
    formatAuctionDateTime,
    formatAuctionNumber,
} from "@/lib/auction-market";
import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    formatTotemValue,
    knownTotemStat,
    positiveTotemGold,
    type Totem,
    TOTEM_STATS,
    totemBudgetState,
    totemBundleTotal,
    totemEffectKeys,
    type TotemEvaluation,
    type TotemRoll,
    totemStatLabel,
    totemValue,
} from "@/lib/totems";
import { candidateTotemPrice, type TotemCandidate } from "@/lib/totems-state";

import s from "./totem-tool.module.css";

export function TotemIcon({ item }: { item: Totem }) {
    const [failed, setFailed] = useState<number | null>(null);
    return (
        <span className={s.icon}>
            {failed === item.id ? (
                <span aria-label="아이콘 없음">◇</span>
            ) : (
                <Image
                    unoptimized
                    src={`/api/item-image?id=${item.id}`}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    onError={() => setFailed(item.id)}
                />
            )}
        </span>
    );
}
export function TotemBadges({ item }: { item: Totem }) {
    return (
        <span className={s.badges}>
            <span className={s.badge}>
                {item.isExtra ? "엑스트라" : "일반"}
            </span>
            <span className={s.badge}>{item.isPet ? "펫" : "캐릭터"}</span>
            {!Object.keys(item.ranges).length && (
                <span className={s.badge}>옵션 범위 정보 없음</span>
            )}
        </span>
    );
}
export function TotemAuctionLink({ name }: { name: string }) {
    return (
        <Link prefetch={false} href={getAuctionSearchPath(name)}>
            경매장 검색
        </Link>
    );
}
export function totemTime(value: string): string {
    return Number.isFinite(Date.parse(value))
        ? formatAuctionDateTime(value)
        : "시각 미확인";
}
export function totemGoldText(value: unknown): string {
    const price = positiveTotemGold(value);
    return price === null
        ? "가격 미확인"
        : `${formatAuctionNumber(price)} 골드`;
}
export function TotemRangeList({ item }: { item: Totem }) {
    return (
        <dl className={s.statList}>
            {totemEffectKeys(item).map(key => (
                <div key={key}>
                    <dt>{totemStatLabel(key)}</dt>
                    <dd>
                        {item.ranges[key]
                            ? item.ranges[key].min === item.ranges[key].max
                                ? `고정 수치 ${formatTotemValue(key, item.ranges[key].max)}`
                                : `${formatTotemValue(key, item.ranges[key].min)} ~ ${formatTotemValue(key, item.ranges[key].max)}`
                            : "옵션 범위 정보 없음"}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
export function TotemInputs({
    item,
    values,
    onChange,
    label,
}: {
    item: Totem;
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    label: string;
}) {
    const id = useId();
    const keys = totemEffectKeys(item).filter(knownTotemStat);
    return (
        <div className={s.inputs}>
            {keys.length ? (
                keys.map(key => {
                    const raw = values[key] ?? "";
                    const invalid =
                        !!raw.trim() && totemValue(key, raw) === null;
                    const range = item.ranges[key];
                    return (
                        <div key={key}>
                            <label htmlFor={`${id}-${key}`}>
                                {label} {totemStatLabel(key)}
                                {TOTEM_STATS[key].unit &&
                                    ` (${TOTEM_STATS[key].unit})`}
                                <input
                                    id={`${id}-${key}`}
                                    inputMode="decimal"
                                    maxLength={64}
                                    value={raw}
                                    onChange={e =>
                                        onChange(key, e.target.value)
                                    }
                                    placeholder="실제 수치 입력"
                                    aria-invalid={invalid}
                                    aria-describedby={`${id}-${key}-help`}
                                />
                            </label>
                            <span
                                id={`${id}-${key}-help`}
                                className={invalid ? s.loss : s.muted}
                            >
                                {invalid
                                    ? "옵션값 확인 필요: 단위에 맞는 숫자를 입력해 주세요."
                                    : range
                                      ? `참고 ${formatTotemValue(key, range.min)} ~ ${formatTotemValue(key, range.max)}`
                                      : "참고 범위 없음 · 실제 값만 비교합니다."}
                            </span>
                        </div>
                    );
                })
            ) : (
                <p className={s.warning}>
                    이 종류는 수치 입력·교체 규칙을 확인하지 못했습니다. 아이템
                    설명과 실제 매물의 원문 옵션을 확인해 주세요.
                </p>
            )}
        </div>
    );
}
export function TotemEvaluationCell({
    evaluation: e,
}: {
    evaluation: TotemEvaluation;
}) {
    return (
        <div>
            <strong className={s.value}>
                {formatTotemValue(e.key, e.value)}
                {e.absent && " · 해당 효과 없음"}
            </strong>
            {e.range && (
                <p className={s.muted}>
                    범위 {formatTotemValue(e.key, e.range.min)} ~{" "}
                    {formatTotemValue(e.key, e.range.max)}
                </p>
            )}
            {e.rangeStatus === "fixed" && <p>고정 수치</p>}
            {e.rangeStatus === "outside" && (
                <p className={s.warning}>기준 범위와 다른 값입니다</p>
            )}
            {e.rangeStatus === "missing" && !e.absent && (
                <p className={s.muted}>옵션 범위 정보 없음</p>
            )}
            {e.rangeStatus === "unknown" && (
                <p className={s.warning}>옵션값 확인 필요</p>
            )}
            {e.rangeStatus === "ambiguous" && (
                <p className={s.warning}>동명이인 · 범위 확정 불가</p>
            )}
            {e.rangeStatus === "conflicting" && (
                <p className={s.warning}>원본과 다른 효과 · 범위 확정 불가</p>
            )}
            {e.gap !== null && (
                <p className={s.muted}>
                    {e.gap < 0
                        ? `최대보다 ${formatTotemValue(e.key, -e.gap, true).replace(/^\+/, "")} 높음`
                        : `최대까지 ${formatTotemValue(e.key, e.gap, true).replace(/^\+/, "")}`}
                </p>
            )}
            {e.position !== null && (
                <>
                    <p className={s.muted}>
                        범위 내 위치 {(e.position * 100).toFixed(1)}% · 확률
                        아님
                    </p>
                    <div className={s.rangeBar} aria-hidden="true">
                        <span style={{ width: `${e.position * 100}%` }} />
                    </div>
                </>
            )}
        </div>
    );
}

export function TotemEvidence({ roll }: { roll: TotemRoll }) {
    return (
        <>
            {roll.status === "missing" && (
                <p className={s.warning}>
                    원본 아이템을 찾지 못해 범위·교체 평가를 보류합니다.
                </p>
            )}
            {roll.status === "ambiguous" && (
                <p className={s.warning}>
                    이름이 같은 토템이 있어 옵션 범위를 확정할 수 없습니다. 변형
                    ID: {roll.matches.map(r => r.id).join(", ")}
                </p>
            )}
            {roll.status === "conflicting" && (
                <p className={s.warning}>
                    원본에 없는 효과가 있어 범위·교체 평가를 보류합니다.
                </p>
            )}
            {!!roll.duplicateKeys.length && (
                <p className={s.warning}>
                    같은 능력치가 여러 번 표기됨:{" "}
                    {roll.duplicateKeys.map(totemStatLabel).join(", ")}
                </p>
            )}
            {!!roll.unknownOptions.length && (
                <p className={s.warning}>
                    해석하지 못한 효과:{" "}
                    {roll.unknownOptions.map((o, i) => (
                        <span key={i}>
                            {o.option_sub_type ?? "종류 미확인"}{" "}
                            {o.option_value ?? "값 미확인"}
                            {i < roll.unknownOptions.length - 1 ? " / " : ""}
                        </span>
                    ))}{" "}
                    · 수치 평가 제외
                </p>
            )}
            <details>
                <summary>원본 옵션·설명</summary>
                {roll.rawOptions.length ? (
                    roll.rawOptions.map((o, index) => (
                        <div key={index} className={s.entry}>
                            <strong>
                                {o.option_type} ·{" "}
                                {o.option_sub_type ?? "하위 종류 없음"}
                            </strong>
                            <p>{o.option_value ?? "값 없음"}</p>
                            {o.option_value2 != null && (
                                <p>추가 값: {o.option_value2}</p>
                            )}
                            {o.option_desc != null && (
                                <p className={s.description}>{o.option_desc}</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p>실제 옵션 정보가 없습니다.</p>
                )}
                {roll.reference && (
                    <p className={s.description}>
                        {roll.reference.description}
                    </p>
                )}
                {roll.reference?.bonuses.some(
                    b =>
                        !knownTotemStat(b.StatName) &&
                        !["allstat", "stat_int"].includes(b.StatName)
                ) && (
                    <p>
                        원본 수치:{" "}
                        {roll.reference.bonuses
                            .map(b => `${b.StatName} ${b.Min}~${b.Max}`)
                            .join(" / ")}
                    </p>
                )}
            </details>
        </>
    );
}

export function TotemPrice({
    candidate,
    budget,
    historical = false,
}: {
    candidate: TotemCandidate;
    budget: number | null;
    historical?: boolean;
}) {
    const price = candidateTotemPrice(candidate);
    const budgetState = totemBudgetState(price, budget);
    const listing = candidate.kind === "listing" ? candidate : null;
    const total = listing
        ? totemBundleTotal(price, listing.item.item_count)
        : null;
    return (
        <div>
            <p>
                <strong className={s.value}>{totemGoldText(price)}</strong> / 개
                {historical ? " · 당시 등록 가격" : ""}
            </p>
            {listing && (
                <>
                    <p>
                        수량{" "}
                        {positiveTotemGold(listing.item.item_count) ?? "미확인"}
                        개 · 묶음 총액{" "}
                        {total === null
                            ? "미확인"
                            : `${BigInt(total).toLocaleString("ko-KR")} 골드`}
                    </p>
                    <p className={s.muted}>
                        {historical ? "공유된 당시 매물 · " : ""}
                        {totemTime(listing.observedAt)} 조회
                    </p>
                    <p className={s.muted}>
                        등록 종료 {totemTime(listing.item.date_auction_expire)}
                    </p>
                    {Date.parse(listing.item.date_auction_expire) <=
                        Date.now() && (
                        <p className={s.warning}>등록 종료 시각이 지난 매물</p>
                    )}
                </>
            )}
            {budgetState !== "unset" && (
                <p className={budgetState === "over" ? s.loss : s.muted}>
                    {budgetState === "unknown"
                        ? "개당 예산 판정 불가"
                        : budgetState === "over"
                          ? "개당 예산 초과"
                          : "개당 예산 이내"}
                </p>
            )}
        </div>
    );
}

export function candidateLabel(candidate: TotemCandidate): string {
    return candidate.kind === "listing"
        ? "실제 매물"
        : candidate.kind === "manual"
          ? "직접 입력"
          : candidate.assumeMaximum
            ? "최댓값 가정 · 실제 매물 아님"
            : "원본 범위 · 실제값 미입력";
}
