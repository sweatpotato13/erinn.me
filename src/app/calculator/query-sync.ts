/**
 * Bookkeeping that tells our own URL writes apart from real navigation.
 * Next delivers search params asynchronously, so after several quick writes
 * the router can still report an older query that we wrote ourselves.
 */
export interface QuerySyncState {
    /** Last query this hook either wrote or restored from. */
    restoredQuery: string;
    /** Last search params key the restore effect has already handled. */
    lastSeenKey: string | null;
    /** Queries we wrote whose router echo has not arrived yet, oldest first. */
    pendingWrites: string[];
    /** Set by a popstate (Back/Forward); the next key change is navigation. */
    historyNavigation: boolean;
}

/** Returns true when the key is an echo of our own writes, not navigation. */
export function consumeOwnWriteEcho(
    sync: QuerySyncState,
    key: string
): boolean {
    if (sync.historyNavigation) {
        sync.historyNavigation = false;
        sync.pendingWrites = [];
        return false;
    }
    if (key === sync.restoredQuery) {
        sync.pendingWrites = [];
        return true;
    }
    const index = sync.pendingWrites.indexOf(key);
    if (index === -1) return false;
    sync.pendingWrites = sync.pendingWrites.slice(index + 1);
    return true;
}
