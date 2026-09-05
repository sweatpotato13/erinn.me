import {
    DEFAULT_AUCTION_CATEGORY,
    setAuctionSearchUrl,
} from "@/lib/auction-url";
import {
    parseGold,
    type ReforgeModel,
    type ReforgeTarget,
    type TargetMode,
} from "@/lib/reforge";

export const REFORGE_PATH = "/simulators/reforge";
export interface ReforgeConfig {
    version: string;
    equipmentId: number | null;
    toolId: number;
    targets: ReforgeTarget[];
    mode: TargetMode;
    price: string;
    budget: string;
    cap: number;
}
export function defaultReforgeConfig(version: string): ReforgeConfig {
    return {
        version,
        equipmentId: null,
        toolId: 1,
        targets: [],
        mode: "and",
        price: "",
        budget: "",
        cap: 1000,
    };
}
const keys = ["v", "e", "t", "goals", "mode", "price", "budget", "cap"];
export function parseReforgeConfig(
    params: URLSearchParams,
    version: string
): { config: ReforgeConfig; error: string | null; changedVersion: boolean } {
    const fallback = defaultReforgeConfig(version);
    const bad = () => ({
        config: fallback,
        error: "공유 설정이 올바르지 않거나 너무 깁니다. 기본 설정으로 돌아가세요.",
        changedVersion: false,
    });
    if (
        params.toString().length > 1200 ||
        keys.some(k => params.getAll(k).length > 1)
    )
        return bad();
    if (!keys.some(k => params.has(k)))
        return { config: fallback, error: null, changedVersion: false };
    const positive = (value: string | null) =>
        value !== null &&
        /^[1-9]\d{0,14}$/.test(value) &&
        Number.isSafeInteger(Number(value));
    if (
        !positive(params.get("v")) ||
        (params.has("e") && !positive(params.get("e"))) ||
        !positive(params.get("t"))
    )
        return bad();
    const goals = params.get("goals") ?? "";
    if (
        goals &&
        !/^[1-9]\d{0,14}:[1-9]\d{0,2}(,[1-9]\d{0,14}:[1-9]\d{0,2}){0,2}$/.test(
            goals
        )
    )
        return bad();
    const targets = goals
        ? goals.split(",").map(value => {
              const [id, level] = value.split(":").map(Number);
              return { id, level };
          })
        : [];
    if (new Set(targets.map(t => t.id)).size !== targets.length) return bad();
    const mode = params.get("mode") ?? "and";
    const cap = params.get("cap") ?? "1000";
    const price = params.get("price") ?? "",
        budget = params.get("budget") ?? "";
    if (
        !["and", "or"].includes(mode) ||
        !positive(cap) ||
        Number(cap) > 1_000_000 ||
        (price !== "" && parseGold(price) === null) ||
        (budget !== "" && parseGold(budget) === null)
    )
        return bad();
    return {
        config: {
            version: params.get("v")!,
            equipmentId: params.has("e") ? Number(params.get("e")) : null,
            toolId: Number(params.get("t")),
            targets,
            mode: mode as TargetMode,
            price,
            budget,
            cap: Number(cap),
        },
        error: null,
        changedVersion: params.get("v") !== version,
    };
}
export function reforgeConfigPath(config: ReforgeConfig) {
    const params = new URLSearchParams({
        v: config.version,
        t: String(config.toolId),
        mode: config.mode,
        cap: String(config.cap),
    });
    if (config.equipmentId !== null)
        params.set("e", String(config.equipmentId));
    if (config.targets.length)
        params.set(
            "goals",
            config.targets.map(t => `${t.id}:${t.level}`).join(",")
        );
    if (config.price !== "") params.set("price", config.price);
    if (config.budget !== "") params.set("budget", config.budget);
    if (parseReforgeConfig(params, config.version).error)
        throw new Error("공유할 설정을 확인하세요.");
    return `${REFORGE_PATH}?${params}`;
}
// Existing Nexon option-value fixture: "마법 공격력(20레벨:...)".
// Keep an explicit allowlist until further names are checked against actual listings.
const verifiedAuctionNames: Record<number, string> = { 15: "마법 공격력" };
export function reforgeAuctionPath(
    model: ReforgeModel,
    targets: ReforgeTarget[]
) {
    if (targets.length !== 1) return null;
    const target = targets[0];
    const ability = model.pool.find(a => a.id === target.id);
    if (!ability || verifiedAuctionNames[target.id] !== ability.name)
        return null;
    const result = setAuctionSearchUrl(
        new URL("/auction", "https://erinn.me"),
        {
            itemName: model.equipment.name,
            category: DEFAULT_AUCTION_CATEGORY,
            optionFilters: {
                reforge: { optionName: ability.name, minLevel: target.level },
            },
        }
    );
    return result.invalid ? null : `${result.url.pathname}${result.url.search}`;
}
