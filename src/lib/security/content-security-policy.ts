const IMG_SRC = [
    "'self'",
    "data:",
    "blob:",
    "https://open.api.nexon.com",
    "https://ssl.nexon.com",
] as const;

const DEV_SCRIPT_ORIGINS = ["https://va.vercel-scripts.com"] as const;

type Directive = {
    readonly name: string;
    readonly values: readonly string[];
};

function scriptSrcValues(production: boolean): readonly string[] {
    const values: string[] = ["'self'", "'unsafe-inline'"];
    if (!production) {
        values.push("'unsafe-eval'", ...DEV_SCRIPT_ORIGINS);
    }
    return values;
}

function buildDirectives(production: boolean): readonly Directive[] {
    return [
        { name: "default-src", values: ["'self'"] },
        { name: "object-src", values: ["'none'"] },
        { name: "base-uri", values: ["'self'"] },
        { name: "form-action", values: ["'self'"] },
        { name: "frame-ancestors", values: ["'none'"] },
        { name: "img-src", values: IMG_SRC },
        { name: "font-src", values: ["'self'", "data:"] },
        { name: "connect-src", values: ["'self'"] },
        { name: "script-src", values: scriptSrcValues(production) },
        { name: "style-src", values: ["'self'", "'unsafe-inline'"] },
        { name: "report-uri", values: ["/api/csp-report"] },
    ];
}

/**
 * Builds the Content-Security-Policy-Report-Only header value.
 */
export function buildContentSecurityPolicyReportOnly(
    production: boolean
): string {
    return buildDirectives(production)
        .map(({ name, values }) => `${name} ${values.join(" ")}`)
        .join("; ");
}

export const CSP_REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only";
