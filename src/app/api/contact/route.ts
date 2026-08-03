import { NextResponse } from "next/server";
import { object, string, ValidationError } from "yup";

import { checkOrigin } from "@/lib/utils/check-origin";
import { sendEmail } from "@/services/mail.service";

export async function POST(request: Request) {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const body = await request.json();

    const bodySchema = object({
        name: string().min(2).required(),
        from: string().email().required(),
        subject: string().min(3).required(),
        message: string().min(10).required(),
    });

    let validatedBody: {
        name: string;
        from: string;
        subject: string;
        message: string;
    };
    try {
        validatedBody = await bodySchema.validate(body);
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
