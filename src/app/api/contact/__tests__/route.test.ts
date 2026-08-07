/** @jest-environment node */

const mockSendEmail = jest.fn();

jest.mock("@/services/mail.service", () => ({
    sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { POST } from "@/app/api/contact/route";

function request(body: BodyInit) {
    return new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
            origin: "http://localhost:3000",
            "Content-Type": "application/json",
        },
        body,
    });
}

const validBody = {
    name: "테스터",
    from: "user@example.com",
    subject: "문의 제목",
    message: "열 글자가 넘는 문의 메시지입니다.",
};

describe("contact route", () => {
    beforeEach(() => mockSendEmail.mockReset());

    it("sends only validated fields", async () => {
        mockSendEmail.mockResolvedValue(undefined);
        const response = await POST(
            request(JSON.stringify({ ...validBody, ignored: "value" }))
        );
        expect(response.status).toBe(200);
        expect(mockSendEmail).toHaveBeenCalledWith(validBody);
    });

    it("rejects malformed and oversized JSON before sending", async () => {
        expect((await POST(request("{"))).status).toBe(400);
        expect(
            (await POST(request(JSON.stringify({ data: "가".repeat(6000) }))))
                .status
        ).toBe(400);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it.each([
        { name: "a" },
        { name: "a".repeat(51) },
        { from: `${"a".repeat(245)}@example.com` },
        { from: "user@example.com\r\nBcc:x@example.com" },
        { subject: "ab" },
        { subject: "a".repeat(121) },
        { subject: "hello\nBcc:x" },
        { message: "short" },
        { message: "a".repeat(5001) },
    ])("rejects invalid field bounds: %o", async invalid => {
        const response = await POST(
            request(JSON.stringify({ ...validBody, ...invalid }))
        );
        expect(response.status).toBe(400);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("returns 500 without exposing mail content", async () => {
        mockSendEmail.mockRejectedValue(new Error("smtp failed"));
        const log = jest
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        const response = await POST(request(JSON.stringify(validBody)));
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "Failed to send mail" });
        expect(log).toHaveBeenCalledWith("Send email failed:", "smtp failed");
    });
});
