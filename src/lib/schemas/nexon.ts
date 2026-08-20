import * as z from "zod";

const AuctionItemOptionSchema = z
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
        item_option: z.array(AuctionItemOptionSchema).nullish(),
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
        item_option: z.array(AuctionItemOptionSchema).nullish(),
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
        image_url: z.string(),
        price: z.array(NpcShopPriceSchema),
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
        shop: z.array(NpcShopTabSchema),
    })
    .passthrough();
