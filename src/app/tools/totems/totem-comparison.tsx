import { useRef } from "react";

import {
    comparisonTotemKeys,
    evaluateTotem,
    formatTotemValue,
    manualTotemRoll,
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

export function TotemComparison({
    data,
    state,
}: {
    data: TotemReference;
    state: ReturnType<typeof useTotemConfig>;
}) {
    const section = useRef<HTMLElement>(null);
    const { config } = state;
    const baselineItem = data.totems.find(r => r.id === config.baseline?.id);
    const baseline = config.baseline
        ? manualTotemRoll(baselineItem, config.baseline.values)
        : null;
    const rows = config.candidates.map(candidate => ({
        candidate,
        roll: candidateTotemRoll(candidate, data),
    }));
    const allKeys = comparisonTotemKeys([
        ...rows.map(r => r.roll),
        ...(baseline ? [baseline] : []),
    ]);
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
            <p>
                내 기준:{" "}
                {config.baseline
                    ? (baselineItem?.name ??
                      `미확인 토템 ID ${config.baseline.id}`)
                    : "미입력 · 실제 옵션을 입력하면 증감을 볼 수 있습니다."}
            </p>
            {!rows.length ? (
                <p>
                    원본 범위, 직접 입력한 토템 또는 실제 매물을 최대 네 개까지
                    담아 비교하세요.
                </p>
            ) : (
                <>
                    <table className={s.comparisonTable}>
                        <caption className="sr-only">
                            토템별 실제 옵션, 기준 대비 증감, 참고 범위와 가격
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">능력치</th>
                                <th scope="col">내 기준</th>
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
                                    <td>
                                        {baseline
                                            ? formatTotemValue(
                                                  key,
                                                  evaluateTotem(key, baseline)
                                                      .value
                                              )
                                            : "미입력"}
                                    </td>
                                    {rows.map(({ candidate, roll }) => (
                                        <td key={candidate.key}>
                                            <TotemEvaluationCell
                                                evaluation={evaluateTotem(
                                                    key,
                                                    roll,
                                                    baseline
                                                )}
                                                hasBaseline={!!baseline}
                                                price={
                                                    key === config.targetStat
                                                        ? candidateTotemPrice(
                                                              candidate
                                                          )
                                                        : undefined
                                                }
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr>
                                <th scope="row">가격·조회 정보</th>
                                <td>
                                    개당 예산{" "}
                                    {budget === null
                                        ? "미입력"
                                        : `${budget.toLocaleString("ko-KR")} 골드`}
                                </td>
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
                                <td>
                                    {baseline && (
                                        <TotemEvidence roll={baseline} />
                                    )}
                                </td>
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
                                                        roll,
                                                        baseline
                                                    )}
                                                    hasBaseline={!!baseline}
                                                    price={
                                                        key ===
                                                        config.targetStat
                                                            ? candidateTotemPrice(
                                                                  candidate
                                                              )
                                                            : undefined
                                                    }
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
                <button
                    onClick={() => void state.share()}
                    disabled={!state.ready}
                >
                    비교 링크 공유
                </button>
                <button
                    onClick={() => void state.share(true)}
                    disabled={!state.ready}
                >
                    설정만 공유
                </button>
                {!!rows.length && (
                    <button onClick={() => remove()}>후보 전체 해제</button>
                )}
            </div>
            {state.shareNotice && (
                <p className={s.notice} role="status">
                    {state.shareNotice}
                </p>
            )}
            {state.shareUrl && (
                <label>
                    복사할 비교 주소
                    <input
                        readOnly
                        value={state.shareUrl}
                        onFocus={e => e.currentTarget.select()}
                    />
                </label>
            )}
        </section>
    );
}
