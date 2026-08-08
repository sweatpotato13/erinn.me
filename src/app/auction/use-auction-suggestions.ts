import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * Fetches auction suggestions for a search term.
 *
 * @param searchTerm - The term used to search for suggestions
 * @param signal - The signal used to cancel the request
 * @returns The matching suggestion strings, or an empty array when none are available
 */
async function fetchSuggestions(searchTerm: string, signal: AbortSignal) {
    const response = await fetch(
        `/api/suggest?q=${encodeURIComponent(searchTerm)}`,
        { signal }
    );
    if (!response.ok) throw new Error("Suggestion request failed");
    const data = await response.json();
    return (data.suggestions ?? []) as string[];
}

/**
 * Scrolls the active suggestion into the nearest visible position when its index changes.
 *
 * @param activeIndex - The index of the suggestion to bring into view
 */
function useActiveSuggestionScroll(
    activeIndex: number,
    activeSuggestionRef: RefObject<HTMLButtonElement | null>
) {
    useEffect(() => {
        activeSuggestionRef.current?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
        });
    }, [activeIndex, activeSuggestionRef]);
}

/**
 * Manages auction suggestions and the active selection for a search term.
 *
 * @param searchTerm - The current auction search input
 * @returns The suggestions, active suggestion index, visibility state, and their setters
 */
export function useAuctionSuggestions(searchTerm: string) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const activeSuggestionRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setIsVisible(false);
            setSuggestions([]);
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => {
            fetchSuggestions(searchTerm, controller.signal)
                .then(names => {
                    if (controller.signal.aborted) return;
                    setSuggestions(names);
                    setActiveIndex(0);
                    setIsVisible(names.length > 0);
                })
                .catch(() => {
                    if (controller.signal.aborted) return;
                    setSuggestions([]);
                    setIsVisible(false);
                });
        }, 300);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);

    useActiveSuggestionScroll(activeIndex, activeSuggestionRef);
    return {
        suggestions,
        activeIndex,
        setActiveIndex,
        isVisible,
        setIsVisible,
        activeSuggestionRef,
    };
}
