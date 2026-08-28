import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
    getCachedCurrentItemMarket,
    getCachedRecentItemSales,
} from "@/lib/api/auction-market";
import {
    type AuctionCatalogItem,
    getAuctionCatalogItemById,
    getAuctionItemPath,
} from "@/lib/auction-item-catalog";
import { prepareRecentSales } from "@/lib/auction-market";
import { getAuctionSearchPath } from "@/lib/auction-url";

type Props = { params: Promise<{ itemId: string }> };
const numberFormatter = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
});
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Seoul",
});

function getItem(itemId: string) {
    const item = getAuctionCatalogItemById(itemId);
    if (!item) notFound();
    return item;
}

function FetchedAt({ value }: { value: string }) {
    return (
        <p className="mt-3 text-sm text-base-content/70">
            조회 완료:{" "}
            <time dateTime={value}>
                {dateTimeFormatter.format(new Date(value))}
            </time>
        </p>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-sm text-base-content/70">{label}</dt>
            <dd className="font-semibold">{value}</dd>
        </div>
    );
}

export async function CurrentMarketPanel({
    item,
}: {
    item: AuctionCatalogItem;
}) {
    try {
        const market = await getCachedCurrentItemMarket(item.name);
        return (
            <section
                aria-labelledby="current-market-title"
                className="rounded-lg border bg-base-100 p-4"
            >
                <h2 id="current-market-title" className="text-xl font-bold">
                    현재 등록 매물
                </h2>
                <p className="text-sm text-base-content/70">
                    판매자가 현재 제시한 가격과 수량입니다.
                </p>
                {market.listingCount === 0 ? (
                    <p className="mt-4">현재 등록된 매물이 없습니다.</p>
                ) : (
                    <dl className="mt-4 grid grid-cols-2 gap-3">
                        <Metric
                            label="최저 단가"
                            value={`${numberFormatter.format(market.minPrice)} Gold`}
                        />
                        <Metric
                            label={
                                market.isComplete
                                    ? "전체 가용 수량"
                                    : "불러온 수량"
                            }
                            value={`${numberFormatter.format(market.availableQuantity)}개`}
                        />
                    </dl>
                )}
                {!market.isComplete && (
                    <p className="alert alert-warning mt-4 text-sm">
                        전체 cursor가 남아 있어 불러온 매물만 반영했습니다.
                    </p>
                )}
                <FetchedAt value={market.fetchedAt} />
            </section>
        );
    } catch {
        return (
            <section
                aria-labelledby="current-market-title"
                className="rounded-lg border bg-base-100 p-4"
            >
                <h2 id="current-market-title" className="text-xl font-bold">
                    현재 등록 매물
                </h2>
                <p role="alert" className="alert alert-error mt-4">
                    현재 매물을 불러오지 못했습니다.
                </p>
            </section>
        );
    }
}

export async function RecentSalesPanel({ item }: { item: AuctionCatalogItem }) {
    try {
        const snapshot = await getCachedRecentItemSales(item.name);
        const prepared = prepareRecentSales(snapshot.sales);
        const { summary } = prepared;
        return (
            <section
                aria-labelledby="recent-sales-title"
                className="rounded-lg border bg-base-100 p-4"
            >
                <h2 id="recent-sales-title" className="text-xl font-bold">
                    최근 1시간 완료 거래
                </h2>
                <p className="text-sm text-base-content/70">
                    실제로 완료된 거래 내역입니다.
                </p>
                {summary.transactionCount === 0 ? (
                    <p className="mt-4">최근 1시간 내 완료 거래가 없습니다.</p>
                ) : (
                    <>
                        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                            <Metric
                                label={
                                    snapshot.hasMore
                                        ? "불러온 거래 수"
                                        : "거래 수"
                                }
                                value={`${numberFormatter.format(summary.transactionCount)}건`}
                            />
                            <Metric
                                label={
                                    snapshot.hasMore
                                        ? "불러온 총 수량"
                                        : "총 수량"
                                }
                                value={`${numberFormatter.format(summary.totalQuantity)}개`}
                            />
                            {summary.medianUnitPrice !== null && (
                                <Metric
                                    label={
                                        snapshot.hasMore
                                            ? "불러온 거래 단가 중앙값"
                                            : "거래 단가 중앙값"
                                    }
                                    value={`${numberFormatter.format(summary.medianUnitPrice)} Gold`}
                                />
                            )}
                        </dl>
                        {summary.transactionCount < 3 && (
                            <p className="mt-3 text-sm text-base-content/70">
                                최근 거래가 3건 미만이므로 중앙값을 표시하지
                                않습니다.
                            </p>
                        )}
                        <div className="mt-4 overflow-x-auto rounded-md border">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>거래 시각</th>
                                        <th>완료 단가</th>
                                        <th>수량</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prepared.sales.slice(0, 10).map(sale => (
                                        <tr key={sale.auction_buy_id}>
                                            <td>
                                                <time
                                                    dateTime={
                                                        sale.date_auction_buy
                                                    }
                                                >
                                                    {dateTimeFormatter.format(
                                                        new Date(
                                                            sale.date_auction_buy
                                                        )
                                                    )}
                                                </time>
                                            </td>
                                            <td>
                                                {numberFormatter.format(
                                                    sale.auction_price_per_unit
                                                )}{" "}
                                                Gold
                                            </td>
                                            <td>
                                                {numberFormatter.format(
                                                    sale.item_count
                                                )}
                                                개
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {prepared.sales.length > 10 && (
                            <p className="mt-2 text-sm text-base-content/70">
                                가장 최근 10건을 표시합니다.
                            </p>
                        )}
                    </>
                )}
                {snapshot.hasMore && (
                    <p className="alert alert-warning mt-4 text-sm">
                        최근 1시간 전체가 아닌 불러온 일부 완료 거래만
                        반영했습니다.
                    </p>
                )}
                <FetchedAt value={snapshot.fetchedAt} />
            </section>
        );
    } catch {
        return (
            <section
                aria-labelledby="recent-sales-title"
                className="rounded-lg border bg-base-100 p-4"
            >
                <h2 id="recent-sales-title" className="text-xl font-bold">
                    최근 1시간 완료 거래
                </h2>
                <p role="alert" className="alert alert-error mt-4">
                    최근 완료 거래를 불러오지 못했습니다.
                </p>
            </section>
        );
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { itemId } = await params;
    const item = getItem(itemId);
    const title = `${item.name} 경매장 시세`;
    const description = `${item.name}의 현재 등록 매물과 최근 1시간 완료 거래를 확인하세요.`;
    const canonical = getAuctionItemPath(item);
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title, description, url: canonical },
    };
}

export default async function AuctionItemPage({ params }: Props) {
    const { itemId } = await params;
    const item = getItem(itemId);
    return (
        <article className="mx-auto min-h-screen w-full max-w-4xl p-6">
            <h1 className="text-2xl font-bold">{item.name} 경매장 시세</h1>
            <p className="mt-2 text-base-content/70">
                현재 등록가는 판매자의 제시 가격이고 최근 완료 거래는 실제 성사
                내역입니다. 어느 값도 적정가를 보장하지 않습니다.
            </p>
            <Link
                href={getAuctionSearchPath(item.name)}
                className="btn btn-primary mt-5"
            >
                경매장에서 상세 매물·옵션 보기
            </Link>
            <div className="mt-6 space-y-4">
                <Suspense
                    fallback={
                        <p role="status" className="rounded-lg border p-4">
                            현재 등록 매물을 불러오는 중입니다.
                        </p>
                    }
                >
                    <CurrentMarketPanel item={item} />
                </Suspense>
                <Suspense
                    fallback={
                        <p role="status" className="rounded-lg border p-4">
                            최근 1시간 완료 거래를 불러오는 중입니다.
                        </p>
                    }
                >
                    <RecentSalesPanel item={item} />
                </Suspense>
            </div>
            <p className="mt-6 text-sm text-base-content/70">
                Nexon Open API 기반 정보로 실제 시세와 차이가 날 수 있습니다.
                구매 전 게임 안에서 최종 확인하세요.
            </p>
        </article>
    );
}
