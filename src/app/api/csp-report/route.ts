import { NextResponse } from "next/server";

import {
    legacyCspReportSchema,
    normalizeLegacyReport,
    normalizeReportingApiEntry,
    reportingApiReportSchema,
} from "@/lib/schemas/csp-report";
import { formatCspViolationLogLine } from "@/lib/security/csp-report-log";

const MAX_BODY_BYTES = 8 * 1024;
const MAX_LOG_LINES_PER_REQUEST = 20;

const ALLOWED_CONTENT_TYPES = [
    "application/csp-report",
    "application/reports+json",
    "application/json",
] as const;

function isAllowedContentType(contentType: string | null): boolean {
    if (!contentType) return false;
    const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(base);
}

async function readLimitedBody(request: Request): Promise<Uint8Array | null> {
    const contentLength = request.headers.get("content-length");
    if (contentLength !== null) {
        const length = Number(contentLength);
        if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
            return null;
        }
    }

    if (!request.body) return new Uint8Array();

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_BODY_BYTES) {
            await reader.cancel("Request body too large");
            return null;
        }
        chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return body;
}

function hasViolationSignal(violation: {
    directive: string;
    blocked: string;
}): boolean {
    return Boolean(violation.directive.trim() || violation.blocked.trim());
}

function logViolation(violation: {
    directive: string;
    blocked: string;
    document: string;
    source: string;
    line: string;
}): void {
    if (!hasViolationSignal(violation)) return;
    console.warn(formatCspViolationLogLine(violation));
}

function logViolations(raw: unknown): boolean {
    let logged = 0;
    const emit = (violation: Parameters<typeof logViolation>[0]) => {
        if (logged >= MAX_LOG_LINES_PER_REQUEST) return;
        if (!hasViolationSignal(violation)) return;
        logViolation(violation);
        logged += 1;
    };

    const legacy = legacyCspReportSchema.safeParse(raw);
    if (legacy.success) {
        emit(normalizeLegacyReport(legacy.data));
        return true;
    }

    const reporting = reportingApiReportSchema.safeParse(raw);
    if (!reporting.success) return false;

    for (const entry of reporting.data) {
        if (logged >= MAX_LOG_LINES_PER_REQUEST) break;
        if (entry.type !== "csp-violation") continue;
        emit(normalizeReportingApiEntry(entry));
    }
    return true;
}

/**
 * Accepts CSP violation reports from the browser Reporting API or legacy format.
 */
export async function POST(request: Request) {
    if (!isAllowedContentType(request.headers.get("content-type"))) {
        return new NextResponse(null, { status: 400 });
    }

    const body = await readLimitedBody(request);
    if (body === null) {
        return new NextResponse(null, { status: 413 });
    }

    let raw: unknown;
    try {
        raw = JSON.parse(new TextDecoder().decode(body));
    } catch {
        return new NextResponse(null, { status: 400 });
    }

    if (!logViolations(raw)) {
        return new NextResponse(null, { status: 400 });
    }

    return new NextResponse(null, { status: 204 });
}

export function GET() {
    return new NextResponse(null, { status: 405 });
}
