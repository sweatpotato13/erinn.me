import { fetchPriceSummaries, loadCraftingPrices } from "@/lib/api/crafting";
import type { CraftingItem } from "@/types";

const items: CraftingItem[] = [
    {
        name: "A",
        imageUrl: "/a",
        materials: [
            { name: "shared", quantity: 4, price: 0, imageUrl: "/s" },
            { name: "fixed", quantity: 2, price: 50, imageUrl: "/f" },
        ],
    },
    {
        name: "B",
        imageUrl: "/b",
        materials: [
            { name: "shared", quantity: 21, price: 0, imageUrl: "/s" },
            { name: "failed", quantity: 1, price: 0, imageUrl: "/x" },
        ],
    },
];

describe("crafting price orchestration", () => {
    it("deduplicates names, caps quantity, and preserves partial success", async () => {
        const fetchSummary = jest.fn((name: string) => {
            if (name === "failed") return Promise.reject(new Error("failed"));
            return Promise.resolve({
                minPrice: 100,
                averagePrice: 120,
                availableQuantity: 10,
                isComplete: true,
            });
        });

        const priced = await loadCraftingPrices(items, 4, fetchSummary);
        expect(fetchSummary).toHaveBeenCalledTimes(2);
        expect(priced[0].materials[0]).toMatchObject({
            unitPrice: 100,
            totalPrice: 400,
        });
        expect(priced[1].materials[0]).toMatchObject({
            unitPrice: 100,
            totalPrice: 1000,
        });
        expect(priced[0].materials[1].totalPrice).toBe(100);
        expect(priced[1].materials[1].priceError).toBe("failed");
    });

    it("never exceeds the configured concurrency", async () => {
        let active = 0;
        let maximum = 0;
        const resolvers: (() => void)[] = [];
        const fetchSummary = jest.fn(
            (name: string) =>
                new Promise<{
                    minPrice: number;
                    averagePrice: number;
                    availableQuantity: number;
                    isComplete: boolean;
                }>(resolve => {
                    active++;
                    maximum = Math.max(maximum, active);
                    resolvers.push(() => {
                        active--;
                        resolve({
                            minPrice: name.length,
                            averagePrice: 1,
                            availableQuantity: 1,
                            isComplete: true,
                        });
                    });
                })
        );

        const pending = fetchPriceSummaries(
            ["a", "b", "c", "d", "e", "f"],
            4,
            fetchSummary
        );
        expect(active).toBe(4);
        while (resolvers.length) {
            resolvers.shift()?.();
            await Promise.resolve();
        }
        await pending;
        expect(maximum).toBe(4);
    });
});
