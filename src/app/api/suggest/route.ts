import { readFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";

const indexPath = resolve(process.cwd(), "src/data/suggest-index.json");
let suggestIndex: Record<string, string[]> = {};

try {
    const raw = readFileSync(indexPath, "utf-8");
    suggestIndex = JSON.parse(raw);
} catch {
    console.error("Failed to load suggest-index.json");
}

export function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

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
