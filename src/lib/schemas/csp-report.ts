import * as z from "zod";

const legacyReportBody = z
    .object({
        "document-uri": z.string().optional(),
        "violated-directive": z.string().optional(),
        "effective-directive": z.string().optional(),
        "blocked-uri": z.string().optional(),
        "source-file": z.string().optional(),
        "line-number": z.number().optional(),
    })
    .passthrough();

export const legacyCspReportSchema = z.object({
    "csp-report": legacyReportBody,
});

const reportingApiBody = z
    .object({
        documentURL: z.string().optional(),
        violatedDirective: z.string().optional(),
        effectiveDirective: z.string().optional(),
        blockedURL: z.string().optional(),
        sourceFile: z.string().optional(),
        lineNumber: z.number().optional(),
    })
    .passthrough();

export const reportingApiEntrySchema = z.object({
    type: z.string(),
    url: z.string().optional(),
    body: reportingApiBody,
});

export const reportingApiReportSchema = z.array(reportingApiEntrySchema);

export type NormalizedCspViolation = {
    directive: string;
    blocked: string;
    document: string;
    source: string;
    line: string;
};

function pickDirective(
    violated?: string,
    effective?: string
): string | undefined {
    return violated ?? effective;
}

export function normalizeLegacyReport(
    report: z.infer<typeof legacyCspReportSchema>
): NormalizedCspViolation {
    const body = report["csp-report"];
    return {
        directive:
            pickDirective(
                body["violated-directive"],
                body["effective-directive"]
            ) ?? "",
        blocked: body["blocked-uri"] ?? "",
        document: body["document-uri"] ?? "",
        source: body["source-file"] ?? "",
        line:
            body["line-number"] !== undefined
                ? String(body["line-number"])
                : "",
    };
}

export function normalizeReportingApiEntry(
    entry: z.infer<typeof reportingApiEntrySchema>
): NormalizedCspViolation {
    const body = entry.body;
    return {
        directive:
            pickDirective(body.violatedDirective, body.effectiveDirective) ??
            "",
        blocked: body.blockedURL ?? "",
        document: body.documentURL ?? entry.url ?? "",
        source: body.sourceFile ?? "",
        line: body.lineNumber !== undefined ? String(body.lineNumber) : "",
    };
}
