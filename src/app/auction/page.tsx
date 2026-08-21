"use client";

import { useRef, useState } from "react";

import { MAX_COMPARISON_ITEMS } from "@/app/auction/auction-comparison";
import { AuctionControls } from "@/app/auction/auction-controls";
import {
    AuctionResults,
    ItemOptionsDialog,
} from "@/app/auction/auction-results";
import {
    FavoritesDialog,
    FavoriteToolbar,
} from "@/app/auction/favorites-dialog";
import type { AuctionItem, Favorite, ItemOption } from "@/app/auction/types";
import { useAuctionSearch } from "@/app/auction/use-auction-search";
import { useAuctionSuggestions } from "@/app/auction/use-auction-suggestions";
import {
    parseStoredFavorites,
    useFavorites,
} from "@/app/auction/use-favorites";
import { useRecentSales } from "@/app/auction/use-recent-sales";
import { categories } from "@/constant/categories";

export { parseStoredFavorites };

interface ComparisonSelection {
    items: AuctionItem[];
    notice: string | null;
}

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
    comparison: ComparisonSelection;
    setSearchTerm: (value: string) => void;
    setSelectedCategory: (value: string) => void;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    onSearch: () => void;
    onSelectFavorite: (favorite: Favorite) => void;
    onShowFavorites: (show: boolean) => void;
    onShowOptions: (options: ItemOption[] | null) => void;
    onToggleComparison: (item: AuctionItem) => void;
    onRemoveComparison: (item: AuctionItem) => void;
    onClearComparison: () => void;
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
                    comparisonItems={props.comparison.items}
                    comparisonNotice={props.comparison.notice}
                    onToggleComparison={props.onToggleComparison}
                    onRemoveComparison={props.onRemoveComparison}
                    onClearComparison={props.onClearComparison}
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
    const [comparison, setComparison] = useState<ComparisonSelection>({
        items: [],
        notice: null,
    });
    const favoritesTriggerRef = useRef<HTMLButtonElement>(null);
    const suggestions = useAuctionSuggestions(searchTerm);
    const favorites = useFavorites();
    const auction = useAuctionSearch();
    const recentSales = useRecentSales();

    const search = (itemName = searchTerm, category = selectedCategory) => {
        setCurrentPage(1);
        setComparison({ items: [], notice: null });
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
    const toggleComparison = (item: AuctionItem) =>
        setComparison(current => {
            if (current.items.includes(item)) {
                return {
                    items: current.items.filter(selected => selected !== item),
                    notice: null,
                };
            }
            if (current.items.length >= MAX_COMPARISON_ITEMS) {
                return {
                    ...current,
                    notice: "최대 4개까지 비교할 수 있습니다.",
                };
            }
            return { items: [...current.items, item], notice: null };
        });
    const removeComparison = (item: AuctionItem) =>
        setComparison(current => ({
            items: current.items.filter(selected => selected !== item),
            notice: null,
        }));
    const clearComparison = () => setComparison({ items: [], notice: null });

    return (
        <AuctionPageView
            {...{ searchTerm, selectedCategory, showFavorites, options }}
            {...{ currentPage, suggestions, favorites, auction, recentSales }}
            comparison={comparison}
            searchLoading={auction.loading || recentSales.loading}
            favoritesTriggerRef={favoritesTriggerRef}
            {...{ setSearchTerm, setSelectedCategory, setCurrentPage }}
            onSearch={() => void search()}
            onSelectFavorite={selectFavorite}
            onShowFavorites={setShowFavorites}
            onShowOptions={setOptions}
            onToggleComparison={toggleComparison}
            onRemoveComparison={removeComparison}
            onClearComparison={clearComparison}
        />
    );
}
