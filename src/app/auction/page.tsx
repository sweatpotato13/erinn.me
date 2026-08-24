"use client";

import { Suspense, useRef, useState } from "react";

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
    type AuctionUrlFeedback,
    type AuctionUrlSearch,
    useAuctionUrlState,
} from "@/app/auction/use-auction-url-state";
import {
    type ComparisonSelection,
    useComparisonSelection,
} from "@/app/auction/use-comparison-selection";
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
    canShare: boolean;
    sharing: boolean;
    feedback: AuctionUrlFeedback | null;
    comparison: ComparisonSelection;
    setSearchTerm: (value: string) => void;
    setSelectedCategory: (value: string) => void;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    onSearch: () => void;
    onShare: () => void;
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

type AuctionSearchLifecycleProps = {
    setSearchTerm: (value: string) => void;
    setSelectedCategory: (value: string) => void;
    setCurrentPage: (value: number) => void;
    setShowFavorites: (value: boolean) => void;
    setOptions: (value: ItemOption[] | null) => void;
    clearComparison: () => void;
};

function useAuctionSearchLifecycle(props: AuctionSearchLifecycleProps) {
    const auction = useAuctionSearch();
    const recentSales = useRecentSales();
    const restoreSearch = (search: AuctionUrlSearch | null) => {
        const itemName = search?.itemName ?? "";
        const category = search?.category ?? categories[0];
        props.setSearchTerm(itemName);
        props.setSelectedCategory(category);
        props.setCurrentPage(1);
        props.setShowFavorites(false);
        props.setOptions(null);
        props.clearComparison();
        if (!search) {
            auction.reset();
            void recentSales.search("");
            return;
        }
        void Promise.allSettled([
            auction.search(itemName, category),
            recentSales.search(itemName),
        ]);
    };
    const urlState = useAuctionUrlState(restoreSearch);
    const selectFavorite = (favorite: Favorite) => {
        urlState.commit(favorite.itemName, favorite.category);
        props.setShowFavorites(false);
    };
    return { auction, recentSales, selectFavorite, urlState };
}

/**
 * Renders the auction search page and manages its search, favorites, pagination, and item options state.
 */
function AuctionPageContent() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFavorites, setShowFavorites] = useState(false);
    const [options, setOptions] = useState<ItemOption[] | null>(null);
    const { comparison, toggleComparison, removeComparison, clearComparison } =
        useComparisonSelection();
    const favoritesTriggerRef = useRef<HTMLButtonElement>(null);
    const suggestions = useAuctionSuggestions(searchTerm);
    const favorites = useFavorites();
    const { auction, recentSales, selectFavorite, urlState } =
        useAuctionSearchLifecycle({
            setSearchTerm,
            setSelectedCategory,
            setCurrentPage,
            setShowFavorites,
            setOptions,
            clearComparison,
        });
    return (
        <AuctionPageView
            {...{ searchTerm, selectedCategory, showFavorites, options }}
            {...{ currentPage, suggestions, favorites, auction, recentSales }}
            comparison={comparison}
            searchLoading={auction.loading || recentSales.loading}
            canShare={urlState.canShare}
            sharing={urlState.sharing}
            feedback={urlState.feedback}
            favoritesTriggerRef={favoritesTriggerRef}
            {...{ setSearchTerm, setSelectedCategory, setCurrentPage }}
            onSearch={() => urlState.commit(searchTerm, selectedCategory)}
            onShare={() => void urlState.share()}
            onSelectFavorite={selectFavorite}
            onShowFavorites={setShowFavorites}
            onShowOptions={setOptions}
            onToggleComparison={toggleComparison}
            onRemoveComparison={removeComparison}
            onClearComparison={clearComparison}
        />
    );
}

export default function AuctionPage() {
    return (
        <Suspense
            fallback={
                <div className="p-6 text-center" role="status">
                    경매장 검색을 준비하고 있습니다.
                </div>
            }
        >
            <AuctionPageContent />
        </Suspense>
    );
}
