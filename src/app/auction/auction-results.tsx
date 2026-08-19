import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import type {
    AuctionItem,
    AuctionSummary,
    ItemOption,
    SortDirection,
} from "@/app/auction/types";
import { useDialogFocus } from "@/app/auction/use-dialog-focus";
import { getItemImageUrl } from "@/lib/utils";

const OptionRenderer = dynamic(() => import("@/components/option-renderer"), {
    ssr: false,
});
const ITEMS_PER_PAGE = 10;
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
    setCurrentPage: (update: (page: number) => number) => void;
};

function CurrentListingsSummary({
    summary,
    hasMore,
    refreshedAt,
}: Pick<AuctionResultsProps, "summary" | "hasMore" | "refreshedAt">) {
    if (!refreshedAt) return null;

    return (
        <section
            aria-labelledby="auction-summary-title"
            className="mb-4 rounded-lg border bg-base-100 p-4"
        >
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="auction-summary-title" className="text-lg font-bold">
                    현재 검색 결과 요약
                </h2>
                <p className="text-sm text-base-content/70">
                    조회 완료:{" "}
                    <time dateTime={refreshedAt}>
                        {dateTimeFormatter.format(new Date(refreshedAt))}
                    </time>
                </p>
            </div>
            {summary ? (
                <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div>
                        <dt className="text-sm text-base-content/70">
                            최저 단가
                        </dt>
                        <dd className="font-semibold">
                            {numberFormatter.format(summary.lowestUnitPrice)}{" "}
                            Gold
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-base-content/70">
                            매물 단가 중앙값
                        </dt>
                        <dd className="font-semibold">
                            {numberFormatter.format(summary.medianUnitPrice)}{" "}
                            Gold
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-base-content/70">
                            매물 수
                        </dt>
                        <dd className="font-semibold">
                            {numberFormatter.format(summary.listingCount)}개
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-base-content/70">
                            총 수량
                        </dt>
                        <dd className="font-semibold">
                            {numberFormatter.format(summary.totalQuantity)}개
                        </dd>
                    </div>
                </dl>
            ) : (
                <p>현재 검색 조건에 유효한 매물이 없습니다.</p>
            )}
            {hasMore && (
                <p className="alert alert-warning mt-3 text-sm">
                    현재 불러온 일부 매물만 반영한 요약입니다.
                </p>
            )}
        </section>
    );
}

/**
 * Renders auction results with sortable table content and pagination controls.
 *
 * @param props - Auction data, loading and error state, and pagination controls.
 */
export function AuctionResults(props: AuctionResultsProps) {
    return (
        <>
            <CurrentListingsSummary {...props} />
            <ResultsTable
                {...props}
                isEmpty={
                    props.items.length === 0 &&
                    !props.errorMessage &&
                    !props.loading
                }
            />
            <Pagination
                currentPage={props.currentPage}
                itemCount={props.items.length}
                setCurrentPage={props.setCurrentPage}
            />
        </>
    );
}
