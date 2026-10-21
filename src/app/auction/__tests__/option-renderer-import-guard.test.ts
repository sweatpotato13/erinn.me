import fs from "node:fs";
import path from "node:path";

const AUCTION_SOURCES = [
    "src/app/auction/auction-comparison.tsx",
    "src/app/auction/auction-results.tsx",
] as const;

const STATIC_OPTION_RENDERER = /from\s+["']@\/components\/option-renderer["']/;
const DIRECT_DYNAMIC_IMPORT =
    /import\s*\(\s*["']@\/components\/option-renderer["']\s*\)/;

describe("auction OptionRenderer imports", () => {
    it.each(AUCTION_SOURCES)(
        "%s must use the shared lazy wrapper, not a static option-renderer import",
        relativePath => {
            const source = fs.readFileSync(
                path.join(process.cwd(), relativePath),
                "utf8"
            );

            expect(source).toContain("@/components/option-renderer/lazy");
            expect(source).not.toMatch(STATIC_OPTION_RENDERER);
            expect(source).not.toMatch(DIRECT_DYNAMIC_IMPORT);
        }
    );
});
