"use client";

import { useId, useRef, useState } from "react";

import {
    type AuctionOptionSuggestion,
    searchOptionSuggestions,
} from "@/lib/auction-filter-reference";

type Props = {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: AuctionOptionSuggestion[];
    suggestOnEmpty?: boolean;
};

export function AuctionOptionAutocomplete({
    label,
    name,
    value,
    onChange,
    options,
    suggestOnEmpty = false,
}: Props) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const composing = useRef(false);
    const input = useRef<HTMLInputElement>(null);
    const suggestions =
        !value.trim() && suggestOnEmpty
            ? options.slice(0, 20)
            : searchOptionSuggestions(options, value);
    const visible = open && suggestions.length > 0;
    const activeIndex = active < suggestions.length ? active : -1;
    const choose = (suggestion: AuctionOptionSuggestion) => {
        onChange(suggestion.value);
        setOpen(false);
        setActive(-1);
        input.current?.focus();
    };
    return (
        <div className="relative min-w-0">
            <label htmlFor={id} className="label-text mb-1 block">
                {label}
            </label>
            <input
                ref={input}
                id={id}
                name={name}
                value={value}
                maxLength={100}
                className="input input-bordered w-full"
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={visible}
                aria-controls={`${id}-list`}
                aria-activedescendant={
                    visible && activeIndex >= 0
                        ? `${id}-${activeIndex}`
                        : undefined
                }
                onChange={event => {
                    onChange(event.target.value);
                    setOpen(true);
                    setActive(-1);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    setOpen(false);
                    setActive(-1);
                }}
                onCompositionStart={() => {
                    composing.current = true;
                }}
                onCompositionEnd={() => {
                    composing.current = false;
                }}
                onKeyDown={event => {
                    if (
                        composing.current ||
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229
                    ) {
                        if (event.key === "Enter") event.preventDefault();
                        return;
                    }
                    if (event.key === "Escape") {
                        event.preventDefault();
                        setOpen(false);
                        setActive(-1);
                        return;
                    }
                    if (event.key === "Tab") {
                        setOpen(false);
                        return;
                    }
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        if (!suggestions.length) return;
                        event.preventDefault();
                        setOpen(true);
                        setActive(
                            event.key === "ArrowDown"
                                ? Math.min(
                                      activeIndex + 1,
                                      suggestions.length - 1
                                  )
                                : Math.max(activeIndex - 1, 0)
                        );
                    } else if (event.key === "Enter" && visible) {
                        event.preventDefault();
                        if (activeIndex >= 0) choose(suggestions[activeIndex]);
                        else setOpen(false);
                    }
                }}
            />
            {visible && (
                <ul
                    id={`${id}-list`}
                    role="listbox"
                    aria-label={`${label} 제안`}
                    className="absolute z-20 max-h-60 w-full overflow-y-auto rounded-md border bg-base-100 shadow-lg"
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={`${suggestion.value}-${suggestion.label}`}
                            id={`${id}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            ref={element => {
                                if (element && index === activeIndex)
                                    element.scrollIntoView?.({
                                        block: "nearest",
                                    });
                            }}
                            className={`cursor-pointer whitespace-normal break-words p-2 text-sm ${index === activeIndex ? "bg-base-200" : ""}`}
                            onPointerDown={event => event.preventDefault()}
                            onClick={() => choose(suggestion)}
                        >
                            {suggestion.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
