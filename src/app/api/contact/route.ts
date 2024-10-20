import { NextResponse } from "next/server";
import { object, string } from "yup";

import { sendEmail } from "@/services/mail.service";

const { BASE_URL } = process.env;

export async function POST(request: Request) {
    const allowedDomain = BASE_URL || "http://localhost:3000";

    const referer = request.headers.get("referer");

    if (!referer || !referer.startsWith(allowedDomain)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const bodySchema = object({
        name: string().min(2).required(),
        from: string().email().required(),
        subject: string().min(3).required(),
        message: string().min(10).required(),
    });

    try {
        await bodySchema.validate(body);
    } catch (error: any) {
        return NextResponse.json(
            {
                error: "Failed to send mail: Invalid data",
                details: error.errors,
            },
            { status: 400 }
        );
    }

    return sendEmail(body)
        .then(() =>
            NextResponse.json(
                { error: "Success to send mail" },
                { status: 200 }
            )
        )
        .catch((error: any) => {
            console.error(error);
            NextResponse.json(
                { error: "Failed to send mail" },
                { status: 500 }
            );
        });
}
