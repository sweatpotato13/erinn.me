"use client";

import { Package, ShoppingBasket } from "lucide-react";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/tools/barter/barter-ui";
import s from "@/components/tools/preparation.module.css";
import { useMaterialMarket } from "@/hooks/use-material-market";
import { formatGold } from "@/lib/auction-calculator";
import {
    calculateCrafting,
    calculateCraftingCosts,
    type CraftingCost,
    type CraftingReference,
    emptyCraftingChoice,
} from "@/lib/crafting";
import {
    buildCraftingShare,
    craftingPlanIssues,
    craftingText,
} from "@/lib/crafting-state";
import { materialPrice, parseMaterialInteger } from "@/lib/material-cost";

import { useCraftingItems, useCraftingPlan } from "./crafting-hooks";
import c from "./crafting-tool.module.css";
import {
    NumberField,
    PriceEditor,
    Quantity,
    RecipeEditor,
    ShoppingRow,
    StockField,
} from "./crafting-ui";

export default function CraftingTool({ data }: { data: CraftingReference }) {
    const state = useCraftingPlan(data);
    const { plan, update, ready, setNotice } = state;
    const catalog = useCraftingItems(data, plan, state.epoch);
    const reference = { ...data, items: [...data.items, ...catalog.items] };
    const calculated = calculateCrafting(plan, reference);
    const issues = [
        ...calculated.issues,
        ...craftingPlanIssues(plan, reference),
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
    const [includeOwned, setIncludeOwned] = useState(false);
    const [exported, setExported] = useState("");
    const nodes = new Map(result.nodes.map(node => [node.item.id, node]));
    const names = result.nodes
        .filter(
            node =>
                node.item.searchable &&
                !node.item.ambiguous &&
                ((node.mode === "buy" &&
                    node.complete &&
                    (node.missing ?? 0) > 0) ||
                    node.target > 0 ||
                    (includeOwned && (node.usedOwned ?? 0) > node.ownedTarget))
        )
        .map(node => node.item.name);
    const market = useMaterialMarket(
        names,
        (name, quote) =>
            update(p => ({ ...p, quotes: { ...p.quotes, [name]: quote } })),
        state.epoch,
        ready && !catalog.pending
    );
    useEffect(() => {
        setExported("");
    }, [state.epoch]);
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
    const text = () => craftingText(plan, result, prices);
    async function copy(value: string) {
        setExported(value);
        try {
            await navigator.clipboard.writeText(value);
            setNotice("복사했습니다.");
        } catch {
            setNotice(
                "자동 복사를 사용할 수 없습니다. 아래 텍스트를 선택해 복사해 주세요."
            );
        }
    }
    function download() {
        const value = text();
        setExported(value);
        const url = URL.createObjectURL(
            new Blob([value], { type: "text/plain;charset=utf-8" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "crafting-preparation.txt";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    const money = (value: CraftingCost) => (
        <>
            <span>{formatGold(value.known)} Gold</span>
            {!value.complete && <span className={s.muted}> · 확인된 소계</span>}
        </>
    );
    const difference = (value: number | null) =>
        value === null
            ? "동일 조건의 가격과 제작 조건 확인 필요"
            : `${value < 0 ? "제작에 더 필요 " : "구매보다 적게 필요 "}${formatGold(Math.abs(value))} Gold`;
    const visited = new Set(plan.targets.map(target => target.itemId));
    function tree(id: number, depth = 0): React.ReactNode {
        const node = nodes.get(id);
        if (!node) return null;
        if (visited.has(id))
            return (
                <li key={id}>
                    <a href={`#craft-node-${id}`}>
                        {node.item.name} · 전체 제작품에서 합산된 설정 보기
                    </a>
                </li>
            );
        visited.add(id);
        return (
            <li key={id} id={`craft-node-${id}`}>
                <details>
                    <summary>
                        {node.item.name} · 전체 필요{" "}
                        {node.complete ? node.required : "미확인"}개 ·{" "}
                        {node.mode === "craft" ? "직접 제작" : "구매"}
                    </summary>
                    <p className={s.muted}>
                        이 재료를 사용하는 모든 제작품에 적용합니다.
                    </p>
                    <RecipeEditor
                        id={id}
                        plan={plan}
                        update={update}
                        reference={reference}
                    />
                    <StockField node={node} plan={plan} update={update} />
                    <p>
                        보유분 사용 {node.usedOwned ?? "미확인"}개 · 제작{" "}
                        {node.batches ?? "미확인"}회 · 남음{" "}
                        {node.surplus ?? "미확인"}개
                    </p>
                    <PriceEditor
                        node={node}
                        plan={plan}
                        update={update}
                        error={market.errors[node.item.name]}
                    />
                    {depth < 32 && (
                        <ul className={c.tree}>
                            {node.children.map(child => tree(child, depth + 1))}
                        </ul>
                    )}
                </details>
            </li>
        );
    }
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
                            ? "공유·가져온 계획을 임시로 열었습니다. 기존 계획과 재고는 변경하지 않습니다."
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
                    물물교환에서 부족한 재료를 가져왔어요. 이미 배정한 보유분은
                    차감된 수량입니다. 추가 재고는 물물교환에 배정하고 남은
                    수량만 입력하세요.
                </p>
            )}
            {craftingPlanIssues(plan, reference).length > 0 &&
                !catalog.pending && (
                    <details className={s.notice}>
                        <summary>변경된 제작법·아이템 입력 관리</summary>
                        <p>
                            기존 입력은 목록 복사로 보관할 수 있습니다. 제작법을
                            초기화하면 조건을 다시 입력해야 합니다.
                        </p>
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
                                                [id]: emptyCraftingChoice(
                                                    "craft"
                                                ),
                                            },
                                            checked: [],
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
                                ...Object.keys(plan.owned).map(Number),
                                ...Object.keys(plan.prices).map(Number),
                                ...Object.keys(plan.comparisons).map(Number),
                                ...plan.checked,
                            ]),
                        ]
                            .filter(
                                id =>
                                    !reference.items.some(
                                        item => item.id === id
                                    )
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
                                                    target =>
                                                        target.itemId !== id
                                                ),
                                                choices: omit(p.choices),
                                                owned: omit(p.owned),
                                                prices: omit(p.prices),
                                                comparisons: omit(
                                                    p.comparisons
                                                ),
                                                checked: p.checked.filter(
                                                    itemId => itemId !== id
                                                ),
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
                                                                        p
                                                                            .choices[
                                                                            item
                                                                                .id
                                                                        ] ??
                                                                        emptyCraftingChoice(
                                                                            "craft"
                                                                        ),
                                                                },
                                                                checked: [],
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
                                const node = nodes.get(target.itemId);
                                if (!node) return null;
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
                                                        checked: [],
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
                                                            checked: [],
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <StockField
                                                node={node}
                                                plan={plan}
                                                update={update}
                                            />
                                            {node.missing === 0 &&
                                            node.complete ? (
                                                <p className={s.badge}>
                                                    보유분으로 충분 · 새로
                                                    제작하지 않아도 됩니다.
                                                </p>
                                            ) : (
                                                <RecipeEditor
                                                    id={target.itemId}
                                                    plan={plan}
                                                    update={update}
                                                    reference={reference}
                                                />
                                            )}
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
                                            {node.children.length > 0 && (
                                                <details open>
                                                    <summary>
                                                        필요한 재료 보기 · 전체
                                                        계획에서 합산
                                                    </summary>
                                                    <ul className={c.tree}>
                                                        {node.children.map(
                                                            child => tree(child)
                                                        )}
                                                    </ul>
                                                </details>
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
                                나의 준비 목록
                            </h2>
                            <div className={s.summaryStats}>
                                <div>
                                    <p>더 준비할 재료</p>
                                    <strong>
                                        {
                                            result.shopping.filter(
                                                node => (node.missing ?? 0) > 0
                                            ).length
                                        }
                                        종
                                    </strong>
                                </div>
                                <div>
                                    <p>준비 완료</p>
                                    <strong>
                                        {
                                            plan.checked.filter(id =>
                                                result.shopping.some(
                                                    node => node.item.id === id
                                                )
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
                                    {result.shopping.map(node => (
                                        <ShoppingRow
                                            key={node.item.id}
                                            node={node}
                                            plan={plan}
                                            update={update}
                                            error={
                                                market.errors[node.item.name]
                                            }
                                        />
                                    ))}
                                    <div className={s.cost}>
                                        <dl className={c.totals}>
                                            <div>
                                                <dt>추가 구매 비용</dt>
                                                <dd>{money(costs.purchase)}</dd>
                                            </div>
                                            <div>
                                                <dt>보유 재료 사용 가치</dt>
                                                <dd>{money(costs.owned)}</dd>
                                            </div>
                                            <div>
                                                <dt>재료 가치 기준 원가</dt>
                                                <dd>
                                                    {money(costs.materialValue)}
                                                </dd>
                                            </div>
                                        </dl>
                                        {costs.materialValue.unresolved.length >
                                            0 && (
                                            <p className={s.error}>
                                                가격·수량 확인 필요:{" "}
                                                {[
                                                    ...new Set(
                                                        costs.materialValue
                                                            .unresolved
                                                    ),
                                                ].join(" / ")}
                                            </p>
                                        )}
                                        <p className={s.muted}>
                                            보유 완제품으로 충당한 수량은 양쪽
                                            비교에서 제외합니다. 잉여 생산분은
                                            판매 수익으로 계산하지 않습니다.
                                        </p>
                                        <details>
                                            <summary>
                                                추가 비용·보유 재료 가치
                                            </summary>
                                            <NumberField
                                                label="계획 전체 일회성 비용 (Gold)"
                                                value={plan.fee}
                                                onChange={fee =>
                                                    update(p => ({ ...p, fee }))
                                                }
                                            />
                                            {result.nodes
                                                .filter(
                                                    node =>
                                                        node.mode === "craft" &&
                                                        (node.usedOwned ?? 0) >
                                                            node.ownedTarget
                                                )
                                                .map(node => (
                                                    <div key={node.item.id}>
                                                        <p>
                                                            {node.item.name} ·
                                                            보유분{" "}
                                                            {node.usedOwned! -
                                                                node.ownedTarget}
                                                            개 사용
                                                        </p>
                                                        <PriceEditor
                                                            node={node}
                                                            plan={plan}
                                                            update={update}
                                                            error={
                                                                market.errors[
                                                                    node.item
                                                                        .name
                                                                ]
                                                            }
                                                        />
                                                    </div>
                                                ))}
                                        </details>
                                        <label className="my-3 block">
                                            <input
                                                type="checkbox"
                                                checked={includeOwned}
                                                onChange={event =>
                                                    setIncludeOwned(
                                                        event.target.checked
                                                    )
                                                }
                                            />{" "}
                                            보유 재료 시세도 포함
                                        </label>
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
                                            선택한 항목 시세 조회
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
                                        <details className={c.comparison}>
                                            <summary>
                                                완제품 구매와 비교
                                            </summary>
                                            <p className={s.muted}>
                                                등록 최저가는 품질·인챈트·세공이
                                                섞인 참고 가격입니다. 같은
                                                조건의 완제품 단가를 직접 입력해
                                                주세요.
                                            </p>
                                            {costs.comparisonRows.map(row => {
                                                const item = nodes.get(
                                                    row.itemId
                                                )!.item;
                                                const comparison = plan
                                                    .comparisons[
                                                    row.itemId
                                                ] ?? {
                                                    price: "",
                                                    comparable: false,
                                                    note: "",
                                                };
                                                const change = (
                                                    patch: Partial<
                                                        typeof comparison
                                                    >
                                                ) =>
                                                    update(p => ({
                                                        ...p,
                                                        comparisons: {
                                                            ...p.comparisons,
                                                            [row.itemId]: {
                                                                ...comparison,
                                                                ...patch,
                                                            },
                                                        },
                                                    }));
                                                const quote =
                                                    plan.quotes[item.name];
                                                return (
                                                    <div
                                                        key={row.itemId}
                                                        className={c.conditions}
                                                    >
                                                        <strong>
                                                            {item.name} · 비교
                                                            수량{" "}
                                                            {row.count ??
                                                                "미확인"}
                                                            개
                                                        </strong>
                                                        <NumberField
                                                            label={`${item.name} 동일 조건 완제품 단가 (Gold)`}
                                                            optional
                                                            value={
                                                                comparison.price
                                                            }
                                                            onChange={price =>
                                                                change({
                                                                    price,
                                                                })
                                                            }
                                                        />
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    comparison.comparable
                                                                }
                                                                onChange={event =>
                                                                    change({
                                                                        comparable:
                                                                            event
                                                                                .target
                                                                                .checked,
                                                                    })
                                                                }
                                                            />{" "}
                                                            제작 결과와 동일한
                                                            조건의 가격이에요
                                                        </label>
                                                        <label
                                                            className={c.field}
                                                        >
                                                            비교 조건
                                                            <input
                                                                className={
                                                                    s.input
                                                                }
                                                                value={
                                                                    comparison.note
                                                                }
                                                                maxLength={200}
                                                                onChange={event =>
                                                                    change({
                                                                        note: event
                                                                            .target
                                                                            .value,
                                                                    })
                                                                }
                                                                placeholder="품질·옵션 등"
                                                            />
                                                        </label>
                                                        {quote && (
                                                            <p
                                                                className={
                                                                    s.muted
                                                                }
                                                            >
                                                                아이템 전체 참고
                                                                최저가{" "}
                                                                {quote.availableQuantity ===
                                                                    0 ||
                                                                !Number.isSafeInteger(
                                                                    quote.minPrice
                                                                )
                                                                    ? "미확인"
                                                                    : formatGold(
                                                                          quote.minPrice
                                                                      )}{" "}
                                                                Gold ·{" "}
                                                                {quote.availableQuantity ===
                                                                0
                                                                    ? "매물 없음"
                                                                    : quote.isComplete
                                                                      ? "전체 조회"
                                                                      : "부분 조회"}{" "}
                                                                ·{" "}
                                                                {quote.fetchedAt ??
                                                                    quote.observedAt}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <dl className={c.totals}>
                                                <div>
                                                    <dt>완제품 구매 비용</dt>
                                                    <dd>
                                                        {money(costs.direct)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt>
                                                        구매 대비 추가 지출 차이
                                                    </dt>
                                                    <dd>
                                                        {difference(
                                                            costs.cashDifference
                                                        )}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt>
                                                        구매 대비 재료 가치 차이
                                                    </dt>
                                                    <dd>
                                                        {difference(
                                                            costs.valueDifference
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </details>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className={s.exports}>
                            <button
                                type="button"
                                className="btn btn-sm"
                                disabled={!plan.targets.length}
                                onClick={() => void copy(text())}
                            >
                                목록 복사
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm"
                                disabled={!plan.targets.length}
                                onClick={download}
                            >
                                다운로드
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm"
                                disabled={!plan.targets.length}
                                onClick={() => {
                                    try {
                                        void copy(
                                            new URL(
                                                buildCraftingShare(plan),
                                                window.location.origin
                                            ).toString()
                                        );
                                    } catch (error) {
                                        setNotice((error as Error).message);
                                        setExported(text());
                                    }
                                }}
                            >
                                공유 링크 복사
                            </button>
                        </div>
                        {exported && (
                            <textarea
                                readOnly
                                className={`${s.input} ${c.export}`}
                                aria-label="내보낸 계획"
                                value={exported}
                            />
                        )}
                    </section>
                </div>
            </fieldset>
            {!!plan.targets.length && (
                <a
                    className={`${s.mobileJump} ${c.mobile}`}
                    href="#crafting-shopping"
                >
                    준비 목록 · {result.shopping.length}종{" "}
                    <span>확인하기 ↓</span>
                </a>
            )}
        </div>
    );
}
