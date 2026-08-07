import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import type {
    AuctionItem,
    ItemOption,
    SortDirection,
} from "@/app/auction/types";
import { getItemImageUrl } from "@/lib/utils";

const OptionRenderer = dynamic(() => import("@/components/option-renderer"), {
    ssr: false,
});
const ITEMS_PER_PAGE = 10;

function AuctionRow({
    item,
    onClick,
}: {
    item: AuctionItem;
    onClick: () => void;
}) {
    return (
        <tr onClick={onClick} className="cursor-pointer hover:bg-gray-100">
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
            <td className="font-medium">{item.item_display_name}</td>
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

function ResultsTable(props: TableProps) {
    const pageItems = props.items.slice(
        (props.currentPage - 1) * ITEMS_PER_PAGE,
        props.currentPage * ITEMS_PER_PAGE
    );
    return (
        <div className="overflow-auto h-[50%] rounded-md border">
            <table className="table w-full">
                <thead>
                    <tr>
                        <th className="w-[50px] hidden md:table-cell"></th>
                        <th className="w-[45%]">아이템명</th>
                        <th
                            className="cursor-pointer hover:bg-base-200"
                            onClick={props.onSort}
                        >
                            가격{" "}
                            {props.sortDirection === "asc"
                                ? "↑"
                                : props.sortDirection === "desc"
                                  ? "↓"
                                  : ""}
                        </th>
                        <th>갯수</th>
                        <th>만료 시간</th>
                    </tr>
                </thead>
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
    return (
        <div className="flex items-center justify-between mt-4">
            <button
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
                className="btn btn-outline btn-sm"
                onClick={() =>
                    setCurrentPage(page => Math.min(page + 1, totalPages))
                }
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ItemOptionsDialog({
    options,
    onClose,
}: {
    options: ItemOption[];
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 flex items-start justify-center z-50">
            <div className="bg-white border p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-bold">아이템 옵션</h2>
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
    errorMessage: string | null;
    loading: boolean;
    setCurrentPage: (update: (page: number) => number) => void;
};

export function AuctionResults(props: AuctionResultsProps) {
    return (
        <>
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
