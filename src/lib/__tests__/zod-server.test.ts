/** @jest-environment node */

describe("@/lib/zod on the server", () => {
    it("keeps the Zod JIT fast path enabled", async () => {
        const { z } = await import("../zod");

        expect(z.core.globalConfig.jitless).not.toBe(true);
        expect(z.object({ a: z.string() }).parse({ a: "x" })).toEqual({
            a: "x",
        });
    });
});
