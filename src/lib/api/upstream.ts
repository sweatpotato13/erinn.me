import { NextResponse } from "next/server";
import type * as z from "zod";

export type UpstreamFailureClass =
    | "timeout"
    | "upstream_http"
    | "upstream_schema";

export class UpstreamFailure extends Error {
    constructor(
        public readonly failureClass: UpstreamFailureClass,
        message: string,
        public readonly upstreamStatus?: number
    ) {
        super(message);
        this.name = "UpstreamFailure";
    }
}

export type RequestDeadline = {
    expiresAt: number;
    requestSignal?: AbortSignal;
};

export function createRequestDeadline(
    requestSignal?: AbortSignal,
    timeoutMs = 5_000
): RequestDeadline {
    return { expiresAt: Date.now() + timeoutMs, requestSignal };
}

export function throwIfDeadlineExpired(deadline: RequestDeadline) {
    if (deadline.requestSignal?.aborted || Date.now() >= deadline.expiresAt) {
        throw new UpstreamFailure("timeout", "Upstream request timed out");
    }
}

function deadlineSignal(deadline: RequestDeadline): AbortSignal {
    throwIfDeadlineExpired(deadline);
    const remaining = Math.max(1, deadline.expiresAt - Date.now());
    const timeoutSignal = AbortSignal.timeout(remaining);
    return deadline.requestSignal
        ? AbortSignal.any([deadline.requestSignal, timeoutSignal])
        : timeoutSignal;
}

function isAbortError(error: unknown): boolean {
    if (!error || typeof error !== "object" || !("name" in error)) {
        return false;
    }
    return error.name === "AbortError" || error.name === "TimeoutError";
}

function rethrowBodyReadFailure(
    error: unknown,
    deadline: RequestDeadline
): never {
    if (
        isAbortError(error) ||
        deadline.requestSignal?.aborted ||
        Date.now() >= deadline.expiresAt
    ) {
        throw new UpstreamFailure("timeout", "Upstream request timed out");
    }
    throw new UpstreamFailure("upstream_schema", "Invalid upstream JSON");
}

export async function fetchUpstream(
    url: URL | string,
    init: RequestInit,
    deadline: RequestDeadline
): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...init,
            signal: deadlineSignal(deadline),
        });
        throwIfDeadlineExpired(deadline);
        if (!response.ok) {
            throw new UpstreamFailure(
                "upstream_http",
                `Upstream returned ${response.status}`,
                response.status
            );
        }
        return response;
    } catch (error) {
        if (error instanceof UpstreamFailure) throw error;
        if (isAbortError(error) || deadline.requestSignal?.aborted) {
            throw new UpstreamFailure("timeout", "Upstream request timed out");
        }
        throw new UpstreamFailure("upstream_http", "Upstream request failed");
    }
}

export async function parseUpstreamJson<T>(
    response: Response,
    schema: z.ZodType<T>,
    deadline: RequestDeadline
): Promise<T> {
    let raw: unknown;
    try {
        raw = await response.json();
    } catch (error) {
        rethrowBodyReadFailure(error, deadline);
    }
    throwIfDeadlineExpired(deadline);

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        throw new UpstreamFailure(
            "upstream_schema",
            "Invalid upstream response"
        );
    }
    return parsed.data;
}

export async function readUpstreamArrayBuffer(
    response: Response,
    deadline: RequestDeadline
): Promise<ArrayBuffer> {
    try {
        const body = await response.arrayBuffer();
        throwIfDeadlineExpired(deadline);
        return body;
    } catch (error) {
        if (error instanceof UpstreamFailure) throw error;
        if (
            isAbortError(error) ||
            deadline.requestSignal?.aborted ||
            Date.now() >= deadline.expiresAt
        ) {
            throw new UpstreamFailure("timeout", "Upstream request timed out");
        }
        throw new UpstreamFailure("upstream_http", "Upstream request failed");
    }
}

export function upstreamErrorResponse(route: string, error: unknown) {
    const failure =
        error instanceof UpstreamFailure
            ? error
            : new UpstreamFailure("upstream_http", "Upstream request failed");

    console.error({ route, failureClass: failure.failureClass });
    return NextResponse.json(
        {
            error:
                failure.failureClass === "timeout"
                    ? "Upstream request timed out"
                    : "Failed to fetch upstream data",
        },
        { status: failure.failureClass === "timeout" ? 504 : 502 }
    );
}
