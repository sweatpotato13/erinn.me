"use client";

import Link from "next/link";
import { useId } from "react";

import { MaterialIcon } from "@/app/tools/barter/barter-ui";
import s from "@/components/tools/preparation.module.css";
import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    type CraftingChoice,
    type CraftingGroup,
    type CraftingNode,
    type CraftingReference,
    emptyCraftingChoice,
    selectCraftingRecipe,
} from "@/lib/crafting";
import type { CraftingPlan } from "@/lib/crafting-state";
import { materialPrice, parseMaterialInteger } from "@/lib/material-cost";

import c from "./crafting-tool.module.css";

export type UpdateCrafting = (
    change: (plan: CraftingPlan) => CraftingPlan
) => void;

export function NumberField({
    label,
    value,
    onChange,
    positive = false,
    optional = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    positive?: boolean;
    optional?: boolean;
}) {
    const id = useId();
    const number = parseMaterialInteger(value);
    const invalid =
        !(optional && value === "") &&
        (number === null || (positive && number === 0));
    return (
        <label className={c.field}>
            {label}
            <input
                className={s.input}
                aria-label={label}
                value={value}
                inputMode="numeric"
                maxLength={64}
                aria-invalid={invalid}
                aria-describedby={invalid ? id : undefined}
                onChange={event => onChange(event.target.value)}
                placeholder={optional ? "미입력" : undefined}
            />
            {invalid && (
                <span id={id} className={s.error}>
                    {positive ? "1" : "0"} 이상의 정수로 입력해 주세요.
                </span>
            )}
        </label>
    );
}

export function Quantity({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const number = parseMaterialInteger(value);
    return (
        <div className={`${s.stepper} ${c.quantity}`}>
            <button
                type="button"
                aria-label={`${label} 줄이기`}
                disabled={number === null || number <= 1}
                onClick={() => onChange(String(number! - 1))}
            >
                −
            </button>
            <input
                aria-label={label}
                aria-invalid={number === null || number === 0}
                inputMode="numeric"
                value={value}
                maxLength={64}
                onChange={event => onChange(event.target.value)}
            />
            <button
                type="button"
                aria-label={`${label} 늘리기`}
                disabled={number === null || number >= Number.MAX_SAFE_INTEGER}
                onClick={() => onChange(String(number! + 1))}
            >
                +
            </button>
        </div>
    );
}

function Groups({
    groups,
    stage,
    choice,
    change,
    reference,
}: {
    groups: CraftingGroup[];
    stage: "p" | "f";
    choice: CraftingChoice;
    change: (patch: Partial<CraftingChoice>) => void;
    reference: CraftingReference;
}) {
    const choices =
        stage === "p" ? choice.processChoices : choice.finishChoices;
    const key = stage === "p" ? "processChoices" : "finishChoices";
    return groups.map((group, index) => {
        const name = `${stage === "p" ? "공정" : "마감"} 재료 ${index + 1}`;
        const allocationKey = `${stage}:${index}`;
        return (
            <div key={index}>
                {group.itemIds.length > 1 && (
                    <label className={c.field}>
                        {name} · 1회당 {group.count}개
                        <select
                            className={s.input}
                            aria-label={name}
                            value={choices[index] ?? 0}
                            onChange={event =>
                                change({
                                    [key]: groups.map((g, i) =>
                                        i === index
                                            ? Number(event.target.value)
                                            : (choices[i] ??
                                              (g.itemIds.length === 1
                                                  ? g.itemIds[0]
                                                  : 0))
                                    ),
                                })
                            }
                        >
                            <option value={0}>재료를 선택하세요</option>
                            {group.itemIds.map(id => (
                                <option key={id} value={id}>
                                    {reference.items.find(
                                        item => item.id === id
                                    )?.name ?? `#${id}`}{" "}
                                    · #{id}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {group.mixed && (
                    <details>
                        <summary>나누어 사용 · {name}</summary>
                        <p>
                            공정 또는 마감 1회당 합계 {group.count}개를
                            배분하세요.
                        </p>
                        {group.itemIds.map(id => (
                            <NumberField
                                key={id}
                                label={`${name} #${id} 배분`}
                                value={
                                    choice.allocations[allocationKey]?.find(
                                        entry => entry.itemId === id
                                    )?.count ?? "0"
                                }
                                onChange={value =>
                                    change({
                                        allocations: {
                                            ...choice.allocations,
                                            [allocationKey]: group.itemIds.map(
                                                itemId => ({
                                                    itemId,
                                                    count:
                                                        itemId === id
                                                            ? value
                                                            : (choice.allocations[
                                                                  allocationKey
                                                              ]?.find(
                                                                  entry =>
                                                                      entry.itemId ===
                                                                      itemId
                                                              )?.count ?? "0"),
                                                })
                                            ),
                                        },
                                    })
                                }
                            />
                        ))}
                        <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                                change({
                                    allocations: Object.fromEntries(
                                        Object.entries(
                                            choice.allocations
                                        ).filter(
                                            ([key]) => key !== allocationKey
                                        )
                                    ),
                                })
                            }
                        >
                            단일 재료 사용
                        </button>
                    </details>
                )}
            </div>
        );
    });
}

export function RecipeEditor({
    id,
    plan,
    update,
    reference,
}: {
    id: number;
    plan: CraftingPlan;
    update: UpdateCrafting;
    reference: CraftingReference;
}) {
    const choice = plan.choices[id] ?? emptyCraftingChoice();
    const recipes = reference.recipes.filter(recipe => recipe.itemId === id);
    const recipe = recipes.find(recipe => recipe.fingerprint === choice.recipe);
    const name = reference.items.find(item => item.id === id)?.name ?? `#${id}`;
    const change = (patch: Partial<CraftingChoice>) =>
        update(p => ({
            ...p,
            choices: {
                ...p.choices,
                [id]: { ...(p.choices[id] ?? emptyCraftingChoice()), ...patch },
            },
            checked: [],
        }));
    return (
        <div className={c.conditions}>
            <div
                className={c.row}
                role="group"
                aria-label={`${name} 준비 방법`}
            >
                <button
                    type="button"
                    className={`btn btn-sm ${choice.mode === "buy" ? "btn-primary" : ""}`}
                    aria-pressed={choice.mode === "buy"}
                    onClick={() => change({ mode: "buy" })}
                >
                    구매
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${choice.mode === "craft" ? "btn-primary" : ""}`}
                    aria-pressed={choice.mode === "craft"}
                    disabled={!recipes.length}
                    onClick={() => change({ mode: "craft" })}
                >
                    직접 제작
                </button>
                {!recipes.length && (
                    <span className={s.muted}>
                        확인된 제작법이 없어 구매로 준비합니다.
                    </span>
                )}
            </div>
            {choice.mode === "craft" && (
                <>
                    <label className={c.field}>
                        {name} 제작법
                        <select
                            className={s.input}
                            aria-label={`${name} 제작법`}
                            value={recipe?.fingerprint ?? ""}
                            onChange={event => {
                                const selected = recipes.find(
                                    recipe =>
                                        recipe.fingerprint ===
                                        event.target.value
                                );
                                change(
                                    selected
                                        ? selectCraftingRecipe(selected)
                                        : emptyCraftingChoice("craft")
                                );
                            }}
                        >
                            <option value="">제작법을 선택하세요</option>
                            {recipes.map((recipe, index) => (
                                <option
                                    key={recipe.fingerprint}
                                    value={recipe.fingerprint}
                                >
                                    {recipe.skill} · {recipe.rank} ·{" "}
                                    {recipe.facility || "시설 지정 없음"} ·{" "}
                                    {recipe.process
                                        .map(
                                            group =>
                                                `${group.itemIds.map(id => reference.items.find(item => item.id === id)?.name ?? `#${id}`).join("/")} ×${group.count}`
                                        )
                                        .join(", ")}{" "}
                                    · 제작법 {index + 1}
                                </option>
                            ))}
                        </select>
                    </label>
                    {recipe && (
                        <>
                            <span className={s.badge}>
                                입력한 제작 조건 기준
                            </span>
                            <p className={s.muted}>
                                {recipe.facility
                                    ? `필요 시설: ${recipe.facility}. `
                                    : ""}
                                도구·시설은 자동으로 소모 비용에 넣지 않습니다.
                            </p>
                            <div className={c.fields}>
                                <NumberField
                                    label={`${name} 성공한 제작 1회당 완성 수량`}
                                    positive
                                    value={choice.yield}
                                    onChange={value => change({ yield: value })}
                                />
                                <NumberField
                                    label={`${name} 완성 1회까지 공정 횟수`}
                                    positive
                                    value={choice.passes}
                                    onChange={value =>
                                        change({ passes: value })
                                    }
                                />
                            </div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={choice.includesFailures}
                                    onChange={event =>
                                        change({
                                            includesFailures:
                                                event.target.checked,
                                        })
                                    }
                                />{" "}
                                입력한 공정 횟수에 실패 재료 소비도 포함했어요
                            </label>
                            <p className={s.muted}>
                                마감은 완성 1회당 한 번만 더합니다. 부분
                                손실·회수·추가 생산 확률은 자동 계산하지
                                않습니다.
                            </p>
                            <Groups
                                groups={recipe.process}
                                stage="p"
                                choice={choice}
                                change={change}
                                reference={reference}
                            />
                            {recipe.finishes.length > 0 && (
                                <label className={c.field}>
                                    {name} 마감 방식
                                    <select
                                        className={s.input}
                                        aria-label={`${name} 마감 방식`}
                                        value={choice.finish ?? -1}
                                        onChange={event => {
                                            const index = Number(
                                                event.target.value
                                            );
                                            change({
                                                finish:
                                                    index < 0 ? null : index,
                                                finishChoices:
                                                    recipe.finishes[
                                                        index
                                                    ]?.groups.map(group =>
                                                        group.itemIds.length ===
                                                        1
                                                            ? group.itemIds[0]
                                                            : 0
                                                    ) ?? [],
                                                allocations: Object.fromEntries(
                                                    Object.entries(
                                                        choice.allocations
                                                    ).filter(([key]) =>
                                                        key.startsWith("p:")
                                                    )
                                                ),
                                            });
                                        }}
                                    >
                                        <option value={-1}>
                                            마감을 선택하세요
                                        </option>
                                        {recipe.finishes.map(
                                            (finish, index) => (
                                                <option
                                                    key={index}
                                                    value={index}
                                                >
                                                    마감 {index + 1} ·{" "}
                                                    {finish.extraData || "기본"}{" "}
                                                    ·{" "}
                                                    {finish.groups
                                                        .map(
                                                            group =>
                                                                `${group.itemIds.map(id => reference.items.find(item => item.id === id)?.name ?? `#${id}`).join("/")} ×${group.count}`
                                                        )
                                                        .join(", ")}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>
                            )}
                            {choice.finish !== null &&
                                recipe.finishes[choice.finish] && (
                                    <Groups
                                        groups={
                                            recipe.finishes[choice.finish]
                                                .groups
                                        }
                                        stage="f"
                                        choice={choice}
                                        change={change}
                                        reference={reference}
                                    />
                                )}
                            <details>
                                <summary>추가 비용·제작법 정보</summary>
                                <NumberField
                                    label={`${name} 완성 1회당 부가 비용 (Gold)`}
                                    value={choice.batchFee}
                                    onChange={value =>
                                        change({ batchFee: value })
                                    }
                                />
                                <p className={s.muted}>
                                    도안 번호 {recipe.formId} · 시설 식별{" "}
                                    {recipe.facilityKey || "없음"} · 원본{" "}
                                    {recipe.occurrences}건
                                </p>
                                <p className={s.muted}>
                                    도안 소모·별도 수수료가 있다면 확인한 단위로
                                    입력하세요. 이미 포함한 실패 소비를 다시
                                    더하지 마세요.
                                </p>
                                {recipe.issues.map(issue => (
                                    <p key={issue} className={s.error}>
                                        {issue}
                                    </p>
                                ))}
                            </details>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export function PriceEditor({
    node,
    plan,
    update,
    error,
}: {
    node: CraftingNode;
    plan: CraftingPlan;
    update: UpdateCrafting;
    error?: string;
}) {
    const item = node.item;
    const manual = Object.hasOwn(plan.prices, item.id);
    const quote = plan.quotes[item.name];
    const value = materialPrice(item, plan.prices, plan.quotes);
    const numericPrice = parseMaterialInteger(value);
    return (
        <details className={s.materialDetails}>
            <summary>
                단가·가격 출처·사용처
                {numericPrice !== null
                    ? ` · 개당 ${numericPrice.toLocaleString("ko-KR")} Gold`
                    : ""}
            </summary>
            <NumberField
                label={`${item.name} 단가 (Gold)`}
                optional
                value={value}
                onChange={value =>
                    update(p => ({
                        ...p,
                        prices: { ...p.prices, [item.id]: value },
                    }))
                }
            />
            <p>
                가격 기준:{" "}
                {manual
                    ? "직접 입력"
                    : value !== ""
                      ? "관측한 최저 등록 단가"
                      : "미입력"}
            </p>
            {manual && (
                <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                        update(p => ({
                            ...p,
                            prices: Object.fromEntries(
                                Object.entries(p.prices).filter(
                                    ([id]) => Number(id) !== item.id
                                )
                            ),
                        }))
                    }
                >
                    시세 사용
                </button>
            )}
            {error && (
                <p role="status" className={s.error}>
                    {error}
                </p>
            )}
            {quote && (
                <p>
                    조회 시각: {quote.fetchedAt ?? quote.observedAt} ·{" "}
                    {quote.isComplete ? "전체 조회" : "부분 조회"} · 관측 수량{" "}
                    {quote.availableQuantity}
                    {quote.availableQuantity === 0
                        ? " · 매물 없음"
                        : quote.availableQuantity < (node.missing ?? 0)
                          ? " · 관측 수량 부족"
                          : ""}
                </p>
            )}
            {item.searchable && !item.ambiguous ? (
                <Link prefetch={false} href={getAuctionSearchPath(item.name)}>
                    경매장 시세 보기 — {item.name}
                </Link>
            ) : (
                <p>
                    동명 변형 또는 검색 미지원 재료는 수동 가격을 입력해 주세요.
                </p>
            )}
            {node.contributions.map(part => (
                <p key={part.itemId}>
                    제작품 #{part.itemId}에서 {part.count}개 필요
                </p>
            ))}
        </details>
    );
}

export function StockField({
    node,
    plan,
    update,
}: {
    node: CraftingNode;
    plan: CraftingPlan;
    update: UpdateCrafting;
}) {
    return (
        <NumberField
            label={`${node.item.name} ${plan.origin === "barter-net-deficit" ? "물물교환 배정 후 남은 보유 수량" : "보유 수량"}`}
            value={plan.owned[node.item.id] ?? "0"}
            onChange={value =>
                update(p => ({
                    ...p,
                    owned: { ...p.owned, [node.item.id]: value },
                    checked: [],
                }))
            }
        />
    );
}

export function ShoppingRow({
    node,
    plan,
    update,
    error,
}: {
    node: CraftingNode;
    plan: CraftingPlan;
    update: UpdateCrafting;
    error?: string;
}) {
    const quote = plan.quotes[node.item.name];
    return (
        <article
            className={s.material}
            aria-label={`${node.item.name} 재료`}
            data-checked={plan.checked.includes(node.item.id)}
        >
            <div className={s.materialTop}>
                <input
                    type="checkbox"
                    aria-label={`${node.item.name} 준비 완료`}
                    checked={plan.checked.includes(node.item.id)}
                    onChange={event =>
                        update(p => ({
                            ...p,
                            checked: event.target.checked
                                ? [...p.checked, node.item.id]
                                : p.checked.filter(id => id !== node.item.id),
                        }))
                    }
                />
                <MaterialIcon id={node.item.id} />
                <h3>{node.item.name}</h3>
            </div>
            <div className={s.materialNumbers}>
                <div>
                    <span>필요 수량</span>
                    <strong>{node.complete ? node.required : "미확인"}</strong>
                </div>
                <StockField node={node} plan={plan} update={update} />
                <div>
                    <span>더 준비할 수량</span>
                    <strong className={s.deficit}>{node.missing ?? "—"}</strong>
                </div>
            </div>
            {node.missing === 0 && <p className={s.badge}>보유분으로 충분</p>}
            {quote &&
                (!quote.isComplete ||
                    quote.availableQuantity < (node.missing ?? 0) ||
                    quote.availableQuantity === 0) && (
                    <p className={s.error}>
                        {quote.availableQuantity === 0
                            ? "매물 없음 · 단가 미확인"
                            : `${quote.isComplete ? "전체 조회" : "부분 조회"} · 관측 수량 ${quote.availableQuantity}${quote.availableQuantity < (node.missing ?? 0) ? " · 관측 수량 부족" : ""}`}
                    </p>
                )}
            {node.issues.map(issue => (
                <p key={issue} className={s.error}>
                    {issue}
                </p>
            ))}
            {error && (
                <p role="status" className={s.error}>
                    {error}
                </p>
            )}
            <PriceEditor node={node} plan={plan} update={update} />
        </article>
    );
}
