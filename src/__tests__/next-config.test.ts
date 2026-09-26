import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

import nextConfig, {
    NEXT_DEFAULT_HTML_LIMITED_BOTS,
} from "../../next.config.mjs";

describe("next.config htmlLimitedBots", () => {
    it("keeps Next's default bot list in sync", () => {
        expect(NEXT_DEFAULT_HTML_LIMITED_BOTS).toBe(
            HTML_LIMITED_BOT_UA_RE.source
        );
    });

    it("adds kakaotalk-scrap on top of the defaults", () => {
        const bots = nextConfig.htmlLimitedBots as RegExp;
        expect(bots.test("kakaotalk-scrap/1.0")).toBe(true);
        expect(bots.test("Mozilla/5.0 (compatible; Bingbot/2.0)")).toBe(true);
        expect(bots.test("Mozilla/5.0 (Macintosh) Chrome/140")).toBe(false);
    });
});
