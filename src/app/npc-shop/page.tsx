/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";

export default function NPCShopPage() {
    const [npcName, setNpcName] = useState("");
    const [serverName, setServerName] = useState("");
    const [channel, setChannel] = useState("");
    const [shopData, setShopData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toastMessage, setToastMessage] = useState("");

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

        try {
            const response = await fetch(
                `/api/npc-shop?npc_name=${npcName}&server_name=${serverName}&channel=${channel}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("데이터를 가져오는 데 실패했습니다.");
            }

            const data = await response.json();
            setShopData(data);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    return (
        <div className="container mx-auto p-7">
            <h1 className="text-2xl mb-4">NPC 상점 조회</h1>

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
                        <option value="상인 아루">상인 아루</option>
                        <option value="리나">리나</option>
                        <option value="상인 누누">상인 누누</option>
                        <option value="상인 메루">상인 메루</option>
                        <option value="켄">켄</option>
                        <option value="귀넥">귀넥</option>
                        <option value="얼리">얼리</option>
                        <option value="데위">데위</option>
                        <option value="테일로">테일로</option>
                        <option value="상인 세누">상인 세누</option>
                        <option value="상인 베루">상인 베루</option>
                        <option value="상인 에루">상인 에루</option>
                        <option value="상인 네루">상인 네루</option>
                        <option value="카디">카디</option>
                        <option value="인장 상인">인장 상인</option>
                        <option value="피오나트">피오나트</option>
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
                        onClick={() => {
                            checkAndFetchShopData().catch(error => {
                                console.error(error);
                            });
                        }}
                        className={`btn bg-base-90 mt-6 ${loading ? "loading" : ""}`}
                        disabled={loading}
                    >
                        조회
                    </button>
                </div>
            </div>

            {toastMessage && (
                <div className="toast">
                    <div className="alert alert-error">
                        <p className="justify-center">{toastMessage}</p>
                    </div>
                </div>
            )}

            {error && <p className="text-red-500">{error}</p>}

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
                                    {tab.item.map(
                                        (item: any, index: number) => (
                                            <li
                                                key={index}
                                                className="border p-2 rounded-lg"
                                            >
                                                <p>
                                                    아이템:{" "}
                                                    {item.item_display_name}
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
                                        )
                                    )}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
