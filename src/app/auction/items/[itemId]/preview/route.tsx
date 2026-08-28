import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import {
    getCachedCurrentItemMarket,
    getCachedRecentItemSales,
} from "@/lib/api/auction-market";
import { getAuctionCatalogItemById } from "@/lib/auction-item-catalog";
import {
    formatAuctionDateTime,
    formatAuctionNumber,
    prepareRecentSales,
} from "@/lib/auction-market";

export const dynamic = "force-static";
export const revalidate = 600;

const WIDTH = 1200;
const HEIGHT = 630;
const DATA_DEADLINE_MS = 4_000;
const CACHE_CONTROL =
    "public, max-age=600, s-maxage=600, stale-while-revalidate=60";
const previewFont = readFile(
    join(process.cwd(), "public/fonts/auction-preview.otf")
);

type CurrentMarket = Awaited<ReturnType<typeof getCachedCurrentItemMarket>>;
type RecentSales = Awaited<ReturnType<typeof getCachedRecentItemSales>> & {
    prepared: ReturnType<typeof prepareRecentSales>;
};
type SourceState<T> =
    { status: "success"; value: T } | { status: "failed" | "timeout" };

export type PreviewData = {
    current: SourceState<CurrentMarket>;
    recent: SourceState<RecentSales>;
};

export type PreviewCopy = {
    current: {
        badge?: string;
        primary: string;
        secondary?: string;
        fetchedAt?: string;
    };
    recent: {
        badge?: string;
        primary: string;
        secondary?: string;
        fetchedAt?: string;
    };
    failure?: string;
};

function settleBeforeDeadline<T>(promise: Promise<T>): Promise<SourceState<T>> {
    return new Promise(resolve => {
        let finished = false;
        const finish = (state: SourceState<T>) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            resolve(state);
        };
        const timer = setTimeout(
            () => finish({ status: "timeout" }),
            DATA_DEADLINE_MS
        );
        promise.then(
            value => finish({ status: "success", value }),
            () => finish({ status: "failed" })
        );
    });
}

export async function loadPreviewData(itemName: string): Promise<PreviewData> {
    const [current, recentSnapshot] = await Promise.all([
        settleBeforeDeadline(getCachedCurrentItemMarket(itemName)),
        settleBeforeDeadline(getCachedRecentItemSales(itemName)),
    ]);
    const recent: SourceState<RecentSales> =
        recentSnapshot.status === "success"
            ? {
                  status: "success",
                  value: {
                      ...recentSnapshot.value,
                      prepared: prepareRecentSales(recentSnapshot.value.sales),
                  },
              }
            : recentSnapshot;

    return { current, recent };
}

export function createPreviewCopy(
    itemName: string,
    data: PreviewData
): PreviewCopy {
    const current: PreviewCopy["current"] =
        data.current.status !== "success"
            ? { primary: "현재 매물 조회 불가" }
            : {
                  badge: data.current.value.isComplete
                      ? undefined
                      : "일부 데이터",
                  primary:
                      data.current.value.listingCount === 0
                          ? data.current.value.isComplete
                              ? "현재 매물 없음"
                              : "확인된 매물 없음"
                          : `최저 등록 단가 ${formatAuctionNumber(data.current.value.minPrice)} Gold`,
                  secondary:
                      data.current.value.listingCount === 0
                          ? undefined
                          : `${data.current.value.isComplete ? "가용 수량" : "확인된 수량"} ${formatAuctionNumber(data.current.value.availableQuantity)}개`,
                  fetchedAt: `조회 시각 ${formatAuctionDateTime(data.current.value.fetchedAt)}`,
              };
    const recent: PreviewCopy["recent"] =
        data.recent.status !== "success"
            ? { primary: "완료 거래 조회 불가" }
            : {
                  badge: data.recent.value.hasMore ? "일부 데이터" : undefined,
                  primary:
                      data.recent.value.prepared.summary.transactionCount === 0
                          ? data.recent.value.hasMore
                              ? "확인된 완료 거래 없음"
                              : "최근 1시간 거래 없음"
                          : `최근 1시간 ${formatAuctionNumber(data.recent.value.prepared.summary.transactionCount)}건 · ${formatAuctionNumber(data.recent.value.prepared.summary.totalQuantity)}개`,
                  secondary:
                      data.recent.value.prepared.summary.transactionCount === 0
                          ? undefined
                          : data.recent.value.prepared.summary
                                  .medianUnitPrice === null
                            ? "거래 3건 미만"
                            : `완료 단가 중앙값 ${formatAuctionNumber(data.recent.value.prepared.summary.medianUnitPrice)} Gold`,
                  fetchedAt: `조회 시각 ${formatAuctionDateTime(data.recent.value.fetchedAt)}`,
              };

    return {
        current,
        recent,
        failure:
            data.current.status !== "success" &&
            data.recent.status !== "success"
                ? `${itemName} 시세 정보를 불러오지 못했습니다`
                : undefined,
    };
}

function PreviewCard({
    title,
    accent,
    copy,
}: {
    title: string;
    accent: string;
    copy: PreviewCopy["current"];
}) {
    return (
        <div
            style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                padding: "26px 28px",
                border: `2px solid ${accent}`,
                borderRadius: 22,
                backgroundColor: "#111827",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: accent,
                    fontSize: 24,
                }}
            >
                <span>{title}</span>
                {copy.badge && (
                    <span
                        style={{
                            padding: "5px 10px",
                            borderRadius: 999,
                            backgroundColor: accent,
                            color: "#07111f",
                            fontSize: 18,
                        }}
                    >
                        {copy.badge}
                    </span>
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <span style={{ color: "#f8fafc", fontSize: 34 }}>
                    {copy.primary}
                </span>
                {copy.secondary && (
                    <span
                        style={{
                            marginTop: 14,
                            color: "#cbd5e1",
                            fontSize: 25,
                        }}
                    >
                        {copy.secondary}
                    </span>
                )}
            </div>
            {copy.fetchedAt && (
                <span style={{ color: "#94a3b8", fontSize: 18 }}>
                    {copy.fetchedAt}
                </span>
            )}
        </div>
    );
}

function AuctionPreview({
    itemName,
    copy,
}: {
    itemName: string;
    copy: PreviewCopy;
}) {
    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                padding: "40px 46px 34px",
                backgroundColor: "#07111f",
                color: "#f8fafc",
                fontFamily: "AuctionPreview",
            }}
        >
            <div
                style={{
                    display: "flex",
                    color: "#67e8f9",
                    fontSize: 24,
                    letterSpacing: 1,
                }}
            >
                ERINN.ME · 마비노기 경매장
            </div>
            <div
                style={{
                    display: "flex",
                    height: 108,
                    alignItems: "center",
                    overflow: "hidden",
                    fontSize: 48,
                    lineHeight: 1.12,
                    wordBreak: "keep-all",
                }}
            >
                {itemName}
            </div>
            {copy.failure ? (
                <div
                    style={{
                        display: "flex",
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #475569",
                        borderRadius: 22,
                        backgroundColor: "#111827",
                        color: "#e2e8f0",
                        fontSize: 34,
                    }}
                >
                    {copy.failure}
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flex: 1,
                        gap: 22,
                    }}
                >
                    <PreviewCard
                        title="현재 등록 매물"
                        accent="#67e8f9"
                        copy={copy.current}
                    />
                    <PreviewCard
                        title="최근 1시간 완료 거래"
                        accent="#fbbf24"
                        copy={copy.recent}
                    />
                </div>
            )}
            <div
                style={{
                    display: "flex",
                    marginTop: 18,
                    color: "#94a3b8",
                    fontSize: 19,
                }}
            >
                Nexon Open API · 실시간/적정가 보장 아님
            </div>
        </div>
    );
}

function GenericPreview() {
    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#07111f",
                color: "#f8fafc",
                fontFamily: "AuctionPreview",
            }}
        >
            <span style={{ color: "#67e8f9", fontSize: 28 }}>ERINN.ME</span>
            <span style={{ marginTop: 24, fontSize: 52 }}>
                마비노기 경매장 시세
            </span>
        </div>
    );
}

function AsciiFallback() {
    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#07111f",
                color: "#f8fafc",
            }}
        >
            <span style={{ color: "#67e8f9", fontSize: 34 }}>ERINN.ME</span>
            <span style={{ marginTop: 24, fontSize: 50 }}>
                MABINOGI AUCTION
            </span>
            <span style={{ marginTop: 18, color: "#94a3b8", fontSize: 24 }}>
                PREVIEW TEMPORARILY UNAVAILABLE
            </span>
        </div>
    );
}

async function renderPng(
    element: React.ReactElement,
    font?: ArrayBuffer | Buffer
): Promise<Response> {
    const image = new ImageResponse(element, {
        width: WIDTH,
        height: HEIGHT,
        headers: { "Cache-Control": CACHE_CONTROL },
        fonts: font
            ? [{ name: "AuctionPreview", data: font, weight: 400 }]
            : undefined,
    });
    const body = await image.arrayBuffer();
    return new Response(body, {
        status: image.status,
        headers: image.headers,
    });
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ itemId: string }> }
): Promise<Response> {
    try {
        const { itemId } = await params;
        const item = getAuctionCatalogItemById(itemId);
        const font = await previewFont;
        if (!item) return await renderPng(<GenericPreview />, font);

        const copy = createPreviewCopy(
            item.name,
            await loadPreviewData(item.name)
        );
        return await renderPng(
            <AuctionPreview itemName={item.name} copy={copy} />,
            font
        );
    } catch {
        return renderPng(<AsciiFallback />);
    }
}
