/** @jest-environment node */

import * as z from "zod";

import {
    createRequestDeadline,
    fetchUpstream,
    parseUpstreamJson,
    readUpstreamArrayBuffer,
    throwIfDeadlineExpired,
    upstreamErrorResponse,
    UpstreamFailure,
} from "@/lib/api/upstream";

describe("upstream boundary", () => {
    afterEach(() => jest.restoreAllMocks());

    it("fetches and validates JSON within one deadline", async () => {
        jest.spyOn(global, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ value: 1 }), { status: 200 })
        );
        const deadline = createRequestDeadline(undefined, 5000);
        const response = await fetchUpstream(
            "https://example.com",
            {},
            deadline
        );
        await expect(
            parseUpstreamJson(
                response,
                z.object({ value: z.number() }),
                deadline
            )
        ).resolves.toEqual({ value: 1 });
    });

    it("classifies non-ok and transport failures", async () => {
        jest.spyOn(global, "fetch").mockResolvedValueOnce(
            new Response("no", { status: 503 })
        );
        await expect(
            fetchUpstream("https://example.com", {}, createRequestDeadline())
        ).rejects.toMatchObject({
            failureClass: "upstream_http",
            upstreamStatus: 503,
        });

        jest.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));
        await expect(
            fetchUpstream("https://example.com", {}, createRequestDeadline())
        ).rejects.toMatchObject({ failureClass: "upstream_http" });
    });

    it("classifies expired and aborted requests as timeouts", async () => {
        expect(() => throwIfDeadlineExpired({ expiresAt: Date.now() })).toThrow(
            UpstreamFailure
        );

        jest.spyOn(global, "fetch").mockRejectedValueOnce(
            new DOMException("aborted", "AbortError")
        );
        await expect(
            fetchUpstream("https://example.com", {}, createRequestDeadline())
        ).rejects.toMatchObject({ failureClass: "timeout" });
    });

    it("rejects malformed JSON and schema failures", async () => {
        const deadline = createRequestDeadline();
        await expect(
            parseUpstreamJson(
                new Response("not json"),
                z.object({ value: z.number() }),
                deadline
            )
        ).rejects.toMatchObject({ failureClass: "upstream_schema" });
        await expect(
            parseUpstreamJson(
                new Response(JSON.stringify({ value: "bad" })),
                z.object({ value: z.number() }),
                deadline
            )
        ).rejects.toMatchObject({ failureClass: "upstream_schema" });
    });

    it("preserves timeout classification while reading response bodies", async () => {
        const jsonResponse = {
            json: () =>
                Promise.reject(new DOMException("aborted", "AbortError")),
        } as Response;
        await expect(
            parseUpstreamJson(
                jsonResponse,
                z.object({ value: z.number() }),
                createRequestDeadline()
            )
        ).rejects.toMatchObject({ failureClass: "timeout" });

        const binaryResponse = {
            arrayBuffer: () =>
                Promise.reject(new DOMException("aborted", "AbortError")),
        } as Response;
        await expect(
            readUpstreamArrayBuffer(binaryResponse, createRequestDeadline())
        ).rejects.toMatchObject({ failureClass: "timeout" });
    });

    it("maps failures to sanitized responses", () => {
        const log = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const timeout = upstreamErrorResponse(
            "/api/test",
            new UpstreamFailure("timeout", "secret")
        );
        expect(timeout.status).toBe(504);
        expect(log).toHaveBeenCalledWith({
            route: "/api/test",
            failureClass: "timeout",
        });
        expect(upstreamErrorResponse("/api/test", new Error("x")).status).toBe(
            502
        );
    });
});
