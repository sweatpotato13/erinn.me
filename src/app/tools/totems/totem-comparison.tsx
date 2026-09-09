import { useRef } from "react";

import {
    comparisonTotemKeys,
    evaluateTotem,
    parseTotemGold,
    type TotemReference,
    totemStatLabel,
} from "@/lib/totems";
import {
    candidateTotemPrice,
    candidateTotemRoll,
    type TotemCandidate,
} from "@/lib/totems-state";

import type { useTotemConfig } from "./totem-hooks";
import s from "./totem-tool.module.css";
import {
    candidateLabel,
    TotemAuctionLink,
    TotemEvaluationCell,
    TotemEvidence,
    totemGoldText,
    TotemPrice,
} from "./totem-ui";

interface TotemComparisonProps {
    data: TotemReference;
    state: ReturnType<typeof useTotemConfig>;
}

export function TotemComparison({ data, state }: TotemComparisonProps) {
    const section = useRef<HTMLElement>(null);
    const { config } = state;
    const rows = config.candidates.map(candidate => ({
        candidate,
        roll: candidateTotemRoll(candidate, data),
    }));
    const allKeys = comparisonTotemKeys(rows.map(r => r.roll));
    const keys =
        config.targetStat !== "all" && allKeys.includes(config.targetStat)
            ? [
                  config.targetStat,
                  ...allKeys.filter(k => k !== config.targetStat),
              ]
            : allKeys;
    const budget = parseTotemGold(config.budget);
    function remove(key?: string) {
        state.remove(key);
        section.current?.focus({ preventScroll: true });
    }
    function title(candidate: TotemCandidate) {
        return candidate.kind === "listing"
            ? candidate.item.item_display_name
            : (data.totems.find(r => r.id === candidate.id)?.name ??
                  `미확인 토템 ID ${candidate.id}`);
    }
    const header = (candidate: TotemCandidate) => (
        <>
            <h3>{title(candidate)}</h3>
            <p className={s.muted}>
                {state.historicalKeys.includes(candidate.key)
                    ? "공유된 당시 매물"
                    : candidateLabel(candidate)}
            </p>
            <p>
                <strong className={s.value}>
                    {totemGoldText(candidateTotemPrice(candidate))}
                </strong>{" "}
                / 개
                {state.historicalKeys.includes(candidate.key)
                    ? " · 당시 등록 가격"
                    : ""}
            </p>
            <button
                onClick={() => remove(candidate.key)}
                aria-label={`${title(candidate)} 비교 제거`}
            >
                비교 제거
            </button>
        </>
    );
    return (
        <section
            ref={section}
            tabIndex={-1}
            id="totem-comparison"
            className={`${s.panel} ${s.comparison}`}
            aria-label="후보 비교"
        >
            <h2>후보 비교 · {rows.length} / 4</h2>
            {config.snapshotVersion !== data.version && (
                <p className={s.warning}>
                    데이터 버전이 달라 현재 범위로 비교합니다. 최댓값 가정과
                    실제 옵션은 저장 당시 값을 유지합니다.
                </p>
            )}
            {state.historicalKeys.some(key =>
                config.candidates.some(c => c.key === key)
            ) && (
                <p className={s.warning}>
                    공유된 당시 매물입니다. 조회 시각은 공유자가 제공한
                    정보이며, 현재 판매 여부와 가격을 보장하지 않습니다.
                </p>
            )}
            {!rows.length ? (
                <p>
                    원본 범위, 직접 입력한 토템 또는 실제 매물을 최대 네 개까지
                    담아 비교하세요.
                </p>
            ) : (
                <>
                    <table className={s.comparisonTable}>
                        <caption className="sr-only">
                            토템별 실제 옵션, 참고 범위와 가격
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">능력치</th>
                                {rows.map(({ candidate }) => (
                                    <th key={candidate.key} scope="col">
                                        {header(candidate)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map(key => (
                                <tr key={key}>
                                    <th scope="row">{totemStatLabel(key)}</th>
                                    {rows.map(({ candidate, roll }) => (
                                        <td key={candidate.key}>
                                            <TotemEvaluationCell
                                                evaluation={evaluateTotem(
                                                    key,
                                                    roll
                                                )}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr>
                                <th scope="row">가격·조회 정보</th>
                                {rows.map(({ candidate }) => (
                                    <td key={candidate.key}>
                                        <TotemPrice
                                            candidate={candidate}
                                            budget={budget}
                                            historical={state.historicalKeys.includes(
                                                candidate.key
                                            )}
                                        />
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <th scope="row">확인 근거</th>
                                {rows.map(({ candidate, roll }) => (
                                    <td key={candidate.key}>
                                        <TotemEvidence roll={roll} />
                                        {candidate.kind === "listing" && (
                                            <TotemAuctionLink
                                                name={candidate.item.item_name}
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                    <div className={s.mobileCards}>
                        {rows.map(({ candidate, roll }) => (
                            <article
                                className={s.entry}
                                key={candidate.key}
                                aria-label={`${title(candidate)} 비교 카드`}
                            >
                                {header(candidate)}
                                <dl className={s.statList}>
                                    {keys.map(key => (
                                        <div key={key}>
                                            <dt>{totemStatLabel(key)}</dt>
                                            <dd>
                                                <TotemEvaluationCell
                                                    evaluation={evaluateTotem(
                                                        key,
                                                        roll
                                                    )}
                                                />
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <TotemPrice
                                    candidate={candidate}
                                    budget={budget}
                                    historical={state.historicalKeys.includes(
                                        candidate.key
                                    )}
                                />
                                <TotemEvidence roll={roll} />
                                {candidate.kind === "listing" && (
                                    <TotemAuctionLink
                                        name={candidate.item.item_name}
                                    />
                                )}
                            </article>
                        ))}
                    </div>
                </>
            )}
            <div className={s.actions}>
                {!!rows.length && (
                    <button onClick={() => remove()}>후보 전체 해제</button>
                )}
            </div>
        </section>
    );
}
