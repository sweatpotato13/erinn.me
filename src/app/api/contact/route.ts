import { NextResponse } from "next/server";
import { object, string, ValidationError } from "yup";

import { checkOrigin } from "@/lib/utils/check-origin";
import { sendEmail } from "@/services/mail.service";

const MAX_BODY_BYTES = 16_384;

const bodySchema = object({
    name: string().min(2).max(50).required(),
    from: string()
        .email()
        .max(254)
        .test("no-newline", "Invalid email header", value =>
            value ? !/[\r\n]/.test(value) : true
        )
        .required(),
    subject: string()
        .min(3)
        .max(120)
        .test("no-newline", "Invalid subject header", value =>
            value ? !/[\r\n]/.test(value) : true
        )
        .required(),
    message: string().min(10).max(5000).required(),
});

/**
 * Reads and parses a request body as JSON within the configured size limit.
 *
 * @param request - The request containing the JSON body
 * @returns The parsed JSON value
 */
async function readLimitedJson(request: Request): Promise<unknown> {
    if (!request.body) throw new Error("Missing request body");

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_BODY_BYTES) {
            await reader.cancel("Request body too large");
            throw new Error("Request body too large");
        }
        chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(body));
}

/**
 * Validates a contact form submission and sends it by email.
 *
 * @returns A successful response, or an error response for forbidden origins,
 * invalid data, or email delivery failures.
 */
export async function POST(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    let rawBody: unknown;
    try {
        rawBody = await readLimitedJson(request);
    } catch {
        return NextResponse.json(
            { error: "Failed to send mail: Invalid data" },
            { status: 400 }
        );
    }

    let validatedBody: {
        name: string;
        from: string;
        subject: string;
        message: string;
    };
    try {
        validatedBody = await bodySchema.validate(rawBody, {
            abortEarly: false,
            stripUnknown: true,
        });
    } catch (error: unknown) {
        const validationError = error as ValidationError;
        return NextResponse.json(
            {
                error: "Failed to send mail: Invalid data",
                details: validationError.errors,
            },
            { status: 400 }
        );
    }

    try {
        await sendEmail(validatedBody);
        return NextResponse.json(
            { message: "Success to send mail" },
            { status: 200 }
        );
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        console.error("Send email failed:", message);
        return NextResponse.json(
            { error: "Failed to send mail" },
            { status: 500 }
        );
    }
}
