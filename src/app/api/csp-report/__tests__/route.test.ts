/** @jest-environment node */

import { GET, POST } from "@/app/api/csp-report/route";

function postRequest(body: BodyInit, headers: Record<string, string> = {}) {
    return new Request("http://localhost:3000/api/csp-report", {
        method: "POST",
        headers: {
            "Content-Type": "application/csp-report",
            ...headers,
        },
        body,
    });
}

const legacyReport = {
    "csp-report": {
        "document-uri": "https://erinn.me/page?token=secret",
        "violated-directive": "img-src",
        "blocked-uri": "https://evil.test/img.png?x=1",
        "source-file": "https://erinn.me/app.js?cache=bust",
        "line-number": 42,
    },
};

describe("csp-report route", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("accepts legacy csp-report shape and logs one compact line", async () => {
        const warn = jest
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
        const response = await POST(postRequest(JSON.stringify(legacyReport)));
        expect(response.status).toBe(204);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(warn.mock.calls[0][0]))).toEqual({
            event: "csp_violation",
            directive: "img-src",
            blocked: "https://evil.test/img.png",
            document: "https://erinn.me/page",
            source: "https://erinn.me/app.js",
            line: "42",
        });
    });

    it("accepts Reporting API array shape", async () => {
        const warn = jest
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
        const body = [
            {
                type: "csp-violation",
                url: "https://erinn.me/auction",
                body: {
                    documentURL: "https://erinn.me/auction",
                    violatedDirective: "connect-src",
                    blockedURL: "https://blocked.test",
                    sourceFile: "https://erinn.me/chunk.js",
                    lineNumber: 7,
                },
            },
        ];
        const response = await POST(
            postRequest(JSON.stringify(body), {
                "Content-Type": "application/reports+json",
            })
        );
        expect(response.status).toBe(204);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(warn.mock.calls[0][0]))).toMatchObject({
            directive: "connect-src",
            blocked: "https://blocked.test",
        });
    });

    it("rejects oversized bodies via content-length and read cap", async () => {
        const payload = "a".repeat(8 * 1024 + 1);
        expect(
            (
                await POST(
                    postRequest(JSON.stringify({ ignored: payload }), {
                        "Content-Length": String(payload.length + 20),
                    })
                )
            ).status
        ).toBe(413);

        expect(
            (
                await POST(
                    postRequest(
                        JSON.stringify({ "csp-report": { x: payload } })
                    )
                )
            ).status
        ).toBe(413);
    });

    it("rejects wrong content type, malformed JSON, and invalid shape", async () => {
        expect(
            (
                await POST(
                    postRequest(JSON.stringify(legacyReport), {
                        "Content-Type": "text/plain",
                    })
                )
            ).status
        ).toBe(400);
        expect((await POST(postRequest("{"))).status).toBe(400);
        expect(
            (await POST(postRequest(JSON.stringify({ not: "csp" })))).status
        ).toBe(400);
    });

    it("returns 405 for GET", () => {
        expect(GET().status).toBe(405);
    });

    it("truncates long fields to 200 characters", async () => {
        const warn = jest
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
        const long = "z".repeat(250);
        await POST(
            postRequest(
                JSON.stringify({
                    "csp-report": {
                        "violated-directive": long,
                        "blocked-uri": long,
                    },
                })
            )
        );
        const logged = JSON.parse(String(warn.mock.calls[0][0]));
        expect(logged.directive).toHaveLength(200);
        expect(logged.blocked).toHaveLength(200);
    });
});
