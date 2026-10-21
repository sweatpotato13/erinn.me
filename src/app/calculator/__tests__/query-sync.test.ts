import { consumeOwnWriteEcho, type QuerySyncState } from "../query-sync";

function createState(overrides: Partial<QuerySyncState> = {}): QuerySyncState {
    return {
        restoredQuery: "",
        lastSeenKey: null,
        pendingWrites: [],
        historyNavigation: false,
        ...overrides,
    };
}

describe("consumeOwnWriteEcho", () => {
    it("treats the latest written query as an echo and clears pending writes", () => {
        const state = createState({
            restoredQuery: "q3",
            pendingWrites: ["q2", "q3"],
        });

        expect(consumeOwnWriteEcho(state, "q3")).toBe(true);
        expect(state.pendingWrites).toEqual([]);
    });

    it("treats an older pending write as a stale echo and keeps newer ones", () => {
        const state = createState({
            restoredQuery: "q3",
            pendingWrites: ["q1", "q2", "q3"],
        });

        expect(consumeOwnWriteEcho(state, "q2")).toBe(true);
        expect(state.pendingWrites).toEqual(["q3"]);
    });

    it("drops echoes skipped by the router when a newer one arrives first", () => {
        const state = createState({
            restoredQuery: "q4",
            pendingWrites: ["q2", "q3", "q4"],
        });

        expect(consumeOwnWriteEcho(state, "q3")).toBe(true);
        expect(state.pendingWrites).toEqual(["q4"]);
    });

    it("does not treat an unknown query as an echo, so back navigation restores", () => {
        const state = createState({
            restoredQuery: "q3",
            pendingWrites: ["q3"],
        });

        expect(consumeOwnWriteEcho(state, "q1")).toBe(false);
        expect(state.pendingWrites).toEqual(["q3"]);
    });

    it("does not treat a delivered query as an echo again once pending is empty", () => {
        const state = createState({ restoredQuery: "q3" });

        expect(consumeOwnWriteEcho(state, "q2")).toBe(false);
    });

    it("handles the initial empty query", () => {
        const state = createState({ restoredQuery: "" });

        expect(consumeOwnWriteEcho(state, "")).toBe(true);
    });

    it("treats Back/Forward as navigation even when the query is still pending", () => {
        const state = createState({
            restoredQuery: "q3",
            pendingWrites: ["q2", "q3"],
            historyNavigation: true,
        });

        expect(consumeOwnWriteEcho(state, "q2")).toBe(false);
        expect(state.pendingWrites).toEqual([]);
        expect(state.historyNavigation).toBe(false);
        expect(consumeOwnWriteEcho(state, "q2")).toBe(false);
    });
});
