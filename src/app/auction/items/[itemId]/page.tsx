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
import {
    formatAuctionDateTime,
    formatAuctionNumber,
    prepareRecentSales,
} from "@/lib/auction-market";
import { getAuctionSearchPath } from "@/lib/auction-url";

interface AuctionItemPageProps {
    params: Promise<{ itemId: string }>;
}

type CurrentMarketSnapshot = Awaited<
    ReturnType<typeof getCachedCurrentItemMarket>
>;
type RecentSalesSnapshot = Awaited<ReturnType<typeof getCachedRecentItemSales>>;
type PreparedRecentSales = ReturnType<typeof prepareRecentSales>;

interface FetchedAtProps {
    value: string;
}

interface MetricProps {
    label: string;
    value: string;
}

interface PanelEmptyProps {
    message: string;
}

interface PanelFailureProps {
    titleId: string;
    title: string;
    message: string;
}

interface CurrentMarketContentProps {
    market: CurrentMarketSnapshot;
}

interface CurrentMarketPanelProps {
    item: AuctionCatalogItem;
}

interface RecentSalesSummaryProps {
    summary: PreparedRecentSales["summary"];
    hasMore: boolean;
}

interface RecentSalesTableProps {
    sales: PreparedRecentSales["sales"];
}

interface RecentSalesContentProps {
    snapshot: RecentSalesSnapshot;
    prepared: PreparedRecentSales;
}

interface RecentSalesPanelProps {
    item: AuctionCatalogItem;
}

function getItem(itemId: string) {
    const item = getAuctionCatalogItemById(itemId);
    if (!item) notFound();
    return item;
}

function FetchedAt({ value }: FetchedAtProps) {
    return (
        <p className="mt-3 text-sm text-base-content/70">
            조회 완료:{" "}
            <time dateTime={value}>{formatAuctionDateTime(value)}</time>
        </p>
    );
}

function Metric({ label, value }: MetricProps) {
    return (
        <div>
            <dt className="text-sm text-base-content/70">{label}</dt>
            <dd className="font-semibold">{value}</dd>
        </div>
    );
}

function PanelEmpty({ message }: PanelEmptyProps): React.JSX.Element {
    return <p className="mt-4">{message}</p>;
}

function PanelFailure({
    titleId,
    title,
    message,
}: PanelFailureProps): React.JSX.Element {
    return (
        <section
            aria-labelledby={titleId}
            className="rounded-lg border bg-base-100 p-4"
        >
            <h2 id={titleId} className="text-xl font-bold">
                {title}
            </h2>
            <p role="alert" className="alert alert-error mt-4">
                {message}
            </p>
        </section>
    );
}

function CurrentMarketContent({
    market,
}: CurrentMarketContentProps): React.JSX.Element {
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
                <PanelEmpty message="현재 등록된 매물이 없습니다." />
            ) : (
                <dl className="mt-4 grid grid-cols-2 gap-3">
                    <Metric
                        label="최저 단가"
                        value={`${formatAuctionNumber(market.minPrice)} Gold`}
                    />
                    <Metric
                        label={
                            market.isComplete ? "전체 가용 수량" : "불러온 수량"
                        }
                        value={`${formatAuctionNumber(market.availableQuantity)}개`}
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
}

export async function CurrentMarketPanel({
    item,
}: CurrentMarketPanelProps): Promise<React.JSX.Element> {
    try {
        const market = await getCachedCurrentItemMarket(item.name);
        return <CurrentMarketContent market={market} />;
    } catch {
        return (
            <PanelFailure
                titleId="current-market-title"
                title="현재 등록 매물"
                message="현재 매물을 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요."
            />
        );
    }
}

function RecentSalesSummary({
    summary,
    hasMore,
}: RecentSalesSummaryProps): React.JSX.Element {
    return (
        <>
            <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                <Metric
                    label={hasMore ? "불러온 거래 수" : "거래 수"}
                    value={`${formatAuctionNumber(summary.transactionCount)}건`}
                />
                <Metric
                    label={hasMore ? "불러온 총 수량" : "총 수량"}
                    value={`${formatAuctionNumber(summary.totalQuantity)}개`}
                />
                {summary.medianUnitPrice !== null && (
                    <Metric
                        label={
                            hasMore
                                ? "불러온 거래 단가 중앙값"
                                : "거래 단가 중앙값"
                        }
                        value={`${formatAuctionNumber(summary.medianUnitPrice)} Gold`}
                    />
                )}
            </dl>
            {summary.transactionCount < 3 && (
                <p className="mt-3 text-sm text-base-content/70">
                    최근 거래가 3건 미만이므로 중앙값을 표시하지 않습니다.
                </p>
            )}
        </>
    );
}

function RecentSalesTable({ sales }: RecentSalesTableProps): React.JSX.Element {
    return (
        <>
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
                        {sales.slice(0, 10).map(sale => (
                            <tr key={sale.auction_buy_id}>
                                <td>
                                    <time dateTime={sale.date_auction_buy}>
                                        {formatAuctionDateTime(
                                            sale.date_auction_buy
                                        )}
                                    </time>
                                </td>
                                <td>
                                    {formatAuctionNumber(
                                        sale.auction_price_per_unit
                                    )}{" "}
                                    Gold
                                </td>
                                <td>
                                    {formatAuctionNumber(sale.item_count)}개
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sales.length > 10 && (
                <p className="mt-2 text-sm text-base-content/70">
                    가장 최근 10건을 표시합니다.
                </p>
            )}
        </>
    );
}

function RecentSalesContent({
    snapshot,
    prepared,
}: RecentSalesContentProps): React.JSX.Element {
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
            {prepared.summary.transactionCount === 0 ? (
                <PanelEmpty message="최근 1시간 내 완료 거래가 없습니다." />
            ) : (
                <>
                    <RecentSalesSummary
                        summary={prepared.summary}
                        hasMore={snapshot.hasMore}
                    />
                    <RecentSalesTable sales={prepared.sales} />
                </>
            )}
            {snapshot.hasMore && (
                <p className="alert alert-warning mt-4 text-sm">
                    최근 1시간 전체가 아닌 불러온 일부 완료 거래만 반영했습니다.
                </p>
            )}
            <FetchedAt value={snapshot.fetchedAt} />
        </section>
    );
}

export async function RecentSalesPanel({
    item,
}: RecentSalesPanelProps): Promise<React.JSX.Element> {
    try {
        const snapshot = await getCachedRecentItemSales(item.name);
        const prepared = prepareRecentSales(snapshot.sales);
        return <RecentSalesContent snapshot={snapshot} prepared={prepared} />;
    } catch {
        return (
            <PanelFailure
                titleId="recent-sales-title"
                title="최근 1시간 완료 거래"
                message="최근 완료 거래를 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요."
            />
        );
    }
}

export async function generateMetadata({
    params,
}: AuctionItemPageProps): Promise<Metadata> {
    const { itemId } = await params;
    const item = getItem(itemId);
    const title = `${item.name} 경매장 시세`;
    const description = `${item.name}의 현재 등록 매물과 최근 1시간 완료 거래를 확인하세요.`;
    const canonical = getAuctionItemPath(item);
    const previewPath = `${canonical}/preview`;
    const imageAlt = `${item.name} 경매장 현재 매물 및 최근 1시간 완료 거래 요약`;
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
            title,
            description,
            url: canonical,
            images: [
                {
                    url: previewPath,
                    width: 1200,
                    height: 630,
                    type: "image/png",
                    alt: imageAlt,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [{ url: previewPath, alt: imageAlt }],
        },
    };
}

export default async function AuctionItemPage({
    params,
}: AuctionItemPageProps): Promise<React.JSX.Element> {
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
