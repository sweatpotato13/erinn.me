import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

type RouteStat = {
    route: string;
    firstLoadUncompressedJsBytes: number;
};

const outputPath = process.argv[2];

if (!outputPath) {
    throw new Error("Usage: capture-bundle-stats.ts <output-path>");
}

const statsPath = resolve(
    process.cwd(),
    ".next/diagnostics/route-bundle-stats.json"
);
const stats = JSON.parse(readFileSync(statsPath, "utf8")) as RouteStat[];
const auditedRoutes = ["/auction"] as const;
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
}).trim();
const isDirty =
    execFileSync("git", ["status", "--porcelain"], {
        encoding: "utf8",
    }).trim().length > 0;

const routes = Object.fromEntries(
    auditedRoutes.map(route => {
        const stat = stats.find(candidate => candidate.route === route);
        if (!stat || !Number.isFinite(stat.firstLoadUncompressedJsBytes)) {
            throw new Error(`Missing bundle metric for ${route}`);
        }
        return [route, { bytes: stat.firstLoadUncompressedJsBytes }];
    })
);

const artifact = {
    metric: "firstLoadUncompressedJsBytes",
    sourceCommit: isDirty ? `${commit}+working-tree` : commit,
    buildCommand: "pnpm build",
    routes,
    capturedAt: new Date().toISOString(),
};

const resolvedOutput = resolve(process.cwd(), outputPath);
mkdirSync(dirname(resolvedOutput), { recursive: true });
writeFileSync(resolvedOutput, `${JSON.stringify(artifact, null, 2)}\n`);
