import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_ROOT = join(__dirname, "..", "..");
const ALLOWED = new Set([join("lib", "zod.ts")]);
const DIRECT_ZOD_IMPORT = /^import\s+(?!type\b)[^;]*\sfrom\s+["']zod["']/m;

function collectSourceFiles(directory: string): string[] {
    return readdirSync(directory).flatMap(name => {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) {
            return name === "__tests__" ? [] : collectSourceFiles(path);
        }
        return /\.(ts|tsx)$/.test(name) ? [path] : [];
    });
}

describe("zod entry point", () => {
    it("is imported through @/lib/zod so browsers never probe new Function", () => {
        const offenders = collectSourceFiles(SRC_ROOT)
            .map(path => relative(SRC_ROOT, path))
            .filter(path => !ALLOWED.has(path))
            .filter(path =>
                DIRECT_ZOD_IMPORT.test(
                    readFileSync(join(SRC_ROOT, path), "utf8")
                )
            );

        expect(offenders).toEqual([]);
    });

    it("detects a direct runtime import and ignores type-only imports", () => {
        expect(DIRECT_ZOD_IMPORT.test('import { z } from "zod";')).toBe(true);
        expect(DIRECT_ZOD_IMPORT.test('import * as z from "zod";')).toBe(true);
        expect(DIRECT_ZOD_IMPORT.test('import type * as z from "zod";')).toBe(
            false
        );
        expect(DIRECT_ZOD_IMPORT.test('import { z } from "@/lib/zod";')).toBe(
            false
        );
    });
});
