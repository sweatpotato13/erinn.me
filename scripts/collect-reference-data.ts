import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

import {
    publishSnapshot,
    tableNames,
    validateData,
    versionSchema,
    type Source,
} from "./reference-data";

const site = "https://prilus.gitlab.io/";
const resourcePath = "/resourcedata/kr/kr_resourcedata.bin.br";

export async function collectReference() {
    const browser = await chromium.launch({ headless: true, timeout: 30_000 });
    const deadline = setTimeout(() => {
        void browser.close();
    }, 120_000);
    try {
        const context = await browser.newContext({
            locale: "ko-KR",
            serviceWorkers: "block",
        });
        context.setDefaultTimeout(120_000);
        context.setDefaultNavigationTimeout(30_000);
        await context.addInitScript(() => {
            localStorage.setItem("region", "kr");
            localStorage.setItem("lang", "kr");
        });
        // The app handles mirror discovery and its own Brotli/protobuf decoder.
        // Avoid fetching unrelated dynamic prices, analytics or visual resources.
        await context.route("**/*", route => {
            const url = new URL(route.request().url());
            if (
                url.origin === site.slice(0, -1) ||
                /^mabires\d*\.pril\.cc$/.test(url.hostname)
            ) {
                if (
                    ["image", "font", "media"].includes(
                        route.request().resourceType()
                    )
                )
                    return route.abort();
                return route.continue();
            }
            return route.abort();
        });
        const page = await context.newPage();
        // Install both waits before navigation so a fast download cannot be missed.
        const downloaded = page.waitForResponse(
            response => new URL(response.url()).pathname === resourcePath
        );
        const ready = Promise.race([
            page.waitForEvent("console", message =>
                /^MabiDB\.update: updated \d+ kr$/.test(message.text())
            ),
            page.waitForEvent("pageerror").then(error => {
                throw new Error(
                    `Upstream decoder/page failed: ${error.message}`
                );
            }),
        ]);
        // Navigation can fail before we await ready; avoid an unhandled rejection on close.
        void ready.catch(() => {});
        void downloaded.catch(() => {});
        await page.goto(site, { waitUntil: "domcontentloaded" });
        const response = await downloaded;
        if (!response.ok())
            throw new Error(
                `Resource download HTTP ${response.status()}: ${response.url()}`
            );
        const downloadError = await response.finished();
        if (downloadError) throw downloadError;
        await ready;
        const resourceUrl = response.url();
        const versionUrl = new URL(
            "/resourceversion/kr/kr_resourceversion.json",
            resourceUrl
        ).href;
        const versionResponse = await context.request.get(versionUrl, {
            timeout: 30_000,
        });
        if (!versionResponse.ok())
            throw new Error(
                `Version check HTTP ${versionResponse.status()}: ${versionUrl}`
            );
        const sourceVersion = versionSchema.parse(await versionResponse.json());
        // One readonly transaction reads both stores after the upstream completion marker.
        // Serialize in the browser to avoid Playwright expanding hundreds of thousands of objects.
        const exported = await page.evaluate(
            names =>
                new Promise<string>((resolveData, reject) => {
                    const request = indexedDB.open("prilus_mabi_db");
                    request.onerror = () => reject(request.error);
                    request.onupgradeneeded = () => {
                        request.transaction?.abort();
                        reject(new Error("Expected populated Prilus database"));
                    };
                    request.onsuccess = () => {
                        const db = request.result;
                        const transaction = db.transaction(
                            ["data", "version"],
                            "readonly"
                        );
                        const data: Record<string, unknown> = {};
                        for (const name of ["Version", ...names]) {
                            const read = transaction
                                .objectStore("data")
                                .get(`${name}_kr`);
                            read.onsuccess = () => {
                                data[name] = read.result;
                            };
                        }
                        const version = transaction
                            .objectStore("version")
                            .get("CreatedAt_kr");
                        transaction.oncomplete = () => {
                            db.close();
                            resolveData(
                                JSON.stringify({
                                    data,
                                    committedVersion: version.result,
                                })
                            );
                        };
                        transaction.onabort = transaction.onerror = () => {
                            db.close();
                            reject(
                                transaction.error ??
                                    new Error("IndexedDB export aborted")
                            );
                        };
                    };
                }),
            tableNames
        );
        const { data: input, committedVersion } = JSON.parse(exported);
        const { data } = validateData(input);
        if (
            data.Version.CreatedAt !== sourceVersion.CreatedAt ||
            committedVersion !== sourceVersion.CreatedAt
        )
            throw new Error(
                "Source version changed during collection or IndexedDB is incomplete; retry collection"
            );
        const assets = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll<HTMLScriptElement>(
                    'script[type="module"][src]'
                ),
                script => script.src
            ).sort()
        );
        const source: Source = {
            site,
            region: "kr",
            language: "kr",
            resourceUrl,
            versionUrl,
            decoder: "upstream-playwright-indexeddb",
            assets,
        };
        return { data, source };
    } catch (error) {
        throw new Error(
            `Prilus collection failed (120s deadline). Check upstream availability/decoder changes and retry; install Chromium with 'pnpm exec playwright install chromium' if needed. ${error instanceof Error ? error.message : String(error)}`,
            { cause: error }
        );
    } finally {
        clearTimeout(deadline);
        await browser.close();
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
    void collectReference()
        .then(({ data, source }) => {
            publishSnapshot(resolve("src/data/reference"), data, source);
        })
        .catch(error => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 1;
        });
}
