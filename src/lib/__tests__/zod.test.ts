/** @jest-environment jsdom */

describe("@/lib/zod in a browser", () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it("disables Zod JIT before any schema is created", async () => {
        const { z } = await import("../zod");

        expect(z.object({ a: z.string() }).parse({ a: "x" })).toEqual({
            a: "x",
        });
        expect(z.core.globalConfig.jitless).toBe(true);
    });

    it("does not probe new Function when an object schema is created", async () => {
        const probe = jest.spyOn(globalThis, "Function");

        const { z } = await import("../zod");
        z.object({ a: z.string() });

        expect(probe).not.toHaveBeenCalled();
        probe.mockRestore();
    });

    it("re-exports the Zod API", async () => {
        const mod = await import("../zod");

        expect(typeof mod.z.string).toBe("function");
        expect(typeof mod.config).toBe("function");
    });
});
