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
    if (containsHeaderInjection(from)) {
        throw new Error("Invalid sender address: potential header injection");
    }

    const safeName = escapeHtml(name);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    const mailData = {
        to: MAILER_AUTH_USER,
        subject: `[erinn.me] ${subject}`,
        from: from,
        html: `
    <h1>${safeName}님의 문의</h1>
    <h1>${safeSubject}</h1>
    <div>${safeMessage}</div>
    <br />
    `,
    };

    return transporter.sendMail(mailData);
}
