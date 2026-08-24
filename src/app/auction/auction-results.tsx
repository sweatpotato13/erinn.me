import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { type RefObject, useRef, useState } from "react";

import { AuctionComparison } from "@/app/auction/auction-comparison";
import type {
    AuctionItem,
    AuctionSale,
    AuctionSummary,
    ItemOption,
    RecentSalesState,
    RecentSalesSummary,
    SortDirection,
} from "@/app/auction/types";
import type { AuctionOptionEvaluation } from "@/app/auction/use-auction-search";
import { MAX_COMPARISON_ITEMS } from "@/app/auction/use-comparison-selection";
import { useDialogFocus } from "@/app/auction/use-dialog-focus";
import { getItemImageUrl } from "@/lib/utils";

const OptionRenderer = dynamic(() => import("@/components/option-renderer"), {
    ssr: false,
});
const ITEMS_PER_PAGE = 10;
const RECENT_SALES_LIMIT = 10;
const numberFormatter = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
});
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "medium",
});

/**
 * Renders a clickable auction item row with its image, name, price, quantity, and expiration time.
 *
 * @param item - The auction item to display
 * @param onClick - The callback invoked when the row is clicked
 */
function AuctionRow({
    item,
    onClick,
    selectedForComparison,
    onToggleComparison,
}: {
    item: AuctionItem;
    onClick: () => void;
    selectedForComparison: boolean;
    onToggleComparison: () => void;
}) {
    return (
        <tr className="hover:bg-gray-100">
            <td className="w-[50px] hidden md:table-cell">
                <Image
                    src={getItemImageUrl(item.item_name)}
                    alt={item.item_name}
                    width={40}
                    height={40}
                    sizes="40px"
                    className="object-contain cursor-pointer"
                    priority={false}
                    unoptimized={true}
                />
            </td>
            <td className="font-medium">
                <button
                    type="button"
                    className="underline text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    onClick={onClick}
                >
                    {item.item_display_name}
                </button>
            </td>
            <td>{item.auction_price_per_unit.toLocaleString()} Gold</td>
            <td>{item.item_count}</td>
            <td>{item.date_auction_expire}</td>
            <td>
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    aria-label={`${item.item_display_name}, ${item.auction_price_per_unit.toLocaleString()} Gold, ${item.item_count}개, 만료 ${item.date_auction_expire} 비교 선택`}
                    aria-describedby="auction-comparison-selection-help"
                    checked={selectedForComparison}
                    onChange={onToggleComparison}
                />
            </td>
        </tr>
    );
}

type TableProps = {
    items: AuctionItem[];
    currentPage: number;
    isEmpty: boolean;
    sortDirection: SortDirection;
    onSort: () => void;
    onItemClick: (item: AuctionItem) => void;
    comparisonItems: AuctionItem[];
    onToggleComparison: (item: AuctionItem) => void;
};

function ResultsHeader({
    sortDirection,
    onSort,
}: Pick<TableProps, "sortDirection" | "onSort">) {
    const indicator =
        sortDirection === "asc" ? "↑" : sortDirection === "desc" ? "↓" : "";
    return (
        <thead>
            <tr>
                <th className="w-[50px] hidden md:table-cell"></th>
                <th className="w-[45%]">아이템명</th>
                <th>
                    <button
                        type="button"
                        className="w-full text-left p-2 hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        onClick={onSort}
                    >
                        가격 {indicator}
                    </button>
                </th>
                <th>갯수</th>
                <th>만료 시간</th>
                <th>
                    비교
                    <span
                        id="auction-comparison-selection-help"
                        className="sr-only"
                    >
                        최대 {MAX_COMPARISON_ITEMS}개까지 선택할 수 있습니다.
                    </span>
                </th>
            </tr>
        </thead>
    );
}

/**
 * Displays a paginated auction results table with sortable prices and selectable items.
 *
 * @param props - Table data, pagination state, sorting state, and interaction handlers.
 * @returns The rendered auction results table.
 */
function ResultsTable(props: TableProps) {
    const pageItems = props.items.slice(
        (props.currentPage - 1) * ITEMS_PER_PAGE,
        props.currentPage * ITEMS_PER_PAGE
    );
    return (
        <div className="overflow-auto h-[50%] rounded-md border">
            <table className="table w-full">
                <ResultsHeader {...props} />
                <tbody>
                    {props.isEmpty ? (
                        <tr>
                            <td colSpan={6} className="text-center">
                                결과가 없습니다.
                            </td>
                        </tr>
                    ) : (
                        pageItems.map(item => (
                            <AuctionRow
                                key={item.listingId}
                                item={item}
                                onClick={() => props.onItemClick(item)}
                                selectedForComparison={props.comparisonItems.includes(
                                    item
                                )}
                                onToggleComparison={() =>
                                    props.onToggleComparison(item)
                                }
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Provides controls for navigating through paginated results.
 *
 * @param currentPage - The currently selected page
 * @param itemCount - The total number of items across all pages
 * @param setCurrentPage - Updates the selected page
 * @returns Pagination controls with previous and next buttons
 */
function Pagination({
    currentPage,
    itemCount,
    setCurrentPage,
}: {
    currentPage: number;
    itemCount: number;
    setCurrentPage: (update: (page: number) => number) => void;
}) {
    const totalPages = Math.ceil(itemCount / ITEMS_PER_PAGE);
    if (totalPages === 0) return null;
    return (
        <div className="flex items-center justify-between mt-4">
            <button
                type="button"
                aria-label="이전 페이지"
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
                {currentPage} / {totalPages}
            </span>
            <button
                type="button"
                aria-label="다음 페이지"
                className="btn btn-outline btn-sm"
                onClick={() =>
                    setCurrentPage(page => Math.min(page + 1, totalPages))
                }
                disabled={currentPage >= totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/**
 * Displays an item's options in a dialog with a control to close it.
 *
 * @param options - The options to display.
 * @param onClose - Invoked when the dialog is closed.
 */
export function ItemOptionsDialog({
    options,
    onClose,
}: {
    options: ItemOption[];
    onClose: () => void;
}) {
    const dialogRef = useDialogFocus(onClose);
    return (
        <div className="fixed inset-0 flex items-start justify-center z-50">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="item-options-dialog-title"
                tabIndex={-1}
                className="bg-white border p-4 rounded-lg shadow-lg outline-none"
            >
                <h2
                    id="item-options-dialog-title"
                    className="text-lg font-bold"
                >
                    아이템 옵션
                </h2>
                <div className="mt-2">
                    {options.length > 0 ? (
                        <OptionRenderer options={options} />
                    ) : (
                        <div>옵션이 없습니다.</div>
                    )}
                </div>
                <button className="btn btn-outline mt-4" onClick={onClose}>
                    닫기
                </button>
            </div>
        </div>
    );
}

type AuctionResultsProps = Omit<TableProps, "isEmpty"> & {
    summary: AuctionSummary | null;
    hasMore: boolean;
    refreshedAt: string | null;
    errorMessage: string | null;
    loading: boolean;
    optionEvaluation: AuctionOptionEvaluation | null;
    recentSales: RecentSalesState;
    comparisonNotice: string | null;
    onRemoveComparison: (item: AuctionItem) => void;
    onClearComparison: () => void;
    setCurrentPage: (update: (page: number) => number) => void;
};

interface SummaryMetricProps {
    label: string;
    value: string;
}

function SummaryMetric({ label, value }: SummaryMetricProps) {
    return (
        <div>
            <dt className="text-sm text-base-content/70">{label}</dt>
            <dd className="font-semibold">{value}</dd>
        </div>
    );
}

function CurrentListingsMetrics({
    summary,
    hasMore,
}: Pick<AuctionResultsProps, "summary" | "hasMore">) {
    return (
        <>
            {summary ? (
                <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <SummaryMetric
                        label="최저 단가"
                        value={`${numberFormatter.format(summary.lowestUnitPrice)} Gold`}
                    />
                    <SummaryMetric
                        label="매물 단가 중앙값"
                        value={`${numberFormatter.format(summary.medianUnitPrice)} Gold`}
                    />
                    <SummaryMetric
                        label="매물 수"
                        value={`${numberFormatter.format(summary.listingCount)}개`}
                    />
                    <SummaryMetric
                        label="총 수량"
                        value={`${numberFormatter.format(summary.totalQuantity)}개`}
                    />
                </dl>
            ) : (
                <p>현재 검색 조건에 유효한 매물이 없습니다.</p>
            )}
            {hasMore && (
                <p className="alert alert-warning mt-3 text-sm">
                    현재 불러온 일부 매물만 반영한 요약입니다.
                </p>
            )}
        </>
    );
}

function CurrentListingsHeader(props: AuctionResultsProps) {
    return (
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h3 id="current-listings-title" className="text-lg font-bold">
                    현재 등록 매물
                </h3>
                <p className="text-sm text-base-content/70">
                    판매자가 현재 제시한 매물의 가격과 수량입니다.
                </p>
            </div>
            {props.refreshedAt && !props.loading && !props.errorMessage && (
                <p className="text-sm text-base-content/70">
                    조회 완료:{" "}
                    <time dateTime={props.refreshedAt}>
                        {dateTimeFormatter.format(new Date(props.refreshedAt))}
                    </time>
                </p>
            )}
        </div>
    );
}

function OptionEvaluationNotice({
    optionEvaluation,
}: Pick<AuctionResultsProps, "optionEvaluation">) {
    if (!optionEvaluation) return null;
    return (
        <p
            className={`alert mt-3 text-sm ${optionEvaluation.unevaluableCount > 0 ? "alert-warning" : "alert-info"}`}
        >
            장비 옵션 조건으로 전체 {optionEvaluation.scannedCount}개 매물을
            확인했습니다.
            {optionEvaluation.unevaluableCount > 0 && (
                <>
                    {" "}
                    옵션 값을 판정할 수 없는 {optionEvaluation.unevaluableCount}
                    개 매물은 결과에서 제외했습니다.
                </>
            )}
        </p>
    );
}

function CurrentListingsBody(props: AuctionResultsProps) {
    if (props.loading)
        return <p role="status">현재 등록 매물을 불러오는 중입니다.</p>;
    if (props.errorMessage)
        return (
            <p role="alert" className="alert alert-error">
                {props.errorMessage}
            </p>
        );
    return (
        <>
            <CurrentListingsMetrics {...props} />
            <OptionEvaluationNotice {...props} />
        </>
    );
}

function CurrentListingsResults(props: AuctionResultsProps) {
    if (props.loading || props.errorMessage || props.items.length === 0)
        return null;
    return (
        <div>
            <ResultsTable {...props} isEmpty={false} />
            <Pagination
                currentPage={props.currentPage}
                itemCount={props.items.length}
                setCurrentPage={props.setCurrentPage}
            />
        </div>
    );
}

function CurrentListingsPanel(props: AuctionResultsProps) {
    const hasListingsState = Boolean(
        props.loading || props.errorMessage || props.refreshedAt
    );
    const content = (
        <>
            <div
                className={
                    hasListingsState ? "rounded-lg border bg-base-100 p-4" : ""
                }
            >
                {hasListingsState && <CurrentListingsHeader {...props} />}
                {hasListingsState && <CurrentListingsBody {...props} />}
                <RecentSalesLauncher
                    key={`${props.recentSales.queriedItemName}-${props.recentSales.refreshedAt}`}
                    recentSales={props.recentSales}
                />
            </div>
            <AuctionComparison
                items={props.comparisonItems}
                notice={props.comparisonNotice}
                onRemove={props.onRemoveComparison}
                onClear={props.onClearComparison}
            />
            <CurrentListingsResults {...props} />
        </>
    );
    if (!hasListingsState) return <div className="space-y-4">{content}</div>;
    return (
        <section aria-labelledby="current-listings-title" className="space-y-4">
            {content}
        </section>
    );
}

function RecentSalesTable({ sales }: { sales: AuctionSale[] }) {
    return (
        <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="table w-full">
                <thead>
                    <tr>
                        <th>거래 시각</th>
                        <th>아이템명</th>
                        <th>완료 단가</th>
                        <th>수량</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.slice(0, RECENT_SALES_LIMIT).map(sale => (
                        <tr key={sale.auction_buy_id}>
                            <td>
                                <time dateTime={sale.date_auction_buy}>
                                    {dateTimeFormatter.format(
                                        new Date(sale.date_auction_buy)
                                    )}
                                </time>
                            </td>
                            <td>{sale.item_display_name}</td>
                            <td>
                                {numberFormatter.format(
                                    sale.auction_price_per_unit
                                )}{" "}
                                Gold
                            </td>
                            <td>{numberFormatter.format(sale.item_count)}개</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RecentSalesSummaryMetrics({
    summary,
    hasMore,
}: {
    summary: RecentSalesSummary;
    hasMore: boolean;
}) {
    const labelPrefix = hasMore ? "불러온 " : "";
    return (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <SummaryMetric
                label={`${labelPrefix}거래 수`}
                value={`${numberFormatter.format(summary.transactionCount)}건`}
            />
            <SummaryMetric
                label={`${labelPrefix}총 수량`}
                value={`${numberFormatter.format(summary.totalQuantity)}개`}
            />
            {summary.medianUnitPrice !== null && (
                <SummaryMetric
                    label={`${labelPrefix}거래 단가 중앙값`}
                    value={`${numberFormatter.format(summary.medianUnitPrice)} Gold`}
                />
            )}
        </dl>
    );
}

function PartialRecentSalesNotice({ hasMore }: { hasMore: boolean }) {
    if (!hasMore) return null;
    return (
        <p className="alert alert-warning mt-3 text-sm">
            최근 1시간 전체가 아닌 현재 불러온 일부 완료 거래만 반영했습니다.
        </p>
    );
}

function RecentSalesResultsBody({
    recentSales,
}: Pick<AuctionResultsProps, "recentSales">) {
    const { sales, summary, hasMore } = recentSales;
    if (!summary) return null;
    if (summary.transactionCount === 0) {
        return (
            <>
                <p>최근 1시간 내 완료 거래가 없습니다.</p>
                <PartialRecentSalesNotice hasMore={hasMore} />
            </>
        );
    }

    return (
        <>
            <RecentSalesSummaryMetrics summary={summary} hasMore={hasMore} />
            {summary.transactionCount < 3 && (
                <p className="mt-3 text-sm text-base-content/70">
                    최근 거래가 3건 미만이므로 중앙값을 표시하지 않습니다.
                </p>
            )}
            <RecentSalesTable sales={sales} />
            {sales.length > RECENT_SALES_LIMIT && (
                <p className="mt-2 text-sm text-base-content/70">
                    가장 최근 {RECENT_SALES_LIMIT}건을 표시합니다.
                </p>
            )}
            <PartialRecentSalesNotice hasMore={hasMore} />
        </>
    );
}

interface RecentSalesModalHeaderProps {
    itemName: string;
    onClose: () => void;
}

function RecentSalesModalHeader({
    itemName,
    onClose,
}: RecentSalesModalHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 border-b p-4">
            <div>
                <h2
                    id="recent-sales-dialog-title"
                    className="text-lg font-bold"
                >
                    최근 1시간 완료 거래
                </h2>
                <p className="text-sm text-base-content/70">{itemName}</p>
            </div>
            <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onClose}
            >
                닫기
            </button>
        </div>
    );
}

interface RecentSalesModalProps {
    recentSales: RecentSalesState;
    onClose: () => void;
    triggerRef: RefObject<HTMLButtonElement | null>;
}

function RecentSalesModal({
    recentSales,
    onClose,
    triggerRef,
}: RecentSalesModalProps) {
    const dialogRef = useDialogFocus(
        onClose,
        triggerRef,
        "market-snapshot-title"
    );
    return (
        <div className="fixed inset-0 z-50 flex bg-black/40 sm:items-center sm:justify-center sm:p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="recent-sales-dialog-title"
                tabIndex={-1}
                className="flex h-full w-full flex-col bg-base-100 outline-none sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-lg sm:border sm:shadow-xl"
            >
                <RecentSalesModalHeader
                    itemName={recentSales.queriedItemName ?? ""}
                    onClose={onClose}
                />
                <div className="overflow-y-auto p-4">
                    {recentSales.refreshedAt && (
                        <p className="mb-3 text-sm text-base-content/70">
                            조회 완료:{" "}
                            <time dateTime={recentSales.refreshedAt}>
                                {dateTimeFormatter.format(
                                    new Date(recentSales.refreshedAt)
                                )}
                            </time>
                        </p>
                    )}
                    <RecentSalesResultsBody recentSales={recentSales} />
                </div>
            </div>
        </div>
    );
}

interface RecentSalesLauncherProps {
    recentSales: RecentSalesState;
}

function RecentSalesLauncher({ recentSales }: RecentSalesLauncherProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    if (!recentSales.queriedItemName) return null;
    if (recentSales.loading)
        return (
            <p role="status" className="mt-4">
                최근 1시간 완료 거래를 불러오는 중입니다.
            </p>
        );
    if (recentSales.noticeMessage)
        return (
            <p role="status" className="alert alert-info mt-4 text-sm">
                {recentSales.noticeMessage}
            </p>
        );
    if (recentSales.errorMessage)
        return (
            <p role="alert" className="alert alert-error mt-4">
                {recentSales.errorMessage}
            </p>
        );

    const count = recentSales.summary?.transactionCount ?? 0;
    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="btn btn-outline mt-4 w-full sm:w-auto"
                disabled={count === 0}
                onClick={() => setOpen(true)}
            >
                최근 1시간 완료 거래 {count === 0 ? "없음" : `${count}건 보기`}
            </button>
            {open && (
                <RecentSalesModal
                    recentSales={recentSales}
                    onClose={() => setOpen(false)}
                    triggerRef={triggerRef}
                />
            )}
        </>
    );
}

function hasMarketSnapshot(props: AuctionResultsProps) {
    return Boolean(
        props.loading ||
        props.errorMessage ||
        props.refreshedAt ||
        props.recentSales.queriedItemName
    );
}

function MarketSnapshot(props: AuctionResultsProps) {
    return (
        <section aria-labelledby="market-snapshot-title" className="space-y-4">
            <div>
                <h2
                    id="market-snapshot-title"
                    className="text-xl font-bold"
                    tabIndex={-1}
                >
                    경매 시장 현황
                </h2>
                <p className="text-sm text-base-content/70">
                    현재 매물은 판매자의 제시 가격이며, 최근 거래는 최근 1시간
                    동안 실제 완료된 가격입니다.
                </p>
            </div>
            <CurrentListingsPanel {...props} />
        </section>
    );
}

/**
 * Renders auction results with sortable table content and pagination controls.
 *
 * @param props - Auction data, loading and error state, and pagination controls.
 */
export function AuctionResults(props: AuctionResultsProps): React.JSX.Element {
    if (hasMarketSnapshot(props)) return <MarketSnapshot {...props} />;

    return <ResultsTable {...props} isEmpty={props.items.length === 0} />;
}
