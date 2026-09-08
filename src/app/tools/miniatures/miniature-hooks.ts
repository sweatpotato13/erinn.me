import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import {
    type Dispatch,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from "react";

import { fetchItemPriceSummary } from "@/lib/api/auction";
import {
    marketGold,
    type Miniature,
    miniatureGold,
    type MiniatureReference,
} from "@/lib/miniatures";
import {
    MINIATURE_STORAGE_KEY,
    parseMiniatureStorage,
} from "@/lib/miniatures-state";

type Notify = (message: string) => void;
export interface MiniatureNotices {
    notice: string;
    storageNotice: string;
    setNotice: Notify;
    setStorageNotice: Notify;
    clear: () => void;
}
export interface MiniatureInstallations {
    installed: number[];
    ready: boolean;
    save: (ids: number[], reset?: boolean) => void;
    toggle: (item: Miniature) => void;
}
export interface MiniatureConfig {
    candidateIds: number[];
    targetStat: string;
    manualPrices: Record<string, string>;
}
export interface MiniatureCandidates {
    config: MiniatureConfig;
    setConfig: Dispatch<SetStateAction<MiniatureConfig>>;
    selected: Miniature[];
    add: (item: Miniature) => void;
    remove: (id?: number) => void;
}
export type MiniatureQuote = UseQueryResult<
    Awaited<ReturnType<typeof fetchItemPriceSummary>>,
    Error
>;
export interface MiniaturePrices {
    quote: (item: Miniature) => MiniatureQuote | undefined;
    price: (item: Miniature) => number | null;
    fetching: boolean;
    canLookup: boolean;
    lookup: () => Promise<void>;
}

export function useMiniatureNotices(): MiniatureNotices {
    const [notice, setNotice] = useState("");
    const [storageNotice, setStorageNotice] = useState("");
    function clear() {
        setNotice("");
        setStorageNotice("");
    }
    useEffect(() => {
        if (!notice && !storageNotice) return;
        const timer = setTimeout(() => {
            setNotice("");
            setStorageNotice("");
        }, 6000);
        return () => clearTimeout(timer);
    }, [notice, storageNotice]);
    return { notice, storageNotice, setNotice, setStorageNotice, clear };
}

function readInstallations(data: MiniatureReference): {
    installedIds: number[];
    notice: string;
} {
    try {
        return parseMiniatureStorage(
            localStorage.getItem(MINIATURE_STORAGE_KEY),
            data
        );
    } catch {
        return {
            installedIds: [],
            notice: "저장소를 사용할 수 없습니다. 현재 화면에서만 설치 목록을 유지합니다.",
        };
    }
}

function persistInstallations(
    data: MiniatureReference,
    ids: number[],
    reset: boolean
): string {
    try {
        if (reset) localStorage.removeItem(MINIATURE_STORAGE_KEY);
        else
            localStorage.setItem(
                MINIATURE_STORAGE_KEY,
                JSON.stringify({
                    formatVersion: 1,
                    snapshotVersion: data.version,
                    installedIds: ids,
                })
            );
        return "";
    } catch {
        return "설치 목록을 저장하지 못했습니다. 현재 화면에서는 계속 사용할 수 있습니다.";
    }
}

export function useMiniatureInstallations(
    data: MiniatureReference,
    notices: MiniatureNotices
): MiniatureInstallations {
    const [installed, setInstalled] = useState<number[]>([]);
    const [ready, setReady] = useState(false);
    const { setNotice, setStorageNotice } = notices;
    useEffect(() => {
        const saved = readInstallations(data);
        setInstalled(saved.installedIds);
        setStorageNotice(saved.notice);
        setReady(true);
    }, [data, setStorageNotice]);
    function save(ids: number[], reset = false) {
        if (ids.length > 1000) {
            setNotice("설치 목록은 최대 1,000개까지 저장할 수 있습니다.");
            return;
        }
        setInstalled(ids);
        setStorageNotice(persistInstallations(data, ids, reset));
    }
    function toggle(item: Miniature) {
        save(
            installed.includes(item.id)
                ? installed.filter(id => id !== item.id)
                : [...installed, item.id]
        );
    }
    return { installed, ready, save, toggle };
}

function removeCandidate(
    config: MiniatureConfig,
    data: MiniatureReference,
    id?: number
): MiniatureConfig {
    const ids =
        id === undefined
            ? []
            : config.candidateIds.filter(value => value !== id);
    const itemIds = data.miniatures
        .filter(item => ids.includes(item.id))
        .map(item => String(item.itemId));
    return {
        ...config,
        candidateIds: ids,
        manualPrices: Object.fromEntries(
            Object.entries(config.manualPrices).filter(([key]) =>
                itemIds.includes(key)
            )
        ),
    };
}

export function useMiniatureCandidates(
    data: MiniatureReference,
    notify: Notify,
    focusSearch: () => void
): MiniatureCandidates {
    const [config, setConfig] = useState<MiniatureConfig>({
        candidateIds: [],
        targetStat: "all",
        manualPrices: {},
    });
    const selected = config.candidateIds
        .map(id => data.miniatures.find(item => item.id === id)!)
        .filter(Boolean);
    function add(item: Miniature) {
        if (config.candidateIds.includes(item.id)) return;
        if (selected.length >= 4) {
            notify("비교 후보는 최대 4개입니다. 기존 후보를 제거해 주세요.");
            return;
        }
        setConfig(c => ({ ...c, candidateIds: [...c.candidateIds, item.id] }));
        notify("");
    }
    function remove(id?: number) {
        setConfig(c => removeCandidate(c, data, id));
        focusSearch();
    }
    return { config, setConfig, selected, add, remove };
}

function usePriceRefresh(quotes: MiniatureQuote[]): {
    fetching: boolean;
    lookup: () => Promise<void>;
} {
    const [pending, setPending] = useState(false);
    const busy = useRef(false);
    const fetching = pending || quotes.some(q => q.isFetching);
    async function lookup() {
        if (busy.current || fetching || !quotes.length) return;
        busy.current = true;
        setPending(true);
        try {
            await Promise.allSettled(quotes.map(q => q.refetch()));
        } finally {
            busy.current = false;
            setPending(false);
        }
    }
    return { fetching, lookup };
}

export function useMiniaturePrices(
    version: string,
    selected: Miniature[],
    manualPrices: Record<string, string>
): MiniaturePrices {
    const names = [
        ...new Set(
            selected.filter(item => item.searchable).map(item => item.itemName)
        ),
    ];
    const quotes = useQueries({
        queries: names.map(name => ({
            queryKey: ["miniature-price", version, name],
            queryFn: ({ signal }: { signal: AbortSignal }) =>
                fetchItemPriceSummary(name, signal),
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: false,
        })),
    });
    const refresh = usePriceRefresh(quotes);
    const quote = (item: Miniature) =>
        item.searchable ? quotes[names.indexOf(item.itemName)] : undefined;
    const price = (item: Miniature) =>
        Object.hasOwn(manualPrices, item.itemId)
            ? miniatureGold(manualPrices[item.itemId])
            : marketGold(quote(item)?.data);
    return { quote, price, ...refresh, canLookup: !!names.length };
}
