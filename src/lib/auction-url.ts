import { categories } from "@/constant/categories";
import {
    getAuctionCatalogItemByExactName,
    getAuctionItemPath,
} from "@/lib/auction-item-catalog";
import {
    appendAuctionOptionFilterQuery,
    type AuctionOptionFilters,
    hasAuctionOptionFilters,
    parseAuctionOptionFilterQuery,
} from "@/lib/auction-options";

const ITEM_QUERY_PARAM = "q";
const CATEGORY_QUERY_PARAM = "category";
const MAX_ITEM_QUERY_LENGTH = 100;
export const DEFAULT_AUCTION_CATEGORY = categories[0];
const PROHIBITED_AUCTION_PARAMS = [
    "cursor",
    "listingId",
    "price",
    "item_count",
    "item_option",
    "date_auction_expire",
];

export interface AuctionUrlSearch {
    itemName: string;
    category: string;
    optionFilters: AuctionOptionFilters;
}

function deleteAuctionOptionParams(params: URLSearchParams) {
    for (const key of Array.from(params.keys())) {
        if (key.startsWith("option_")) params.delete(key);
    }
}

function parseBaseAuctionParams(params: URLSearchParams) {
    const itemValues = params.getAll(ITEM_QUERY_PARAM);
    const itemName = (itemValues[0] ?? "").trim();
    const usableItemName =
        itemName.length > 0 && itemName.length <= MAX_ITEM_QUERY_LENGTH;
    const invalidItemName =
        params.has(ITEM_QUERY_PARAM) &&
        (itemValues.length !== 1 || !usableItemName);
    const categoryValues = params.getAll(CATEGORY_QUERY_PARAM);
    const categoryValue = categoryValues[0] ?? DEFAULT_AUCTION_CATEGORY;
    const usableCategory = categories.includes(categoryValue);
    return {
        itemName,
        usableItemName,
        invalidItemName,
        category: usableCategory ? categoryValue : DEFAULT_AUCTION_CATEGORY,
        invalidCategory:
            params.has(CATEGORY_QUERY_PARAM) &&
            (categoryValues.length !== 1 || !usableCategory),
    };
}

export function parseAuctionSearchParams(params: URLSearchParams): {
    search: AuctionUrlSearch | null;
    normalized: URLSearchParams;
    invalid: boolean;
    filterError: string | null;
} {
    const normalized = new URLSearchParams(params);
    const hasOptionParams = Array.from(params.keys()).some(key =>
        key.startsWith("option_")
    );
    const parsedFilters = parseAuctionOptionFilterQuery(params);
    const base = parseBaseAuctionParams(params);

    if (base.usableItemName) normalized.set(ITEM_QUERY_PARAM, base.itemName);
    else normalized.delete(ITEM_QUERY_PARAM);
    if (base.category !== DEFAULT_AUCTION_CATEGORY) {
        normalized.set(CATEGORY_QUERY_PARAM, base.category);
    } else {
        normalized.delete(CATEGORY_QUERY_PARAM);
    }
    PROHIBITED_AUCTION_PARAMS.forEach(param => normalized.delete(param));
    deleteAuctionOptionParams(normalized);

    const hasBaseSearch =
        base.usableItemName || base.category !== DEFAULT_AUCTION_CATEGORY;
    const optionFilters = parsedFilters.success
        ? (parsedFilters.filters ?? {})
        : {};
    if (hasBaseSearch && parsedFilters.success) {
        appendAuctionOptionFilterQuery(normalized, optionFilters);
    }
    const search = hasBaseSearch
        ? {
              itemName: base.usableItemName ? base.itemName : "",
              category: base.category,
              optionFilters,
          }
        : null;
    return {
        search,
        normalized,
        invalid:
            base.invalidItemName ||
            base.invalidCategory ||
            !parsedFilters.success ||
            (!hasBaseSearch && hasOptionParams),
        filterError: parsedFilters.success ? null : parsedFilters.error,
    };
}

export function setAuctionSearchUrl(
    currentUrl: URL,
    search: AuctionUrlSearch
): ReturnType<typeof parseAuctionSearchParams> & { url: URL } {
    const url = new URL(currentUrl);
    const itemName = search.itemName.trim();
    if (itemName) url.searchParams.set(ITEM_QUERY_PARAM, itemName);
    else url.searchParams.delete(ITEM_QUERY_PARAM);
    if (search.category !== DEFAULT_AUCTION_CATEGORY) {
        url.searchParams.set(CATEGORY_QUERY_PARAM, search.category);
    } else {
        url.searchParams.delete(CATEGORY_QUERY_PARAM);
    }
    deleteAuctionOptionParams(url.searchParams);
    appendAuctionOptionFilterQuery(url.searchParams, search.optionFilters);
    const parsed = parseAuctionSearchParams(url.searchParams);
    url.search = parsed.normalized.toString();
    return { ...parsed, url };
}

export function getAuctionShareTarget(
    currentUrl: URL,
    search: AuctionUrlSearch
): URL {
    const item = getAuctionCatalogItemByExactName(search.itemName);
    if (
        item &&
        search.category === DEFAULT_AUCTION_CATEGORY &&
        !hasAuctionOptionFilters(search.optionFilters)
    ) {
        return new URL(getAuctionItemPath(item), currentUrl.origin);
    }
    return setAuctionSearchUrl(currentUrl, search).url;
}

export function getAuctionSearchPath(itemName: string): string {
    const url = setAuctionSearchUrl(new URL("/auction", "https://erinn.me"), {
        itemName,
        category: DEFAULT_AUCTION_CATEGORY,
        optionFilters: {},
    }).url;
    return `${url.pathname}${url.search}`;
}
