import { readFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import * as z from "zod";

import { parseQuery } from "@/lib/api/request";

const indexPath = resolve(process.cwd(), "src/data/suggest-index.json");
let suggestIndex: Record<string, string[]> = {};

try {
    const raw = readFileSync(indexPath, "utf-8");
    suggestIndex = JSON.parse(raw);
} catch {
    console.error("Failed to load suggest-index.json");
}

const querySchema = z.object({ q: z.string().max(100).optional() });

export function GET(request: NextRequest) {
    const query = parseQuery(request, querySchema);
    if (!query.success) return query.response;
    const q = (query.data.q ?? "").toLowerCase();

    if (q.length < 2) {
        return NextResponse.json({ suggestions: [] });
    }

    const prefix = q.substring(0, 2);
    const candidates = suggestIndex[prefix] ?? [];

    const results = candidates
        .filter(name => name.toLowerCase().includes(q))
        .slice(0, 20);

    return NextResponse.json({ suggestions: results });
}
