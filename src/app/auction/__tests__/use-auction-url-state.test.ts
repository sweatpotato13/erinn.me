import { act, renderHook } from "@testing-library/react";

import {
    parseAuctionSearchParams,
    setAuctionSearchUrl,
    shareUrl,
    useAuctionUrlState,
} from "@/app/auction/use-auction-url-state";
import { categories } from "@/constant/categories";
import { getAuctionCatalogItems } from "@/lib/auction-item-catalog";
import { getAuctionSearchPath, getAuctionShareTarget } from "@/lib/auction-url";

describe("auction URL state", () => {
    const catalogItem = getAuctionCatalogItems()[0];

    it("round-trips Korean search state while preserving unrelated URL data", () => {
        const current = new URL(
            "https://erinn.me/auction?view=compact#current-listings"
        );
        const result = setAuctionSearchUrl(current, {
            itemName: "  한글 검  ",
            category: "검",
            optionFilters: {},
        });

        expect(result.search).toEqual({
            itemName: "한글 검",
            category: "검",
            optionFilters: {},
        });
        expect(result.url.searchParams.get("q")).toBe("한글 검");
        expect(result.url.searchParams.get("category")).toBe("검");
        expect(result.url.searchParams.get("view")).toBe("compact");
        expect(result.url.hash).toBe("#current-listings");
        expect(current.searchParams.has("q")).toBe(false);
    });

    it("omits default state and removes listing data", () => {
        const prohibitedParams = [
            "cursor",
            "listingId",
            "price",
            "item_count",
            "item_option",
            "date_auction_expire",
        ];
        const current = new URL("https://erinn.me/auction?view=compact");
        prohibitedParams.forEach(key => current.searchParams.set(key, "stale"));
        const result = setAuctionSearchUrl(current, {
            itemName: "검",
            category: categories[0],
            optionFilters: {},
        });

        expect(result.url.searchParams.get("q")).toBe("검");
        expect(result.url.searchParams.has("category")).toBe(false);
        expect(result.url.searchParams.get("view")).toBe("compact");
        for (const key of prohibitedParams) {
            expect(result.url.searchParams.has(key)).toBe(false);
        }
    });

    it.each([
        ["q=", null],
        [`q=${"가".repeat(101)}`, null],
        ["category=폐기된카테고리", null],
        [
            "q=검&q=활",
            { itemName: "검", category: categories[0], optionFilters: {} },
        ],
        [
            "q=검&category=폐기된카테고리",
            { itemName: "검", category: categories[0], optionFilters: {} },
        ],
    ])("normalizes invalid params: %s", (query, search) => {
        const result = parseAuctionSearchParams(new URLSearchParams(query));

        expect(result.invalid).toBe(true);
        expect(result.search).toEqual(search);
        expect(result.normalized.getAll("q")).toHaveLength(search ? 1 : 0);
        expect(result.normalized.has("category")).toBe(false);
    });

    it("produces the same URL for the same canonical search", () => {
        const current = new URL(
            "https://erinn.me/auction?view=compact&q=%EA%B2%80"
        );
        const result = setAuctionSearchUrl(current, {
            itemName: "검",
            category: categories[0],
            optionFilters: {},
        });

        expect(result.url.href).toBe(current.href);
    });

    it("round-trips canonical option filters", () => {
        const result = setAuctionSearchUrl(
            new URL("https://erinn.me/auction?view=compact&option_unknown=x"),
            {
                itemName: "검",
                category: categories[0],
                optionFilters: {
                    enchantName: "  여명  ",
                    reforge: { optionName: "볼트  대미지", minLevel: 10 },
                    erg: { grade: "S", minLevel: 40 },
                },
            }
        );

        expect(result.search).toEqual({
            itemName: "검",
            category: categories[0],
            optionFilters: {
                enchantName: "여명",
                reforge: { optionName: "볼트 대미지", minLevel: 10 },
                erg: { grade: "S", minLevel: 40 },
            },
        });
        expect(result.url.searchParams.get("option_enchant")).toBe("여명");
        expect(result.url.searchParams.get("option_reforge")).toBe(
            "볼트 대미지"
        );
        expect(result.url.searchParams.get("option_erg")).toBe("present");
        expect(result.url.searchParams.get("option_erg_grade")).toBe("S");
        expect(result.url.searchParams.has("option_unknown")).toBe(false);
        expect(result.url.searchParams.get("view")).toBe("compact");
    });

    it.each([
        [
            "q=검&option_reforge=볼트",
            "세공 옵션 이름과 최소 레벨을 함께 입력해주세요.",
        ],
        [
            "q=검&option_unknown=x",
            "지원하지 않는 장비 옵션 필터입니다: option_unknown",
        ],
        [
            "q=검&option_enchant=a&option_enchant=b",
            "장비 옵션 필터는 같은 항목을 한 번만 지정할 수 있습니다: option_enchant",
        ],
    ])("removes invalid option params: %s", (query, filterError) => {
        const result = parseAuctionSearchParams(new URLSearchParams(query));

        expect(result.invalid).toBe(true);
        expect(result.filterError).toBe(filterError);
        expect(result.search).toEqual({
            itemName: "검",
            category: categories[0],
            optionFilters: {},
        });
        expect(
            Array.from(result.normalized.keys()).some(key =>
                key.startsWith("option_")
            )
        ).toBe(false);
    });

    it("removes option filters without a base search", () => {
        const result = parseAuctionSearchParams(
            new URLSearchParams("view=compact&option_erg=present")
        );

        expect(result.search).toBeNull();
        expect(result.invalid).toBe(true);
        expect(result.normalized.toString()).toBe("view=compact");
    });

    it("skips a deferred restore after commit changes the URL", () => {
        jest.useFakeTimers();
        window.history.replaceState(null, "", "/auction");
        const onRestore = jest.fn();
        const pushState = jest.spyOn(window.history, "pushState");
        const { result } = renderHook(() => useAuctionUrlState(onRestore));

        act(() => result.current.commit("검", categories[0], {}));
        expect(pushState).toHaveBeenCalledTimes(1);
        act(() => jest.runOnlyPendingTimers());

        expect(onRestore).not.toHaveBeenCalled();
        jest.useRealTimers();
    });

    it.each([
        [
            "partial keyword",
            {
                itemName: catalogItem.name.slice(0, 1),
                category: categories[0],
                optionFilters: {},
            },
            "/auction?view=compact&q=",
        ],
        [
            "non-catalog exact name",
            {
                itemName: "한글 + & (雪)",
                category: categories[0],
                optionFilters: {},
            },
            "/auction?view=compact&q=",
        ],
        [
            "category only",
            { itemName: "", category: "검", optionFilters: {} },
            "/auction?view=compact&category=",
        ],
        [
            "non-default category",
            { itemName: catalogItem.name, category: "기타", optionFilters: {} },
            "/auction?view=compact&q=",
        ],
        [
            "option filter",
            {
                itemName: catalogItem.name,
                category: categories[0],
                optionFilters: { enchantName: "여명" },
            },
            "/auction?view=compact&q=",
        ],
    ])(
        "keeps %s shares on the normalized query URL",
        (_label, search, prefix) => {
            const target = getAuctionShareTarget(
                new URL("https://erinn.me/auction?view=compact"),
                search
            );
            expect(
                `${target.pathname}${target.search}`.startsWith(prefix)
            ).toBe(true);
        }
    );

    it("uses the stable item URL for exact unfiltered catalog searches", () => {
        const target = getAuctionShareTarget(
            new URL("https://erinn.me/auction?view=compact#results"),
            {
                itemName: catalogItem.name,
                category: categories[0],
                optionFilters: {},
            }
        );
        expect(target.href).toBe(
            `https://erinn.me/auction/items/${catalogItem.id}`
        );
    });

    it("preserves special characters in the item-page auction CTA", () => {
        const name = "한글 + & (雪)";
        const target = new URL(getAuctionSearchPath(name), "https://erinn.me");
        expect(target.pathname).toBe("/auction");
        expect(target.searchParams.get("q")).toBe(name);
    });

    it("passes the same stable target to native share and clipboard fallback", async () => {
        const expected = `http://localhost/auction/items/${catalogItem.id}`;
        const nativeShare = jest.fn().mockResolvedValue(undefined);
        const clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
        Object.defineProperty(navigator, "share", {
            configurable: true,
            value: nativeShare,
        });
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: clipboard,
        });
        await shareUrl(expected);
        expect(nativeShare).toHaveBeenCalledWith({
            title: "Erinn.me 경매장 검색",
            url: expected,
        });
        Object.defineProperty(navigator, "share", {
            configurable: true,
            value: undefined,
        });
        await shareUrl(expected);
        expect(clipboard.writeText).toHaveBeenCalledWith(expected);
    });
});
