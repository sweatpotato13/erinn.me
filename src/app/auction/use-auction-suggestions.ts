import { useEffect, useState } from "react";

async function fetchSuggestions(searchTerm: string, signal: AbortSignal) {
    const response = await fetch(
        `/api/suggest?q=${encodeURIComponent(searchTerm)}`,
        { signal }
    );
    if (!response.ok) throw new Error("Suggestion request failed");
    const data = await response.json();
    return (data.suggestions ?? []) as string[];
}

function useActiveSuggestionScroll(activeIndex: number) {
    useEffect(() => {
        document.getElementById(`suggestion-${activeIndex}`)?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
        });
    }, [activeIndex]);
}

export function useAuctionSuggestions(searchTerm: string) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

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

    useActiveSuggestionScroll(activeIndex);
    return {
        suggestions,
        activeIndex,
        setActiveIndex,
        isVisible,
        setIsVisible,
    };
}
