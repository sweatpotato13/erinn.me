export const HORN_SERVERS = ["류트", "울프", "하프", "만돌린"] as const;
export const HORN_PREFERENCES_KEY = "hornPreferences";

export type HornServer = (typeof HORN_SERVERS)[number];

export interface HornPreferences {
    selectedServer: HornServer;
    alertKeywords: string[];
    soundEnabled: boolean;
}

export function defaultHornPreferences(): HornPreferences {
    return {
        selectedServer: HORN_SERVERS[0],
        alertKeywords: [],
        soundEnabled: true,
    };
}

export function parseHornPreferences(value: string | null): HornPreferences {
    if (!value) return defaultHornPreferences();
    try {
        const parsed: unknown = JSON.parse(value);
        if (!parsed || typeof parsed !== "object")
            return defaultHornPreferences();
        const preferences = parsed as Record<string, unknown>;
        if (
            !HORN_SERVERS.includes(preferences.selectedServer as HornServer) ||
            !Array.isArray(preferences.alertKeywords) ||
            !preferences.alertKeywords.every(
                keyword => typeof keyword === "string" && keyword.trim()
            ) ||
            typeof preferences.soundEnabled !== "boolean"
        )
            return defaultHornPreferences();
        return {
            selectedServer: preferences.selectedServer as HornServer,
            alertKeywords: [...preferences.alertKeywords],
            soundEnabled: preferences.soundEnabled,
        };
    } catch {
        return defaultHornPreferences();
    }
}

export function loadHornPreferences(): HornPreferences {
    try {
        return parseHornPreferences(localStorage.getItem(HORN_PREFERENCES_KEY));
    } catch {
        return defaultHornPreferences();
    }
}

export function saveHornPreferences(preferences: HornPreferences): void {
    try {
        localStorage.setItem(HORN_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
        // Keep the page usable in memory when storage is unavailable.
    }
}
