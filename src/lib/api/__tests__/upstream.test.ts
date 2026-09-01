/** @jest-environment node */

import * as z from "zod";

import {
    createRequestDeadline,
    createUpstreamUrl,
    fetchUpstream,
    parseUpstreamJson,
    readUpstreamArrayBuffer,
    throwIfDeadlineExpired,
    upstreamErrorResponse,
    UpstreamFailure,
} from "@/lib/api/upstream";

describe("upstream boundary", () => {
    afterEach(() => jest.restoreAllMocks());

    it("uses the official Nexon URL by default and validates overrides", () => {
        expect(createUpstreamUrl("/v1", "https://example.com").href).toBe(
            "https://example.com/v1"
        );
        expect(createUpstreamUrl("/v1").href).toBe(
            "https://open.api.nexon.com/v1"
        );
        expect(() => createUpstreamUrl("/v1", "not-a-url")).toThrow(
            expect.objectContaining({ failureClass: "upstream_config" })
        );
        expect(() => createUpstreamUrl("/v1", "http://example.com")).toThrow(
            expect.objectContaining({ failureClass: "upstream_config" })
        );
    });

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
        expect(fetch).toHaveBeenCalledWith(
            "https://example.com",
            expect.objectContaining({ redirect: "error" })
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
        expect(
            upstreamErrorResponse(
                "/api/test",
                new UpstreamFailure("upstream_config", "secret")
            ).status
        ).toBe(500);
    });
});
