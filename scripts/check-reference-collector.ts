import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mock } from "node:test";

import { type BrowserContext, chromium } from "@playwright/test";

import { collectReference } from "./collect-reference-data";
import { publishSnapshot, readSnapshot } from "./reference-data";

type Failure = "download" | "decoder";

function mockPages(context: BrowserContext, failure: Failure) {
    const newPage = context.newPage.bind(context);
    mock.method(context, "newPage", async () => {
        const page = await newPage();
        // Return only after interception is ready, before the collector can navigate.
        await page.route("**/*", route => {
            if (route.request().isNavigationRequest()) {
                return route.fulfill({
                    contentType: "text/html",
                    body: `<script>fetch('https://mabires.pril.cc/resourcedata/kr/kr_resourcedata.bin.br').then(() => { ${failure === "decoder" ? "throw new Error('simulated decoder failure')" : ""} });</script>`,
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

function mockBrowser(failure: Failure, onClose: () => void) {
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
                    mockPages(context, failure);
                    return context;
                }
            );
            return browser;
        }
    );
}

async function checkFailure(failure: Failure) {
    const root = resolve("src/data/reference");
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

// Optional Chromium check: synthetic responses, with outbound requests blocked.
async function main() {
    for (const failure of ["download", "decoder"] as const)
        await checkFailure(failure);
    console.log(
        "Prilus browser checks passed: download/decoder failures preserve the snapshot and close Chromium with outbound requests blocked."
    );
}

void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
