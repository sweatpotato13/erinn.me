import type { NormalizedCspViolation } from "@/lib/schemas/csp-report";

const MAX_FIELD_LENGTH = 200;

/**
 * Strips the query string from a URL-like value for safer logs.
 */
export function stripUrlQuery(value: string): string {
    const queryIndex = value.indexOf("?");
    return queryIndex === -1 ? value : value.slice(0, queryIndex);
}

function truncateField(value: string): string {
    const trimmed = stripUrlQuery(value.trim());
    if (trimmed.length <= MAX_FIELD_LENGTH) return trimmed;
    return trimmed.slice(0, MAX_FIELD_LENGTH);
}

/**
 * Formats a CSP violation as one compact JSON log line.
 */
export function formatCspViolationLogLine(
    violation: NormalizedCspViolation
): string {
    return JSON.stringify({
        event: "csp_violation",
        directive: truncateField(violation.directive),
        blocked: truncateField(violation.blocked),
        document: truncateField(violation.document),
        source: truncateField(violation.source),
        line: truncateField(violation.line),
    });
}
