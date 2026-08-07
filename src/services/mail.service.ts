import nodemailer from "nodemailer";

import { containsHeaderInjection, escapeHtml } from "@/lib/utils/escape";

const { MAILER_AUTH_USER, MAILER_AUTH_PASS } = process.env;

export type EmailData = {
    name: string;
    from: string;
    subject: string;
    message: string;
};

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: MAILER_AUTH_USER,
        pass: MAILER_AUTH_PASS,
    },
});

export async function sendEmail({ name, from, subject, message }: EmailData) {
    if (
        containsHeaderInjection(from) ||
        /[\r\n]/.test(subject) ||
        subject.length > 120
    ) {
        throw new Error("Invalid mail header");
    }

    const safeName = escapeHtml(name);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const mailData = {
        to: MAILER_AUTH_USER,
        subject: `[erinn.me] ${subject}`,
        from: MAILER_AUTH_USER,
        replyTo: from,
        html: `
    <h1>${safeName}님의 문의</h1>
    <h1>${safeSubject}</h1>
    <div>${safeMessage}</div>
    <br />
    `,
    };

    return transporter.sendMail(mailData);
}
