import { Loader, Share2 } from "lucide-react";
import type { KeyboardEvent } from "react";

import type { useAuctionSuggestions } from "@/app/auction/use-auction-suggestions";
import type { AuctionUrlFeedback } from "@/app/auction/use-auction-url-state";
import { categories } from "@/constant/categories";

type Suggestions = ReturnType<typeof useAuctionSuggestions>;
type InputProps = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    suggestions: Suggestions;
};

/**
 * Handles keyboard navigation and selection for the suggestion list.
 *
 * @param event - The keyboard event to process
 * @param props - The input state and handlers used to update the search and suggestions
 */
function handleSuggestionKey(event: KeyboardEvent, props: InputProps) {
    const { suggestions: model, setSearchTerm } = props;
    if (!model.isVisible && event.key === "Escape") setSearchTerm("");
    if (!model.isVisible) return;
    if (event.key === "ArrowDown") {
        model.setActiveIndex(index =>
            Math.min(index + 1, model.suggestions.length - 1)
        );
    } else if (event.key === "ArrowUp") {
        model.setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
        setSearchTerm(model.suggestions[model.activeIndex]);
        model.setIsVisible(false);
    } else if (event.key === "Escape") {
        model.setIsVisible(false);
    }
}

/**
 * Renders the visible autocomplete suggestions and handles suggestion selection.
 *
 * @param props - Search state and handlers used to display and select suggestions.
 * @returns The suggestion list, or `null` when no suggestions are available or visible.
 */
function SuggestionList({ props }: { props: InputProps }) {
    const { suggestions: model, setSearchTerm } = props;
    if (!model.isVisible || model.suggestions.length === 0) return null;
    return (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {model.suggestions.map((suggestion, index) => (
                <li key={`suggestion-${suggestion}-${index}`} role="none">
                    <button
                        ref={
                            index === model.activeIndex
                                ? model.activeSuggestionRef
                                : undefined
                        }
                        type="button"
                        className={`w-full p-2 text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${index === model.activeIndex ? "bg-gray-200" : ""}`}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => {
                            setSearchTerm(suggestion);
                            model.setIsVisible(false);
                        }}
                    >
                        {suggestion}
                    </button>
                </li>
            ))}
        </ul>
    );
}

/**
 * Renders an item-name search input with autocomplete suggestions.
 *
 * @param props - Search state, suggestion data, and handlers used by the input
 */
function SuggestionInput(props: InputProps) {
    const { searchTerm, setSearchTerm, suggestions: model } = props;
    return (
        <div className="relative w-full">
            <input
                className="input input-bordered w-full"
                placeholder="아이템명"
                value={searchTerm || ""}
                onChange={event => setSearchTerm(event.target.value)}
                onKeyDown={event => handleSuggestionKey(event, props)}
                onBlur={() => setTimeout(() => model.setIsVisible(false), 150)}
                onFocus={() => {
                    if (
                        searchTerm.length >= 2 &&
                        model.suggestions.length > 0
                    ) {
                        model.setIsVisible(true);
                    }
                }}
            />
            <SuggestionList props={props} />
        </div>
    );
}

/**
 * Renders a dropdown for viewing and selecting an auction category.
 *
 * @param selectedCategory - The category currently displayed as selected
 * @param setSelectedCategory - Updates the selected category
 */
function CategoryDropdown({
    selectedCategory,
    setSelectedCategory,
}: {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
}) {
    return (
        <div className="mt-2 md:mt-0">
            <div className="dropdown dropdown-end">
                <div
                    tabIndex={0}
                    role="button"
                    className="btn w-full md:w-auto"
                >
                    {selectedCategory}
                </div>
                <ul
                    tabIndex={0}
                    className="max-h-80 overflow-y-auto dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                >
                    {categories.map(category => (
                        <li key={`category-${category}`}>
                            <button
                                type="button"
                                className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

type AuctionControlsProps = InputProps & {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    loading: boolean;
    onSearch: () => void;
    canShare: boolean;
    sharing: boolean;
    feedback: AuctionUrlFeedback | null;
    onShare: () => void;
};

/**
 * Renders auction search controls with autocomplete, search submission, category selection, and loading feedback.
 *
 * @param props - The search, category, loading, and suggestion state used by the controls
 */
export function AuctionControls(props: AuctionControlsProps) {
    return (
        <div className="mb-2">
            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 w-full">
                <SuggestionInput {...props} />
                <button
                    type="button"
                    className="btn btn-outline w-full md:w-auto"
                    onClick={props.onSearch}
                >
                    {props.loading ? (
                        <Loader className="animate-spin" />
                    ) : (
                        "검색"
                    )}
                </button>
                <button
                    type="button"
                    className="btn btn-outline w-full md:w-auto"
                    disabled={!props.canShare || props.sharing}
                    onClick={props.onShare}
                >
                    {props.sharing ? (
                        <Loader className="animate-spin" aria-hidden="true" />
                    ) : (
                        <Share2 aria-hidden="true" />
                    )}
                    {props.sharing ? "공유 중" : "검색 공유"}
                </button>
                <CategoryDropdown {...props} />
            </div>
            {props.feedback && (
                <div
                    className={`alert mt-2 ${
                        props.feedback.kind === "error"
                            ? "alert-error"
                            : props.feedback.kind === "success"
                              ? "alert-success"
                              : "alert-info"
                    }`}
                    role={props.feedback.kind === "error" ? "alert" : "status"}
                    aria-live={
                        props.feedback.kind === "error" ? undefined : "polite"
                    }
                >
                    <span>{props.feedback.message}</span>
                </div>
            )}
        </div>
    );
}
