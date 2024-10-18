"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const inventoryItems = [
    { id: 1, name: "판타지트 엘름워커 사이니트 팬츠", level: 57, price: 5303 },
    { id: 2, name: "판타지트 엘름워커 사이니트 팬츠", level: 55, price: 5303 },
    { id: 3, name: "판타지트 엘름워커 사이니트 팬츠", level: 53, price: 5404 },
    { id: 4, name: "마이트 엘름워커 사이니트 팬츠", level: 58, price: 704 },
    {
        id: 5,
        name: "마크어 엘름워커 사이니트 브리즈 팬츠",
        level: 48,
        price: 504,
    },
    { id: 6, name: "판타지트 엘름워커 아르코 팬츠", level: 58, price: 504 },
    { id: 7, name: "젤라이트 엘름워커 사이니트 팬츠", level: 57, price: 504 },
    { id: 8, name: "판타지트 엘름워커 아르코 팬츠", level: 58, price: 504 },
    { id: 9, name: "판타지트 엘름워커 아르코 팬츠", level: 58, price: 504 },
    { id: 10, name: "마이트 엘름워커 아르코 팬츠", level: 50, price: 49500000 },
];

const categories = ["모든 카테고리", "무기", "방어구", "장신구"];

export default function AuctionPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(inventoryItems.length / itemsPerPage);
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [searchTerm, setSearchTerm] = useState("");

    // 필터링된 아이템
    const filteredItems = inventoryItems.filter(item => {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="flex flex-col items-center justify-start h-[70vh] p-6">
            <div className="w-full max-w-4xl p-6 backdrop-blur-sm rounded-lg">
                <div className="flex justify-between mb-4">
                    <div className="flex space-x-2">
                        <input
                            className="input input-bordered w-64"
                            placeholder="아이템명"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button className="btn btn-outline">검색</button>
                        <div className="dropdown">
                            <div tabIndex={0} role="button" className="btn m-1">
                                {selectedCategory}
                            </div>
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
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
                <div className="overflow-auto h-[400px] rounded-md border">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th className="w-[50%]">아이템명</th>
                                <th>남은 시간</th>
                                <th>거래 형태</th>
                                <th>가격</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems
                                .slice(
                                    (currentPage - 1) * itemsPerPage,
                                    currentPage * itemsPerPage
                                )
                                .map(item => (
                                    <tr key={item.id}>
                                        <td className="font-medium">
                                            {item.name}
                                        </td>
                                        <td>{item.level} 시간</td>
                                        <td>일반 거래</td>
                                        <td>
                                            {item.price.toLocaleString()} Gold
                                        </td>
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
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                            setCurrentPage(prev =>
                                Math.min(prev + 1, totalPages)
                            )
                        }
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
