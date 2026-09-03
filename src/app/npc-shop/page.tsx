"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import * as z from "zod";

import { getAuctionSearchPath } from "@/lib/auction-url";
import {
    NpcShopChannelQuerySchema,
    NpcShopChannelSchema,
    NpcShopNameSchema,
    type NpcShopResponse,
    NpcShopResponseSchema,
    serverNameSchema,
} from "@/lib/schemas/nexon";

const NPC_SHOP_PREFERENCES_KEY = "npcShopPreferences";
const LOOKUP_ERROR = "데이터를 가져오는 데 실패했습니다.";
const NpcShopPreferencesSchema = z
    .object({
        serverName: serverNameSchema,
        channel: NpcShopChannelSchema,
    })
    .strict();
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Seoul",
});
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

function normalizeItemName(value: string) {
    return value.trim().normalize("NFKC").toLocaleLowerCase("ko-KR");
}

function formatNumber(value: string | number) {
    return typeof value === "number" ? NUMBER_FORMATTER.format(value) : value;
}

/**
 * Displays NPC shop information for a selected NPC, server, and channel.
 */
export default function NPCShopPage() {
    const [npcName, setNpcName] = useState("");
    const [serverName, setServerName] = useState("");
    const [channel, setChannel] = useState("");
    const [shopData, setShopData] = useState<NpcShopResponse | null>(null);
    const [itemFilter, setItemFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [preferencesReady, setPreferencesReady] = useState(false);
    const requestRef = useRef({
        sequence: 0,
        controller: null as AbortController | null,
    });
    const npcNameRef = useRef<HTMLSelectElement>(null);
    const serverNameRef = useRef<HTMLSelectElement>(null);
    const channelRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const value = localStorage.getItem(NPC_SHOP_PREFERENCES_KEY);
            if (value) {
                const preferences = NpcShopPreferencesSchema.safeParse(
                    JSON.parse(value)
                );
                if (preferences.success) {
                    setServerName(preferences.data.serverName);
                    setChannel(preferences.data.channel.toString());
                }
            }
        } catch {
            // Keep the page usable in memory when storage is unavailable.
        } finally {
            setPreferencesReady(true);
        }
    }, []);

    useEffect(() => {
        if (!preferencesReady) return;
        const parsedChannel = NpcShopChannelQuerySchema.safeParse(channel);
        if (!parsedChannel.success) return;
        const parsed = NpcShopPreferencesSchema.safeParse({
            serverName,
            channel: parsedChannel.data,
        });
        if (!parsed.success) return;
        try {
            localStorage.setItem(
                NPC_SHOP_PREFERENCES_KEY,
                JSON.stringify(parsed.data)
            );
        } catch {
            // Keep the current selection in memory when storage is unavailable.
        }
    }, [channel, preferencesReady, serverName]);

    useEffect(
        () => () => {
            requestRef.current.sequence += 1;
            requestRef.current.controller?.abort();
        },
        []
    );

    const invalidateLookup = () => {
        requestRef.current.sequence += 1;
        requestRef.current.controller?.abort();
        requestRef.current.controller = null;
        setLoading(false);
        setError("");
        setShopData(null);
        setItemFilter("");
    };

    const failValidation = (message: string, field: HTMLElement | null) => {
        setError(message);
        field?.focus();
    };

    const fetchShopData = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const npc = NpcShopNameSchema.safeParse(npcName);
        if (!npc.success) {
            failValidation("NPC를 선택해주세요.", npcNameRef.current);
            return;
        }
        const server = serverNameSchema.safeParse(serverName);
        if (!server.success) {
            failValidation("서버를 선택해주세요.", serverNameRef.current);
            return;
        }
        if (!channel.trim()) {
            failValidation("채널 번호를 입력해주세요.", channelRef.current);
            return;
        }
        const parsedChannel = NpcShopChannelQuerySchema.safeParse(channel);
        if (!parsedChannel.success) {
            failValidation(
                "채널은 1부터 42 사이의 정수여야 합니다.",
                channelRef.current
            );
            return;
        }

        const sequence = ++requestRef.current.sequence;
        requestRef.current.controller?.abort();
        const controller = new AbortController();
        requestRef.current.controller = controller;
        setLoading(true);
        setError("");
        setShopData(null);
        setItemFilter("");

        try {
            const params = new URLSearchParams({
                npc_name: npc.data,
                server_name: server.data,
                channel: parsedChannel.data.toString(),
            });
            const response = await fetch("/api/npc-shop?" + params.toString(), {
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
            });
            if (!response.ok) throw new Error(LOOKUP_ERROR);
            const data = NpcShopResponseSchema.parse(await response.json());
            if (
                controller.signal.aborted ||
                sequence !== requestRef.current.sequence
            )
                return;
            setShopData(data);
            setItemFilter("");
        } catch {
            if (
                !controller.signal.aborted &&
                sequence === requestRef.current.sequence
            )
                setError(LOOKUP_ERROR);
        } finally {
            if (sequence === requestRef.current.sequence) {
                requestRef.current.controller = null;
                setLoading(false);
            }
        }
    };

    const normalizedFilter = normalizeItemName(itemFilter);
    const totalItemCount =
        shopData?.shop.reduce((count, tab) => count + tab.item.length, 0) ?? 0;
    const filteredTabs = normalizedFilter
        ? (shopData?.shop
              .map(tab => ({
                  ...tab,
                  item: tab.item.filter(item =>
                      normalizeItemName(item.item_display_name).includes(
                          normalizedFilter
                      )
                  ),
              }))
              .filter(tab => tab.item.length > 0) ?? [])
        : (shopData?.shop ?? []);
    const matchingItemCount = filteredTabs.reduce(
        (count, tab) => count + tab.item.length,
        0
    );

    return (
        <main className="container mx-auto p-7">
            <h1 className="text-2xl mb-4">NPC 상점 조회</h1>
            <p className="mb-2 text-base-content/70">
                서버·채널·NPC를 선택해 상점 탭별 판매 아이템과 가격 정보를
                확인하세요.
            </p>
            <p className="mb-6 text-sm text-base-content/70">
                서버와 유효한 채널은 현재 브라우저의 이 기기에만 저장되며 다른
                기기와 동기화되지 않습니다.
            </p>

            <form
                noValidate
                className="mb-8 flex flex-wrap gap-4"
                onSubmit={event => void fetchShopData(event)}
            >
                <div className="flex-1 mb-4 min-w-[250px]">
                    <label
                        className="block text-sm font-medium mb-2"
                        htmlFor="npc_name"
                    >
                        NPC 이름
                    </label>
                    <select
                        ref={npcNameRef}
                        required
                        id="npc_name"
                        value={npcName}
                        onChange={event => {
                            invalidateLookup();
                            setNpcName(event.target.value);
                        }}
                        className="select select-bordered w-full"
                    >
                        <option value="" disabled>
                            NPC를 선택하세요
                        </option>
                        {NpcShopNameSchema.options.map(npc => (
                            <option key={npc} value={npc}>
                                {npc}
                            </option>
                        ))}
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
                        ref={serverNameRef}
                        required
                        id="server_name"
                        value={serverName}
                        onChange={event => {
                            invalidateLookup();
                            setServerName(event.target.value);
                        }}
                        className="select select-bordered w-full"
                    >
                        <option value="" disabled>
                            서버를 선택하세요
                        </option>
                        {serverNameSchema.options.map(server => (
                            <option key={server} value={server}>
                                {server}
                            </option>
                        ))}
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
                        ref={channelRef}
                        required
                        id="channel"
                        type="number"
                        min={1}
                        max={42}
                        step={1}
                        value={channel}
                        onChange={event => {
                            invalidateLookup();
                            setChannel(event.target.value);
                        }}
                        className="input input-bordered w-full"
                    />
                </div>

                <div className="flex-none">
                    <button
                        type="submit"
                        className="btn btn-primary mt-6"
                        aria-busy={loading}
                    >
                        {loading && (
                            <span className="loading loading-spinner" />
                        )}
                        {loading ? "조회 중…" : "조회"}
                    </button>
                </div>
            </form>

            {loading && <p role="status">상점 정보를 불러오는 중입니다.</p>}
            {error && (
                <p role="alert" className="alert alert-error">
                    {error}
                </p>
            )}

            {shopData && (
                <section className="mt-8" aria-labelledby="shop-result-title">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 id="shop-result-title" className="text-xl">
                                상점 정보
                            </h2>
                            <p className="text-sm text-base-content/70">
                                상점 탭 {shopData.shop_tab_count}개
                            </p>
                        </div>
                        <dl className="text-sm text-base-content/70">
                            <div>
                                <dt className="inline font-medium">
                                    데이터 조회 시각:{" "}
                                </dt>
                                <dd className="inline">
                                    <time dateTime={shopData.date_inquire}>
                                        {DATE_TIME_FORMATTER.format(
                                            new Date(shopData.date_inquire)
                                        )}
                                    </time>
                                </dd>
                            </div>
                            <div>
                                <dt className="inline font-medium">
                                    다음 상점 갱신 예정 시각:{" "}
                                </dt>
                                <dd className="inline">
                                    <time
                                        dateTime={
                                            shopData.date_shop_next_update
                                        }
                                    >
                                        {DATE_TIME_FORMATTER.format(
                                            new Date(
                                                shopData.date_shop_next_update
                                            )
                                        )}
                                    </time>
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <p className="alert alert-info mb-5 text-sm">
                        Nexon OpenAPI의 게임 데이터는 평균 약 10분 지연될 수
                        있으며, 상점 정보는 36분 주기로 갱신됩니다.
                    </p>

                    {totalItemCount > 0 && (
                        <div className="mb-6">
                            <label
                                className="block text-sm font-medium mb-2"
                                htmlFor="item_filter"
                            >
                                아이템 이름 필터
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <input
                                    id="item_filter"
                                    type="search"
                                    value={itemFilter}
                                    onChange={event =>
                                        setItemFilter(event.target.value)
                                    }
                                    className="input input-bordered min-w-0 flex-1"
                                />
                                {normalizedFilter && (
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setItemFilter("")}
                                    >
                                        필터 지우기
                                    </button>
                                )}
                            </div>
                            <p className="mt-2 text-sm" aria-live="polite">
                                일치하는 아이템 {matchingItemCount}개
                            </p>
                        </div>
                    )}

                    {shopData.shop.length === 0 || totalItemCount === 0 ? (
                        <p role="status">판매 중인 아이템이 없습니다.</p>
                    ) : filteredTabs.length === 0 ? (
                        <p role="status" className="alert">
                            필터와 일치하는 아이템이 없습니다.
                        </p>
                    ) : (
                        filteredTabs.map((tab, tabIndex) => (
                            <section
                                key={[tab.tab_name, tabIndex].join("-")}
                                className="mb-6"
                            >
                                <h3 className="text-lg font-semibold mb-2">
                                    {tab.tab_name}
                                </h3>
                                <ul className="space-y-2">
                                    {tab.item.map((item, itemIndex) => (
                                        <li
                                            key={[
                                                item.item_display_name,
                                                itemIndex,
                                            ].join("-")}
                                            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start"
                                        >
                                            <Image
                                                src={item.image_url}
                                                alt={item.item_display_name}
                                                width={64}
                                                height={64}
                                                sizes="64px"
                                                className="h-16 w-16 object-contain"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium break-words">
                                                    {item.item_display_name}
                                                </p>
                                                {item.item_count != null && (
                                                    <p>
                                                        수량:{" "}
                                                        {NUMBER_FORMATTER.format(
                                                            item.item_count
                                                        )}
                                                        개
                                                    </p>
                                                )}
                                                <ul
                                                    aria-label={
                                                        item.item_display_name +
                                                        " 가격"
                                                    }
                                                >
                                                    {item.price.map(
                                                        (price, priceIndex) => (
                                                            <li
                                                                key={[
                                                                    price.price_type,
                                                                    priceIndex,
                                                                ].join("-")}
                                                            >
                                                                가격:{" "}
                                                                {formatNumber(
                                                                    price.price_value
                                                                )}{" "}
                                                                (
                                                                {
                                                                    price.price_type
                                                                }
                                                                )
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                                {(item.limit_type != null ||
                                                    item.limit_value !=
                                                        null) && (
                                                    <p>
                                                        구매 제한:{" "}
                                                        {item.limit_type ??
                                                            "제한"}
                                                        {item.limit_value !=
                                                        null
                                                            ? " " +
                                                              NUMBER_FORMATTER.format(
                                                                  item.limit_value
                                                              ) +
                                                              "개"
                                                            : ""}
                                                    </p>
                                                )}
                                                <Link
                                                    href={getAuctionSearchPath(
                                                        item.item_display_name
                                                    )}
                                                    aria-label={
                                                        item.item_display_name +
                                                        " 경매장 시세 보기"
                                                    }
                                                    className="link link-primary mt-2 inline-block"
                                                >
                                                    경매장 시세 보기
                                                </Link>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))
                    )}
                </section>
            )}
        </main>
    );
}
