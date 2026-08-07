jest.mock("nodemailer", () => ({
    __esModule: true,
    default: {
        createTransport: jest.fn(() => ({ sendMail: jest.fn() })),
    },
}));

import nodemailer from "nodemailer";

import { sendEmail } from "@/services/mail.service";

const mockSendMail = jest.mocked(nodemailer.createTransport).mock.results[0]
    .value.sendMail as jest.Mock;

describe("sendEmail", () => {
    beforeEach(() => mockSendMail.mockReset());

    it("uses authenticated from, user replyTo, and escaped HTML", async () => {
        mockSendMail.mockResolvedValue({ accepted: ["mail"] });
        await sendEmail({
            name: "<Name>",
            from: "user@example.com",
            subject: "Normal subject",
            message: "<script>alert(1)</script>",
        });
        expect(mockSendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: process.env.MAILER_AUTH_USER,
                replyTo: "user@example.com",
                subject: "[erinn.me] Normal subject",
                html: expect.stringContaining("&lt;script&gt;"),
            })
        );
    });

    it.each([
        { from: "a@example.com\nBcc:x", subject: "valid" },
        { from: "a@example.com", subject: "bad\rsubject" },
        { from: "a@example.com", subject: "x".repeat(121) },
    ])("rejects unsafe headers", async input => {
        await expect(
            sendEmail({
                name: "name",
                message: "long enough message",
                ...input,
            })
        ).rejects.toThrow("Invalid mail header");
        expect(mockSendMail).not.toHaveBeenCalled();
    });
});
