import { z } from "zod";

import { AuctionListResponseSchema } from "@/lib/schemas/nexon";

const responseSchema = z
    .object({
        items: AuctionListResponseSchema.shape.auction_item.max(2500),
        hasMore: z.boolean(),
        nextCursor: z.string().max(2048).nullish(),
    })
    .refine(
        r => r.hasMore === Boolean(r.nextCursor?.trim()),
        "Inconsistent auction cursor"
    );

export interface TotemMarketResult {
    name: string;
    observedAt: string;
    receivedCount: number;
    hasMore: boolean;
    listings: TotemListing[];
}

export type TotemListing = {
    kind: "listing";
    key: string;
    observedAt: string;
    item: z.infer<typeof AuctionListResponseSchema>["auction_item"][number];
};

/** One browser request; the existing server bounds aggregation to five pages. */
export async function fetchTotemListings(
    name: string,
    signal: AbortSignal,
    requestId: string
): Promise<TotemMarketResult> {
    if (!name.trim() || name.length > 100)
        throw new Error("토템 이름을 확인해 주세요.");
    const params = new URLSearchParams({
        auction_item_category: "토템",
        item_name: name,
    });
    const response = await fetch(`/api/auction?${params}`, { signal });
    if (!response.ok)
        throw new Error(
            "매물을 불러오지 못했습니다. 수동 비교는 계속 사용할 수 있습니다."
        );
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success)
        throw new Error(
            "매물 응답 형식을 확인할 수 없습니다. 다시 조회해 주세요."
        );
    const observedAt = new Date().toISOString();
    return {
        name,
        observedAt,
        receivedCount: parsed.data.items.length,
        hasMore: parsed.data.hasMore,
        // Do not prepareAuctionResults(): it drops zero prices and invalid quantities.
        // Original row indices distinguish identical listings within this observation.
        listings: parsed.data.items.flatMap((item, index) =>
            item.item_name === name
                ? [
                      {
                          kind: "listing" as const,
                          key: `${requestId}:${index}`,
                          observedAt,
                          item,
                      },
                  ]
                : []
        ),
    };
}
