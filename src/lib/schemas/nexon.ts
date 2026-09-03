import * as z from "zod";

export const serverNameSchema = z.enum(["류트", "울프", "하프", "만돌린"]);

export const NpcShopNameSchema = z.enum([
    "델",
    "델렌",
    "상인 라누",
    "상인 피루",
    "모락",
    "상인 아루",
    "리나",
    "상인 누누",
    "상인 메루",
    "켄",
    "귀넥",
    "얼리",
    "데위",
    "테일로",
    "상인 세누",
    "상인 베루",
    "상인 에루",
    "상인 네루",
    "카디",
    "인장 상인",
    "피오나트",
]);

export const NpcShopChannelSchema = z.number().int().min(1).max(42);
export const NpcShopChannelQuerySchema = z.coerce
    .number()
    .pipe(NpcShopChannelSchema);

const NexonItemOptionSchema = z
    .object({
        option_type: z.string(),
        option_sub_type: z.string().nullish(),
        option_value: z.string().nullish(),
        option_value2: z.string().nullish(),
        option_desc: z.string().nullish(),
    })
    .passthrough();

const AuctionItemSchema = z
    .object({
        item_name: z.string(),
        item_display_name: z.string(),
        item_count: z.number().nonnegative(),
        auction_price_per_unit: z.number().nonnegative(),
        date_auction_expire: z.string(),
        item_option: z.array(NexonItemOptionSchema).nullish(),
    })
    .passthrough();

export const AuctionListResponseSchema = z
    .object({
        auction_item: z.array(AuctionItemSchema),
        next_cursor: z.string().nullish(),
    })
    .passthrough();

export type AuctionListResponse = z.infer<typeof AuctionListResponseSchema>;

export const AuctionHistoryItemSchema = z
    .object({
        item_name: z.string(),
        item_display_name: z.string(),
        item_count: z.number().nonnegative(),
        auction_price_per_unit: z.number().nonnegative(),
        date_auction_buy: z.string(),
        auction_buy_id: z.string(),
        item_option: z.array(NexonItemOptionSchema).nullish(),
    })
    .passthrough();

export const AuctionHistoryResponseSchema = z
    .object({
        auction_history: z.array(AuctionHistoryItemSchema),
        next_cursor: z.string().nullish(),
    })
    .passthrough();

export type AuctionHistoryResponse = z.infer<
    typeof AuctionHistoryResponseSchema
>;
export type AuctionHistoryItem = z.infer<typeof AuctionHistoryItemSchema>;

const HornMessageSchema = z
    .object({
        character_name: z.string(),
        message: z.string(),
        date_send: z.string(),
    })
    .passthrough();

export const HornResponseSchema = z
    .object({
        horn_bugle_world_history: z.array(HornMessageSchema),
    })
    .passthrough();

export type HornResponse = z.infer<typeof HornResponseSchema>;

const NpcShopPriceSchema = z
    .object({
        price_type: z.string(),
        price_value: z.union([z.string(), z.number()]),
    })
    .passthrough();

const NpcShopItemSchema = z
    .object({
        item_display_name: z.string(),
        item_count: z.number().int().nonnegative().nullish(),
        item_option: z.array(NexonItemOptionSchema).nullish(),
        image_url: z.string(),
        price: z.array(NpcShopPriceSchema),
        limit_type: z.string().nullish(),
        limit_value: z.number().int().nonnegative().nullish(),
    })
    .passthrough();

const NpcShopTabSchema = z
    .object({
        tab_name: z.string(),
        item: z.array(NpcShopItemSchema),
    })
    .passthrough();

export const NpcShopResponseSchema = z
    .object({
        shop_tab_count: z.number().int().nonnegative(),
        shop: z.array(NpcShopTabSchema),
        date_inquire: z.iso.datetime(),
        date_shop_next_update: z.iso.datetime(),
    })
    .passthrough();

export type NpcShopResponse = z.infer<typeof NpcShopResponseSchema>;
