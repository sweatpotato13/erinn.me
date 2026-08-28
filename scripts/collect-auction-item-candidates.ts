import "dotenv/config";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import * as z from "zod";

type Candidate = { name: string; canonicalId?: string };
type Evidence = "current-listing" | "recent-sale";
const candidateInputSchema = z.array(
    z.union([
        z.string(),
        z
            .object({
                name: z.string(),
                canonicalId: z.string().min(1).optional(),
            })
            .strict(),
    ])
);

const inputFlag = process.argv.indexOf("--input");
const inputPath = inputFlag >= 0 ? process.argv[inputFlag + 1] : undefined;
const { NXOPEN_API_URL, NXOPEN_API_KEY } = process.env;
if (!inputPath || !NXOPEN_API_URL || !NXOPEN_API_KEY) {
    console.error(
        "Usage: pnpm catalog:collect --input <candidate.json> (NXOPEN_API_URL and NXOPEN_API_KEY required)"
    );
    process.exit(1);
}
const candidateInputPath = inputPath;
const upstreamApiKey = NXOPEN_API_KEY;

let upstreamBaseUrl: URL;
try {
    upstreamBaseUrl = new URL(NXOPEN_API_URL);
    if (upstreamBaseUrl.protocol !== "https:") throw new TypeError();
} catch {
    console.error("NXOPEN_API_URL must be a valid HTTPS URL");
    process.exit(1);
}

const delay = (milliseconds: number) =>
    new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
const readJson = (path: string) =>
    JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const parsedInput = candidateInputSchema.safeParse(
    readJson(candidateInputPath)
);
if (!parsedInput.success) {
    console.error(
        "Candidate input must be an array of names or { name, canonicalId } objects"
    );
    process.exit(1);
}
const candidates: Candidate[] = parsedInput.data.map(candidate =>
    typeof candidate === "string" ? { name: candidate } : candidate
);
const localItems: Array<{ id: string; name: string }> = readJson(
    "src/data/all-item-list.json"
);
const idsByName = new Map<string, string[]>();
for (const item of localItems) {
    const ids = idsByName.get(item.name) ?? [];
    ids.push(item.id);
    idsByName.set(item.name, ids);
}

async function hasEvidence(path: string, name: string): Promise<boolean> {
    const url = new URL(path, upstreamBaseUrl);
    url.searchParams.set("item_name", name);
    const response = await fetch(url, {
        headers: { "x-nxopen-api-key": upstreamApiKey },
        redirect: "error",
    });
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as Record<string, unknown>;
    const values = path.endsWith("/history")
        ? data.auction_history
        : data.auction_item;
    return Array.isArray(values) && values.length > 0;
}

async function main(): Promise<void> {
    const report = {
        source: basename(candidateInputPath),
        createdAt: new Date().toISOString(),
        stoppedByRateLimit: false,
        candidates: [] as Array<Record<string, unknown>>,
    };

    for (const [index, candidate] of candidates.entries()) {
        if (report.candidates.filter(row => row.evidence).length >= 1000) break;
        const name = candidate.name.trim();
        const ids = idsByName.get(name) ?? [];
        const chosenId =
            candidate.canonicalId ?? (ids.length === 1 ? ids[0] : null);
        const result: Record<string, unknown> = {
            source: report.source,
            rank: index + 1,
            name,
            candidateIds: ids,
            chosenCanonicalId: chosenId,
        };
        if (!name || !chosenId || !ids.includes(chosenId)) {
            result.rejectionReason = !name
                ? "empty-name"
                : ids.length > 1 && !candidate.canonicalId
                  ? "canonical-id-required"
                  : "unknown-canonical-id";
            report.candidates.push(result);
            continue;
        }
        try {
            let evidence: Evidence | null = (await hasEvidence(
                "/mabinogi/v1/auction/list",
                name
            ))
                ? "current-listing"
                : null;
            await delay(250);
            if (
                !evidence &&
                (await hasEvidence("/mabinogi/v1/auction/history", name))
            ) {
                evidence = "recent-sale";
            }
            if (evidence) {
                result.evidence = evidence;
                result.verifiedAt = new Date().toISOString();
            } else {
                result.rejectionReason = "no-current-or-recent-activity";
            }
        } catch (error) {
            if (error instanceof Error && error.message === "RATE_LIMITED") {
                report.stoppedByRateLimit = true;
                result.rejectionReason = "rate-limited";
                report.candidates.push(result);
                break;
            }
            result.rejectionReason =
                error instanceof Error ? error.message : "request-failed";
        }
        report.candidates.push(result);
        await delay(250);
    }

    const outputDir = resolve(process.cwd(), "artifacts");
    mkdirSync(outputDir, { recursive: true });
    const outputPath = resolve(outputDir, "auction-catalog-candidates.json");
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    const eligible = report.candidates.filter(row => row.evidence).length;
    console.log(`Wrote ${outputPath}: ${eligible} eligible candidates`);
    if (eligible < 500) process.exitCode = 1;
}

void main().catch(error => {
    console.error(error instanceof Error ? error.message : "Collector failed");
    process.exitCode = 1;
});
