/** @jest-environment node */
import reference from "../../src/data/barter-reference.json";

jest.mock("node:fs/promises", () => ({
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockResolvedValue(undefined),
    rm: jest.fn().mockResolvedValue(undefined),
}));

test.each(["success", "write", "rename", "cleanup"])(
    "icon publication preserves results and cleans temporary files: %s",
    async failure => {
        jest.resetModules();
        const io = jest.mocked(await import("node:fs/promises"));
        const original = new Error("Original filesystem failure");
        if (failure === "write") io.writeFile.mockRejectedValue(original);
        if (failure === "rename" || failure === "cleanup")
            io.rename.mockRejectedValue(original);
        if (failure === "cleanup")
            io.rm.mockRejectedValue(new Error("Cleanup failure"));
        const previousExitCode = process.exitCode;
        const request = jest.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            arrayBuffer: async () =>
                Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]).buffer,
        } as Response);
        let finish!: (value: unknown) => void;
        const finished = new Promise(resolve => {
            finish = resolve;
        });
        const log = jest.spyOn(console, "log").mockImplementation(finish);
        const error = jest.spyOn(console, "error").mockImplementation(finish);
        try {
            await import("../collect-barter-icons");
            const result = await finished;
            if (failure === "success") {
                expect(result).toBe(
                    `Saved ${reference.materials.length} local barter material icons.`
                );
                expect(io.rename).toHaveBeenCalledTimes(
                    reference.materials.length
                );
                expect(io.rm).not.toHaveBeenCalled();
            } else {
                expect(result).toBe(original);
                expect(process.exitCode).toBe(1);
                expect(io.rm).toHaveBeenCalledWith(
                    expect.stringMatching(/\.tmp$/),
                    { force: true }
                );
                if (failure === "write")
                    expect(io.rename).not.toHaveBeenCalled();
            }
        } finally {
            process.exitCode = previousExitCode;
            request.mockRestore();
            log.mockRestore();
            error.mockRestore();
        }
    }
);
