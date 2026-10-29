import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mock } from "node:test";

import { type BrowserContext, chromium } from "@playwright/test";

import { collectReference } from "./collect-reference-data";
import { publishSnapshot, readSnapshot } from "./reference-data";

type Failure = "download" | "decoder";
type Scenario = Failure | "success";

const root = resolve("src/data/reference");
const resourceUrl =
    "https://mabires.pril.cc/resourcedata/kr/kr_resourcedata.bin.zst";

// A Prilus-shaped page: a chunk that throws when imported, then a store module
// exporting a MabiDB-like computed ref over the committed snapshot.
const successModules: Record<string, string> = {
    "/assets/index.js": `await fetch("/assets/broken.js");
await import("/assets/store.js");
await fetch("${resourceUrl}");`,
    "/assets/broken.js": `throw new Error("not the store module");`,
    "/assets/store.js": `const tables = await (await fetch("/snapshot.json")).json();
for (const row of tables.ItemCategoryList) row.TagMask = new Uint8Array(row.TagMask);
export const db = { value: {
    cache: new Map(),
    startFull: async () => {},
    getData: (name, region) => (region === "kr" ? tables[name] : undefined),
} };`,
};

function mockPages(context: BrowserContext, scenario: Scenario) {
    const newPage = context.newPage.bind(context);
    mock.method(context, "newPage", async () => {
        const page = await newPage();
        // Return only after interception is ready, before the collector can navigate.
        await page.route("**/*", route => {
            if (scenario === "success") {
                const { pathname } = new URL(route.request().url());
                if (route.request().isNavigationRequest())
                    return route.fulfill({
                        contentType: "text/html",
                        body: `<script type="module" src="/assets/index.js"></script>`,
                    });
                if (pathname in successModules)
                    return route.fulfill({
                        contentType: "text/javascript",
                        body: successModules[pathname],
                    });
                if (pathname === "/snapshot.json")
                    return route.fulfill({
                        contentType: "application/json",
                        body: JSON.stringify(readSnapshot(root).data),
                    });
                return route.fulfill({ body: "zstd bytes" });
            }
            const failure = scenario;
            if (route.request().isNavigationRequest()) {
                return route.fulfill({
                    contentType: "text/html",
                    body: `<script>fetch('https://mabires.pril.cc/resourcedata/kr/kr_resourcedata.bin.zst').then(() => { ${failure === "decoder" ? "throw new Error('simulated decoder failure')" : ""} });</script>`,
                });
            }
            return route.fulfill({
                status: failure === "download" ? 503 : 200,
                body: "corrupt protobuf",
            });
        });
        return page;
    });
}

function mockBrowser(scenario: Scenario, onClose: () => void) {
    const launch = chromium.launch.bind(chromium);
    return mock.method(
        chromium,
        "launch",
        async (options: Parameters<typeof launch>[0]) => {
            const browser = await launch({
                ...options,
                // Unintercepted requests must fail locally, never reach upstream.
                proxy: { server: "http://127.0.0.1:9" },
            });
            browser.on("disconnected", onClose);
            const newContext = browser.newContext.bind(browser);
            mock.method(
                browser,
                "newContext",
                async (contextOptions: Parameters<typeof newContext>[0]) => {
                    const context = await newContext(contextOptions);
                    mockPages(context, scenario);
                    if (scenario === "success")
                        mock.method(context.request, "get", () =>
                            Promise.resolve({
                                ok: () => true,
                                status: () => 200,
                                json: () =>
                                    Promise.resolve(
                                        readSnapshot(root).data.Version
                                    ),
                            })
                        );
                    return context;
                }
            );
            return browser;
        }
    );
}

async function checkFailure(failure: Failure) {
    const before = readFileSync(resolve(root, "manifest.json"), "utf8");
    let closed = false;
    const stub = mockBrowser(failure, () => {
        closed = true;
    });
    try {
        await assert.rejects(
            async () => {
                const { data, source } = await collectReference();
                publishSnapshot(root, data, source);
            },
            failure === "download" ? /HTTP 503/ : /simulated decoder failure/
        );
        assert.ok(closed, "collector closes Chromium on failure");
        assert.equal(
            readFileSync(resolve(root, "manifest.json"), "utf8"),
            before
        );
        readSnapshot(root); // Every referenced file still matches its committed checksum.
    } finally {
        stub.mock.restore();
    }
}

async function checkSuccess() {
    let closed = false;
    const stub = mockBrowser("success", () => {
        closed = true;
    });
    try {
        const { data, source } = await collectReference();
        assert.deepEqual(data, readSnapshot(root).data);
        assert.deepEqual(source, {
            site: "https://prilus.gitlab.io/",
            region: "kr",
            language: "kr",
            resourceUrl,
            versionUrl:
                "https://mabires.pril.cc/resourceversion/kr/kr_resourceversion.json",
            decoder: "upstream-playwright-mabidb",
            assets: ["https://prilus.gitlab.io/assets/index.js"],
        });
        assert.ok(closed, "collector closes Chromium on success");
    } finally {
        stub.mock.restore();
    }
}

// Optional Chromium check: synthetic responses, with outbound requests blocked.
async function main() {
    for (const failure of ["download", "decoder"] as const)
        await checkFailure(failure);
    await checkSuccess();
    console.log(
        "Prilus browser checks passed: download/decoder failures preserve the snapshot, a MabiDB page past a failing chunk yields the committed snapshot, and Chromium closes with outbound requests blocked."
    );
}

void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
