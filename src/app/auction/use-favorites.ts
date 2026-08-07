import { useEffect, useState } from "react";

import type { Favorite } from "@/app/auction/types";

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

export function useFavorites() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [addButtonText, setAddButtonText] = useState("즐겨찾기 등록");

    useEffect(() => {
        setFavorites(parseStoredFavorites(localStorage.getItem("favorites")));
    }, []);
    useEffect(() => {
        if (addButtonText !== "✔") return;
        const timer = setTimeout(() => setAddButtonText("즐겨찾기 등록"), 3000);
        return () => clearTimeout(timer);
    }, [addButtonText]);

    const save = (nextFavorites: Favorite[]) => {
        setFavorites(nextFavorites);
        localStorage.setItem("favorites", JSON.stringify(nextFavorites));
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
