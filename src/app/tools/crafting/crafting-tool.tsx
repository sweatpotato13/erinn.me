"use client";

import { Package, ShoppingBasket } from "lucide-react";
import { useMemo, useState } from "react";

import { MaterialIcon } from "@/app/tools/barter/barter-ui";
import s from "@/components/tools/preparation.module.css";
import { useMaterialMarket } from "@/hooks/use-material-market";
import { formatGold } from "@/lib/auction-calculator";
import {
    calculateCrafting,
    calculateCraftingCosts,
    type CraftingCost,
    type CraftingReference,
    resolveCraftingChoice,
} from "@/lib/crafting";
import { craftingPlanIssues } from "@/lib/crafting-state";
import { materialPrice, parseMaterialInteger } from "@/lib/material-cost";

import { useCraftingItems, useCraftingPlan } from "./crafting-hooks";
import c from "./crafting-tool.module.css";
import { Quantity, RecipeEditor, ShoppingRow } from "./crafting-ui";

export default function CraftingTool({ data }: { data: CraftingReference }) {
    const state = useCraftingPlan(data);
    const { plan, update, ready } = state;
    const catalog = useCraftingItems(data, plan, state.epoch);
    const reference = useMemo(
        () => ({ ...data, items: [...data.items, ...catalog.items] }),
        [data, catalog.items]
    );
    const calculated = useMemo(
        () => calculateCrafting(plan, reference),
        [plan, reference]
    );
    const planIssues = useMemo(
        () => craftingPlanIssues(plan, reference),
        [plan, reference]
    );
    const targetResults = useMemo(
        () =>
            plan.targets.map(target =>
                calculateCrafting({ ...plan, targets: [target] }, reference)
            ),
        [plan, reference]
    );
    const issues = [
        ...calculated.issues,
        ...planIssues,
        ...(catalog.error ? [catalog.error] : []),
        ...(catalog.pending ? ["아이템을 확인하고 있습니다."] : []),
    ];
    const result = {
        ...calculated,
        issues: [...new Set(issues)],
        complete: calculated.complete && !issues.length,
    };
    const prices = Object.fromEntries(
        reference.items.map(item => [
            item.id,
            materialPrice(item, plan.prices, plan.quotes),
        ])
    );
    const costs = calculateCraftingCosts({ ...plan, prices }, result);
    const [query, setQuery] = useState("");
    const [limit, setLimit] = useState(20);
    const names = result.nodes
        .filter(
            node =>
                node.item.searchable &&
                (!node.item.ambiguous || node.target > 0) &&
                ((node.mode === "buy" &&
                    node.complete &&
                    (node.missing ?? 0) > 0) ||
                    node.target > 0)
        )
        .map(node => node.item.name);
    const market = useMaterialMarket(
        names,
        (name, quote) =>
            update(p => ({ ...p, quotes: { ...p.quotes, [name]: quote } })),
        state.epoch,
        ready && !catalog.pending
    );
    const candidates = query.trim()
        ? data.items.filter(
              item =>
                  data.byOutput[item.id]?.length &&
                  (item.name
                      .toLocaleLowerCase("ko-KR")
                      .includes(query.trim().toLocaleLowerCase("ko-KR")) ||
                      String(item.id) === query.trim())
          )
        : [];
    const money = (value: CraftingCost) => (
        <>
            <span>{formatGold(value.known)} Gold</span>
            {!value.complete && <span className={s.muted}> · 확인된 소계</span>}
        </>
    );
    const difference = (value: number | null) =>
        value === null
            ? "시세와 제작 원가 확인 필요"
            : `${value < 0 ? "제작에 더 필요 " : "구매보다 적게 필요 "}${formatGold(Math.abs(value))} Gold`;
    return (
        <div className={c.tool}>
            {!ready && (
                <p role="status" className={s.notice}>
                    저장된 계획을 확인하고 있습니다.
                </p>
            )}
            {state.notice && (
                <p role="status" className={s.notice}>
                    {state.notice}
                </p>
            )}
            {(state.temporary || state.needsReview) && (
                <section
                    className={s.notice}
                    aria-label="임시 계획·저장 자료 관리"
                >
                    <p>
                        {state.temporary
                            ? "공유·가져온 계획을 임시로 열었습니다. 기존 계획은 변경하지 않습니다."
                            : "저장된 자료를 검토해 주세요. 원래 저장 내용은 보존했습니다."}
                    </p>
                    <div className={c.row}>
                        <button
                            type="button"
                            className="btn btn-sm"
                            disabled={catalog.pending || !ready}
                            onClick={() => state.adopt(reference)}
                        >
                            검토한 계획을 이 기기에 저장
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={state.openSaved}
                        >
                            기존 계획 열기
                        </button>
                    </div>
                    {state.backup && (
                        <details>
                            <summary>기존 저장 내용 확인</summary>
                            <textarea
                                className={c.export}
                                readOnly
                                aria-label="기존 저장 내용"
                                value={state.backup}
                            />
                        </details>
                    )}
                </section>
            )}
            {plan.origin === "barter-net-deficit" && (
                <p className={s.notice}>
                    물물교환에서 부족한 재료를 가져왔어요. 가져온 수량의 제작
                    원가를 계산합니다.
                </p>
            )}
            {planIssues.length > 0 && !catalog.pending && (
                <details className={s.notice}>
                    <summary>변경된 제작법·아이템 입력 관리</summary>
                    <p>제작법을 초기화하면 조건을 다시 입력해야 합니다.</p>
                    {Object.entries(plan.choices)
                        .filter(([, choice]) => choice.mode === "craft")
                        .map(([id]) => (
                            <button
                                key={id}
                                type="button"
                                className="btn btn-sm"
                                onClick={() =>
                                    update(p => ({
                                        ...p,
                                        choices: {
                                            ...p.choices,
                                            [id]: resolveCraftingChoice(
                                                undefined,
                                                reference.recipes.filter(
                                                    recipe =>
                                                        recipe.itemId ===
                                                        Number(id)
                                                ),
                                                true
                                            ),
                                        },
                                    }))
                                }
                            >
                                #{id} 제작법 선택 초기화
                            </button>
                        ))}
                    {[
                        ...new Set([
                            ...plan.targets.map(target => target.itemId),
                            ...Object.keys(plan.choices).map(Number),
                            ...Object.keys(plan.prices).map(Number),
                        ]),
                    ]
                        .filter(
                            id => !reference.items.some(item => item.id === id)
                        )
                        .map(id => (
                            <button
                                key={id}
                                type="button"
                                className="btn btn-sm"
                                onClick={() =>
                                    update(p => {
                                        const omit = <T,>(
                                            map: Record<string, T>
                                        ) =>
                                            Object.fromEntries(
                                                Object.entries(map).filter(
                                                    ([key]) =>
                                                        Number(key) !== id
                                                )
                                            );
                                        return {
                                            ...p,
                                            targets: p.targets.filter(
                                                target => target.itemId !== id
                                            ),
                                            choices: omit(p.choices),
                                            prices: omit(p.prices),
                                        };
                                    })
                                }
                            >
                                알 수 없는 아이템 #{id} 입력 제거
                            </button>
                        ))}
                </details>
            )}
            <fieldset disabled={!ready} className="min-w-0">
                <div className={s.layout}>
                    <div className={s.catalog}>
                        <section
                            className={s.panel}
                            aria-labelledby="craft-search-heading"
                        >
                            <div className={s.panelHead}>
                                <h2 id="craft-search-heading">
                                    <Package size={18} aria-hidden="true" />
                                    만들 물품 선택
                                </h2>
                                <span className={s.muted}>
                                    {plan.targets.length}개 선택
                                </span>
                            </div>
                            <div className={c.body}>
                                <label className={c.field}>
                                    아이템 검색
                                    <input
                                        className={s.input}
                                        value={query}
                                        maxLength={100}
                                        placeholder="만들 아이템 이름을 입력하세요"
                                        onChange={event => {
                                            setQuery(event.target.value);
                                            setLimit(20);
                                        }}
                                    />
                                </label>
                                {query && (
                                    <div
                                        className={c.results}
                                        aria-label="제작품 검색 결과"
                                    >
                                        {candidates
                                            .slice(0, limit)
                                            .map(item => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className={`btn h-auto min-h-12 ${c.result}`}
                                                    disabled={
                                                        plan.targets.length >=
                                                            100 &&
                                                        !plan.targets.some(
                                                            target =>
                                                                target.itemId ===
                                                                item.id
                                                        )
                                                    }
                                                    onClick={() =>
                                                        update(p => {
                                                            const existing =
                                                                p.targets.find(
                                                                    target =>
                                                                        target.itemId ===
                                                                        item.id
                                                                );
                                                            return {
                                                                ...p,
                                                                targets:
                                                                    existing
                                                                        ? p.targets.map(
                                                                              target =>
                                                                                  target.itemId ===
                                                                                  item.id
                                                                                      ? {
                                                                                            ...target,
                                                                                            count: String(
                                                                                                Math.min(
                                                                                                    Number.MAX_SAFE_INTEGER,
                                                                                                    (parseMaterialInteger(
                                                                                                        target.count
                                                                                                    ) ??
                                                                                                        0) +
                                                                                                        1
                                                                                                )
                                                                                            ),
                                                                                        }
                                                                                      : target
                                                                          )
                                                                        : [
                                                                              ...p.targets,
                                                                              {
                                                                                  itemId: item.id,
                                                                                  count: "1",
                                                                              },
                                                                          ],
                                                                choices: {
                                                                    ...p.choices,
                                                                    [item.id]:
                                                                        resolveCraftingChoice(
                                                                            p
                                                                                .choices[
                                                                                item
                                                                                    .id
                                                                            ],
                                                                            data.recipes.filter(
                                                                                recipe =>
                                                                                    recipe.itemId ===
                                                                                    item.id
                                                                            ),
                                                                            true
                                                                        ),
                                                                },
                                                            };
                                                        })
                                                    }
                                                >
                                                    <MaterialIcon
                                                        id={item.id}
                                                    />
                                                    <span>
                                                        {item.name}{" "}
                                                        <small>
                                                            #{item.id} · 제작법{" "}
                                                            {
                                                                data.byOutput[
                                                                    item.id
                                                                ].length
                                                            }
                                                            개
                                                        </small>
                                                    </span>
                                                    담기
                                                </button>
                                            ))}
                                        {!candidates.length && (
                                            <p>
                                                검색 결과가 없습니다. 이름 또는
                                                아이템 번호를 확인해 주세요.
                                            </p>
                                        )}
                                        {candidates.length > limit && (
                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                onClick={() =>
                                                    setLimit(
                                                        value => value + 20
                                                    )
                                                }
                                            >
                                                결과 더 보기
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                        <div className={c.targets}>
                            {plan.targets.map((target, index) => {
                                const targetResult = targetResults[index];
                                const node = targetResult.nodes.find(
                                    node => node.item.id === target.itemId
                                );
                                if (!node) return null;
                                const intermediates = targetResult.nodes.filter(
                                    material =>
                                        !material.target &&
                                        reference.byOutput[material.item.id]
                                            ?.length
                                );
                                return (
                                    <article
                                        key={`${target.itemId}:${index}`}
                                        id={`craft-node-${target.itemId}`}
                                        className={`${s.panel} ${c.target}`}
                                        data-selected="true"
                                        aria-label={`${node.item.name} 제작 목표`}
                                    >
                                        <div className={s.panelHead}>
                                            <h2>
                                                <MaterialIcon
                                                    id={target.itemId}
                                                />
                                                {node.item.name}
                                            </h2>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                aria-label={`${node.item.name} 목표 삭제`}
                                                onClick={() =>
                                                    update(p => ({
                                                        ...p,
                                                        targets:
                                                            p.targets.filter(
                                                                (_, i) =>
                                                                    i !== index
                                                            ),
                                                        choices:
                                                            Object.fromEntries(
                                                                Object.entries(
                                                                    p.choices
                                                                ).filter(
                                                                    ([id]) =>
                                                                        Number(
                                                                            id
                                                                        ) !==
                                                                        target.itemId
                                                                )
                                                            ),
                                                    }))
                                                }
                                            >
                                                삭제
                                            </button>
                                        </div>
                                        <div className={c.body}>
                                            <div className={c.row}>
                                                <span>만들 수량</span>
                                                <Quantity
                                                    label={`${node.item.name} 만들 수량`}
                                                    value={target.count}
                                                    onChange={count =>
                                                        update(p => ({
                                                            ...p,
                                                            targets:
                                                                p.targets.map(
                                                                    (
                                                                        target,
                                                                        i
                                                                    ) =>
                                                                        i ===
                                                                        index
                                                                            ? {
                                                                                  ...target,
                                                                                  count,
                                                                              }
                                                                            : target
                                                                ),
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <RecipeEditor
                                                id={target.itemId}
                                                plan={plan}
                                                update={update}
                                                reference={reference}
                                            />
                                            {node.mode === "craft" && (
                                                <p>
                                                    제작{" "}
                                                    {node.batches ?? "미확인"}회
                                                    · 완성{" "}
                                                    {node.produced ?? "미확인"}
                                                    개 · 남음{" "}
                                                    {node.surplus ?? "미확인"}개
                                                </p>
                                            )}
                                            {node.issues.map(issue => (
                                                <p
                                                    className={s.error}
                                                    key={issue}
                                                >
                                                    {issue}
                                                </p>
                                            ))}

                                            {!!intermediates.length && (
                                                <section
                                                    className={c.intermediates}
                                                    aria-label={`${node.item.name} 중간재 구매·제작`}
                                                >
                                                    <h3>중간재 구매·제작</h3>
                                                    {intermediates.map(
                                                        material => (
                                                            <article
                                                                key={
                                                                    material
                                                                        .item.id
                                                                }
                                                                className={
                                                                    s.material
                                                                }
                                                                aria-label={`${material.item.name} 중간재`}
                                                            >
                                                                <div
                                                                    className={
                                                                        s.materialTop
                                                                    }
                                                                >
                                                                    <MaterialIcon
                                                                        id={
                                                                            material
                                                                                .item
                                                                                .id
                                                                        }
                                                                        name={
                                                                            material
                                                                                .item
                                                                                .name
                                                                        }
                                                                    />
                                                                    <h4>
                                                                        {
                                                                            material
                                                                                .item
                                                                                .name
                                                                        }
                                                                    </h4>
                                                                </div>
                                                                <p>
                                                                    필요 수량{" "}
                                                                    {material.complete
                                                                        ? material.required
                                                                        : "미확인"}
                                                                    개
                                                                </p>
                                                                <RecipeEditor
                                                                    id={
                                                                        material
                                                                            .item
                                                                            .id
                                                                    }
                                                                    plan={plan}
                                                                    update={
                                                                        update
                                                                    }
                                                                    reference={
                                                                        reference
                                                                    }
                                                                />
                                                                {material.mode ===
                                                                    "craft" && (
                                                                    <p>
                                                                        제작{" "}
                                                                        {material.batches ??
                                                                            "미확인"}
                                                                        회 ·
                                                                        남음{" "}
                                                                        {material.surplus ??
                                                                            "미확인"}
                                                                        개
                                                                    </p>
                                                                )}
                                                            </article>
                                                        )
                                                    )}
                                                </section>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                    <section
                        id="crafting-shopping"
                        className={s.sidebar}
                        tabIndex={-1}
                        aria-labelledby="craft-shopping-heading"
                    >
                        <div className={s.summary}>
                            <h2
                                id="craft-shopping-heading"
                                className={`${s.summaryHeading} ${c.heading}`}
                            >
                                <ShoppingBasket size={18} aria-hidden="true" />
                                제작 재료 및 원가
                            </h2>
                            <div className={s.summaryStats}>
                                <div>
                                    <p>필요 재료</p>
                                    <strong>
                                        {
                                            result.shopping.filter(
                                                node => (node.missing ?? 0) > 0
                                            ).length
                                        }
                                        종
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div className={s.shopping}>
                            {!plan.targets.length ? (
                                <div className={s.empty}>
                                    <ShoppingBasket
                                        size={42}
                                        aria-hidden="true"
                                    />
                                    <strong>만들 물품을 골라보세요</strong>
                                    <p>
                                        필요한 재료와 구매·제작 비용을 여기에
                                        모아드려요.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {!!result.issues.length && (
                                        <div className={s.warning} role="alert">
                                            <strong>
                                                제작 조건을 확인해 주세요
                                            </strong>
                                            <p>
                                                확인된 부분만 표시합니다. 아직
                                                전체 제작 비용은 아닙니다.
                                            </p>
                                            <ul className={c.errors}>
                                                {result.issues.map(issue => (
                                                    <li key={issue}>{issue}</li>
                                                ))}
                                            </ul>
                                            {catalog.error && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm"
                                                    onClick={catalog.retry}
                                                >
                                                    아이템 다시 확인
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className={s.cost}>
                                        <dl className={c.totals}>
                                            <div>
                                                <dt>제작 원가</dt>
                                                <dd>{money(costs.total)}</dd>
                                            </div>
                                            <div>
                                                <dt>완제품 경매장 최저가</dt>
                                                <dd>
                                                    {costs.direct.complete
                                                        ? money(costs.direct)
                                                        : "시세 조회 필요"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>구매 대비 원가 차이</dt>
                                                <dd>
                                                    {difference(
                                                        costs.difference
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                        {costs.total.unresolved.length > 0 && (
                                            <p className={s.error}>
                                                가격·수량 확인 필요:{" "}
                                                {[
                                                    ...new Set(
                                                        costs.total.unresolved
                                                    ),
                                                ].join(" / ")}
                                            </p>
                                        )}
                                        <p className={s.muted}>
                                            입력한 만들 수량 전체를 구매 비용과
                                            비교합니다. 잉여 생산분은 판매
                                            수익으로 계산하지 않습니다.
                                        </p>

                                        <button
                                            type="button"
                                            className="btn btn-primary w-full"
                                            disabled={
                                                market.loading ||
                                                !names.length ||
                                                catalog.pending
                                            }
                                            onClick={() => void market.load()}
                                        >
                                            전체 항목 시세 조회
                                        </button>
                                        {market.loading && (
                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                onClick={market.cancel}
                                            >
                                                조회 취소
                                            </button>
                                        )}
                                        {Object.entries(market.errors).map(
                                            ([name, error]) => (
                                                <p
                                                    role="status"
                                                    className={s.error}
                                                    key={name}
                                                >
                                                    {name === "request"
                                                        ? ""
                                                        : `${name}: `}
                                                    {error}
                                                </p>
                                            )
                                        )}
                                    </div>
                                    {result.shopping.map(node => (
                                        <ShoppingRow
                                            onLookup={() =>
                                                void market.load([
                                                    node.item.name,
                                                ])
                                            }
                                            lookupDisabled={
                                                market.loading ||
                                                catalog.pending
                                            }
                                            reference={reference}
                                            key={node.item.id}
                                            node={node}
                                            plan={plan}
                                            update={update}
                                            error={
                                                market.errors[node.item.name]
                                            }
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </fieldset>
            {!!plan.targets.length && (
                <a
                    className={`${s.mobileJump} ${c.mobile}`}
                    href="#crafting-shopping"
                >
                    필요 재료 · {result.shopping.length}종{" "}
                    <span>확인하기 ↓</span>
                </a>
            )}
        </div>
    );
}
