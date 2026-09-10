import assert from "node:assert/strict";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import reference from "../src/data/barter-reference.json";

// Explicit maintainer command; rendering and builds use these local files only.
async function main() {
    const directory = resolve("public/images/barter");
    await mkdir(directory, { recursive: true });
    for (let i = 0; i < reference.materials.length; i += 3) {
        await Promise.all(
            reference.materials.slice(i, i + 3).map(async ({ id }) => {
                const response = await fetch(
                    `https://mabires2.pril.cc/invimage/kr/${id}/${id}.png`,
                    {
                        signal: AbortSignal.timeout(15000),
                        redirect: "error",
                    }
                );
                assert(
                    response.ok,
                    `Material icon ${id}: HTTP ${response.status}`
                );
                const bytes = Buffer.from(await response.arrayBuffer());
                assert(
                    bytes.length <= 1024 * 1024 &&
                        bytes
                            .subarray(0, 8)
                            .equals(
                                Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
                            ),
                    `Invalid PNG: ${id}`
                );
                const temporary = resolve(
                    directory,
                    `${id}.${process.pid}.tmp`
                );
                try {
                    await writeFile(temporary, bytes);
                    await rename(temporary, resolve(directory, `${id}.png`));
                } catch (error) {
                    await rm(temporary, { force: true }).catch(() => {});
                    throw error;
                }
            })
        );
    }
    console.log(
        `Saved ${reference.materials.length} local barter material icons.`
    );
}
void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
