/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";

function NPCShop() {
    const [npcName, setNpcName] = useState("");
    const [serverName, setServerName] = useState("");
    const [channel, setChannel] = useState("");
    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toastMessage, setToastMessage] = useState("");

    // 더미 데이터를 사용할 예정입니다.
    const dummyData = {
        shop_tab_count: 1,
        shop: [
            {
                tab_name: "일반 상품",
                item: [
                    {
                        item_display_name: "아이템1",
                        item_option: [],
                        price: [
                            {
                                price_type: "골드",
                                price_value: 1000,
                            },
                        ],
                        limit_type: "없음",
                        limit_value: 0,
                        image_url: "https://via.placeholder.com/50",
                    },
                    {
                        item_display_name: "아이템2",
                        item_option: [],
                        price: [
                            {
                                price_type: "골드",
                                price_value: 2000,
                            },
                        ],
                        limit_type: "없음",
                        limit_value: 0,
                        image_url: "https://via.placeholder.com/50",
                    },
                ],
            },
        ],
        date_inquire: "2024-09-01T00:00:000Z",
        date_shop_next_update: "2024-09-01T00:36:000Z",
    };

    // 입력 필드가 비어 있는지 확인하고, 비어 있으면 토스트 메시지를 보여주는 함수
    const checkAndFetchShopData = async () => {
        if (!npcName || !serverName || !channel || isNaN(Number(channel))) {
            setToastMessage("모든 필드를 채워주세요");
            return;
        }

        if (Number(channel) < 1 || Number(channel) > 42) {
            setToastMessage("올바른 채널을 입력해주세요!");
            return;
        }

        setLoading(true);
        setToastMessage("");
        setError("");

        // API 요청 대신 더미 데이터 사용
        setTimeout(() => {
            setShopData(dummyData);
            setLoading(false);
        }, 1000); // 로딩 시간 시뮬레이션
    };

    // Toast가 일정 시간 후 자동으로 사라지도록 설정
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage("");
            }, 3000); // 3초 후에 토스트 사라짐
            return () => clearTimeout(timer); // 컴포넌트가 언마운트되면 타이머 해제
        }
    }, [toastMessage]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl mb-4">NPC 상점 조회</h1>

            {/* 입력 폼 */}
            <div className="mb-8 flex flex-wrap gap-4">
                <div className="flex-1 mb-4 min-w-[250px]">
                    <label
                        className="block text-sm font-medium mb-2"
                        htmlFor="npc_name"
                    >
                        NPC 이름
                    </label>
                    <select
                        id="npc_name"
                        value={npcName}
                        onChange={e => setNpcName(e.target.value)}
                        className="select select-bordered w-full"
                    >
                        <option value="" disabled>
                            NPC를 선택하세요
                        </option>
                        <option value="델">델</option>
                        <option value="델렌">델렌</option>
                        <option value="상인 라누">상인 라누</option>
                        <option value="상인 피루">상인 피루</option>
                        <option value="모락">모락</option>
                    </select>
                </div>

                <div className="flex-1 mb-4 min-w-[250px]">
                    <label
                        className="block text-sm font-medium mb-2"
                        htmlFor="server_name"
                    >
                        서버 이름
                    </label>
                    <select
                        id="server_name"
                        value={serverName}
                        onChange={e => setServerName(e.target.value)}
                        className="select select-bordered w-full"
                    >
                        <option value="" disabled>
                            서버를 선택하세요
                        </option>
                        <option value="류트">류트</option>
                        <option value="만돌린">만돌린</option>
                        <option value="하프">하프</option>
                        <option value="울프">울프</option>
                    </select>
                </div>

                <div className="flex-1 mb-4 min-w-[100px]">
                    <label
                        className="block text-sm font-medium mb-2"
                        htmlFor="channel"
                    >
                        채널 번호
                    </label>
                    <input
                        id="channel"
                        type="number"
                        value={channel}
                        onChange={e => setChannel(e.target.value)}
                        className="input input-bordered w-full"
                    />
                </div>

                <div className="flex-none">
                    <button
                        onClick={checkAndFetchShopData}
                        className={`btn bg-base-90 mt-6 ${loading ? "loading" : ""}`}
                        disabled={loading}
                    >
                        조회
                    </button>
                </div>
            </div>

            {/* 토스트 메시지 */}
            {toastMessage && (
                <div className="toast">
                    <div className="alert alert-error">
                        <p className="justify-center">{toastMessage}</p>
                    </div>
                </div>
            )}

            {error && <p className="text-red-500">{error}</p>}

            {/* 조회 결과 */}
            {shopData && (
                <div className="mt-8">
                    <h2 className="text-xl mb-4">상점 정보</h2>
                    {shopData.shop.length === 0 ? (
                        <p>상점 탭이 없습니다.</p>
                    ) : (
                        shopData.shop.map((tab: any, index: number) => (
                            <div key={index} className="mb-4">
                                <h3 className="text-lg font-semibold">
                                    {tab.tab_name}
                                </h3>
                                <ul className="space-y-2">
                                    {tab.item.map((item: any, idx: number) => (
                                        <li
                                            key={idx}
                                            className="border p-2 rounded-lg"
                                        >
                                            <p>
                                                아이템: {item.item_display_name}
                                            </p>
                                            <p>
                                                가격:{" "}
                                                {item.price.map(
                                                    (price: any) =>
                                                        `${price.price_value} (${price.price_type})`
                                                )}
                                            </p>
                                            <img
                                                src={item.image_url}
                                                alt={item.item_display_name}
                                                className="w-16 h-16 mt-2"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default NPCShop;
