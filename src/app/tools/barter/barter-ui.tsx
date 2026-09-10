"use client";

import { Minus, Package, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import reference from "@/data/barter-reference.json";
import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    type BarterMaterial,
    type BarterMaterialTotal,
    type BarterRow,
    goodIssue,
    parseBarterInteger,
    rowIssue,
    seoulDateInput,
} from "@/lib/barter";
import { type BarterPlan } from "@/lib/barter-state";
import { getItemImageUrl } from "@/lib/utils";

import s from "./barter-tool.module.css";

const localIcons = new Set(reference.materials.map(m => m.id));
export function MaterialIcon({ id, name }: { id: number; name?: string }) {
    const [failed, setFailed] = useState(false);
    const src = localIcons.has(id)
        ? `/images/barter/${id}.png`
        : name
          ? getItemImageUrl(name)
          : undefined;
    return (
        <span className={s.icon}>
            {src && !failed ? (
                <Image
                    unoptimized
                    src={src}
                    width={28}
                    height={28}
                    alt=""
                    style={{ width: "100%", height: "100%" }}
                    onError={() => setFailed(true)}
                />
            ) : (
                <Package size={20} aria-hidden="true" />
            )}
        </span>
    );
}

export function GoodCard({
    row,
    materials,
    now,
    disabled,
    changed,
    onChange,
}: {
    row: BarterRow;
    materials: BarterMaterial[];
    now: number;
    disabled: boolean;
    changed: boolean;
    onChange: (patch: Partial<BarterRow>) => void;
}) {
    const { good } = row;
    const quantity = parseBarterInteger(row.q);
    const used = parseBarterInteger(row.used);
    const remaining =
        used === null || used > good.limit ? null : good.limit - used;
    const unavailable = disabled || changed || !!goodIssue(good, now);
    const issue = rowIssue(row, now) ?? goodIssue(good, now);
    return (
        <article
            className={s.good}
            data-selected={quantity !== null && quantity > 0}
            aria-label={`${good.name} 교역품`}
        >
            <div className={s.goodTop}>
                <input
                    id={`pick-${good.key}`}
                    type="checkbox"
                    aria-label={`${good.name} 주간분 담기`}
                    checked={quantity !== null && quantity > 0}
                    disabled={
                        unavailable ||
                        ((remaining === null || remaining === 0) && !quantity)
                    }
                    onChange={e =>
                        onChange({
                            q: e.target.checked ? String(remaining) : "0",
                        })
                    }
                />
                <div className={s.goodTitle}>
                    {good.period && (
                        <p className={s.muted}>
                            {good.postName}{" "}
                            <span className={s.badge}>
                                {good.source === "manual"
                                    ? "직접 입력"
                                    : "6티어"}
                            </span>
                        </p>
                    )}
                    <h3>
                        <label htmlFor={`pick-${good.key}`}>{good.name}</label>
                    </h3>
                    <span className={s.limit}>
                        주 {good.limit}회{used ? ` · 이미 ${used}회 교환` : ""}
                    </span>
                </div>
            </div>
            <div className={s.ingredients} aria-label="교환 1회당 재료">
                {good.groups.map((options, i) => {
                    const option = options.find(
                        o => o.itemId === row.choices[i]
                    );
                    if (!option)
                        return (
                            <span className={s.badge} key={i}>
                                대체 재료 선택 필요
                            </span>
                        );
                    const name =
                        materials.find(m => m.id === option.itemId)?.name ??
                        `#${option.itemId}`;
                    return (
                        <span
                            className={s.ingredient}
                            key={i}
                            title={`${name} × ${option.count}`}
                        >
                            <MaterialIcon id={option.itemId} />
                            <span className="sr-only">{name}</span>×
                            {option.count}
                        </span>
                    );
                })}
            </div>
            <div className={s.quantityLine}>
                <span className={s.muted}>준비할 횟수</span>
                <div className={s.stepper}>
                    <button
                        type="button"
                        aria-label={`${good.name} 준비 횟수 줄이기`}
                        disabled={
                            unavailable || quantity === null || quantity === 0
                        }
                        onClick={() => onChange({ q: String(quantity! - 1) })}
                    >
                        <Minus size={14} aria-hidden="true" />
                    </button>
                    <input
                        aria-label={`${good.name} 준비할 횟수`}
                        aria-invalid={!!issue}
                        aria-describedby={issue ? `row-${good.key}` : undefined}
                        inputMode="numeric"
                        maxLength={64}
                        value={row.q}
                        disabled={unavailable}
                        onChange={e => onChange({ q: e.target.value })}
                    />
                    <button
                        type="button"
                        aria-label={`${good.name} 준비 횟수 늘리기`}
                        disabled={
                            unavailable ||
                            quantity === null ||
                            remaining === null ||
                            quantity >= remaining
                        }
                        onClick={() => onChange({ q: String(quantity! + 1) })}
                    >
                        <Plus size={14} aria-hidden="true" />
                    </button>
                </div>
            </div>
            {good.groups.map(
                (options, i) =>
                    options.length > 1 && (
                        <label key={i} className={s.muted}>
                            {good.name} 대체 재료 {i + 1}
                            <select
                                className={s.input}
                                value={row.choices[i] ?? 0}
                                disabled={disabled}
                                onChange={e =>
                                    onChange({
                                        choices: good.groups.map((_, index) =>
                                            index === i
                                                ? Number(e.target.value)
                                                : row.choices[index]
                                        ),
                                    })
                                }
                            >
                                <option value={0}>재료를 선택하세요</option>
                                {options.map(o => (
                                    <option key={o.itemId} value={o.itemId}>
                                        {materials.find(m => m.id === o.itemId)
                                            ?.name ?? `#${o.itemId}`}{" "}
                                        ×{o.count}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )
            )}
            {issue && (
                <p className={s.error} id={`row-${good.key}`}>
                    {issue}
                </p>
            )}
            {changed && (
                <p className={s.error}>
                    자료가 변경되었습니다. 아래의 ‘시즌·저장 자료 관리’에서
                    확인해 주세요.
                </p>
            )}
        </article>
    );
}

export function MaterialRow({
    row,
    plan,
    update,
    marketError,
}: {
    row: BarterMaterialTotal;
    plan: BarterPlan;
    update: (change: (p: BarterPlan) => BarterPlan) => void;
    marketError?: string;
}) {
    const m = row.material;
    const quote = plan.quotes[m.name];
    const manual = Object.hasOwn(plan.prices, m.id);
    const ownedInvalid = parseBarterInteger(plan.owned[m.id] ?? "0") === null;
    const priceInvalid =
        manual &&
        plan.prices[m.id] !== "" &&
        parseBarterInteger(plan.prices[m.id]) === null;
    return (
        <article
            className={s.material}
            aria-label={`${m.name} 재료`}
            data-checked={plan.checked.includes(m.id)}
        >
            <div className={s.materialTop}>
                <input
                    type="checkbox"
                    aria-label={`${m.name} 준비 완료`}
                    checked={plan.checked.includes(m.id)}
                    onChange={e =>
                        update(p => ({
                            ...p,
                            checked: e.target.checked
                                ? [...p.checked, m.id]
                                : p.checked.filter(id => id !== m.id),
                        }))
                    }
                />
                <MaterialIcon id={m.id} />
                <h3>{m.name}</h3>
                {row.missing === 0 && (
                    <span className={s.badge}>보유분으로 충분</span>
                )}
            </div>
            <div className={s.materialNumbers}>
                <div>
                    <span className={s.muted}>필요 수량</span>
                    <strong>{row.required}</strong>
                </div>
                <label>
                    보유 수량
                    <input
                        className={s.input}
                        aria-label={`${m.name} 보유 수량`}
                        inputMode="numeric"
                        maxLength={64}
                        value={plan.owned[m.id] ?? "0"}
                        aria-invalid={ownedInvalid}
                        aria-describedby={
                            ownedInvalid ? `owned-${m.id}` : undefined
                        }
                        onChange={e =>
                            update(p => ({
                                ...p,
                                owned: { ...p.owned, [m.id]: e.target.value },
                                checked: p.checked.filter(id => id !== m.id),
                            }))
                        }
                    />
                </label>
                <div>
                    <span className={s.muted}>더 준비할 수량</span>
                    <strong className={s.deficit}>{row.missing ?? "—"}</strong>
                </div>
            </div>
            <p className="sr-only">
                필요 {row.required} · 보유분 사용 {row.usedOwned ?? "미확인"} ·
                부족 {row.missing ?? "미확인"}
            </p>
            {ownedInvalid && (
                <p className={s.error} id={`owned-${m.id}`}>
                    보유 수량은 0 이상의 정수로 입력해 주세요.
                </p>
            )}
            {marketError && (
                <p role="status" className={s.error}>
                    {marketError}
                </p>
            )}
            {quote &&
                (!quote.isComplete ||
                    quote.availableQuantity < (row.missing ?? 0) ||
                    quote.availableQuantity === 0) && (
                    <p className={s.error}>
                        {quote.availableQuantity === 0
                            ? "매물 없음"
                            : `${quote.isComplete ? "전체 조회" : "부분 조회"} · 관측 수량 ${quote.availableQuantity}${quote.availableQuantity < (row.missing ?? 0) ? " · 관측 수량 부족" : ""}`}
                    </p>
                )}
            <details className={s.materialDetails}>
                <summary>
                    가격·필요한 교역품 보기
                    {row.unitPrice !== null
                        ? ` · 개당 ${row.unitPrice.toLocaleString("ko-KR")} Gold`
                        : ""}
                </summary>
                <div className={s.priceLine}>
                    <label>
                        단가 (Gold)
                        <input
                            className={s.input}
                            aria-label={`${m.name} 단가 (Gold)`}
                            inputMode="numeric"
                            maxLength={64}
                            placeholder="미입력"
                            value={
                                plan.prices[m.id] ??
                                (row.unitPrice === null
                                    ? ""
                                    : String(row.unitPrice))
                            }
                            aria-invalid={priceInvalid}
                            aria-describedby={
                                priceInvalid ? `price-${m.id}` : undefined
                            }
                            onChange={e =>
                                update(p => ({
                                    ...p,
                                    prices: {
                                        ...p.prices,
                                        [m.id]: e.target.value,
                                    },
                                }))
                            }
                        />
                    </label>
                    {manual && (
                        <button
                            type="button"
                            className={`btn btn-sm ${s.button}`}
                            onClick={() =>
                                update(p => ({
                                    ...p,
                                    prices: Object.fromEntries(
                                        Object.entries(p.prices).filter(
                                            ([id]) => id !== String(m.id)
                                        )
                                    ),
                                }))
                            }
                        >
                            시세 사용
                        </button>
                    )}
                </div>
                {priceInvalid && (
                    <p className={s.error} id={`price-${m.id}`}>
                        단가는 0 이상의 안전한 정수 또는 빈칸으로 입력해 주세요.
                    </p>
                )}
                <p>
                    가격 기준:{" "}
                    {manual
                        ? "직접 입력"
                        : quote && row.unitPrice !== null
                          ? "관측한 최저 등록 단가"
                          : "미입력"}{" "}
                    · 재료 ID #{m.id}
                </p>
                {quote && (
                    <p>
                        {quote.fetchedAt
                            ? "서버 조회"
                            : "수신 시각 (서버 시각 미제공)"}
                        :{" "}
                        {seoulDateInput(
                            Date.parse(quote.fetchedAt ?? quote.observedAt)
                        ).replace("T", " ")}{" "}
                        (서울) · {quote.isComplete ? "전체 조회" : "부분 조회"}{" "}
                        · 관측 수량 {quote.availableQuantity}
                    </p>
                )}
                {m.searchable && !m.ambiguous ? (
                    <Link prefetch={false} href={getAuctionSearchPath(m.name)}>
                        경매장 시세 보기 — {m.name}
                    </Link>
                ) : (
                    <p>
                        {m.ambiguous
                            ? "동명 변형이라 자동 시세를 적용하지 않습니다."
                            : "경매 검색 지원 여부를 확인할 수 없습니다."}{" "}
                        수동 가격을 입력할 수 있습니다.
                    </p>
                )}
                <ul>
                    {row.contributions.map(c => (
                        <li key={c.key}>
                            {c.name}: {c.count}개
                        </li>
                    ))}
                </ul>
            </details>
        </article>
    );
}
