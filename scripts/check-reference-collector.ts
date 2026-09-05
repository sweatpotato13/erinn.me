import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mock } from "node:test";

import { chromium } from "@playwright/test";

import { collectReference } from "./collect-reference-data";
import { publishSnapshot, readSnapshot } from "./reference-data";

// Optional Chromium check: all browser responses are synthetic; no upstream access.
async function main() {
    const root = resolve("src/data/reference");
    const before = readFileSync(resolve(root, "manifest.json"), "utf8");
    const launch = chromium.launch.bind(chromium);
    for (const failure of ["download", "decoder"]) {
        let closed = false;
        const stub = mock.method(
            chromium,
            "launch",
            async (options: Parameters<typeof launch>[0]) => {
                const browser = await launch(options);
                browser.on("disconnected", () => {
                    closed = true;
                });
                const newContext = browser.newContext.bind(browser);
                mock.method(
                    browser,
                    "newContext",
                    async (
                        contextOptions: Parameters<typeof newContext>[0]
                    ) => {
                        const context = await newContext(contextOptions);
                        context.on("page", page => {
                            void page.route("**/*", route => {
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
                        });
                        return context;
                    }
                );
                return browser;
            }
        );
        try {
            await assert.rejects(
                async () => {
                    const { data, source } = await collectReference();
                    publishSnapshot(root, data, source);
                },
                failure === "download"
                    ? /HTTP 503/
                    : /simulated decoder failure/
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
    console.log(
        "Prilus browser checks passed: download/decoder failures preserve the snapshot and close Chromium."
    );
}

void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
