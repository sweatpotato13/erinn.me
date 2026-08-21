import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import type {
    AuctionItem,
    AuctionSale,
    AuctionSummary,
    ItemOption,
    RecentSalesState,
    RecentSalesSummary,
    SortDirection,
} from "@/app/auction/types";
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
}: {
    item: AuctionItem;
    onClick: () => void;
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
                            <td colSpan={5} className="text-center">
                                결과가 없습니다.
                            </td>
                        </tr>
                    ) : (
                        pageItems.map((item, index) => (
                            <AuctionRow
                                key={`item-${item.item_display_name}-${item.auction_price_per_unit}-${item.date_auction_expire}-${index}`}
                                item={item}
                                onClick={() => props.onItemClick(item)}
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
    recentSales: RecentSalesState;
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

function CurrentListingsPanel(props: AuctionResultsProps) {
    if (!props.loading && !props.errorMessage && !props.refreshedAt)
        return null;

    let body = <CurrentListingsMetrics {...props} />;
    if (props.loading) {
        body = <p role="status">현재 등록 매물을 불러오는 중입니다.</p>;
    } else if (props.errorMessage) {
        body = (
            <p role="alert" className="alert alert-error">
                {props.errorMessage}
            </p>
        );
    }

    return (
        <section aria-labelledby="current-listings-title" className="space-y-4">
            <div className="rounded-lg border bg-base-100 p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3
                            id="current-listings-title"
                            className="text-lg font-bold"
                        >
                            현재 등록 매물
                        </h3>
                        <p className="text-sm text-base-content/70">
                            판매자가 현재 제시한 매물의 가격과 수량입니다.
                        </p>
                    </div>
                    {props.refreshedAt &&
                        !props.loading &&
                        !props.errorMessage && (
                            <p className="text-sm text-base-content/70">
                                조회 완료:{" "}
                                <time dateTime={props.refreshedAt}>
                                    {dateTimeFormatter.format(
                                        new Date(props.refreshedAt)
                                    )}
                                </time>
                            </p>
                        )}
                </div>
                {body}
            </div>
            {!props.loading &&
                !props.errorMessage &&
                props.items.length > 0 && (
                    <div>
                        <ResultsTable {...props} isEmpty={false} />
                        <Pagination
                            currentPage={props.currentPage}
                            itemCount={props.items.length}
                            setCurrentPage={props.setCurrentPage}
                        />
                    </div>
                )}
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

function RecentSalesHeader({
    itemName,
    refreshedAt,
}: {
    itemName: string;
    refreshedAt: string | null;
}) {
    return (
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h3 id="recent-sales-title" className="text-lg font-bold">
                    최근 1시간 완료 거래
                </h3>
                <p className="text-sm text-base-content/70">
                    최근 1시간 동안 실제 완료된 거래입니다.
                </p>
                <p className="text-sm text-base-content/70">{itemName}</p>
            </div>
            {refreshedAt && (
                <p className="text-sm text-base-content/70">
                    조회 완료:{" "}
                    <time dateTime={refreshedAt}>
                        {dateTimeFormatter.format(new Date(refreshedAt))}
                    </time>
                </p>
            )}
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

function RecentSalesDetails({ sales }: { sales: AuctionSale[] }) {
    return (
        <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
                최근 완료 거래 상세 보기
            </summary>
            <RecentSalesTable sales={sales} />
            {sales.length > RECENT_SALES_LIMIT && (
                <p className="mt-2 text-sm text-base-content/70">
                    가장 최근 {RECENT_SALES_LIMIT}건을 표시합니다.
                </p>
            )}
        </details>
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
            <RecentSalesDetails sales={sales} />
            <PartialRecentSalesNotice hasMore={hasMore} />
        </>
    );
}

function RecentSalesPanel({
    recentSales,
}: Pick<AuctionResultsProps, "recentSales">) {
    if (!recentSales.queriedItemName) return null;

    let body = <RecentSalesResultsBody recentSales={recentSales} />;
    if (recentSales.loading) {
        body = <p role="status">최근 1시간 완료 거래를 불러오는 중입니다.</p>;
    } else if (recentSales.errorMessage) {
        body = (
            <p role="alert" className="alert alert-error">
                {recentSales.errorMessage}
            </p>
        );
    }

    return (
        <section
            aria-labelledby="recent-sales-title"
            className="rounded-lg border bg-base-100 p-4"
        >
            <RecentSalesHeader
                itemName={recentSales.queriedItemName}
                refreshedAt={recentSales.refreshedAt}
            />
            {body}
        </section>
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
                <h2 id="market-snapshot-title" className="text-xl font-bold">
                    경매 시장 현황
                </h2>
                <p className="text-sm text-base-content/70">
                    현재 매물은 판매자의 제시 가격이며, 최근 거래는 최근 1시간
                    동안 실제 완료된 가격입니다.
                </p>
            </div>
            <CurrentListingsPanel {...props} />
            <RecentSalesPanel recentSales={props.recentSales} />
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
