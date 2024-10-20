"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { categories } from "@/constant/categories";

export default function Page() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedCategory, setSelectedCategory] = useState<
        string | undefined
    >(categories[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredItems, setFilteredItems] = useState<any>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [popupItemOptions, setPopupItemOptions] = useState<any>(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const fetchItems = async () => {
        try {
            setFilteredItems([]);
            setCurrentPage(1);

            let url = "/api/auction?";
            if (selectedCategory !== categories[0]) {
                url += `auction_item_category=${selectedCategory}`;
            }
            if (searchTerm !== "") {
                url += `&item_name=${searchTerm}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("네트워크 오류가 발생했습니다.");
            }
            const data = await response.json();

            data.auction_item.sort(
                (a: any, b: any) =>
                    a.auction_price_per_unit - b.auction_price_per_unit
            );
            setFilteredItems(data.auction_item);
            setErrorMessage(null);
        } catch (error) {
            console.error("API 호출 중 오류가 발생했습니다:", error);
            setErrorMessage("아이템을 불러오는 중 오류가 발생했습니다.");
        }
    };

    function handleItemClick(item: any) {
        setPopupItemOptions(item.item_option || []);
        setIsPopupVisible(true);
    }

    function handleClosePopup() {
        setIsPopupVisible(false);
        setPopupItemOptions(null);
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-6">
            <div className="w-full max-w-4xl p-6 backdrop-blur-sm rounded-lg flex-grow">
                {errorMessage && (
                    <div className="alert alert-error mb-4">{errorMessage}</div>
                )}
                <div className="flex flex-col md:flex-row md:justify-between mb-4">
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full">
                        <input
                            className="input input-bordered w-full"
                            placeholder="아이템명"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button
                            className="btn btn-outline w-full md:w-auto"
                            onClick={fetchItems}
                        >
                            검색
                        </button>
                        <div className="mt-2 md:mt-0">
                            <div className="dropdown">
                                <div
                                    tabIndex={0}
                                    role="button"
                                    className="btn w-full md:w-auto"
                                >
                                    {selectedCategory}
                                </div>
                                <ul
                                    tabIndex={0}
                                    className="max-h-80 overflow-y-auto dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                                >
                                    {categories.map(category => (
                                        <li key={category}>
                                            <a
                                                onClick={() =>
                                                    setSelectedCategory(
                                                        category
                                                    )
                                                }
                                            >
                                                {category}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-auto h-[50%] rounded-md border">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th className="w-[50%]">아이템명</th>
                                <th>가격</th>
                                <th>갯수</th>
                                <th>만료 시간</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems
                                .slice(
                                    (currentPage - 1) * itemsPerPage,
                                    currentPage * itemsPerPage
                                )
                                .map((item: any, index: number) => (
                                    <tr
                                        key={`${item.item_display_name}-${index}`}
                                        onClick={() => handleItemClick(item)}
                                        className="cursor-pointer"
                                    >
                                        <td className="font-medium">
                                            {item.item_display_name}
                                        </td>
                                        <td>
                                            {item.auction_price_per_unit.toLocaleString()}{" "}
                                            Gold
                                        </td>
                                        <td>{item.item_count}</td>
                                        <td>{item.date_auction_expire}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                            setCurrentPage(prev => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span>
                        {currentPage} /{" "}
                        {Math.ceil(filteredItems.length / itemsPerPage)}
                    </span>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                            setCurrentPage(prev =>
                                Math.min(
                                    prev + 1,
                                    Math.ceil(
                                        filteredItems.length / itemsPerPage
                                    )
                                )
                            )
                        }
                        disabled={
                            currentPage ===
                            Math.ceil(filteredItems.length / itemsPerPage)
                        }
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {isPopupVisible && (
                    <div className="fixed inset-0 flex items-start justify-center z-50">
                        <div className="bg-white border p-4 rounded-lg shadow-lg">
                            <h2 className="text-lg font-bold">아이템 옵션</h2>
                            <div className="mt-2">
                                {popupItemOptions &&
                                popupItemOptions.length > 0 ? (
                                    popupItemOptions.map(
                                        (option: any, index: number) => (
                                            <div
                                                key={`${option.option_type}-${index}`}
                                            >
                                                <strong>
                                                    {option.option_type}:{" "}
                                                </strong>
                                                {option.option_value}
                                            </div>
                                        )
                                    )
                                ) : (
                                    <div>옵션이 없습니다.</div>
                                )}
                            </div>
                            <button
                                className="btn btn-outline mt-4"
                                onClick={handleClosePopup}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
