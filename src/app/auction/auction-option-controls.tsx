"use client";

import { useEffect, useState } from "react";

import {
    type AuctionOptionFilters,
    hasAuctionOptionFilters,
    parseAuctionOptionFilterQuery,
} from "@/lib/auction-options";

const FILTER_FIELDS = [
    "option_enchant",
    "option_reforge",
    "option_reforge_min_level",
    "option_erg",
    "option_erg_grade",
    "option_erg_min_level",
] as const;

type AuctionOptionControlsProps = {
    filters: AuctionOptionFilters;
    onApply: (filters: AuctionOptionFilters) => void;
    onChange: (filters: AuctionOptionFilters) => void;
};

function parseFilterForm(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const field of FILTER_FIELDS) {
        const value = data.get(field);
        if (typeof value === "string" && value !== "") {
            params.set(field, value);
        }
    }
    return parseAuctionOptionFilterQuery(params);
}

function OptionFilterForm({
    filters,
    onSubmit,
}: {
    filters: AuctionOptionFilters;
    onSubmit: (form: HTMLFormElement) => void;
}) {
    const [ergEnabled, setErgEnabled] = useState(Boolean(filters.erg));
    return (
        <form
            className="grid gap-4 border-t p-4 sm:grid-cols-2"
            noValidate
            onSubmit={event => {
                event.preventDefault();
                onSubmit(event.currentTarget);
            }}
        >
            <fieldset className="space-y-2">
                <legend className="font-semibold">인챈트</legend>
                <label className="form-control">
                    <span className="label-text mb-1">인챈트 이름</span>
                    <input
                        type="text"
                        name="option_enchant"
                        className="input input-bordered w-full"
                        defaultValue={filters.enchantName ?? ""}
                        maxLength={100}
                        placeholder="예: 여명"
                    />
                </label>
            </fieldset>
            <fieldset className="space-y-2">
                <legend className="font-semibold">세공</legend>
                <label className="form-control">
                    <span className="label-text mb-1">세공 옵션 이름</span>
                    <input
                        type="text"
                        name="option_reforge"
                        className="input input-bordered w-full"
                        defaultValue={filters.reforge?.optionName ?? ""}
                        maxLength={100}
                        placeholder="예: 볼트 대미지"
                    />
                </label>
                <label className="form-control">
                    <span className="label-text mb-1">세공 최소 레벨</span>
                    <input
                        type="number"
                        name="option_reforge_min_level"
                        className="input input-bordered w-full"
                        defaultValue={filters.reforge?.minLevel ?? ""}
                        min={1}
                        step={1}
                        inputMode="numeric"
                    />
                </label>
            </fieldset>
            <fieldset className="space-y-2 sm:col-span-2">
                <legend className="font-semibold">에르그</legend>
                <label className="label w-fit cursor-pointer gap-2">
                    <input
                        type="checkbox"
                        name="option_erg"
                        value="present"
                        className="checkbox"
                        checked={ergEnabled}
                        onChange={event => setErgEnabled(event.target.checked)}
                    />
                    <span className="label-text">에르그 있음</span>
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                    <label className="form-control">
                        <span className="label-text mb-1">에르그 등급</span>
                        <select
                            name="option_erg_grade"
                            className="select select-bordered w-full"
                            defaultValue={filters.erg?.grade ?? ""}
                            disabled={!ergEnabled}
                        >
                            <option value="">등급 무관</option>
                            <option value="B">B</option>
                            <option value="A">A</option>
                            <option value="S">S</option>
                        </select>
                    </label>
                    <label className="form-control">
                        <span className="label-text mb-1">
                            에르그 최소 레벨
                        </span>
                        <input
                            type="number"
                            name="option_erg_min_level"
                            className="input input-bordered w-full"
                            defaultValue={filters.erg?.minLevel ?? ""}
                            disabled={!ergEnabled}
                            min={1}
                            step={1}
                            inputMode="numeric"
                        />
                    </label>
                </div>
            </fieldset>
            <button
                type="submit"
                className="btn btn-outline w-full sm:col-span-2"
            >
                조건 적용
            </button>
        </form>
    );
}

function activeFilters(filters: AuctionOptionFilters) {
    const values: Array<{
        key: keyof AuctionOptionFilters;
        label: string;
    }> = [];
    if (filters.enchantName) {
        values.push({
            key: "enchantName",
            label: `인챈트: ${filters.enchantName}`,
        });
    }
    if (filters.reforge) {
        values.push({
            key: "reforge",
            label: `세공: ${filters.reforge.optionName} ${filters.reforge.minLevel}레벨 이상`,
        });
    }
    if (filters.erg) {
        const details = [
            "있음",
            filters.erg.grade && `${filters.erg.grade}등급`,
            filters.erg.minLevel && `${filters.erg.minLevel}레벨 이상`,
        ].filter(Boolean);
        values.push({ key: "erg", label: `에르그: ${details.join(", ")}` });
    }
    return values;
}

function ActiveOptionFilters({
    filters,
    onChange,
}: Pick<AuctionOptionControlsProps, "filters" | "onChange">) {
    const values = activeFilters(filters);
    if (values.length === 0) return null;
    return (
        <section
            aria-label="활성 장비 옵션 조건"
            className="mt-2 rounded-md border bg-base-100 p-3"
        >
            <p className="text-sm">
                모든 활성 조건을 만족하는 현재 등록 매물만 표시합니다. 최근 완료
                거래에는 적용되지 않습니다.
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
                {values.map(filter => (
                    <li
                        key={filter.key}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
                    >
                        <span>{filter.label}</span>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            aria-label={`${filter.label} 조건 제거`}
                            onClick={() => {
                                const next = { ...filters };
                                delete next[filter.key];
                                onChange(next);
                            }}
                        >
                            제거
                        </button>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                className="btn btn-ghost btn-sm mt-2 w-full sm:w-auto"
                onClick={() => onChange({})}
            >
                장비 옵션 조건 전체 해제
            </button>
        </section>
    );
}

export function AuctionOptionControls({
    filters,
    onApply,
    onChange,
}: AuctionOptionControlsProps) {
    const filterKey = JSON.stringify(filters);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => setError(null), [filterKey]);
    const values = activeFilters(filters);
    return (
        <div className="mt-2">
            <details className="rounded-md border bg-base-100">
                <summary className="cursor-pointer p-3 font-semibold">
                    장비 옵션 필터{values.length > 0 && ` (${values.length})`}
                </summary>
                <OptionFilterForm
                    key={filterKey}
                    filters={filters}
                    onSubmit={form => {
                        const parsed = parseFilterForm(form);
                        if (!parsed.success) {
                            setError(parsed.error);
                            return;
                        }
                        setError(null);
                        onApply(parsed.filters ?? {});
                    }}
                />
            </details>
            {error && (
                <p role="alert" className="alert alert-error mt-2">
                    {error}
                </p>
            )}
            {hasAuctionOptionFilters(filters) && (
                <ActiveOptionFilters filters={filters} onChange={onChange} />
            )}
        </div>
    );
}
