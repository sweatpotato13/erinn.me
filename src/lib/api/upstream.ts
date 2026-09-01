import { NextResponse } from "next/server";
import type * as z from "zod";

const NEXON_OPEN_API_URL = "https://open.api.nexon.com";

export type UpstreamFailureClass =
    "upstream_config" | "timeout" | "upstream_http" | "upstream_schema";

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

/**
 * Builds an HTTPS URL from an upstream path and base URL.
 *
 * @param path - The path to resolve against the base URL
 * @param baseUrl - An optional configured upstream base URL
 * @returns The resolved upstream URL
 * @throws `UpstreamFailure` if the base URL is invalid or uses an unsupported protocol
 */
export function createUpstreamUrl(path: string, baseUrl?: string): URL {
    try {
        const url = new URL(path, baseUrl || NEXON_OPEN_API_URL);
        if (url.protocol !== "https:") {
            throw new TypeError("Unsupported upstream URL protocol");
        }
        return url;
    } catch {
        throw new UpstreamFailure(
            "upstream_config",
            "Invalid upstream configuration"
        );
    }
}

/**
 * Creates a request deadline with an optional caller-provided abort signal.
 *
 * @param requestSignal - Signal used to abort the request
 * @param timeoutMs - Maximum duration in milliseconds before the deadline expires
 * @returns The request expiration timestamp and optional abort signal
 */
export function createRequestDeadline(
    requestSignal?: AbortSignal,
    timeoutMs = 5_000
): RequestDeadline {
    return { expiresAt: Date.now() + timeoutMs, requestSignal };
}

/**
 * Raises a timeout failure when the request has been aborted or its deadline has passed.
 *
 * @param deadline - The request deadline and optional caller-provided abort signal
 */
export function throwIfDeadlineExpired(deadline: RequestDeadline) {
    if (deadline.requestSignal?.aborted || Date.now() >= deadline.expiresAt) {
        throw new UpstreamFailure("timeout", "Upstream request timed out");
    }
}

/**
 * Creates an abort signal that responds to the request deadline or caller cancellation.
 *
 * @param deadline - The request expiration time and optional caller-provided abort signal
 * @returns An abort signal for the request
 */
function deadlineSignal(deadline: RequestDeadline): AbortSignal {
    throwIfDeadlineExpired(deadline);
    const remaining = Math.max(1, deadline.expiresAt - Date.now());
    const timeoutSignal = AbortSignal.timeout(remaining);
    return deadline.requestSignal
        ? AbortSignal.any([deadline.requestSignal, timeoutSignal])
        : timeoutSignal;
}

/**
 * Identifies errors caused by an aborted or timed-out operation.
 *
 * @param error - The value to inspect.
 * @returns `true` if the value has an abort or timeout error name, `false` otherwise.
 */
function isAbortError(error: unknown): boolean {
    if (!error || typeof error !== "object" || !("name" in error)) {
        return false;
    }
    return error.name === "AbortError" || error.name === "TimeoutError";
}

/**
 * Converts an upstream response body read failure into a classified upstream failure.
 *
 * @param error - The error raised while reading the response body
 * @param deadline - The request deadline and optional caller abort signal
 */
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

/**
 * Fetches an upstream resource within the request deadline.
 *
 * @param url - The upstream resource URL
 * @param init - Fetch request options
 * @param deadline - Request expiration and cancellation settings
 * @returns The upstream response
 */
export async function fetchUpstream(
    url: URL | string,
    init: RequestInit,
    deadline: RequestDeadline
): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...init,
            redirect: "error",
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

/**
 * Parses and validates an upstream JSON response.
 *
 * @param response - The upstream response containing JSON data
 * @param schema - The schema used to validate the parsed data
 * @param deadline - The request deadline used to detect expiration
 * @returns The validated response data
 */
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

/**
 * Reads binary content from an upstream response.
 *
 * @param response - The upstream response containing the binary content
 * @param deadline - The deadline governing the body read
 * @returns The response body as an `ArrayBuffer`
 */
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

/**
 * Creates a standardized JSON response for an upstream request failure.
 *
 * @param route - The route associated with the failed request
 * @param error - The failure to classify and report
 * @returns A JSON response with an error message and HTTP status corresponding to the failure category
 */
export function upstreamErrorResponse(route: string, error: unknown) {
    const failure =
        error instanceof UpstreamFailure
            ? error
            : new UpstreamFailure("upstream_http", "Upstream request failed");

    console.error({ route, failureClass: failure.failureClass });
    return NextResponse.json(
        {
            error:
                failure.failureClass === "upstream_config"
                    ? "Upstream service is not configured"
                    : failure.failureClass === "timeout"
                      ? "Upstream request timed out"
                      : "Failed to fetch upstream data",
        },
        {
            status:
                failure.failureClass === "upstream_config"
                    ? 500
                    : failure.failureClass === "timeout"
                      ? 504
                      : 502,
        }
    );
}
