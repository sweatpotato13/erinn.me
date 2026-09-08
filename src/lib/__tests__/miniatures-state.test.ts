import data from "@/data/miniature-reference.json";
import { parseMiniatureStorage } from "@/lib/miniatures-state";

const stored = {
    formatVersion: 1,
    snapshotVersion: data.version,
    installedIds: [485, 485, 826],
};
test("saved installations are deduplicated and reconciled against the current snapshot", () => {
    expect(
        parseMiniatureStorage(JSON.stringify(stored), data).installedIds
    ).toEqual([485, 826]);
    const parsed = parseMiniatureStorage(
        JSON.stringify({
            ...stored,
            snapshotVersion: `1788405829:${"a".repeat(64)}`,
            installedIds: [485, 999999],
        }),
        data
    );
    expect(parsed.installedIds).toEqual([485]);
    expect(parsed.notice).toContain("999999");
    expect(parsed.notice).toContain("버전");
});
test("corruption, invalid identifiers and ownership-only data cannot activate installations", () => {
    for (const raw of [
        "{",
        "[]",
        " ".repeat(65537),
        JSON.stringify({ ...stored, ownedIds: [485] }),
        JSON.stringify({ ...stored, formatVersion: 2 }),
        ...[
            [-1],
            [1.1],
            [Number.MAX_SAFE_INTEGER + 1],
            Array(1001).fill(485),
        ].map(installedIds => JSON.stringify({ ...stored, installedIds })),
    ]) {
        expect(parseMiniatureStorage(raw, data).installedIds).toEqual([]);
        expect(parseMiniatureStorage(raw, data).notice).not.toBe("");
    }
    expect(parseMiniatureStorage(null, data)).toEqual({
        installedIds: [],
        notice: "",
    });
});
