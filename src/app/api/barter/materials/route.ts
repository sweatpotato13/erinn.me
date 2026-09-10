import { NextResponse } from "next/server";
import { z } from "zod";

import index from "@/data/barter-material-index.json";
import { parseQuery } from "@/lib/api/request";

const schema = z.union([
    z.object({ q: z.string().trim().min(2).max(100) }).strict(),
    z
        .object({
            ids: z
                .string()
                .max(1700)
                .regex(/^[1-9]\d*(,[1-9]\d*)*$/)
                .refine(s => {
                    const ids = s.split(",").map(Number);
                    return (
                        ids.length <= 100 &&
                        new Set(ids).size === ids.length &&
                        ids.every(Number.isSafeInteger)
                    );
                }),
        })
        .strict(),
]);
const byId = new Map(index.materials.map(m => [m.id, m]));

export function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    if (new Set(params.keys()).size !== [...params.keys()].length)
        return NextResponse.json(
            { error: "Duplicate query parameters" },
            { status: 400 }
        );
    const parsed = parseQuery(request, schema);
    if (!parsed.success) return parsed.response;
    const query = parsed.data;
    const found =
        "ids" in query
            ? query.ids
                  .split(",")
                  .map(Number)
                  .flatMap(id => (byId.has(id) ? [byId.get(id)!] : []))
            : index.materials.filter(m => m.name.includes(query.q));
    return NextResponse.json({
        version: index.version,
        sourceVersion: index.sourceVersion,
        materials: "ids" in query ? found : found.slice(0, 20),
        hasMore: "q" in query && found.length > 20,
    });
}
