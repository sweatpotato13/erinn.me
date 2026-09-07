import { z } from "zod";

import {
    createEchoPool,
    ECHO_CAP,
    type EchoReference,
    echoStateError,
} from "@/lib/echostone";
import { parseGold } from "@/lib/reforge";

export const ECHOSTONE_PATH = "/simulators/echostone";
const gold = z
    .string()
    .max(30)
    .refine(v => v === "" || parseGold(v) !== null);
const configSchema = z
    .object({
        version: z.string().regex(/^[1-9]\d{0,14}$/),
        color: z.number().int().min(1).max(5),
        grade: z.number().int().min(1).max(30),
        agent: z.union([
            z.literal(53940),
            z.literal(53941),
            z.literal(53942),
            z.literal(5000078),
        ]),
        target: z
            .object({
                name: z.string().min(1).max(100),
                level: z.number().int().min(1).max(20),
            })
            .strict(),
        prices: z
            .object({
                53940: gold,
                53941: gold,
                53942: gold,
                5000078: gold,
                5040961: gold,
            })
            .strict(),
        fee: gold,
        budget: gold,
        cap: z.number().int().min(1).max(ECHO_CAP),
        policy: z.enum(["awakening", "polishing"]),
        current: z
            .object({
                id: z.number().int().positive(),
                level: z.number().int().min(1).max(20),
                polishingUsed: z.boolean(),
            })
            .strict()
            .nullable(),
    })
    .strict();
export type EchoConfig = z.infer<typeof configSchema>;
export function defaultEchoConfig(data: EchoReference): EchoConfig {
    return {
        version: data.version,
        color: 1,
        grade: 30,
        agent: 53940,
        target: { name: data.colors[0].options[0].name, level: 3 },
        prices: { 53940: "", 53941: "", 53942: "", 5000078: "", 5040961: "" },
        fee: "0",
        budget: "",
        cap: 1000,
        policy: "awakening",
        current: null,
    };
}
export function echoConfigError(config: EchoConfig, data: EchoReference) {
    const color = data.colors.find(c => c.id === config.color);
    if (!color?.options.some(o => o.name === config.target.name))
        return "이 색상에 없는 목표 옵션입니다.";
    return echoStateError(
        createEchoPool(data, config.color, config.grade, 53940),
        config.current
    );
}
export function parseEchoConfig(params: URLSearchParams, data: EchoReference) {
    const fallback = defaultEchoConfig(data);
    const bad = () => ({
        config: fallback,
        error: "공유 설정이 올바르지 않거나 너무 깁니다. 기본 설정을 사용하세요.",
        changedVersion: false,
    });
    if (params.toString().length > 4000 || params.getAll("s").length > 1)
        return bad();
    const raw = params.get("s");
    if (raw === null)
        return { config: fallback, error: null, changedVersion: false };
    try {
        const config = configSchema.parse(JSON.parse(raw));
        if (echoConfigError(config, data)) return bad();
        return {
            config,
            error: null,
            changedVersion: config.version !== data.version,
        };
    } catch {
        return bad();
    }
}
export function echoConfigPath(config: EchoConfig, data: EchoReference) {
    const params = new URLSearchParams({ s: JSON.stringify(config) });
    if (parseEchoConfig(params, data).error)
        throw new Error("공유할 설정을 확인하세요.");
    return `${ECHOSTONE_PATH}?${params}`;
}
