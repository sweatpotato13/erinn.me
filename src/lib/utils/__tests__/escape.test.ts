import { containsHeaderInjection, escapeHtml } from "@/lib/utils/escape";

describe("mail escaping", () => {
    it("escapes all HTML metacharacters", () => {
        expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
        expect(escapeHtml("safe")).toBe("safe");
    });

    it("rejects newlines and oversized addresses", () => {
        expect(containsHeaderInjection("a@example.com\r\nBcc: x")).toBe(true);
        expect(containsHeaderInjection("a".repeat(255))).toBe(true);
        expect(containsHeaderInjection("a@example.com")).toBe(false);
    });
});
