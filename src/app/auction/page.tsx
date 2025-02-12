"use client";

import { ChevronLeft, ChevronRight, Loader } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import OptionRenderer from "@/components/option-renderer";
import { AllItemList } from "@/constant/all-item-list";
import { categories } from "@/constant/categories";

export default function AuctionPage() {
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
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [favorites, setFavorites] = useState<
        { itemName: string; category: string }[]
    >([]);
    const [isFavoritesPopupVisible, setIsFavoritesPopupVisible] =
        useState(false);
    const [addFavoriteText, setAddFavoriteText] = useState("즐겨찾기 등록");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
        null
    );

    useEffect(() => {
        if (searchTerm.length >= 2) {
            const filteredSuggestions = AllItemList.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSuggestions(filteredSuggestions.map(item => item.name));
            setActiveSuggestionIndex(0);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    }, [searchTerm]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            setFilteredItems([]);
            setCurrentPage(1);
            setSortDirection(null);

            let url = "/api/auction?";
            if (selectedCategory !== categories[0]) {
                url += `auction_item_category=${selectedCategory}`;
            }
            if (searchTerm !== "") {
                url += `&item_name=${encodeURIComponent(searchTerm).replace(/\+/g, "%2B")}`;
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
            setErrorMessage(
                "아이템을 불러오는 중 오류가 발생했습니다. 아이템명 입력 시 아이템의 이름을 정확히 입력해주세요."
            );
        } finally {
            setLoading(false);
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === "ArrowDown") {
                setActiveSuggestionIndex(prevIndex =>
                    Math.min(prevIndex + 1, suggestions.length - 1)
                );
            } else if (e.key === "ArrowUp") {
                setActiveSuggestionIndex(prevIndex =>
                    Math.max(prevIndex - 1, 0)
                );
            } else if (e.key === "Enter") {
                setSearchTerm(suggestions[`${activeSuggestionIndex}`]);
                setShowSuggestions(false);
            }
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion);
        setShowSuggestions(false);
    };

    useEffect(() => {
        const activeSuggestionElement = document.getElementById(
            `suggestion-${activeSuggestionIndex}`
        );
        if (activeSuggestionElement) {
            activeSuggestionElement.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        }
    }, [activeSuggestionIndex]);

    useEffect(() => {
        const storedFavorites = localStorage.getItem("favorites");
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }
    }, []);

    const saveFavorites = (
        newFavorites: { itemName: string; category: string }[]
    ) => {
        setFavorites(newFavorites);
        localStorage.setItem("favorites", JSON.stringify(newFavorites));
    };

    const addFavorite = () => {
        if (favorites.length >= 20) {
            alert("즐겨찾기는 최대 20개까지 저장할 수 있습니다.");
            return;
        }

        const newFavorite = {
            itemName: searchTerm,
            category: selectedCategory || categories[0],
        };

        const itemExists = AllItemList.some(item => item.name === searchTerm);
        if (!itemExists) {
            alert("존재하지 않는 아이템입니다.");
            return;
        }

        const newFavorites = [...favorites, newFavorite];
        saveFavorites(newFavorites);
        setAddFavoriteText("✔");
    };

    const removeFavorite = (index: number) => {
        const newFavorites = favorites.filter((_, i) => i !== index);
        saveFavorites(newFavorites);
    };

    const handleFavoriteClick = (favorite: {
        itemName: string;
        category: string;
    }) => {
        setSearchTerm(favorite.itemName);
        setSelectedCategory(favorite.category);
        fetchItems().catch(error => {
            console.error(error);
        });
        setIsFavoritesPopupVisible(false);
    };

    useEffect(() => {
        if (addFavoriteText === "✔") {
            const timer = setTimeout(() => {
                setAddFavoriteText("즐겨찾기 등록");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [addFavoriteText]);

    // ESC 키 이벤트 리스너 추가
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClosePopup();
            }
        };

        if (isPopupVisible) {
            window.addEventListener("keydown", handleEsc);
        }

        // 컴포넌트가 언마운트되거나 isPopupVisible이 false가 될 때 이벤트 리스너 제거
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isPopupVisible]); // isPopupVisible이 변경될 때마다 실행

    // 정렬 처리 함수
    const handleSortByPrice = () => {
        const newDirection = sortDirection === "asc" ? "desc" : "asc";
        setSortDirection(newDirection);

        const sortedItems = [...filteredItems].sort((a, b) => {
            if (newDirection === "asc") {
                return a.auction_price_per_unit - b.auction_price_per_unit;
            } else {
                return b.auction_price_per_unit - a.auction_price_per_unit;
            }
        });

        setFilteredItems(sortedItems);
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-6">
            <div className="w-full max-w-4xl p-6 backdrop-blur-sm rounded-lg flex-grow">
                {errorMessage && (
                    <div className="alert alert-error mb-4">{errorMessage}</div>
                )}
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full mb-2">
                    <button
                        className="btn btn-outline w-auto min-w-[50px]"
                        onClick={addFavorite}
                    >
                        {addFavoriteText}
                    </button>
                    <button
                        className="btn btn-outline w-auto  min-w-[50px]"
                        onClick={() => setIsFavoritesPopupVisible(true)}
                    >
                        즐겨찾기 보기
                    </button>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between mb-2">
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full">
                        <div className="relative w-full">
                            <input
                                className="input input-bordered w-full"
                                placeholder="아이템명"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {suggestions.map((suggestion, index) => (
                                        <li
                                            key={`suggestion-${suggestion}-${index}`}
                                            id={`suggestion-${index}`}
                                            className={`p-2 cursor-pointer ${
                                                index === activeSuggestionIndex
                                                    ? "bg-gray-200"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleSuggestionClick(
                                                    suggestion
                                                )
                                            }
                                        >
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className="btn btn-outline w-full md:w-auto"
                            onClick={() => {
                                fetchItems().catch(error => {
                                    console.error(error);
                                });
                            }}
                        >
                            {loading ? (
                                <Loader className="animate-spin" />
                            ) : (
                                "검색"
                            )}
                        </button>
                        <div className="mt-2 md:mt-0">
                            <div className="dropdown dropdown-end">
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
                                        <li key={`category-${category}`}>
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
                {isFavoritesPopupVisible && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white border p-4 rounded-lg shadow-lg w-80">
                            <h2 className="text-lg font-bold mb-2">
                                즐겨찾기 목록
                            </h2>
                            {favorites.length === 0 ? (
                                <div>저장된 즐겨찾기가 없습니다.</div>
                            ) : (
                                <ul className="list-disc ml-4">
                                    {favorites.map((favorite, index) => (
                                        <li
                                            key={`favorite-${favorite.itemName}-${favorite.category}-${index}`}
                                            className="flex justify-between items-center"
                                        >
                                            <button
                                                className="underline"
                                                onClick={() =>
                                                    handleFavoriteClick(
                                                        favorite
                                                    )
                                                }
                                            >
                                                {favorite.itemName} (
                                                {favorite.category})
                                            </button>
                                            <button
                                                className="text-red-500 ml-4"
                                                onClick={() =>
                                                    removeFavorite(index)
                                                }
                                            >
                                                삭제
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button
                                className="btn btn-outline mt-4 w-full"
                                onClick={() =>
                                    setIsFavoritesPopupVisible(false)
                                }
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}
                <div className="overflow-auto h-[50%] rounded-md border">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th className="w-[50px] hidden md:table-cell"></th>
                                <th className="w-[45%]">아이템명</th>
                                <th
                                    className="cursor-pointer hover:bg-base-200"
                                    onClick={handleSortByPrice}
                                >
                                    가격{" "}
                                    {sortDirection === "asc"
                                        ? "↑"
                                        : sortDirection === "desc"
                                          ? "↓"
                                          : ""}
                                </th>
                                <th>갯수</th>
                                <th>만료 시간</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 &&
                            errorMessage === null &&
                            loading === false ? (
                                <tr>
                                    <td colSpan={5} className="text-center">
                                        결과가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems
                                    .slice(
                                        (currentPage - 1) * itemsPerPage,
                                        currentPage * itemsPerPage
                                    )
                                    .map((item: any, index: number) => {
                                        const itemInfo = AllItemList.find(
                                            listItem =>
                                                listItem.name === item.item_name
                                        );

                                        return (
                                            <tr
                                                key={`item-${item.item_display_name}-${item.auction_price_per_unit}-${item.date_auction_expire}-${index}`}
                                                onClick={() =>
                                                    handleItemClick(item)
                                                }
                                                className="cursor-pointer hover:bg-gray-100"
                                            >
                                                <td className="w-[50px] hidden md:table-cell">
                                                    {itemInfo && (
                                                        <>
                                                            <Image
                                                                src={`/api/item-image?id=${itemInfo.id}`}
                                                                alt={
                                                                    item.item_name
                                                                }
                                                                width={40}
                                                                height={40}
                                                                sizes="40px"
                                                                className="object-contain cursor-pointer"
                                                                priority={false}
                                                                unoptimized={
                                                                    true
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </td>
                                                <td className="font-medium">
                                                    {item.item_display_name}
                                                </td>
                                                <td>
                                                    {item.auction_price_per_unit.toLocaleString()}{" "}
                                                    Gold
                                                </td>
                                                <td>{item.item_count}</td>
                                                <td>
                                                    {item.date_auction_expire}
                                                </td>
                                            </tr>
                                        );
                                    })
                            )}
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
                                    <OptionRenderer
                                        options={popupItemOptions}
                                    />
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
