import {
    buildContentSecurityPolicyReportOnly,
    CSP_REPORT_ONLY_HEADER,
} from "@/lib/security/content-security-policy";

describe("buildContentSecurityPolicyReportOnly", () => {
    it("includes core directives and report-uri", () => {
        const policy = buildContentSecurityPolicyReportOnly(true);
        expect(policy).toContain("default-src 'self'");
        expect(policy).toContain("object-src 'none'");
        expect(policy).toContain("base-uri 'self'");
        expect(policy).toContain("form-action 'self'");
        expect(policy).toContain("frame-ancestors 'none'");
        expect(policy).toContain("img-src 'self' data: blob:");
        expect(policy).toContain("https://open.api.nexon.com");
        expect(policy).toContain("https://ssl.nexon.com");
        expect(policy).toContain("font-src 'self' data:");
        expect(policy).toContain("connect-src 'self'");
        expect(policy).toContain("style-src 'self' 'unsafe-inline'");
        expect(policy).toContain("report-uri /api/csp-report");
    });

    it("omits unsafe-eval in production script-src", () => {
        const policy = buildContentSecurityPolicyReportOnly(true);
        expect(policy).toContain("script-src 'self' 'unsafe-inline'");
        expect(policy).not.toContain("'unsafe-eval'");
        expect(policy).not.toContain("va.vercel-scripts.com");
    });

    it("allows dev-only script sources when not production", () => {
        const policy = buildContentSecurityPolicyReportOnly(false);
        expect(policy).toContain("'unsafe-eval'");
        expect(policy).toContain("https://va.vercel-scripts.com");
    });

    it("exports the report-only header name", () => {
        expect(CSP_REPORT_ONLY_HEADER).toBe(
            "Content-Security-Policy-Report-Only"
        );
    });
});
