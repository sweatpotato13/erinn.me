"use client";

import { useRef, useState } from "react";

import { AuctionControls } from "@/app/auction/auction-controls";
import {
    AuctionResults,
    ItemOptionsDialog,
} from "@/app/auction/auction-results";
import {
    FavoritesDialog,
    FavoriteToolbar,
} from "@/app/auction/favorites-dialog";
import type { Favorite, ItemOption } from "@/app/auction/types";
import { useAuctionSearch } from "@/app/auction/use-auction-search";
import { useAuctionSuggestions } from "@/app/auction/use-auction-suggestions";
import {
    parseStoredFavorites,
    useFavorites,
} from "@/app/auction/use-favorites";
import { useRecentSales } from "@/app/auction/use-recent-sales";
import { categories } from "@/constant/categories";

export { parseStoredFavorites };

type AuctionViewProps = {
    searchTerm: string;
    selectedCategory: string;
    showFavorites: boolean;
    options: ItemOption[] | null;
    currentPage: number;
    suggestions: ReturnType<typeof useAuctionSuggestions>;
    favorites: ReturnType<typeof useFavorites>;
    auction: ReturnType<typeof useAuctionSearch>;
    recentSales: ReturnType<typeof useRecentSales>;
    searchLoading: boolean;
    setSearchTerm: (value: string) => void;
    setSelectedCategory: (value: string) => void;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    onSearch: () => void;
    onSelectFavorite: (favorite: Favorite) => void;
    onShowFavorites: (show: boolean) => void;
    onShowOptions: (options: ItemOption[] | null) => void;
    favoritesTriggerRef: React.RefObject<HTMLButtonElement | null>;
};

/**
 * Renders the auction page view, including controls, favorites, results, and dialogs.
 *
 * @param props - State and event handlers used to render and interact with the auction view
 * @returns The auction page view
 */
function AuctionPageView(props: AuctionViewProps) {
    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-6">
            <div className="w-full max-w-4xl p-6 backdrop-blur-sm rounded-lg flex-grow">
                <FavoriteToolbar
                    addButtonText={props.favorites.addButtonText}
                    onAdd={() =>
                        props.favorites.add(
                            props.searchTerm,
                            props.selectedCategory
                        )
                    }
                    onShow={() => props.onShowFavorites(true)}
                    showButtonRef={props.favoritesTriggerRef}
                />
                <AuctionControls {...props} loading={props.searchLoading} />
                {props.showFavorites && (
                    <FavoritesDialog
                        favorites={props.favorites.favorites}
                        onSelect={props.onSelectFavorite}
                        onRemove={props.favorites.remove}
                        onClose={() => props.onShowFavorites(false)}
                        triggerRef={props.favoritesTriggerRef}
                    />
                )}
                <AuctionResults
                    {...props.auction}
                    currentPage={props.currentPage}
                    setCurrentPage={props.setCurrentPage}
                    onSort={props.auction.sortByPrice}
                    onItemClick={item =>
                        props.onShowOptions(item.item_option ?? [])
                    }
                    recentSales={props.recentSales}
                />
                {props.options && (
                    <ItemOptionsDialog
                        options={props.options}
                        onClose={() => props.onShowOptions(null)}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * Renders the auction search page and manages its search, favorites, pagination, and item options state.
 */
export default function AuctionPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFavorites, setShowFavorites] = useState(false);
    const [options, setOptions] = useState<ItemOption[] | null>(null);
    const favoritesTriggerRef = useRef<HTMLButtonElement>(null);
    const suggestions = useAuctionSuggestions(searchTerm);
    const favorites = useFavorites();
    const auction = useAuctionSearch();
    const recentSales = useRecentSales();

    const search = (itemName = searchTerm, category = selectedCategory) => {
        setCurrentPage(1);
        return Promise.allSettled([
            auction.search(itemName, category),
            recentSales.search(itemName),
        ]);
    };
    const selectFavorite = (favorite: Favorite) => {
        setSearchTerm(favorite.itemName);
        setSelectedCategory(favorite.category);
        void search(favorite.itemName, favorite.category);
        setShowFavorites(false);
    };

    return (
        <AuctionPageView
            {...{ searchTerm, selectedCategory, showFavorites, options }}
            {...{ currentPage, suggestions, favorites, auction, recentSales }}
            searchLoading={auction.loading || recentSales.loading}
            favoritesTriggerRef={favoritesTriggerRef}
            {...{ setSearchTerm, setSelectedCategory, setCurrentPage }}
            onSearch={() => void search()}
            onSelectFavorite={selectFavorite}
            onShowFavorites={setShowFavorites}
            onShowOptions={setOptions}
        />
    );
}
