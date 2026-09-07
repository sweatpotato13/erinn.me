import {
    fetchCouponPriceSummaries,
    fetchItemPriceSummary,
    getItemPrice,
} from "@/lib/api/auction";

const validSummary = {
    minPrice: 100,
    averagePrice: 120,
    availableQuantity: 4,
    isComplete: true,
};

describe("auction price client", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => jest.restoreAllMocks());

    it("returns a strict validated summary", async () => {
        jest.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(validSummary),
        } as Response);

        await expect(fetchItemPriceSummary("최고급 실크")).resolves.toEqual(
            validSummary
        );
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(
                "item_name=%EC%B5%9C%EA%B3%A0%EA%B8%89+%EC%8B%A4%ED%81%AC"
            ),
            { signal: undefined }
        );
    });

    it.each([
        ["2026-09-07T00:00:00Z", true],
        ["2024-02-29T23:59:59.123+09:00", true],
        ["2000-02-29T00:00:00Z", true],
        ["invalid", false],
        ["2026-02-30T00:00:00Z", false],
        ["2026-02-29T00:00:00Z", false],
        ["1900-02-29T00:00:00Z", false],
        ["2026-04-31T00:00:00+09:00", false],
        ["2026-09-07T24:00:00Z", false],
    ])(
        "validates calendar components in collection time %s",
        async (fetchedAt, valid) => {
            jest.mocked(fetch).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ ...validSummary, fetchedAt }),
            } as Response);
            const summary = await fetchItemPriceSummary("item");
            expect(summary.fetchedAt).toBe(valid ? fetchedAt : undefined);
        }
    );

    it("loads and validates all coupon summaries in one request", async () => {
        const summaries = {
            10: validSummary,
            20: null,
            30: validSummary,
            50: validSummary,
            100: validSummary,
        };
        jest.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(summaries),
        } as Response);

        await expect(fetchCouponPriceSummaries()).resolves.toEqual(summaries);
        expect(fetch).toHaveBeenCalledWith(
            "/api/auction/coupon-price-summary",
            { signal: undefined }
        );
    });

    it("rejects incomplete coupon batches", async () => {
        jest.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ 10: validSummary }),
        } as Response);

        await expect(fetchCouponPriceSummaries()).rejects.toThrow("Malformed");
    });

    it.each([
        { ...validSummary, minPrice: -1 },
        { ...validSummary, averagePrice: Number.NaN },
        { ...validSummary, availableQuantity: "4" },
        { ...validSummary, isComplete: "yes" },
        null,
    ])("rejects malformed summaries", async body => {
        jest.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(body),
        } as Response);
        await expect(fetchItemPriceSummary("item")).rejects.toThrow(
            "Malformed"
        );
    });

    it("rejects non-ok, transport, and empty-name failures", async () => {
        jest.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 502,
        } as Response);
        await expect(fetchItemPriceSummary("item")).rejects.toThrow("502");

        jest.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
        await expect(fetchItemPriceSummary("item")).rejects.toThrow("offline");
        await expect(fetchItemPriceSummary(" ")).rejects.toThrow("required");
    });

    it("keeps the compatibility wrapper's zero fallback", async () => {
        jest.mocked(fetch).mockRejectedValue(new Error("offline"));
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        await expect(getItemPrice("item")).resolves.toEqual({
            unitPrice: 0,
            averagePrice: 0,
            isComplete: true,
        });
    });
});
