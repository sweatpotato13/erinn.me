"use client";

import { Suspense, useRef, useState } from "react";

import { AuctionControls } from "@/app/auction/auction-controls";
import {
    AuctionPresetsDialog,
    AuctionPresetToolbar,
} from "@/app/auction/auction-presets-dialog";
import {
    AuctionResults,
    ItemOptionsDialog,
} from "@/app/auction/auction-results";
import {
    FavoritesDialog,
    FavoriteToolbar,
} from "@/app/auction/favorites-dialog";
import type { AuctionItem, Favorite, ItemOption } from "@/app/auction/types";
import { useAuctionPresets } from "@/app/auction/use-auction-presets";
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
import type { AuctionOptionFilters } from "@/lib/auction-options";

export { parseStoredFavorites };

type AuctionViewProps = {
    searchTerm: string;
    selectedCategory: string;
    showFavorites: boolean;
    showPresets: boolean;
    options: ItemOption[] | null;
    currentPage: number;
    suggestions: ReturnType<typeof useAuctionSuggestions>;
    favorites: ReturnType<typeof useFavorites>;
    presets: ReturnType<typeof useAuctionPresets>;
    auction: ReturnType<typeof useAuctionSearch>;
    recentSales: ReturnType<typeof useRecentSales>;
    searchLoading: boolean;
    canShare: boolean;
    sharing: boolean;
    feedback: AuctionUrlFeedback | null;
    optionFilters: AuctionOptionFilters;
    activeSearch: AuctionUrlSearch | null;
    comparison: ComparisonSelection;
    setSearchTerm: (value: string) => void;
    setSelectedCategory: (value: string) => void;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    onSearch: () => void;
    onApplyOptionFilters: (filters: AuctionOptionFilters) => void;
    onChangeOptionFilters: (filters: AuctionOptionFilters) => void;
    onShare: () => void;
    onLoadPreset: (search: AuctionUrlSearch) => void;
    onSelectFavorite: (favorite: Favorite) => void;
    onShowFavorites: (show: boolean) => void;
    onShowPresets: (show: boolean) => void;
    onShowOptions: (options: ItemOption[] | null) => void;
    onToggleComparison: (item: AuctionItem) => void;
    onRemoveComparison: (item: AuctionItem) => void;
    onClearComparison: () => void;
    favoritesTriggerRef: React.RefObject<HTMLButtonElement | null>;
    presetsTriggerRef: React.RefObject<HTMLButtonElement | null>;
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
                <h1 className="text-2xl font-bold">
                    마비노기 경매장 시세 조회
                </h1>
                <p className="mt-2 mb-6 text-base-content/70">
                    아이템명·카테고리·세부 옵션으로 현재 매물을 검색하고 최근
                    거래가와 비교하세요.
                </p>
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
                <AuctionPresetToolbar
                    onShow={() => props.onShowPresets(true)}
                    triggerRef={props.presetsTriggerRef}
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
                {props.showPresets && (
                    <AuctionPresetsDialog
                        activeSearch={props.activeSearch}
                        presets={props.presets}
                        onLoad={props.onLoadPreset}
                        onClose={() => props.onShowPresets(false)}
                        triggerRef={props.presetsTriggerRef}
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
    setShowPresets: (value: boolean) => void;
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
        props.setShowPresets(false);
        props.setOptions(null);
        props.clearComparison();
        if (!search) {
            auction.reset();
            void recentSales.search("");
            return;
        }
        void Promise.allSettled([
            auction.search(itemName, category, search.optionFilters),
            recentSales.search(itemName),
        ]);
    };
    const urlState = useAuctionUrlState(restoreSearch);
    const optionFilters = urlState.search?.optionFilters ?? {};
    const selectFavorite = (favorite: Favorite) => {
        urlState.commit(favorite.itemName, favorite.category, optionFilters);
        props.setShowFavorites(false);
    };
    const changeOptionFilters = (filters: AuctionOptionFilters) => {
        if (!urlState.search) return;
        urlState.commit(
            urlState.search.itemName,
            urlState.search.category,
            filters
        );
    };
    return {
        auction,
        changeOptionFilters,
        optionFilters,
        recentSales,
        selectFavorite,
        urlState,
    };
}

/**
 * Renders the auction search page and manages its search, favorites, pagination, and item options state.
 */
function AuctionPageContent() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFavorites, setShowFavorites] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [options, setOptions] = useState<ItemOption[] | null>(null);
    const { comparison, toggleComparison, removeComparison, clearComparison } =
        useComparisonSelection();
    const favoritesTriggerRef = useRef<HTMLButtonElement>(null);
    const presetsTriggerRef = useRef<HTMLButtonElement>(null);
    const suggestions = useAuctionSuggestions(searchTerm);
    const favorites = useFavorites();
    const presets = useAuctionPresets();
    const {
        auction,
        changeOptionFilters,
        optionFilters,
        recentSales,
        selectFavorite,
        urlState,
    } = useAuctionSearchLifecycle({
        setSearchTerm,
        setSelectedCategory,
        setCurrentPage,
        setShowFavorites,
        setShowPresets,
        setOptions,
        clearComparison,
    });
    return (
        <AuctionPageView
            {...{
                searchTerm,
                selectedCategory,
                showFavorites,
                showPresets,
                options,
            }}
            {...{
                currentPage,
                suggestions,
                favorites,
                presets,
                auction,
                recentSales,
            }}
            comparison={comparison}
            searchLoading={auction.loading || recentSales.loading}
            canShare={urlState.canShare}
            sharing={urlState.sharing}
            feedback={urlState.feedback}
            optionFilters={optionFilters}
            activeSearch={urlState.canShare ? urlState.search : null}
            favoritesTriggerRef={favoritesTriggerRef}
            presetsTriggerRef={presetsTriggerRef}
            {...{ setSearchTerm, setSelectedCategory, setCurrentPage }}
            onSearch={() =>
                urlState.commit(searchTerm, selectedCategory, optionFilters)
            }
            onApplyOptionFilters={filters =>
                urlState.commit(searchTerm, selectedCategory, filters)
            }
            onChangeOptionFilters={changeOptionFilters}
            onShare={() => void urlState.share()}
            onLoadPreset={search =>
                urlState.commit(
                    search.itemName,
                    search.category,
                    search.optionFilters
                )
            }
            onSelectFavorite={selectFavorite}
            onShowFavorites={show => {
                setShowFavorites(show);
                if (show) setShowPresets(false);
            }}
            onShowPresets={show => {
                setShowPresets(show);
                if (show) setShowFavorites(false);
            }}
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
