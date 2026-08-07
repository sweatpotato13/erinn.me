import { useEffect, useState } from "react";

import type { Favorite } from "@/app/auction/types";

/**
 * Parses stored JSON into a validated list of favorite items.
 *
 * @param value - The stored JSON string, or `null` when no value is available
 * @returns The parsed favorite items, or an empty array for missing, invalid, or structurally invalid data
 */
export function parseStoredFavorites(value: string | null): Favorite[] {
    if (!value) return [];
    try {
        const parsed: unknown = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        const valid = parsed.every(
            item =>
                !!item &&
                typeof item === "object" &&
                typeof (item as Favorite).itemName === "string" &&
                typeof (item as Favorite).category === "string"
        );
        return valid ? (parsed as Favorite[]) : [];
    } catch {
        return [];
    }
}

/**
 * Manages stored favorites and the add-button feedback state.
 *
 * @returns The current favorites, button label, and operations for adding or removing favorites.
 */
export function useFavorites() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [addButtonText, setAddButtonText] = useState("즐겨찾기 등록");

    useEffect(() => {
        try {
            setFavorites(
                parseStoredFavorites(localStorage.getItem("favorites"))
            );
        } catch {
            setFavorites([]);
        }
    }, []);
    useEffect(() => {
        if (addButtonText !== "✔") return;
        const timer = setTimeout(() => setAddButtonText("즐겨찾기 등록"), 3000);
        return () => clearTimeout(timer);
    }, [addButtonText]);

    const save = (nextFavorites: Favorite[]) => {
        setFavorites(nextFavorites);
        try {
            localStorage.setItem("favorites", JSON.stringify(nextFavorites));
        } catch {
            // Keep favorites usable in memory when storage is unavailable.
        }
    };
    const add = (itemName: string, category: string) => {
        if (favorites.length >= 20) {
            alert("즐겨찾기는 최대 20개까지 저장할 수 있습니다.");
            return;
        }
        if (!itemName.trim()) {
            alert("아이템 이름을 입력해주세요.");
            return;
        }
        save([...favorites, { itemName, category }]);
        setAddButtonText("✔");
    };
    const remove = (index: number) => {
        save(favorites.filter((_, favoriteIndex) => favoriteIndex !== index));
    };
    return { favorites, addButtonText, add, remove };
}
