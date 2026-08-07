import { Loader } from "lucide-react";
import type { KeyboardEvent } from "react";

import type { useAuctionSuggestions } from "@/app/auction/use-auction-suggestions";
import { categories } from "@/constant/categories";

type Suggestions = ReturnType<typeof useAuctionSuggestions>;
type InputProps = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    suggestions: Suggestions;
};

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

function SuggestionList({ props }: { props: InputProps }) {
    const { suggestions: model, setSearchTerm } = props;
    if (!model.isVisible || model.suggestions.length === 0) return null;
    return (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {model.suggestions.map((suggestion, index) => (
                <li
                    key={`suggestion-${suggestion}-${index}`}
                    id={`suggestion-${index}`}
                    className={`p-2 cursor-pointer ${index === model.activeIndex ? "bg-gray-200" : ""}`}
                    onClick={() => {
                        setSearchTerm(suggestion);
                        model.setIsVisible(false);
                    }}
                >
                    {suggestion}
                </li>
            ))}
        </ul>
    );
}

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
                            <a onClick={() => setSelectedCategory(category)}>
                                {category}
                            </a>
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
};

export function AuctionControls(props: AuctionControlsProps) {
    return (
        <div className="flex flex-col md:flex-row md:justify-between mb-2">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full">
                <SuggestionInput {...props} />
                <button
                    className="btn btn-outline w-full md:w-auto"
                    onClick={props.onSearch}
                >
                    {props.loading ? (
                        <Loader className="animate-spin" />
                    ) : (
                        "검색"
                    )}
                </button>
                <CategoryDropdown {...props} />
            </div>
        </div>
    );
}
