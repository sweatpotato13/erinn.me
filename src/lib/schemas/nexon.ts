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
        item_count: z.number(),
        auction_price_per_unit: z.number(),
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
