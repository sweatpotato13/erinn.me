import {
    type Dispatch,
    type ReactElement,
    type RefObject,
    type SetStateAction,
    useState,
} from "react";

import {
    effectLabel,
    filterMiniatures,
    type Miniature,
    MINIATURE_EFFECTS,
    miniatureDelta,
    miniatureGold,
    type MiniatureReference,
} from "@/lib/miniatures";

import type {
    MiniatureCandidates,
    MiniatureInstallations,
    MiniaturePrices,
} from "./miniature-hooks";
import {
    Auction,
    Effects,
    Icon,
    InstallationToggle,
    ItemEffects,
    styles,
    typeName,
    TypeSelect,
} from "./miniature-ui";

interface CatalogProps {
    data: MiniatureReference;
    installations: MiniatureInstallations;
    candidates: MiniatureCandidates;
    prices: MiniaturePrices;
    searchRef: RefObject<HTMLInputElement | null>;
}
interface CatalogFilters {
    search: string;
    type: string;
    minimum: string;
    budget: string;
    auctionOnly: boolean;
}
interface FilterProps {
    filters: CatalogFilters;
    setFilters: Dispatch<SetStateAction<CatalogFilters>>;
    candidates: MiniatureCandidates;
}
interface CatalogResults {
    visible: Miniature[];
    priced: Miniature[];
    unknown: Miniature[];
    budget: number | null;
}
function catalogResults(
    props: CatalogProps,
    filters: CatalogFilters
): CatalogResults {
    const minimum =
        filters.minimum.trim() !== "" &&
        Number.isFinite(Number(filters.minimum)) &&
        Number(filters.minimum) >= 0
            ? Number(filters.minimum)
            : null;
    const results = filterMiniatures(props.data.miniatures, {
        ...filters,
        stat: props.candidates.config.targetStat,
        minimum,
    });
    const budget = miniatureGold(filters.budget);
    const { price } = props.prices;
    const visible = results.filter(
        item =>
            budget === null || price(item) === null || price(item)! <= budget
    );
    const unknown =
        budget === null ? [] : visible.filter(item => price(item) === null);
    const priced =
        budget === null
            ? visible
            : visible.filter(item => price(item) !== null);
    return { visible, unknown, priced, budget };
}
function CatalogStatFilters({
    filters,
    setFilters,
    candidates,
}: FilterProps): ReactElement {
    return (
        <div className={styles.controls}>
            <label>
                목표 능력치
                <select
                    value={candidates.config.targetStat}
                    onChange={e =>
                        candidates.setConfig(c => ({
                            ...c,
                            targetStat: e.target.value,
                        }))
                    }
                >
                    <option value="all">전체</option>
                    {Object.keys(MINIATURE_EFFECTS).map(key => (
                        <option key={key} value={key}>
                            {effectLabel(key)}
                        </option>
                    ))}
                </select>
            </label>
            <TypeSelect
                label="후보 종류"
                value={filters.type}
                onChange={type => setFilters(f => ({ ...f, type }))}
            />
        </div>
    );
}
function AdvancedFilters({
    filters,
    setFilters,
    candidates,
}: FilterProps): ReactElement {
    return (
        <details>
            <summary>상세 필터</summary>
            <label>
                후보 자체 능력치 최솟값
                <input
                    disabled={candidates.config.targetStat === "all"}
                    type="number"
                    min="0"
                    step="any"
                    value={filters.minimum}
                    onChange={e =>
                        setFilters(f => ({ ...f, minimum: e.target.value }))
                    }
                />
            </label>
            <label>
                개당 예산 (Gold)
                <input
                    inputMode="numeric"
                    value={filters.budget}
                    onChange={e =>
                        setFilters(f => ({ ...f, budget: e.target.value }))
                    }
                />
            </label>
            {filters.budget !== "" &&
                miniatureGold(filters.budget) === null && (
                    <p>예산은 안전한 범위의 0 이상 정수로 입력하세요.</p>
                )}
            <p>
                예산은 확인된 개당 가격에만 적용합니다. 가격 미확인 항목은
                별도로 표시합니다.
            </p>
        </details>
    );
}
function CatalogFilterControls(props: FilterProps): ReactElement {
    const { filters, setFilters, candidates } = props;
    return (
        <>
            <CatalogStatFilters {...props} />
            <p>
                {candidates.config.targetStat === "all"
                    ? "모든 능력치의 미니어처를 검색합니다."
                    : "선택한 능력치 효과가 있는 미니어처만 표시합니다."}
            </p>
            <label className={styles.check}>
                <input
                    type="checkbox"
                    checked={filters.auctionOnly}
                    onChange={e =>
                        setFilters(f => ({
                            ...f,
                            auctionOnly: e.target.checked,
                        }))
                    }
                />
                경매장 검색 가능만
            </label>
            <AdvancedFilters {...props} />
        </>
    );
}
function CatalogCard({
    item,
    data,
    installations,
    candidates,
}: Pick<CatalogProps, "data" | "installations" | "candidates"> & {
    item: Miniature;
}): ReactElement {
    const selected = candidates.config.candidateIds.includes(item.id);
    const changes = miniatureDelta(data.miniatures, installations.installed, [
        item.id,
    ]).delta;
    return (
        <article
            className={styles.entry}
            aria-label={item.name}
            data-selected={selected}
        >
            <div className={styles.row}>
                <Icon item={item} />
                <div>
                    <h3>{item.name}</h3>
                    <span>
                        {typeName(item)}
                        {selected ? " · ✓ 비교 중" : ""}
                    </span>
                    <ItemEffects item={item} changes={changes} />
                </div>
            </div>
            <div className={styles.controls}>
                <InstallationToggle item={item} installations={installations} />
                <button
                    disabled={selected}
                    onClick={() => candidates.add(item)}
                >
                    비교 추가
                </button>
                <Auction item={item} />
            </div>
            <Effects item={item} />
        </article>
    );
}
function CatalogGroups({
    results,
    ...props
}: CatalogProps & { results: CatalogResults }): ReactElement {
    const groups = [
        {
            label: results.budget === null ? "검색 결과" : "예산 이내",
            items: results.priced,
        },
        { label: "가격 미확인 · 예산 판정 제외", items: results.unknown },
    ].filter(group => group.items.length);
    return (
        <div className={styles.catalog}>
            {results.visible.length === 0 && <p>검색 결과가 없습니다.</p>}
            {groups.map(group => (
                <section key={group.label} aria-label={group.label}>
                    {results.budget !== null && (
                        <h3>
                            {group.label} · {group.items.length}개
                        </h3>
                    )}
                    {group.items.map(item => (
                        <CatalogCard key={item.id} item={item} {...props} />
                    ))}
                </section>
            ))}
        </div>
    );
}
export function MiniatureCatalog(props: CatalogProps): ReactElement {
    const [filters, setFilters] = useState<CatalogFilters>({
        search: "",
        type: "all",
        minimum: "",
        budget: "",
        auctionOnly: false,
    });
    const results = catalogResults(props, filters);
    const stat = props.candidates.config.targetStat;
    return (
        <section className={styles.panel} aria-label="미니어처 찾기">
            <h2>미니어처 찾기</h2>
            <label>
                미니어처 검색
                <input
                    ref={props.searchRef}
                    value={filters.search}
                    placeholder="이름·효과 검색"
                    onChange={e =>
                        setFilters(f => ({ ...f, search: e.target.value }))
                    }
                />
            </label>
            <CatalogFilterControls
                filters={filters}
                setFilters={setFilters}
                candidates={props.candidates}
            />
            <p>
                {results.visible.length}개 ·{" "}
                {stat === "all"
                    ? "최신순 (등록 ID 기준)"
                    : `${effectLabel(stat)} 높은 순`}
            </p>
            <CatalogGroups {...props} results={results} />
        </section>
    );
}
