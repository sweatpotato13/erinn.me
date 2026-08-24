import {
    parseAuctionSearchParams,
    setAuctionSearchUrl,
} from "@/app/auction/use-auction-url-state";
import { categories } from "@/constant/categories";

describe("auction URL state", () => {
    it("round-trips Korean search state while preserving unrelated URL data", () => {
        const current = new URL(
            "https://erinn.me/auction?view=compact#current-listings"
        );
        const result = setAuctionSearchUrl(current, {
            itemName: "  한글 검  ",
            category: "검",
        });

        expect(result.search).toEqual({ itemName: "한글 검", category: "검" });
        expect(result.url.searchParams.get("q")).toBe("한글 검");
        expect(result.url.searchParams.get("category")).toBe("검");
        expect(result.url.searchParams.get("view")).toBe("compact");
        expect(result.url.hash).toBe("#current-listings");
        expect(current.searchParams.has("q")).toBe(false);
    });

    it("omits default state and never adds listing data", () => {
        const result = setAuctionSearchUrl(
            new URL("https://erinn.me/auction?view=compact"),
            { itemName: "검", category: categories[0] }
        );

        expect(result.url.searchParams.get("q")).toBe("검");
        expect(result.url.searchParams.has("category")).toBe(false);
        for (const key of [
            "cursor",
            "listingId",
            "price",
            "item_count",
            "item_option",
            "date_auction_expire",
        ]) {
            expect(result.url.searchParams.has(key)).toBe(false);
        }
    });

    it.each([
        ["q=", null],
        [`q=${"가".repeat(101)}`, null],
        ["category=폐기된카테고리", null],
        ["q=검&q=활", { itemName: "검", category: categories[0] }],
        [
            "q=검&category=폐기된카테고리",
            { itemName: "검", category: categories[0] },
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
        });

        expect(result.url.href).toBe(current.href);
    });
});
