import { NextResponse } from "next/server";
import * as z from "zod";

type ParsedQuery<T> =
    | { success: true; data: T }
    | { success: false; response: NextResponse };

export function parseQuery<T>(
    request: Request,
    schema: z.ZodType<T>
): ParsedQuery<T> {
    const values = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
        return {
            success: false,
            response: NextResponse.json(
                { error: "Invalid query parameters" },
                { status: 400 }
            ),
        };
    }

    return { success: true, data: parsed.data };
}

export const serverNameSchema = z.enum(["류트", "울프", "하프", "만돌린"]);
