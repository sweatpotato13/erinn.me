import { parseStoredFavorites } from "@/app/auction/page";

describe("parseStoredFavorites", () => {
    it.each([
        ["null input", null],
        ["malformed JSON", "{"],
        ["non-array JSON", JSON.stringify({ itemName: "검" })],
        [
            "an array containing invalid entries",
            JSON.stringify([{ itemName: "검", category: "무기" }, null]),
        ],
    ])("returns an empty array for %s", (_case, value) => {
        expect(parseStoredFavorites(value)).toEqual([]);
    });

    it("preserves valid favorites", () => {
        const favorites = [
            { itemName: "검", category: "무기" },
            { itemName: "포션", category: "소모품" },
        ];

        expect(parseStoredFavorites(JSON.stringify(favorites))).toEqual(
            favorites
        );
    });
});
