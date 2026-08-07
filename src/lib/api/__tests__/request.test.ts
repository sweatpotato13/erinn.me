/** @jest-environment node */

import * as z from "zod";

import { parseQuery } from "@/lib/api/request";

describe("parseQuery", () => {
    it("returns decoded query data", () => {
        const request = new Request(
            "http://localhost/api?q=%ED%95%9C%EA%B8%80%2B%26"
        );
        expect(
            parseQuery(request, z.object({ q: z.string().max(20) }))
        ).toEqual({ success: true, data: { q: "한글+&" } });
    });

    it("returns a 400 response for invalid data", () => {
        const result = parseQuery(
            new Request("http://localhost/api"),
            z.object({ q: z.string() })
        );
        expect(result.success).toBe(false);
        if (!result.success) expect(result.response.status).toBe(400);
    });
});
