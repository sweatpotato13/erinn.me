"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const categories = [
    "모든 카테고리",
    "개조석",
    "검",
    "경갑옷",
    "기타",
    "기타 소모품",
    "기타 스크롤",
    "기타 장비",
    "기타 재료",
    "꼬리",
    "날개",
    "낭만농장/달빛섬",
    "너클",
    "던전 통행증",
    "도끼",
    "도면",
    "둔기",
    "듀얼건",
    "랜스",
    "로브",
    "마기그래프",
    "마기그래프 도안",
    "마도서",
    "마리오네트",
    "마법가루",
    "마비노벨",
    "마족 스크롤",
    "말풍선 스티커",
    "매직 크래프트",
    "모자/가발",
    "방패",
    "변신 메달",
    "보석",
    "분양 메달",
    "불타래",
    "뷰티 쿠폰",
    "생활 도구",
    "석궁",
    "수리검",
    "스케치",
    "스태프",
    "신발",
    "실린더",
    "아틀라틀",
    "악기",
    "알반 훈련석",
    "액세서리",
    "양손 장비",
    "얼굴 장식",
    "에이도스",
    "에코스톤",
    "염색 앰플",
    "오브",
    "옷본",
    "원거리 소모품",
    "원드",
    "음식",
    "의자/사물",
    "인챈트 스크롤",
    "장갑",
    "제련/블랙스미스",
    "제스처",
    "주머니",
    "중갑옷",
    "책",
    "천옷",
    "천옷/방직",
    "체인 블레이드",
    "토템",
    "팔리아스 유물",
    "퍼퓸",
    "페이지",
    "포션",
    "피니 펫",
    "핀즈비즈",
    "한손 장비",
    "핸들",
    "허브",
    "활",
    "힐웬 공학",
];

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

    // API 호출 함수
    const fetchItems = async () => {
        try {
            setFilteredItems([]);
            setCurrentPage(1); // 페이지를 초기화합니다.

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
                <div className="flex justify-between mb-4">
                    <div className="flex space-x-2">
                        <input
                            className="input input-bordered w-64"
                            placeholder="아이템명"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button
                            className="btn btn-outline"
                            onClick={fetchItems}
                        >
                            검색
                        </button>
                        <div className="dropdown">
                            <div tabIndex={0} role="button" className="btn m-1">
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
                                                setSelectedCategory(category)
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
                                .map((item: any) => (
                                    <tr
                                        key={item.item_name}
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
                                    popupItemOptions.map((option: any) => (
                                        <div key={option.option_type}>
                                            <strong>
                                                {option.option_type}:{" "}
                                            </strong>
                                            {option.option_value}
                                        </div>
                                    ))
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
